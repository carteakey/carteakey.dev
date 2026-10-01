---
name: commit-batches
description: Commit and push carteakey.dev work in coherent, hook-checked batches without sweeping up other people's or other sessions' changes, and verify the committed tree builds before pushing. Use when the user says commit, push, "ship it", or "commit everything", and whenever the working tree holds changes from more than one source.
---

# Commit in batches

**Status: draft.** Distilled from the 2026-10-01 commit of 151 changed files (7
commits, one push), where another session was committing at the same time.

## Know what is in the tree first

```sh
git fetch origin && git status -sb
git log --format='%h %ad %an %s' --date=format:%H:%M -8      # did another session commit while you worked?
git status --short | awk '{print $1}' | sort | uniq -c
```

The tree usually mixes: your work, another session's work, and the owner's
earlier uncommitted work (docs reorgs, template passes, moved files). Another
session's commit may already contain some of your files under its own message;
you cannot relabel pushed history, so just say so.

**Scope is the owner's call.** If "commit" is ambiguous, ask once: only my work,
or everything. When they say everything, do everything but still batch it.

## Check for dependencies between groups

A change can depend on an uncommitted file from another group (a post using a
shortcode defined in an uncommitted `eleventy.config.mjs` hunk). Committing the
post alone breaks the committed build. Grep for it before staging, and either
commit the dependency in the same or an earlier batch or hold the dependent file.

## Batches

Stage with **explicit paths**, never a blanket `git add -A` first.

1. Group by purpose and path, e.g. docs reorg; tooling/guard; skills; a feature
   (JS+CSS+template); posts and their images; rule docs; leftover site templates.
2. Put a file with hunks from several groups in the group that needs it to build.
   `git add -p` is interactive and unavailable; if you truly must split a file,
   build the wanted content and write it to the index
   (`git hash-object -w` + `git update-index --cacheinfo`).
3. Commit with a conventional, scoped message and the attribution line the
   harness provides. Run through the hook; a hook failure means fix, not
   `--no-verify`.
4. Leave out, and **tell the owner**: unreferenced scratch/generator output
   (check `grep -rl <name> src docs`), secrets (`.env`, tokens), caches, large
   binaries (`du -k` the untracked list first).

## The hook

`.githooks/pre-commit` runs `check-version`, `check-content`, and `check-design`
on the **working tree** (not the index). It is installed by `npm install`
(`prepare`) via `core.hooksPath`. A pass means the working tree is clean of new
drift, not that each staged subset is self-consistent: that is what the next step
is for.

## Verify the committed state before pushing

A push deploys on Netlify. Build into a scratch directory so the dev server and
`_site/` are untouched (see `dev-server`):

```sh
npx eleventy --output=$SCRATCHPAD/site-test --quiet
```

Confirm the pages you changed exist in the output. Do not run `npm run build`
with a dev server up (its `prebuild` wipes `_site/`).

## Push

AGENTS.md says batch pushes (roughly 5-10 commits) to save Netlify build minutes.
Push sooner only when the owner asks, it is urgent, or the batch is already a
sensible deploy unit. After each commit remind them how many commits are
unpushed. When they say "push", push, then:

```sh
git fetch origin -q; git rev-list --left-right --count HEAD...origin/main     # expect 0 0
```

Mention any remote advisories GitHub prints (e.g. Dependabot counts); do not
ignore them.

## Pulling with local changes

```sh
sha=$(git stash create "pre-pull snapshot") && git update-ref refs/backup/pre-pull "$sha"   # safety net
git pull --rebase --autostash origin main
```

Expect conflicts in `docs/CHANGELOG.md` and `versions.json` when both sides
bumped the version. Resolve by renumbering into one linear sequence (never two
entries with the same version), then `git add` and `git rebase --continue`. When
the autostash re-applies, check for markers (`grep -rn '^<<<<<<<'`), run
`node utils/check-version.mjs`, and only then `git stash drop`. The pop de-stages
anything that was staged.
