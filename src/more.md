---
layout: layouts/base.njk
title: More
permalink: /more/
eleventyNavigation:
  key: ...More
  order: 8
---

{% include "components/breadcrumbs.njk" %}

{% set pageTitle = "Sitemap" %}
{% set pageDescription = "All pages on this site, organized by category." %}
{% set pageIcon = "map" %}

<div class="max-w-5xl mx-auto">
  {% include "components/page-header.njk" %}

  <div class="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    
    {# Content & Writing #}
    <div class="card card-compact space-y-2">
      <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        {% feather "edit-3", class="w-4 h-4" %}Content
      </h3>
      <nav class="space-y-1 text-sm">
        <a href="/blog/" class="block link-accent">/blog</a>
        <a href="/snippets/" class="block link-accent">/snippets</a>
        <a href="/feed/" class="block link-accent">/feed</a>
        <a href="/quotes/" class="block link-accent">/quotes</a>
      </nav>
    </div>

    {# About Me #}
    <div class="card card-compact space-y-2">
      <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        {% feather "user", class="w-4 h-4" %}About Me
      </h3>
      <nav class="space-y-1 text-sm">
        <a href="/about/" class="block link-accent">/about</a>
        <a href="/cv/" class="block link-accent">/cv</a>
        <a href="/now/" class="block link-accent">/now</a>
        <a href="/uses/" class="block link-accent">/uses</a>
      </nav>
    </div>

    {# Interests #}
    <div class="card card-compact space-y-2">
      <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        {% feather "heart", class="w-4 h-4" %}Interests
      </h3>
      <nav class="space-y-1 text-sm">
        <a href="/games/" class="block link-accent">/games</a>
        <a href="/vibes/" class="block link-accent">/vibes</a>
        <a href="/gallery/" class="block link-accent">/gallery</a>
        <a href="/workouts/" class="block link-accent">/workouts</a>
      </nav>
    </div>

    {# Resources #}
    <div class="card card-compact space-y-2">
      <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        {% feather "bookmark", class="w-4 h-4" %}Resources
      </h3>
      <nav class="space-y-1 text-sm">
        <a href="/bookmarks/" class="block link-accent">/bookmarks</a>
        <a href="/blogroll/" class="block link-accent">/blogroll</a>
        <a href="/projects/" class="block link-accent">/projects</a>
      </nav>
    </div>

    {# Utilities #}
    <div class="card card-compact space-y-2">
      <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        {% feather "tool", class="w-4 h-4" %}Utilities
      </h3>
      <nav class="space-y-1 text-sm">
        <a href="/search/" class="block link-accent">/search</a>
        <a href="/stats/" class="block link-accent">/stats</a>
        <a href="/newsletter/" class="block link-accent">/newsletter</a>
      </nav>
    </div>

    {# Meta #}
    <div class="card card-compact space-y-2">
      <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        {% feather "info", class="w-4 h-4" %}Meta
      </h3>
      <nav class="space-y-1 text-sm">
        <a href="/feed.xml" class="block link-accent">/feed.xml</a>
        <a href="https://slashpages.net" target="_blank" rel="noopener" class="block link-accent flex items-center gap-1">
          slashpages.net {% feather "external-link", class="w-3 h-3" %}
        </a>
      </nav>
    </div>

  </div>
</div>
