# Site review — 2026-11-12

Reviewer: Claude Fable 5.1, an external model reading the built site, not the author.
Scope: homepage, `/blog/`, one post (the Strata benchmark), `/now/`, `/about/`, `/more/` and the 404, on desktop, mobile and dark mode. Nothing was changed during the review.
Status: open. No item here has been actioned yet.

## General thoughts

The site has a real identity, and it holds together. The halftone avatar, pixel name, cobalt accent, paper grain and footer coast read as one person's work, and dark mode keeps all of it. The dense index pages (`/blog/`, `/more/`) are the strongest part: fast to scan, clearly structured, no filler. The copy sounds like a person.

The weak spot is not the look. It is how much stands between a reader and the first sentence of a post, plus a few inconsistencies that make the site seem less careful than it is.

## What I'd change (none of it touches the protected personality)

- **Trim the top of posts.** On the Strata post, before the first line of prose you get: a Draft notice, an AI Assisted banner, the description, a meta row with a second AI Assisted badge, the sketch, Copy as Markdown, the outline, and a long checkpoint box. On mobile that is about two screens. I'd keep the badge, drop the banner (or collapse it to one line), and move the checkpoint below the intro.
- **Drafts on the front page.** That same post is the newest card on the homepage and opens with "this post is a work in progress". Either mark draft cards on the feed or drop the notice once a post has a changelog eight entries long.
- **Dates disagree between pages.** The homepage shows Strata as Nov 9 and the pinned guide as Oct 18; `/blog/` shows Oct 3 and Jun 12. One is the updated date, one the original, and neither says which. Label the homepage one "updated".
- **Note cards cut off mid-sentence.** Long notes on the homepage are clipped at a hard edge with no fade or "more" cue, so they look broken, not excerpted.
- **Newsletter copy contradicts itself.** The homepage says "No weekly content treadmill"; `/more/` describes `/newsletter/` as "Weekly digest".
- **The 404 breaks your own rules.** It uses rounded pill buttons, which the design language bans, and the scene box above the heading was an empty rectangle when I loaded it.
- **Post page scrolls sideways on desktop.** At a 1024px viewport the page is about 5px wider than the window, so a horizontal scrollbar appears. A wide table is the likely cause.
- **Wikilink chips wrap badly on mobile.** `[[elastic --kv-grow]]` splits into three pieces across two lines.

## Not sure about

- **Mobile homepage:** below the hero, the screen was blank for at least three seconds, though the feed cards were in the layout at that position. It may be an artifact of the emulated viewport; it needs a check on a real phone.
- **Avatar:** it painted noticeably late on first load on desktop, leaving an empty square.

## One opinion

Body text is Iosevka Aile at about 15px. It is part of your type trio, so I would not swap it, but for 2,600-word benchmark posts a bump to 16–17px would help more than any other single change.

## Not done

Lighthouse and performance, the remaining slashpages (`/projects/`, `/uses/`, `/data/`, `/folio/`), and dark mode beyond the homepage. The browser pane is still emulating dark mode from my test.
