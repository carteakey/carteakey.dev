#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { load as parseYaml } from "js-yaml";

const API_ROOT = process.env.NETLIFY_API_ROOT ?? "https://api.netlify.com/api/v1";
const FORM_NAME = "guestbook";
const PAGE_SIZE = 100;
const COLORS = ["yellow", "pink", "blue", "green", "purple", "orange"];
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../../../..");
const DATA_FILE = path.join(REPO_ROOT, "src/_data/guestbook.yaml");

function usage() {
  console.log(`Usage: approve-guestbook.mjs [options]

Options:
  --apply                 Mark spam submissions verified and update guestbook.yaml
  --site-id <uuid>        Netlify site UUID (defaults to NETLIFY_SITE_ID)
  --file <path>           Guestbook YAML path (defaults to src/_data/guestbook.yaml)
  --help                  Show this help
`);
}

function parseArgs(argv) {
  const options = {
    apply: false,
    siteId: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN ?? process.env.NETLIFY_API_TOKEN,
    file: DATA_FILE,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--apply") {
      options.apply = true;
    } else if (argument === "--site-id") {
      options.siteId = argv[++index];
    } else if (argument === "--file") {
      options.file = path.resolve(argv[++index]);
    } else if (argument === "--help" || argument === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.siteId) {
    throw new Error("Missing Netlify site UUID. Set NETLIFY_SITE_ID or pass --site-id.");
  }
  if (!options.token) {
    throw new Error("Missing Netlify API token. Set NETLIFY_AUTH_TOKEN or NETLIFY_API_TOKEN.");
  }
  return options;
}

async function netlifyRequest(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.token}`,
      ...(options.headers ?? {}),
    },
  });
  const body = await response.text();
  let parsed;
  try {
    parsed = body ? JSON.parse(body) : null;
  } catch {
    parsed = body;
  }
  if (!response.ok) {
    const detail = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    throw new Error(`${options.method ?? "GET"} ${url} failed (${response.status}): ${detail}`);
  }
  return parsed;
}

async function getAllSubmissions(siteId, formId, token, state) {
  const submissions = [];
  for (let page = 1; ; page += 1) {
    const params = new URLSearchParams({ page: String(page), per_page: String(PAGE_SIZE) });
    if (state && state !== "verified") params.set("state", state);
    const pageItems = await netlifyRequest(
      `${API_ROOT}/forms/${encodeURIComponent(formId)}/submissions?${params}`,
      { token },
    );
    if (!Array.isArray(pageItems)) {
      throw new Error(`Unexpected submissions response for site ${siteId}.`);
    }
    submissions.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) break;
  }
  return submissions;
}

function submissionData(submission) {
  const data = submission.data ?? {};
  const name = String(data.name ?? submission.name ?? "").trim();
  const website = String(data.website ?? submission.website ?? "").trim();
  const message = String(data.message ?? submission.body ?? submission.summary ?? "").trim();
  const createdAt = String(submission.created_at ?? "");
  const date = createdAt.slice(0, 10);
  if (!name || !message || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return { name, website, message, date, submissionId: submission.id };
}

function dedupeKey(entry) {
  return [entry.name, entry.website, entry.message, entry.date].join("\u0000");
}

function yamlScalar(value) {
  return JSON.stringify(String(value ?? ""));
}

async function appendEntries(file, entries) {
  if (!entries.length) return 0;
  const currentText = await fs.readFile(file, "utf8");
  const parsed = parseYaml(currentText) ?? {};
  const existingEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
  const known = new Set(existingEntries.map(dedupeKey));
  const additions = entries.filter((entry) => !known.has(dedupeKey(entry)));
  if (!additions.length) return 0;

  const startColor = existingEntries.length;
  const lines = additions.map((entry, index) => {
    const color = COLORS[(startColor + index) % COLORS.length];
    return [
      "  - name: " + yamlScalar(entry.name),
      "    website: " + yamlScalar(entry.website),
      "    message: " + yamlScalar(entry.message),
      "    date: " + yamlScalar(entry.date),
      "    color: " + yamlScalar(color),
    ].join("\n");
  });
  const separator = currentText.endsWith("\n") ? "" : "\n";
  await fs.writeFile(file, `${currentText}${separator}${lines.join("\n")}\n`, "utf8");
  return additions.length;
}

function sortByDate(submissions) {
  return [...submissions].sort((left, right) =>
    String(left.created_at ?? "").localeCompare(String(right.created_at ?? "")),
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const forms = await netlifyRequest(
    `${API_ROOT}/sites/${encodeURIComponent(options.siteId)}/forms`,
    { token: options.token },
  );
  const form = Array.isArray(forms) ? forms.find((candidate) => candidate.name === FORM_NAME) : null;
  if (!form) throw new Error(`Netlify form '${FORM_NAME}' was not found on the configured site.`);

  const spam = sortByDate(await getAllSubmissions(options.siteId, form.id, options.token, "spam"));
  const candidates = spam.map(submissionData).filter(Boolean);
  const invalidCount = spam.length - candidates.length;

  console.log(`Form: ${FORM_NAME} (${form.id})`);
  console.log(`Remaining spam submissions: ${spam.length}`);
  if (invalidCount) console.log(`Skipped submissions missing name, message, or valid date: ${invalidCount}`);
  if (!candidates.length) {
    console.log("Nothing to approve.");
    return;
  }
  for (const entry of candidates) {
    console.log(`- ${entry.date} — ${entry.name}: ${entry.message}`);
  }

  if (!options.apply) {
    console.log("\nDry run only. Re-run with --apply to mark these submissions verified and sync the YAML file.");
    return;
  }

  const failures = [];
  let approvedCount = 0;
  for (const entry of candidates) {
    try {
      await netlifyRequest(`${API_ROOT}/submissions/${encodeURIComponent(entry.submissionId)}/ham`, {
        method: "PUT",
        token: options.token,
      });
      approvedCount += 1;
    } catch (error) {
      failures.push({ id: entry.submissionId, error: error.message });
    }
  }

  const verified = await getAllSubmissions(options.siteId, form.id, options.token, "verified");
  const verifiedEntries = sortByDate(verified.map(submissionData).filter(Boolean));
  const appendedCount = await appendEntries(options.file, verifiedEntries);
  console.log(`Approved: ${approvedCount}`);
  console.log(`Appended to ${options.file}: ${appendedCount}`);
  if (failures.length) {
    for (const failure of failures) console.error(`Failed ${failure.id}: ${failure.error}`);
    process.exitCode = 1;
  }
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
