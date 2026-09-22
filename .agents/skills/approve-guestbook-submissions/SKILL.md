---
name: approve-guestbook-submissions
description: Approve all remaining Netlify Forms submissions for the carteakey.dev guestbook and sync newly verified entries into src/_data/guestbook.yaml. Use when the site owner asks to approve, verify, curate, or publish pending guestbook notes.
---

# Approve Guestbook Submissions

Use the Netlify Forms API to move the `guestbook` form's spam submissions to
verified, then copy newly verified notes into the repository's data file.
"Approve" means Netlify's `ham` state; do not delete submissions or edit the
site output directly.

## Required inputs

- Work from the carteakey.dev repository root.
- Set `NETLIFY_AUTH_TOKEN` (or `NETLIFY_API_TOKEN`) in the environment. Never
  save the token in the repository, shell history, or skill files.
- Set `NETLIFY_SITE_ID` to the Netlify site UUID. Do not guess it from the
  deploy subdomain.
- Keep the existing `src/_data/guestbook.yaml` entries and any unrelated
  working-tree changes intact.

## Workflow

1. Read `AGENTS.md`, inspect `src/_data/guestbook.yaml`, and check the working
   tree before making changes.
2. Run the helper without `--apply` first. It resolves the form by the exact
   name `guestbook`, lists every spam submission, and previews the entries it
   would publish:

   ```sh
   node .agents/skills/approve-guestbook-submissions/scripts/approve-guestbook.mjs
   ```

3. If the user has already verified submissions in Netlify, sync those without
   touching spam:

   ```sh
   node .agents/skills/approve-guestbook-submissions/scripts/approve-guestbook.mjs --sync-verified
   node .agents/skills/approve-guestbook-submissions/scripts/approve-guestbook.mjs --sync-verified --apply
   ```

4. For spam submissions, approve only the exact IDs the user has selected when
   the queue contains obvious spam. Pass a comma-separated allowlist:

   ```sh
   node .agents/skills/approve-guestbook-submissions/scripts/approve-guestbook.mjs \
     --approve-ids <submission-id[,submission-id...]> --apply
   ```

   Only use plain `--apply` when the user explicitly confirms that every spam
   submission should be verified. The helper calls
   `PUT /api/v1/submissions/{id}/ham`, refetches verified guestbook submissions,
   and appends only notes not already represented in the YAML file.

5. Review the diff. New entries must contain `name`, `website` (possibly
   empty), `message`, an explicit ISO date, and one of the existing sticky-note
   colors. Do not hand-edit `_site/`.
6. Run `npm run build` and spot-check `/guestbook/`. Report the number approved,
   number appended, and any API failures. Commit the repository data change
   using the project's normal workflow when the user asked for a committed
   change.

## Safety and failure handling

- The helper is read-only unless `--apply` is present.
- Approve only submissions belonging to the exact `guestbook` form. Never
  operate on site-wide submissions or a similarly named form.
- Prefer `--sync-verified` for entries already marked verified in Netlify; it
  changes no remote submission state.
- If one `ham` request fails, continue the remaining requests, sync successful
  approvals, and exit non-zero with the failed submission IDs.
- If Netlify access is unavailable, do not fabricate entries or mark local
  YAML entries as approved. Ask the user to connect/authenticate Netlify or
  provide the site UUID and a token through the environment.
