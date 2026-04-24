# carteakey.dev Migration Process

This document is for the boring part of redesign work: taking older pages that still use ad hoc utility stacks and moving them onto the current design language without accidentally redesigning the whole site from scratch again.

The goal is not novelty. The goal is convergence.

## What counts as a migration pass

A migration pass is any sweep where an older page is brought onto the current design system by:

- replacing fallback typography
- removing outdated card/chrome habits
- swapping repeated utility stacks for shared primitives
- tightening structure so the page reads like carteakey.dev again

Examples:
- archive page
- footer mega nav
- now page
- notes index
- older collection pages like reading, projects, stats

## The order of operations

Do this in order. Skipping the early steps is how a “quick cleanup” turns into random CSS sprawl.

### 1. Inventory the page

Before editing, find the obvious legacy text stacks.

Typical search:

```sh
rg -n "text-(xs|sm)|font-semibold|font-medium|tracking-widest|tracking-wide|text-gray-(4|5)" src/<page>.njk src/_includes
```

You are looking for:

- utility-only text styling in content areas
- page-local repeated patterns that should be named
- old rounded/card leftovers
- places where metadata, support copy, and titles are all using the same font role

### 2. Assign a type role to every element

Do not start by swapping classes blindly.

Each element should fall into one of four roles:

- display title
- serif support/body copy
- mono metadata/label
- rare sans UI control

If you cannot explain what role a text element plays, stop and decide that first.

## Current shared primitives

Use the shared primitives before inventing more page-local CSS.

- `.editorial-kicker`
- `.editorial-title`
- `.editorial-title-link`
- `.editorial-title-compact`
- `.editorial-title-link-compact`
- `.editorial-support`
- `.editorial-support-compact`
- `.editorial-meta-link`
- `.footer-nav-heading`
- `.footer-nav-link`
- `.footer-smallprint`
- `.now-log`

See also: [DESIGN_LANGUAGE.md](./DESIGN_LANGUAGE.md)

## Common replacement patterns

These are the swaps that come up over and over.

### Section labels

Before:

```html
<h2 class="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
```

After:

```html
<h2 class="editorial-kicker">
```

### Row or item titles

Before:

```html
<a class="font-semibold text-gray-900 dark:text-gray-100">
```

After:

```html
<a class="editorial-title-link">
```

Or for tighter cards:

```html
<a class="editorial-title-link-compact">
```

### Description / support copy

Before:

```html
<p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
```

After:

```html
<p class="editorial-support-compact">
```

Or the roomier version:

```html
<p class="editorial-support">
```

### Small action links

Before:

```html
<a class="text-xs text-gray-400 hover:underline">
```

After:

```html
<a class="editorial-meta-link">
```

### Footer links

Before:

```html
<a class="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
```

After:

```html
<a class="footer-nav-link">
```

## When to add a new primitive

Add a new primitive only when all of these are true:

1. The pattern appears at least twice.
2. It is likely to recur on other pages.
3. It represents a real semantic role, not one page's special case.

Bad reason:
- “this one page needs a slightly different gray”

Good reason:
- “we keep having the same compact title pattern in archive cards, feed cards, and now snippets”

When you add one:

1. Add it to `src/static/css/tailwind.css`
2. Keep it narrow and role-based
3. Add it to `docs/DESIGN_LANGUAGE.md`

## Structural rules during migration

Do not:

- add new decorative cards just because a section feels empty
- use bigger type to compensate for weak structure
- leave one page half semantic and half utility-styled
- redesign unrelated pages in the same pass

Do:

- keep the write surface focused
- move repeated styles into shared classes
- keep metadata mono
- keep support copy serif
- keep titles visually stronger than descriptions

## Verification checklist

After a pass:

- Does the page still fit the current design language?
- Are titles clearly in the display face?
- Is support copy serif where it should be?
- Are labels/dates/counts mono?
- Did any old `text-sm text-gray-500` stacks remain in important content?
- Did the page get denser in a useful way, not just tighter?

## Release checklist

For a finished migration batch:

1. Update `versions.json`
2. Update `docs/CHANGELOG.md`
3. Update `docs/TODO.md`
4. Run `npm run build`
5. Spot-check the affected pages

## Recommended next migration targets

At the time of writing, the likely remaining candidates are:

- `reading.njk`
- `projects.njk`
- `stats.njk`
- any collection page still leaning on raw `text-sm text-gray-500 font-*` content stacks

That is the whole point of this document: keep the next pass mechanical where it should be, and thoughtful where it actually matters.
