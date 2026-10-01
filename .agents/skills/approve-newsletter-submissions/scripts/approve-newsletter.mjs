#!/usr/bin/env node
// Approve (ham) pending Netlify Forms newsletter signups, then optionally delete
// the ones that stay unapproved (spam). Nothing is written to the repository:
// subscriber emails are personal data and must never be saved in files or commits.
//
// The digest function (netlify/functions/newsletter-digest.mjs) lists submissions
// with no `state` filter, which Netlify treats as "verified only". A signup that
// Netlify flagged as spam therefore never receives an issue until it is approved.

import process from "node:process";

const API_ROOT = process.env.NETLIFY_API_ROOT ?? "https://api.netlify.com/api/v1";
const FORM_NAME = "newsletter";
const PAGE_SIZE = 100;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "temp-mail.org", "yopmail.com", "trashmail.com", "sharklasers.com", "getnada.com",
]);

function usage() {
  console.log(`Usage: approve-newsletter.mjs [options]

Read-only unless --apply is present.

Options:
  --apply                 Perform the selected approvals / deletions
  --approve-ids <ids>     Approve these comma-separated spam submission IDs
  --approve-recommended   Approve every spam submission that has no red flags
  --delete-unapproved     After approving, DELETE the spam submissions still left
  --confirm-delete <n>    Required with --delete-unapproved --apply: the exact
                          number of submissions that will be deleted (from the dry run)
  --show-emails           Print full emails (default masks them: j***@example.com)
  --site-id <uuid>        Netlify site UUID (defaults to NETLIFY_SITE_ID)
  --help                  Show this help
`);
}

function parseArgs(argv) {
  const o = {
    apply: false,
    approveIds: [],
    approveRecommended: false,
    deleteUnapproved: false,
    confirmDelete: null,
    showEmails: false,
    siteId: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN ?? process.env.NETLIFY_API_TOKEN,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--apply") o.apply = true;
    else if (a === "--approve-recommended") o.approveRecommended = true;
    else if (a === "--delete-unapproved") o.deleteUnapproved = true;
    else if (a === "--show-emails") o.showEmails = true;
    else if (a === "--approve-ids") {
      const v = argv[++i];
      if (!v) throw new Error("--approve-ids requires at least one submission ID.");
      o.approveIds.push(...v.split(",").map((x) => x.trim()).filter(Boolean));
    } else if (a === "--confirm-delete") {
      const v = Number(argv[++i]);
      if (!Number.isInteger(v) || v < 0) throw new Error("--confirm-delete requires a whole number.");
      o.confirmDelete = v;
    } else if (a === "--site-id") o.siteId = argv[++i];
    else if (a === "--help" || a === "-h") {
      usage();
      process.exit(0);
    } else throw new Error(`Unknown argument: ${a}`);
  }
  if (!o.siteId) throw new Error("Missing Netlify site UUID. Set NETLIFY_SITE_ID or pass --site-id.");
  if (!o.token) throw new Error("Missing Netlify API token. Set NETLIFY_AUTH_TOKEN or NETLIFY_API_TOKEN.");
  return o;
}

async function api(url, { method = "GET", token } = {}) {
  const response = await fetch(url, {
    method,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`${method} ${url} failed (${response.status}): ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function listSubmissions(formId, token, state) {
  const all = [];
  for (let page = 1; ; page += 1) {
    const params = new URLSearchParams({ page: String(page), per_page: String(PAGE_SIZE) });
    if (state && state !== "verified") params.set("state", state); // no state == verified
    const items = await api(`${API_ROOT}/forms/${encodeURIComponent(formId)}/submissions?${params}`, { token });
    if (!Array.isArray(items)) throw new Error("Unexpected submissions response from Netlify.");
    all.push(...items);
    if (items.length < PAGE_SIZE) break;
  }
  return all.sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")));
}

const emailOf = (s) => String(s.data?.email ?? s.email ?? "").trim().toLowerCase();
const nameOf = (s) => String(s.data?.name ?? s.name ?? "").trim();
const consentOf = (s) => {
  const v = s.data?.consent;
  return v === true || (typeof v === "string" && !["", "false", "off", "0", "no"].includes(v.toLowerCase()));
};

function mask(email) {
  const [local, domain] = email.split("@");
  if (!domain) return "(no email)";
  return `${local.slice(0, 1)}***@${domain}`;
}

// Red flags. A submission is "recommended" only when it has none.
function assess(submission, verifiedEmails, seenInQueue) {
  const email = emailOf(submission);
  const reasons = [];
  if (!EMAIL_RE.test(email)) reasons.push("invalid-email");
  if (!consentOf(submission)) reasons.push("no-consent");
  if (String(submission.data?.["bot-field"] ?? "").trim()) reasons.push("honeypot");
  if (/https?:\/\/|www\./i.test(nameOf(submission))) reasons.push("link-in-name");
  const domain = email.split("@")[1] ?? "";
  if (DISPOSABLE.has(domain)) reasons.push("disposable-domain");
  if (verifiedEmails.has(email)) reasons.push("already-subscribed");
  else if (seenInQueue.has(email)) reasons.push("duplicate-in-queue");
  if (email) seenInQueue.add(email);
  return reasons;
}

function describe(submission, reasons, showEmails) {
  const email = emailOf(submission);
  const shown = showEmails ? email : mask(email);
  const date = String(submission.created_at ?? "").slice(0, 10);
  const flag = reasons.length ? `FLAGS: ${reasons.join(", ")}` : "ok";
  return `- ${submission.id}  ${date}  ${nameOf(submission).slice(0, 28).padEnd(28)}  ${shown.padEnd(30)}  ${flag}`;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const forms = await api(`${API_ROOT}/sites/${encodeURIComponent(o.siteId)}/forms`, { token: o.token });
  const form = Array.isArray(forms) ? forms.find((f) => f.name === FORM_NAME) : null;
  if (!form) throw new Error(`Netlify form '${FORM_NAME}' was not found on the configured site.`);

  const verified = await listSubmissions(form.id, o.token, "verified");
  const spam = await listSubmissions(form.id, o.token, "spam");
  const verifiedEmails = new Set(verified.map(emailOf).filter(Boolean));

  console.log(`Form: ${FORM_NAME} (${form.id})`);
  console.log(`Verified (receiving the digest): ${verifiedEmails.size} unique emails from ${verified.length} submissions`);
  console.log(`Spam-flagged (NOT receiving the digest): ${spam.length}\n`);

  const seen = new Set();
  const rows = spam.map((s) => ({ s, reasons: assess(s, verifiedEmails, seen) }));
  for (const { s, reasons } of rows) console.log(describe(s, reasons, o.showEmails));
  if (!rows.length) console.log("Nothing in the spam queue.");

  const ids = new Set(rows.map((r) => String(r.s.id)));
  const unknown = o.approveIds.filter((id) => !ids.has(id));
  if (unknown.length) throw new Error(`These IDs are not in the ${FORM_NAME} spam queue: ${unknown.join(", ")}`);

  const approve = new Set(o.approveIds);
  if (o.approveRecommended) for (const r of rows) if (!r.reasons.length) approve.add(String(r.s.id));
  const toApprove = rows.filter((r) => approve.has(String(r.s.id)));
  const remaining = rows.filter((r) => !approve.has(String(r.s.id)));

  console.log(`\nWould approve: ${toApprove.length}`);
  if (o.deleteUnapproved) {
    console.log(`Would delete (unapproved, irreversible): ${remaining.length}`);
  }
  if (!o.apply) {
    console.log("\nDry run only. Re-run with --apply to perform these actions.");
    if (o.deleteUnapproved) {
      console.log(`Deletion also needs: --confirm-delete ${remaining.length}`);
    }
    return;
  }
  if (!toApprove.length && !o.deleteUnapproved) {
    console.log("Nothing selected. Pass --approve-ids or --approve-recommended.");
    return;
  }
  if (o.deleteUnapproved && o.confirmDelete !== remaining.length) {
    throw new Error(
      `Refusing to delete: --confirm-delete must equal the number of submissions that will be deleted (${remaining.length}), got ${o.confirmDelete ?? "nothing"}. Nothing was changed.`,
    );
  }

  const failures = [];
  let approved = 0;
  for (const { s } of toApprove) {
    try {
      await api(`${API_ROOT}/submissions/${encodeURIComponent(s.id)}/ham`, { method: "PUT", token: o.token });
      approved += 1;
    } catch (error) {
      failures.push({ id: s.id, action: "approve", error: error.message });
    }
  }
  console.log(`Approved: ${approved}`);

  let deleted = 0;
  if (o.deleteUnapproved) {
    if (failures.length) {
      console.error("Skipping deletion because some approvals failed. Fix them and re-run.");
    } else {
      // Re-read the queue so only what is *still* spam after approvals is deleted.
      const stillSpam = await listSubmissions(form.id, o.token, "spam");
      if (stillSpam.length !== remaining.length) {
        throw new Error(`The spam queue changed during the run (expected ${remaining.length}, found ${stillSpam.length}). Re-run the dry run. Nothing was deleted.`);
      }
      for (const s of stillSpam) {
        try {
          await api(`${API_ROOT}/submissions/${encodeURIComponent(s.id)}`, { method: "DELETE", token: o.token });
          deleted += 1;
        } catch (error) {
          failures.push({ id: s.id, action: "delete", error: error.message });
        }
      }
      console.log(`Deleted: ${deleted}`);
    }
  }

  const after = await listSubmissions(form.id, o.token, "verified");
  console.log(`Subscribers now receiving the digest: ${new Set(after.map(emailOf).filter(Boolean)).size} unique emails`);
  for (const f of failures) console.error(`Failed ${f.action} ${f.id}: ${f.error}`);
  if (failures.length) process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
