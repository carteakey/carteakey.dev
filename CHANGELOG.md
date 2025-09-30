# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-14

### Added
- SEO meta tags optimization for social media sharing
  - Open Graph meta tags for Facebook and LinkedIn sharing
  - Twitter Card meta tags for enhanced Twitter previews
  - Article-specific Open Graph tags for blog posts (published_time, author, tags)
  - Canonical URLs for SEO
  - Theme color meta tags for mobile browsers
  - Fallback to avatar.png for social media preview images
- Breadcrumb navigation component for better site navigation
  - Added reusable breadcrumbs component (`src/_includes/components/breadcrumbs.njk`)
  - Integrated breadcrumbs into post, snippet, home, and major page layouts
  - Custom `split` filter added to Eleventy config for URL parsing
  - Breadcrumbs show hierarchical navigation with home icon and chevron separators
  - Special handling for known sections (Blog, Now, Snippets, Gallery, etc.)
  - Responsive design with proper dark mode support
- Easter egg features for enhanced user engagement:
  - Konami Code easter egg (↑↑↓↓←→←→BA) triggers floating animated icons and celebratory message
  - Secret message reveal on double-clicking site title/logo
  - Sparkle trail mouse effect activated by triple-clicking footer
  - Secret click counter with achievements (activated by Shift+Click on theme slider)
  - Custom CSS animations for all easter egg effects (float, bounce, sparkle, slideIn/Out)
