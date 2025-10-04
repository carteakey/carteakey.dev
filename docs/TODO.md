# Site Improvement TODO List

## High Priority Features

### SEO & Navigation

### User Experience

### Content Features

## Medium Priority

### Performance & Technical
- [ ] Port image optimization to all areas not currently using it
- [ ] Critical CSS inlining for above-the-fold content
- [ ] Add service worker for offline reading
- [ ] Implement lazy loading for images (if not already present)
- [ ] Add RSS feed enhancements (full content)

### Interactive Features
- [ ] Tag filtering - Interactive tag-based post filtering
- [ ] Code snippet favorites - Let visitors save useful snippets

### Analytics & Insights
- [ ] GitHub contribution graph integration
- [ ] Learning progress tracker
- [ ] View count tracking (privacy-friendly)

### Content Organization
- [ ] Archive page improvements
- [ ] Better 404 page design
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
### 2025-10-04
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
