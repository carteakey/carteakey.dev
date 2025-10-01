# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
