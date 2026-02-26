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

  <ul class="list-none m-0 p-0 space-y-8 pl-7">
    {% for entry in archiveEntries %}
    <li class="relative">
      {# dot #}
      <div class="absolute -left-7 top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-950" style="background: var(--accent-color);"></div>
      <div class="flex items-baseline gap-3 mb-2">
        <time class="meta-text text-xs text-gray-400 dark:text-gray-500 font-semibold">{{ entry.data.archiveDate | readableDate }}</time>
        <a href="{{ entry.url }}" class="text-xs text-gray-400 dark:text-gray-500 hover:underline" style="text-decoration:none;">permalink →</a>
      </div>
      <div class="text-sm text-gray-700 dark:text-gray-300 site-content prose-sm">
        {{ entry.templateContent | safe }}
      </div>
    </li>
    {% endfor %}
  </ul>
</div>
{% else %}
<p class="text-sm text-gray-400">No archive entries yet.</p>
{% endif %}

