---
name: approve-newsletter-submissions
description: Approve pending Netlify Forms newsletter signups for carteakey.dev so they start receiving the weekly digest, then delete the signups that stay unapproved. Use when the site owner asks to approve, verify, moderate, clean up, or purge newsletter subscribers or the newsletter spam queue.
---

# Approve Newsletter Submissions

Moves the `newsletter` form's spam-flagged signups to verified (Netlify's `ham`
state) and, once that is done, deletes whatever is still unapproved.

## Why approval matters

The digest function (`netlify/functions/newsletter-digest.mjs`) lists the
`newsletter` form's submissions with **no `state` filter**, which Netlify treats
as *verified only*. It then keeps entries that have an email, a truthy `consent`,
and an empty `bot-field`. So a real signup that Netlify's spam filter flagged
never receives an issue until it is approved here.

## Differences from `approve-guestbook-submissions`

- **No repository data file.** Subscriber emails are personal data. Never write
  them to YAML, docs, commits, logs you save, or the skill files. Nothing in the
  repo changes, so there is nothing to build or commit.
- **Emails are masked** in output (`j***@example.com`). Use `--show-emails` only
  when the owner needs to see an address, and do not paste the output elsewhere.
- **It can delete**, which is irreversible, so deletion has its own guards below.

## Required inputs

- Work from the carteakey.dev repository root.
- `NETLIFY_AUTH_TOKEN` (or `NETLIFY_API_TOKEN`) and `NETLIFY_SITE_ID` in the
  environment. Never save them in the repo, shell history, or skill files. If they
  are missing, stop and ask the owner to export them. Do not guess the site UUID
  from the subdomain, and never fabricate subscribers.

## Workflow

1. **Dry run first.** It resolves the form by the exact name `newsletter`, shows
   how many unique subscribers already receive the digest, and lists every
   spam-flagged signup with red flags:

   ```sh
   node .agents/skills/approve-newsletter-submissions/scripts/approve-newsletter.mjs --approve-recommended
   ```

   Flags: `invalid-email`, `no-consent`, `honeypot`, `link-in-name`,
   `disposable-domain`, `already-subscribed` (the address already receives the
   digest), `duplicate-in-queue` (a second copy of an address in this batch). A
   submission is **recommended** only when it has none.

2. **Review with the owner.** Show the list and the counts. Do not approve
   anything the owner has not seen. Anything flagged `no-consent`, `honeypot`, or
   `invalid-email` must never be approved: they cannot be emailed lawfully or at
   all.

3. **Approve.** Either the recommended set, or exact IDs:

   ```sh
   node .agents/skills/approve-newsletter-submissions/scripts/approve-newsletter.mjs --approve-recommended --apply
   node .agents/skills/approve-newsletter-submissions/scripts/approve-newsletter.mjs --approve-ids <id[,id...]> --apply
   ```

   Each approval is `PUT /api/v1/submissions/{id}/ham`. IDs that are not in the
   `newsletter` spam queue are rejected, so another form can never be touched.

4. **Delete the unapproved ones** (only after approving, and only on the owner's
   explicit say-so). Dry run first; it prints the exact count you must confirm:

   ```sh
   node .agents/skills/approve-newsletter-submissions/scripts/approve-newsletter.mjs --approve-recommended --delete-unapproved
   # then, with the count it printed (here 6):
   node .agents/skills/approve-newsletter-submissions/scripts/approve-newsletter.mjs --approve-recommended --delete-unapproved --apply --confirm-delete 6
   ```

   Deletion is `DELETE /api/v1/submissions/{id}` for what is *still* spam after
   the approvals. Refused unless `--confirm-delete` equals the dry-run count.

5. **Report**: number approved, number deleted, subscribers now receiving the
   digest, and any failures. No commit is needed (no repository change).

## Safety rules

- Read-only unless `--apply` is present.
- Operates only on the exact form named `newsletter`. Never other forms, never
  site-wide submissions.
- Deletes only submissions that are still spam after approvals, never verified
  ones. If any approval fails, deletion is skipped. If the spam queue changes
  between the dry run and the run (a new signup arrives), the script aborts
  without deleting; re-run the dry run.
- If one request fails the rest still run and the script exits non-zero listing
  the failed IDs.
- Do not echo emails into chat summaries, commit messages, or the changelog.

## Caveat the owner should know

Unsubscribes are stored separately (hashed, in Upstash Redis) and the digest
filters them out. Approving a new signup from someone who previously
unsubscribed does not re-subscribe them. This skill cannot read that list.

## Self-test (no network, no token)

```sh
node .agents/skills/approve-newsletter-submissions/scripts/mock-netlify.test.mjs
```

It starts a mock Netlify API with good and bad signups plus a decoy `guestbook`
form and checks masking, flags, the confirm-count guard, and that other forms and
verified subscribers are never touched. Run it after any change to the script.
