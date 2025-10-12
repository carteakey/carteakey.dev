---
layout: layouts/home.njk
title: Now Page Archive
permalink: /now/archive/
---

<h1>Now Page Archive</h1>
<p>This is an archive of previous versions of my <a href="/now/">/now</a> page. Each entry below links to a snapshot of what my /now page looked like at that time. Should probably call this back then.</p>

<ul>
  {%- for snap in collections.nowArchive | reverse %}
    {% if loop.first %}
      <li><a href="/now/">{{ snap.data.archiveDate | archiveReadableDate }}</a> (current)</li>
    {% else %}
      <li><a href="{{ snap.url }}">{{ snap.data.archiveDate | archiveReadableDate }}</a></li>
    {% endif %}
  {%- endfor %}
</ul>
