# carteakey.dev

[![Netlify Status](https://api.netlify.com/api/v1/badges/08c07e6f-a368-433c-908f-be5c7b37c60e/deploy-status)](https://app.netlify.com/sites/starlit-brigadeiros-b87f35/deploys)

Welcome to my personal website and digital playground!  
This site is where I write about stuff, and share projects, code snippets, and thoughts on tech and life.

## What is this?

- **A personal blog and portfolio**: Posts, project showcases, and a /now page.
- **Built for speed and simplicity**: No heavy frameworks, just static files and a sprinkle of JavaScript.
- **A living experiment**: I’m always adding new features, automations, and integrations.

## Tech Stack

- **[Eleventy (11ty)](https://www.11ty.dev/)** — Static site generator for flexible content and templating.
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first CSS for rapid, maintainable styling.
- **[Alpine.js](https://alpinejs.dev/)** — Minimal JavaScript for interactivity (dropdowns, dark mode, etc).
- **[Netlify](https://www.netlify.com/)** — Hosting, serverless functions, and continuous deployment.
- **Netlify CMS** — For editing posts and pages via a friendly UI.
- **PrismJS** — Syntax highlighting for code blocks.
- **Giscus** — GitHub-powered comments.
- **Upstash Redis** — For fun features like upvotes.
- **OpenAI/Ollama** — For dynamic content like the "quote of the day".

## Features

- ✍️ **Markdown-based blogging** with drafts, tags, and archives
- 🏷️ **Code snippets** and search
- 🖼️ **Image optimization** and responsive images
- 🌗 **Dark mode** toggle (remembers your preference)
- 💬 **Comments** via Giscus (GitHub Issues)
- 📈 **Upvotes** and dynamic counters (via Netlify Functions + Redis)
- 🎵 **Now playing** integration with Spotify
- 📚 **Reading shelf** synced from Goodreads with manual physical-book/progress overrides and cover thumbnails
- 🎬 **Film diary** synced from dated Letterboxd entries with poster thumbnails
- ⚡ **Fast, accessible, and mobile-friendly** by default

## Local Development

```sh
npm install
npm run start
```
- Visit [http://localhost:8080](http://localhost:8080) to view the site locally.
- Edit content in `src/` (posts, pages, data, etc).

## Deploy

- Pushed to `main` branch → auto-deployed to Netlify.

## Credits

- Built and maintained by [Kartikey Chauhan](https://carteakey.dev)
- Inspired by the [TEA stack](src/posts/2025-05-25-understanding-the-neat-framework.md): Tailwind, Eleventy, Alpine.js

---

Feel free to fork, learn, or reach out if you have questions!
