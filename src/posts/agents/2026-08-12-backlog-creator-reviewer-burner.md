---
title: My Backlog Now Has a Creator, a Reviewer, and a Burner
description: I turned backlog work into a three-skill loop that discovers useful work, challenges the plan, ships it, and then checks whether Done is actually true.
seoDescription: "A practical Codex workflow using Backlog Creator, Reviewer, and Burner skills to discover, verify, implement, and audit work across many repositories."
date: 2026-08-12
authored_by: ai-assisted
tags:
  - AI
  - Agents
hidden: true
draft: true
pinned: false
featured: false
---

I asked Codex to clear my backlogs. It did. Then I asked it to find more work.

Somewhere between those two prompts, I accidentally created a small bureaucracy.

There is now a **Backlog Creator**, a **Backlog Reviewer**, and a **Backlog Burner**. The Creator finds useful work. The Reviewer argues with it. The Burner does the work. Then the Reviewer comes back and argues with the Burner.

This sounds like process for the sake of process. In practice, it is three Markdown skills and one useful rule: **Done is a claim, not a state transition.**

## The first version was just “burn the backlog”

The original idea was delightfully blunt. Point an agent at a pile of repositories, find the canonical TODOs, turn the committed ones into tracker issues, rank them, and keep going until the feasible work is gone.

I called it Backlog Burner because “token furnace” sounded less responsible.

It worked surprisingly well. The Burner could read repository instructions, inspect Linear, preserve dirty worktrees, create isolated branches, delegate bounded slices, run tests, open draft pull requests, and leave genuinely external work open. It was much better than asking an agent to “work through TODO.md,” which is an invitation to treat every half-formed idea as a product commitment.

My planning split became:

- Git is the source of truth for code.
- Repository Markdown is the source of truth for public documentation.
- Linear, or the repository's explicitly chosen tracker, is the source of truth for committed work.
- `TODO.md` is for thinking.

That last line matters. A note like “maybe support offline mode” is not the same thing as deciding to ship offline mode. The Burner should not promote every thought simply because it found a checkbox.

The problem came after the first successful burns: what should it do next?

## The Creator is not an idea generator

Backlog Creator sounds like it should sit in a room inventing features. I made it do almost the opposite.

It starts with archaeology:

- What is on the current remote default branch?
- Which pull requests are open, merged, failing, or waiting on review?
- What did the latest implementation defer explicitly?
- Which docs disagree with runtime behaviour?
- Which tests are missing around code that just changed?
- Does the tracker already contain the same objective?
- Which local files are private, dirty, generated, or simply none of its business?

Only after that does it propose work.

A failed check on an open pull request is usually not a new backlog item. It is unfinished work in that pull request. A missing browser check on an otherwise implemented feature is verification debt on the existing issue. A speculative rewrite stays in `TODO.md`. A concrete privacy defect with a bounded fix and credible test path can become committed work.

The Creator's useful output is not a giant list. It is a small packet: current remote state, existing issue matches, evidence, scope, non-goals, dependencies, verification, protected operations, and a ranked order.

The first version handed that packet directly to the Burner. After using it for real, I changed the default route:

```text
Creator -> Reviewer (pre) -> Burner -> Reviewer (post)
                                      ^               |
                                      |-- remediation-|
```

The Reviewer gets first refusal.

## The Reviewer exists because green is a colour, not proof

The Backlog Reviewer has two jobs.

Before implementation, it asks whether the work is worth burning at all. Is the problem current? Is it already fixed on another branch? Is the scope bounded? Are acceptance criteria observable? Does the verification plan match the risk? Does the work require a credential, a customer photo, a particular machine, or permission to touch production?

After implementation, it ignores the victory speech and reads the actual remote pull-request head.

It checks the changed files, current checks, unresolved review threads, issue history, runtime evidence, visual artifacts, documentation, privacy boundaries, and the original acceptance criteria. A draft pull request can pass. An unmerged pull request can pass. A green test suite can fail the review if the risky behaviour was mocked away.

That distinction turned out to be the whole point.

In one review batch, the implementation work looked excellent from a distance: current draft PRs, logical commits, green CI, evidence comments, completed milestones. The Reviewer examined eleven issues and returned four clean passes, four “not complete” verdicts, and three conditional slice passes where the broader issue correctly remained active.

The four failures were not theoretical nitpicks. They found real gaps.

## A source assertion did not catch a 614-pixel drawer

One personal site had source-level checks for mobile breakpoints, keyboard focus, reduced motion, placeholder content, and valid routes. The production build passed. The HTTP smoke passed. The issue was marked Done.

What it did not have was an actual browser.

The Reviewer rejected the mobile and interaction evidence. The Burner reopened the issue, launched real Chrome, and found that a contact-sheet component had a minimum-content width of roughly 614 pixels inside a 390-pixel viewport. Three visual styles overflowed. One heading clipped.

The fix was tiny: allow the drawer stack and drawers to shrink, then wrap the mobile heading. The durable part was not the CSS. It was the new dependency-free Chrome DevTools Protocol harness that checks 320, 390, and desktop widths, cycles through all three art directions, verifies keyboard focus and reduced motion, checks placeholders and routes, and saves screenshots for inspection.

Source assertions had proved that CSS strings existed. Chrome proved whether the page fit.

## A generated screenshot can still miss the requested layout

Another project had a new Skills browser with beautiful light and dark snapshots. The snapshot workflow was green. The images were not blank. The Reviewer still rejected completion.

Every image was 1100 pixels wide.

The acceptance criteria included narrow-window behaviour, plus useful loading, unsupported, and unavailable states. The code appeared responsive, but the requested layout had never actually been rendered. The same batch also promised cancellation behaviour for continuous local-source sync, but no deterministic test disabled auto-sync while the loop was active.

The remediation added real 620-point light and dark snapshots, implemented the missing states, added cancellation tests, and ran a disposable account-free source-health smoke with synthetic local files. Hosted macOS CI passed 41 Swift tests and 18 bridge tests. Fourteen uploaded PNGs were downloaded and inspected.

The lesson was annoyingly specific: “we generated snapshots” and “we rendered the state in the acceptance criteria” are different sentences.

## A real cloud test can still test only half the cloud path

The third gap involved a disposable Cloudflare runtime gate for an image service.

The first live run was genuinely useful. It created temporary R2 and KV resources, deployed an ephemeral Worker, proved authenticated and public flows, exercised rate limiting, survived a redeploy, cleaned up exact fixtures, and deleted the generated resources. The local suite also tested the no-KV fallback.

But that fallback used fakes.

The acceptance criteria explicitly cared about behaviour when optional KV and image bindings were absent. A mock R2 store could not prove that reserved cleanup state persisted across a real Worker restart. The Reviewer kept the issue open.

The Burner then ran the missing real fallback. The first attempt hit Worker propagation delay and failed its bounded readiness window. This was where the workflow earned its keep: the agent did not widen the timeout until the check turned green. It used the recovery ledger to delete the exact generated Worker and bucket, verified the endpoint was gone, and treated the attempt as recovery evidence—not acceptance evidence.

A fresh run passed. It proved R2 scanning with `indexed:false`, missing-image-transform failure, bounded rate limiting, cleanup preview persistence across redeploy, successful apply, repeat-apply conflict, and zero residual fixtures. No KV namespaces existed. The Worker and bucket were deleted. The existing code did not need a change, so the Burner did not manufacture an empty commit. It updated the pull request and tracker with the runtime proof.

That produced two new rules:

1. Evidence-only remediation is valid; an empty commit is not evidence.
2. Recovery from a failed disposable run proves cleanup, not acceptance.

## The tracker has to tell the truth during the work

The Reviewer had found four issues marked Done without complete evidence. Before the Burner touched code or created cloud resources, it moved each issue back to an active state and left a comment naming the missing gate.

Only after the new evidence passed did the issues return to Done.

That sounds cosmetic until multiple agents or humans are looking at the same milestone. If an issue stays Done while somebody performs risky remediation, the tracker is lying precisely when its state matters most. It also makes failure awkward: if the browser exposes a real defect or teardown fails, there is no honest transition left to make.

The improved Reviewer now emits a remediation packet with the issue baseline, exact branch and pull request to reuse, missing evidence, allowed scope, non-goals, verification environment, protected operations, cleanup requirements, and the evidence required before Done.

The improved Burner treats that packet as a fence. It does not create a fresh issue, milestone, branch, or PR unless the packet says the work is genuinely independent.

## Yes, this burns tokens

The obvious criticism is in the name. The workflow reads a lot: repository instructions, docs, Forge context, trackers, branches, pull requests, checks, tests, artifacts, and sometimes a live service. Then another agent reads much of it again.

That is not free.

But the expensive failure mode is not “the agent read the repository twice.” It is “the project says Done, the risky path was never exercised, and I discover that after merge or deployment.”

The Reviewer spends tokens where confidence is usually hand-waved. The Burner spends them where evidence is missing. Creator saves tokens downstream by refusing duplicates and speculative work. The loop is intentionally asymmetrical: broad discovery once, bounded implementation, adversarial verification, then narrow remediation.

I still do not let it merge automatically. It does not get to publish private context, invent credentials, fabricate customer content, or decide that a production deployment is harmless. Draft pull requests remain the handoff point. Humans still decide when code crosses the final boundary.

## Three Markdown files and a refusal to trust Done

I like Codex skills because they are not a framework. Each one is mostly a Markdown operating procedure with a small reference checklist. The value comes from preserving decisions between runs:

- Creator knows where ideas belong and how to avoid duplicate work.
- Reviewer knows that acceptance is frozen before implementation and evidence must match risk.
- Burner knows how to execute safely, preserve local work, and close the tracker only after proof.

The loop is not autonomous software development. It is closer to a standing argument among three roles, each optimized for a different mistake.

The Creator's mistake is enthusiasm: finding too much work.

The Burner's mistake is momentum: shipping the requested shape and declaring victory.

The Reviewer's mistake is caution: asking for proof that may feel redundant.

For now, I would rather pay for the argument.
