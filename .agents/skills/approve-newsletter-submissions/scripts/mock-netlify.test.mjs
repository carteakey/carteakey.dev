#!/usr/bin/env node
// Self-test for approve-newsletter.mjs against a local mock of the Netlify Forms API.
// No network, no real token. Run:  node .agents/skills/approve-newsletter-submissions/scripts/mock-netlify.test.mjs
import http from "node:http";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "approve-newsletter.mjs");
const sub = (id, email, extra = {}) => ({
  id, created_at: "2026-09-30T12:00:00Z",
  data: { name: extra.name ?? id, email, consent: "consent" in extra ? extra.consent : "on", "bot-field": extra.bot ?? "" },
});

// state: { [submissionId]: { form, state, ...submission } }
const db = new Map();
const add = (form, state, s) => db.set(s.id, { ...s, form, state });
add("F-news", "verified", sub("v1", "existing@example.com"));
add("F-news", "spam", sub("s1", "alice@example.com"));
add("F-news", "spam", sub("s2", "bob@example.com"));
add("F-news", "spam", sub("s3", "existing@example.com"));
add("F-news", "spam", sub("s4", "not-an-email"));
add("F-news", "spam", sub("s5", "carol@example.com", { consent: "" }));
add("F-news", "spam", sub("s6", "x@mailinator.com"));
add("F-news", "spam", sub("s7", "alice@example.com"));
add("F-news", "spam", sub("s8", "bot@example.com", { bot: "gotcha" }));
add("F-guest", "spam", sub("g1", "guest@example.com")); // must never be touched

const list = (form, state) => [...db.values()].filter((s) => s.form === form && s.state === state);
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const send = (code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
  if (req.headers.authorization !== "Bearer test-token") return send(401, { error: "unauthorized" });
  let m;
  if (req.method === "GET" && url.pathname === "/sites/SITE/forms") return send(200, [{ id: "F-guest", name: "guestbook" }, { id: "F-news", name: "newsletter" }]);
  if (req.method === "GET" && (m = url.pathname.match(/^\/forms\/([^/]+)\/submissions$/))) {
    return send(200, list(m[1], url.searchParams.get("state") === "spam" ? "spam" : "verified"));
  }
  if (req.method === "PUT" && (m = url.pathname.match(/^\/submissions\/([^/]+)\/ham$/))) {
    const s = db.get(m[1]); if (!s) return send(404, {}); s.state = "verified"; return send(200, s);
  }
  if (req.method === "DELETE" && (m = url.pathname.match(/^\/submissions\/([^/]+)$/))) {
    if (!db.delete(m[1])) return send(404, {}); res.writeHead(204); return res.end();
  }
  send(404, { error: "not found" });
});

const run = (args) => new Promise((resolve) => {
  const p = spawn("node", [SCRIPT, ...args, "--site-id", "SITE"], {
    env: { ...process.env, NETLIFY_API_ROOT: `http://127.0.0.1:${server.address().port}`, NETLIFY_AUTH_TOKEN: "test-token" },
  });
  let out = ""; let err = "";
  p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (err += d));
  p.on("close", (code) => resolve({ code, out, err }));
});

let failed = 0;
const check = (name, cond, detail = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  -> " + detail}`); if (!cond) failed += 1; };

await new Promise((r) => server.listen(0, "127.0.0.1", r));

let r = await run(["--approve-recommended"]);
check("dry run exits 0 and changes nothing", r.code === 0 && list("F-news", "spam").length === 8 && /Dry run only/.test(r.out), r.err || r.out);
check("dry run recommends exactly 2 (alice s1, bob s2)", /Would approve: 2/.test(r.out), r.out);
check("emails are masked by default", !/alice@example\.com/.test(r.out) && /a\*\*\*@example\.com/.test(r.out));
check("flags: already-subscribed, invalid-email, no-consent, disposable-domain, honeypot, duplicate-in-queue",
  ["already-subscribed", "invalid-email", "no-consent", "disposable-domain", "honeypot", "duplicate-in-queue"].every((f) => r.out.includes(f)), r.out);
r = await run(["--approve-recommended", "--show-emails"]);
check("--show-emails prints full emails", /alice@example\.com/.test(r.out));

r = await run(["--approve-ids", "nope"]);
check("unknown id is rejected", r.code !== 0 && /not in the newsletter spam queue/.test(r.err));
r = await run(["--approve-ids", "g1", "--apply"]);
check("cannot approve a submission from another form", r.code !== 0 && db.get("g1").state === "spam");

r = await run(["--approve-recommended", "--apply"]);
check("approves the 2 recommended ones", r.code === 0 && /Approved: 2/.test(r.out) && db.get("s1").state === "verified" && db.get("s2").state === "verified", r.err || r.out);
check("subscriber count is now 3 unique", /now receiving the digest: 3 unique/.test(r.out), r.out);

r = await run(["--delete-unapproved", "--apply"]);
check("delete without --confirm-delete is refused and changes nothing", r.code !== 0 && list("F-news", "spam").length === 6, r.err);
r = await run(["--delete-unapproved", "--apply", "--confirm-delete", "5"]);
check("wrong --confirm-delete count is refused", r.code !== 0 && list("F-news", "spam").length === 6, r.err);
r = await run(["--delete-unapproved"]);
check("delete dry run reports the count to confirm", /Would delete \(unapproved, irreversible\): 6/.test(r.out) && /--confirm-delete 6/.test(r.out) && list("F-news", "spam").length === 6, r.out);

r = await run(["--delete-unapproved", "--apply", "--confirm-delete", "6"]);
check("correct confirm deletes exactly the 6 unapproved", r.code === 0 && /Deleted: 6/.test(r.out) && list("F-news", "spam").length === 0, r.err || r.out);
check("verified subscribers untouched (3 unique)", list("F-news", "verified").length === 3);
check("guestbook form's spam submission was never touched", db.has("g1") && db.get("g1").state === "spam");

server.close();
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
