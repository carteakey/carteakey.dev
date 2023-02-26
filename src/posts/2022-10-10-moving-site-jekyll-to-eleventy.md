---
title: Moving my site from Jekyll to Eleventy.
description: How I revamped my personal site.
date: 2022-10-10
tags:
  - Eleventy
  - Jekyll
layout: layouts/post.njk
---

So, after a lot of procrastination, I decided to migrate my old [site](https://carteakey.github.io) - which was based on Jekyll's popular theme - [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/) and hosted on [GitHub Pages](https://pages.github.com/).

While the experience of it had been great so far, it was time to move on.

Here are a few reasons why:

- Setting up a local development environment in Jekyll is painful, to say the least. (Although docker does help in that)
- I am not a Rubyist (nor a good web dev) - so customizing anything to suit my needs involved a lot of research.
- I am out of ideas and have nothing better to do.

## Why Eleventy?

Jekyll is still a good option for a static site generator. It is now quite mature and feature-complete.

However, I chose [Eleventy](https://www.11ty.dev/) as the new framework.

- It is lightweight & super fast.
- It is a lot more flexible and extensible, thanks to the Javascript ecosystem.
- It supports multiple templating systems out of the box (including Liquid - the one used by Jekyll)
- It is much easier for someone equally unskilled in Javascript & Ruby to build, customize and deploy.
- It feels the closest to Jekyll than other jamstack generators, yet makes it much more simple and more accessible.
- And most importantly, it's **_new and shiny_**. (Atleast for me - it has been around for a while now)

I tried my hand at other popular [options](https://jamstack.org/generators/) - A lot of them (e.g. Next, Gatsby) are simply overkill - they involve cognitive load associated with taking care of an unnecessarily complex system when you just wanted to render some text, with some occasional images.

## Migrating from Jekyll

My earlier site was pretty small, so it was quite easy to make the move.

I started with the [eleventy-base-blog](https://github.com/11ty/eleventy-base-blog) template which made it even easier.

Some references that helped me in this endeavor:

- https://nicolashery.com/moving-a-blog-from-jekyll-to-eleventy/
- https://savjee.be/blog/migrating-this-blog-from-jekyll-to-eleventy/

## Conclusion

The site in its current state is quite barebones, but I can already feel the benefits.

I plan to keep it minimal but will keep on adding features and sharing my experiences alongside.

Anyhow, it was a weekend well spent. :)
