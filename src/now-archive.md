---
layout: layouts/base.njk
title: Now Archive
description: A timeline of past /now updates.
permalink: /now/archive/
---

{% include "components/breadcrumbs.njk" %}

<div class="not-prose mb-6 flex items-baseline justify-between">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight m-0">Now Archive</h1>
    <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Past snapshots of <a href="/now/" class="title-hover">what I was up to</a>.</p>
  </div>
</div>

{% set archiveEntries = collections.nowArchive | reverse %}
{% if archiveEntries %}
<div class="not-prose relative">
  {# vertical timeline line #}
  <div class="absolute left-[0.4rem] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-800"></div>

  <ul class="list-none m-0 p-0 space-y-6 pl-7">
    {% for entry in archiveEntries %}
    <li class="relative">
      {# dot #}
      <div class="absolute -left-7 top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-950" style="background: var(--accent-color);"></div>
      <div class="flex items-baseline gap-3 mb-1">
        <time class="meta-text text-xs text-gray-400 dark:text-gray-500">{{ entry.data.archiveDate | readableDate }}</time>
        <a href="{{ entry.url }}" class="text-sm font-medium title-hover" style="text-decoration:none;">View snapshot →</a>
      </div>
    </li>
    {% endfor %}
  </ul>
</div>
{% else %}
<p class="text-sm text-gray-400">No archive entries yet.</p>
{% endif %}

