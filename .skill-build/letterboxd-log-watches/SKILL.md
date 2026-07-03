---
name: letterboxd-log-watches
description: Add historical cinema watches to a user's Letterboxd diary from receipts, booking confirmations, ticket text, screenshots, or pasted showtime lists. Use when Codex must parse film titles and screening dates, prepare one or more dated Letterboxd diary entries in the user's logged-in browser, avoid duplicates, obtain required save confirmation, and verify the resulting diary rows.
---

# Letterboxd Log Watches

Turn cinema booking details into accurate, dated Letterboxd diary entries using the user's logged-in browser.

## Parse the source

For each screening, extract:

- Film title
- Showtime date
- Showtime time when present, for disambiguation only
- Venue when present, for disambiguation only

Use the screening/showtime date as the diary date. Do not use purchase, email, or transaction dates. Treat multiple seats for the same screening as one watch. Ignore booking IDs, seat numbers, prices, auditorium numbers, and refund labels unless the user explicitly says they affect whether the screening was attended.

Normalize receipt titles for search without changing the final diary title. Strip format/language suffixes such as “The IMAX Experience®” or “(Hindi w/e.s.t.)” when they hurt search matching, then choose the canonical Letterboxd film and release year. Known mappings from Cineplex receipts include:

- *F1 The Movie – The IMAX Experience®* → *F1* (2025)
- *Mission: Impossible The Final Reckoning – The IMAX Experience®* → *Mission: Impossible – The Final Reckoning* (2025)
- *The Fantastic 4: First Steps* → *The Fantastic 4: First Steps* (2025)

If the source contains repeated bookings for the same film on the same date, create only one diary entry unless the user explicitly asks for multiple same-day rewatches. Letterboxd diary verification is title/date-based and does not preserve theater, time, or seat details.

Do not retain or reproduce passwords, booking IDs, or other unnecessary sensitive data in the skill or final response.

## Prepare entries

1. Use the Chrome-control skill because Letterboxd work depends on the user's logged-in browser state.
2. Confirm the active account from the visible Letterboxd page.
3. Before creating an entry, check the user's diary for the same film and date. Skip exact duplicates and report them.
4. Open Letterboxd's **Log** flow and search using the receipt title.
5. Select the matching film by title and release year. Account for renamed listings; for example, Letterboxd lists *Mission: Impossible – Dead Reckoning Part One* as *Mission: Impossible – Dead Reckoning* (2023).
6. Keep **Watched on** enabled and set the screening date through the date picker.
   - Prefer year → month → day navigation over repeated previous-month clicks.
   - When a day number appears more than once because adjacent-month cells are visible, choose the in-month cell from the date grid, not just the first text match.
7. Leave rating, like, review, tags, spoilers, and rewatch unchanged unless the user supplies those details. Letterboxd may prefill an existing film-level rating in the diary modal; do not clear or change it unless the user asks.

For a batch, prepare and validate the exact film/date set first. Request one confirmation immediately before saving the clearly enumerated batch when browser policy permits grouping; otherwise request confirmation at each required save boundary.

## Save and verify

After the user confirms, save each prepared entry. Dismiss ordinary ad overlays if they block the confirmed action, but never bypass browser security warnings or solve a CAPTCHA without the required user involvement.

Verify each saved entry on `/USERNAME/diary/` using the visible diary row. Confirm both the normalized Letterboxd title and the date. Do not claim success based only on the modal closing. Conversely, do not assume failure only because the modal stays visible after Save; first check the exact diary date page. If the row exists, treat the save as successful and avoid retrying the form.

Keep the diary page open as the deliverable when useful. Report saved entries and skipped duplicates concisely.

## Failure handling

- If the title match is ambiguous, stop before saving and ask which film is intended.
- If the source has only a purchase date and no screening date, ask for the watch date.
- If authentication is missing, ask the user to log in; never inspect cookies, stored passwords, or browser storage.
- If a modal has sat open across a long pause or date/session change, discard and rebuild it before saving. Stale Letterboxd diary modals can return an API error even when the visible fields look correct.
- If a browser unsaved-changes warning appears while discarding a stale or failed modal, get user confirmation before accepting the warning.
- If a save fails, keep the prepared entry intact when possible, explain the visible blocker, and retry only after obtaining any newly required confirmation.
