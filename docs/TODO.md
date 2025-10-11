# Site Improvement TODO List

## High Priority Features

### SEO & Navigation

### User Experience

### Content Features

## Medium Priority

- [x] New blogpost - "How i let AI run wild on my blog - using copilot and codex" - the flow, the prompt.md and the instructions.md file.
Before: https://68d0d4ffaa909e0008c341e0--starlit-brigadeiros-b87f35.netlify.app
After: https://carteakey.dev
- [x] Add the same masonry layout to the feed on homapage as it shows up in the feed page.
- [x] Remove the dropdown navbar, keep a three ... feather icon that opens the more page.
- [x] Fix Contribution data is unavailable right now. Try checking back later.
- [x] Hide breadcrumbs on mobile view - they take up too much space and are not very useful on small screens.
- [ ] There's 5 types of cards - blogroll, projects, bookmarks, feed, snippets. Projects is 3 columns based which is per design.
The feed and snippets are good and similar, but blogroll and projects, bookmarks are different. Bookmarks has flashy animations, different date format, bigger cards. Blogroll is denser but different style. We should have a single card style for all of them, with minor variations if needed. The one that needs most work is bookmarks. Bookmarks count should be similar to snippets count. Same for blogroll. 

- [x] Add Some padding on top and bottom of the main base view to give it some notebook feel.
- [x] Make the readable view slighty transparent with a subtle shadow and square corners. 

- [ ] Add a link to open the Feed in the frontpage heading of Feed. Maybe a link beside the heading with an arrow icon or something.


Buy me a coffee

### Performance & Technical
- [ ] Add service worker for offline reading
- [ ] Implement lazy loading for images (if not already present)
- [ ] Add RSS feed enhancements (full content)

### Interactive Features
- [ ] Tag filtering - Interactive tag-based post filtering
- [ ] Code snippet favorites - Let visitors save useful snippets

### Analytics & Insights

- [ ] Learning progress tracker
- [ ] View count tracking (privacy-friendly)

### Content Organization
- [ ] Archive page improvements
- [ ] Add skip links for accessibility
- [ ] Improve heading hierarchy
- [ ] Add table of contents for long posts

### Future Enhancements
- [ ] Dark/light mode improvements

## Maybe Later

- [ ] Add print styles - Better printing experience
- [ ] Add JSON-LD structured data for blog posts
- [ ] Comment threading - Enhanced Giscus comments
- [ ] Live typing effect - Animate text on homepage
- [ ] Popular posts widget - Most upvoted content
- [ ] Blog series navigation - Group related posts with prev/next
- [ ] Custom fonts optimization
- [ ] Progressive web app features
- [ ] Advanced search with filters
- [ ] Multi-language support

## Completed TODOs
### 2025-10-05
- [x] Background - implement a subtle, non-distracting background pattern or gradient. Right now its plain background.
- [x] Footer row icons with links to social media, GitHub, email should be in a single line on small screens. STill wrapping to 2nd line on small screens.
- [x] Bookmarks page should follow the same card style as blogroll and projects. Looks very different right now.
- [x] Feed - implement masonry layout like the gallery. I discarded the previous implementation as it was buggy.
- [x] Critical CSS inlining for above-the-fold content
### 2025-10-04
- [x] In the feed, the photo format is not closing and the rest of the items are getting put into that container.
- [x] Notebook reading frame widened with square edges, taller breathing room, and a softer desktop padding cadence.
- [x] Site backdrop now leans into a gray gradient layered over the doodle pattern for a calmer desk vibe.
- [x] Long-form prose now uses the et-book family for a notebook feel while UI text stays crisp.
- [x] Sidebar cards restyled: matching backgrounds, cushioned padding, comment pointer component, and EthicalAds paused.
- [x] Feed grid upgraded to a masonry layout with auto-resizing tiles like the gallery.
- [x] Notebook reading frame now adds a desktop-only off-white surround with a matching outline card on posts.
- [x] Reserved a right-rail "Conversation space" block beside posts for future inline comments.
- [x] Notebook frame defers on mobile screens and `fullWidth` pages to stay out of the way.
- [x] Bookmarks CTA links now inherit the active accent theme instead of hard-coded amber tones.
- [x] 404 hero actions and badge now follow the accent theme with the new accent utility classes.
- [x] Added an off-white doodle backdrop outside the main reading column for a cozier feel.
- [x] Feed cards now size themselves to their content height instead of stretching to match neighbors.
- [x] "Back to Top" control now inherits the currently selected accent theme colors.
- [x] Bookmarks display each site's favicon with graceful fallbacks.
- [x] Bookmark timestamps use the same readable date format as blog posts.
- [x] Feed layout refreshed to match card styling across the site and share a reusable component.
- [x] Footer icon row now stays on a single line on small screens.
- [x] Snippets index rebuilt with card grid styling, search polish, and inline metadata chips.
- [x] Site typography tightened for higher information density.
- [x] Lighthouse metrics now sourced from `_data/lighthouse.json` and displayed dynamically on the stats page.
- [x] GitHub contribution graph integration with data-driven heatmap on projects page
- [x] Better 404 page design with helpful navigation
- [x] Bookmarks page aligned with blogroll/projects card layout
- [x] Add a "Back to Top" button on long pages floating at bottom right
- [x] Port image optimization to remaining templates using eleventy-img
- [x] A blog post outlining how i am working with copilot and codex - the flow, the prompt.md and the instructions.md file. 
- [x] Create bookmarks/reading list - Curated list of articles you recommend
- [x] Add post reactions - Beyond upvotes, add emoji reactions
- [x] Allow me to link files from the posts folder to post itself - like images, PDFs, etc. For example, if I have a post about a project, I should be able to link to the project's GitHub repo or a PDF document related to the project from within the post content. The files should be stored in the posts folder and linked using relative paths. This will help keep all related content together and make it easier to manage. e.g. gpt-oss-benchmarks folder i want to link the raw html files e.g. GPT‑OSS output (HTML): camping-gear-checklist.html not rendered in the post but linked to the file in the folder, same for .py, .yaml files etc etc. There is some implmentation in place but not working as expected.
- [x] Move completed TODO items to a separate section at the bottom of the TODO list with a date stamp of when they were completed. This will help keep the TODO list clean and focused on pending tasks while still maintaining a record of what has been accomplished.
- [x] Blogroll - increase information density
- [x] Newsletter signup - add to footer as icon
- [x] Stats page - add lighthouse score
- [x] Remove Search, Blogroll, Newsletter from nav - keep only in footer
- [x] Organize footer links better - group related links together 
- [x] Add alt text to all images - improve accessibility
- [x] Stats - Add total visitors count *maybe capture the existing count from Google Analytics* or Redis
- [x] Add gitub contributions graph to projects page
- [x] Add bookmarks/reading list - curated list of articles you recommend
- [x] Stats Page - fix days since last post bug - currently shows first post date
- [x] Drop some easter eggs in the site (fun, hidden features) using feather icons and TailwindCSS animations or anything else.
- [x] stats page - Lighthouse score should have its own section with all 4 categories (Performance, Accessibility, Best Practices, SEO).
- [x] stats page - Add total words written across all posts
- [x] Stats - Add total visitors count *maybe capture the existing count from Google Analytics* or start capturing in Redis
- [x] Stats - Meta information needs to be denser
- [x] I want a feed view of all posts, snippets, and pages in one place - like a mini RSS feed on the homepage or a separate page. 
- [x] Feed view It should allow me to post mini-blogs as well, like tweets or micro-posts - maybe use a new collection called "microposts" or "feed"? It should contain posts, snippets, and microposts in reverse chronological order. Posts and snippets should link to their respective pages, while microposts can be displayed in full.
- [x] Feed view looks ugly right now - needs better styling and layout. Maybe use a layout with a consistent design for all items. Each item should show the title, date, and description. Mini blogs should be present in full. move it below quote of the day to fit more items. Use TailwindCSS for styling and make it responsive.
- [x] We can then replace the "Recent Posts" section on the homepage with this feed view, showing the latest 5-10 items from the feed collection. This will give visitors a quick overview of all recent activity on the site in one place.
- [x] Move all markdown docs to the docs folder - apart from README.md
- [x] I'd want a logo 
- [x] Ads by EthicalAds - on the left sidebar of blog posts and snippets pages
- [x] Recent activity to be renamed to Feed
- [x] Recent activity to show photos, vibe photos, now page updates, posts, snippets, microposts and any other content in one place.
- [x] The feed cards should be similar to the blogroll, projects and stats cards, they're not white boxes.
- [x] a blog folder view - that allows me to put posts in folders like /blog/tech/, /blog/personal/, /blog/work/, etc. and have a page that lists all posts in that folder. The folder structure should be reflected in the URL as well. For example, a post in the tech folder would have a URL like /blog/tech/post-title. The blog folder view page should show all posts in that folder with their titles, dates, and excerpts. In the breadcrumb too.
- [x] Allow me to link files from the posts folder to post itself - like images, PDFs, etc. For example, if I have a post about a project, I should be able to link to the project's GitHub repo or a PDF document related to the project from within the post content. The files should be stored in the posts folder and linked using relative paths. This will help keep all related content together and make it easier to manage.
- [x] Add sitemap.xml - Already present at `/sitemap.xml`
- [x] Implement breadcrumbs - Better navigation
- [x] Add meta tags optimization (Open Graph, Twitter Cards)
- [x] Add JSON-LD structured data for blog posts
- [x] Add estimated reading time - User experience enhancement
- [x] Create stats page - Site statistics (Posts count, total words, visitors)
- [x] Add search functionality - Full-text search across posts and snippets
- [x] Implement related posts - Show similar posts based on tags or content
- [x] Add loading states for dynamic content
- [x] Add blogroll section - Curated list of blogs you recommend
- [x] Newsletter signup - Simple email collection via Netlify Forms

## Completed Features ✅
- [x] Upvote system
- [x] Dark mode toggle
- [x] Accent color theme switcher  
- [x] Responsive design with Tailwind CSS
- [x] Syntax highlighting with PrismJS
- [x] Comments with Giscus
- [x] RSS feed
- [x] SEO-friendly URLs
- [x] Navigation with Eleventy Navigation
- [x] Image optimization (partial)

---

**Next Up: Stats Page Implementation** 📊
