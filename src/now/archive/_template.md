---
layout: layouts/home.njk
eleventyExcludeFromCollections: true
title: "{{ 'YYYY-MM-DD' | archiveTitle }}"
permalink: false
archiveDate: YYYY-MM-DD
---

{# <h1>Now - {{ archiveDate | archiveHeading }}</h1> #}
{# <p>This is a snapshot of my <a href="/now/">/now</a> page as it appeared on {{ archiveDate | archiveReadableDate }}.</p> #}

<!--
Every new /now/ page must archive the outgoing page first.
Copy its content here, excluding the footer and archive link, then rename this
file to the outgoing page's YYYY-MM-DD date before editing nowPage.yaml.
-->
{# 
---
<p><a href="/now/archive/">Back to now archive</a></p> #}
