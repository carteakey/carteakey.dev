# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.2] - 2025-10-01

### Added
- Feed: extended unified timeline to include photos, vibe board entries, microposts, snippets, blog posts, and /now archive updates with per-type metadata.
- Blog folders: automatic `/blog/{folder}/` listing pages generated from the posts directory structure, with breadcrumb-aware pagination.
- Post asset pipeline: copies allowed files stored alongside posts into the matching `/blog/` output path so relative links (e.g., `./diagram.png`) work out of the box.
- Documentation: EthicalAds setup guide at `docs/ETHICAL_ADS_SETUP.md` detailing configuration steps.

### Changed
- Homepage and `/feed/` cards restyled to match site card design and retitled from "Recent Activity" to "Feed" everywhere.
- Primary blog index now lives at `/blog/` (with legacy `/posts/` redirect) and sample posts moved under `/blog/tech/` and `/blog/personal/` to demonstrate folder routing.
- Posts referencing the GPT OSS benchmarks bundle now use relative asset links (`../gpt-oss-benchmarks/...`) to align with the new asset pipeline.

## [1.3.1] - 2025-10-01

### Added
- Micropost collection with inline-only entries feeding the unified activity stream.
- EthicalAds placement for posts and snippets, backed by a reusable sidebar component and global script loader.
- Gradient KC logo (`src/static/img/logo.svg`) now displayed in the site navigation.

### Changed
- Restyled the feed page and homepage activity cards for type-aware badges, improved spacing, and better responsiveness.
- Homepage "Recent Activity" now lives beneath the Quote of the Day and surfaces six latest items across all content types.
- Documentation housekeeping: developer guides (e.g., Copilot instructions) now live under `docs/` for a single source of truth.

## [1.3.0] - 2025-09-30

### Added
- **Stats Page**: Dedicated Lighthouse Performance section with all 4 categories (Performance: 94, Accessibility: 95, Best Practices: 100, SEO: 91)
  - Visual progress bars for each metric
  - Color-coded cards with gradient backgrounds
  - Individual icons for each category (zap, users, shield, search)
- **Stats Page**: Total words written metric (estimated ~800 words per post)
  - Shows total words in thousands (k) format
  - Displays average words per post
- **Stats Page**: Total visitors count tracked via Redis
  - Real-time visitor tracking from Upstash Redis
  - Integrated with existing analytics infrastructure
- **Stats Page**: Denser, more informative meta information section
  - Now displays 12 technical details in compact grid layout
  - Added: CSS Framework (Tailwind CSS v4), JS Framework (Alpine.js), Hosting (Netlify)
  - Added: Template Engine (Nunjucks), Syntax Highlighting (PrismJS), Comments (Giscus)
  - Added: Analytics (Upstash Redis), Build Time
  - Improved visual hierarchy with uppercase labels and better spacing
- **Feed Page**: New unified activity feed at `/feed/`
  - Combines posts and snippets in reverse chronological order
  - Visual indicators for content type (Post vs Snippet)
  - Color-coded borders (blue for posts, purple for snippets)
  - Displays tags, dates, and descriptions for each item
  - Added to navigation menu (order: 10)
- **Homepage**: Replaced "Recent Posts" section with "Recent Activity" feed
  - Shows latest 5 items from unified feed
  - Includes both posts and code snippets
  - Better visual design with type badges and borders
  - Links to full activity feed, posts, and snippets pages

### Changed
- **Data Layer**: Created `visitors.js` data file for Redis-based visitor tracking
- **Collections**: Added new "feed" collection that merges posts and snippets
  - Each item tagged with `feedType` property for easy filtering
  - Maintains proper date sorting across content types
- **Footer Navigation**: Simplified layout with visual separators instead of categories
  - Removed category headings (Main, Work, Content, etc.)
  - Added bullet point separators (•) between logical groups
  - More compact, less whitespace
  - All links in single flowing row with wrapping
- **More Page**: Changed to alphabetically sorted list
  - Removed category sections
  - Single "All Pages" section with A-Z sorting

## [1.2.0] - 2025-09-30

### Added
- Bookmarks page: New curated reading list of recommended articles and resources
  - Organized by categories (Development, Career, Learning, Communication, etc.)
  - 10+ carefully selected links with descriptions and tags
  - External link indicators for better UX
- Stats page: Total upvotes metric showing aggregate engagement across all posts
- Projects page: GitHub contributions graph visualization
  - Shows yearly contribution activity
  - Integrated using ghchart.rshah.org service
- Footer: Better alt text for Spotify album artwork (accessibility improvement)
- Footer navigation: Categorized site navigation into logical groups
  - Main (About, Now, Blog, CV)
  - Work (Projects, Snippets)
  - Content (Gallery, Vibes, Quotes)
  - Lifestyle (Games, Workouts)
  - Resources (Search, Stats, Blogroll, Bookmarks, Newsletter, More)

### Changed
- Footer: Reorganized icon links into visual groups with separators (no labels)
  - Social icons (LinkedIn, GitHub)
  - Discovery icons (Search, Blogroll)
  - Subscribe icons (RSS, Newsletter)
  - Better mobile responsiveness with flex layout
- More page: Updated to reflect new categorized structure matching footer navigation

### Fixed
- Stats page: Fixed "Days Since Last Post" calculation bug
  - Now correctly uses the latest post date instead of build date
  - Accurate day count display

## [1.1.1] - 2025-01-14

### Changed
- Blogroll: Increased information density with 2-column grid layout and compact cards
- Navigation: Removed Search, Blogroll, and Newsletter from main nav dropdown (now only in footer)
- Stats page: Added Lighthouse performance score card with A11y and SEO metrics

### Fixed
- Stats page: Fixed "Days Since Last Post" bug - now correctly shows days since most recent post instead of first post

### Added
- Footer: Added Newsletter (mail icon) and Blogroll (bookmark icon) to footer icons for quick access

## [1.1.0] - 2025-01-14

### Added
- Search functionality across posts and snippets
  - Full-text search with live filtering
  - Search by title, description, content, or tags
  - Results sorted by relevance
  - Clean UI with result count display
  - Search icon in footer for easy access
- Related posts feature
  - Automatically shows up to 3 related posts based on shared tags
  - Compact design with border accent
  - Displays at the bottom of each blog post
- Loading states for dynamic content
  - Added loading spinner for upvote count fetching
  - Smooth opacity transition during loading
  - Newsletter form submission loading state
- Blogroll page
  - Expanded to 30+ recommended blogs and websites
  - Includes web dev, self-hosting, AI/ML, and data science resources
  - Organized with descriptions and topic tags
  - External link indicators
- Newsletter signup page
  - Email subscription via Netlify Forms
  - Privacy-conscious with consent checkbox
  - Success/error states with clear messaging
  - Honeypot spam protection
  - Links to RSS feed as alternative
  - Focused on AI, data science, and self-hosting topics

### Changed
- Post list layout: date and reading time now stack vertically in left column (desktop)
- Navigation: Added Search, Blogroll, and Newsletter to dropdown menu
- More page: Updated with all new pages including search, blogroll, and newsletter
- Newsletter wording updated to focus on AI, data science, and self-hosting content
- Related posts section made more compact with cleaner design

### Fixed
- Search functionality now properly handles snippets collection
- Search results display correctly with all content types

## [1.0.1] - 2025-01-14

### Fixed
- Easter egg features now working correctly
  - Konami code (↑↑↓↓←→←→BA) key detection fixed with proper case-insensitive comparison
  - Double-click site title detection improved with timestamp-based logic
  - Triple-click footer sparkle mode now properly detects clicks in footer area
  - Shift+click theme slider achievement counter wrapped in DOMContentLoaded
- Reading time layout in post list view
  - Desktop: Date and reading time now displayed in single left column (stacked vertically)
  - Tags moved to separate row below description in left column
  - Mobile: Maintains horizontal inline layout with proper separators

### Added
- Comprehensive testing guide (TESTING_GUIDE.md)
  - Step-by-step instructions for testing all easter eggs
  - Methods to validate JSON-LD structured data
  - Tools and techniques for testing Open Graph and Twitter Card tags
  - Troubleshooting section for common issues
  - Production testing checklist

## [1.0.0] - 2025-01-14

### Added
- Estimated reading time feature for blog posts
  - Added `readingTime` filter calculating based on 200 words per minute
  - Display reading time with clock icon in post layouts
  - Show reading time in post list views (both mobile and desktop)
  - Automatic word count from content with HTML tag stripping
- JSON-LD structured data for enhanced SEO
  - BlogPosting schema for blog posts with headline, description, author, dates, keywords
  - WebSite schema for homepage with SearchAction potential
  - Proper author and publisher information
  - Integration with existing metadata
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
