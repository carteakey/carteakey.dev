---
title:  Vault 76 - My Obsidian Vault Structure
description: How I organize my notes and resources.
date: 2025-07-12
authored_by: human
tags:
  - Obsidian
  - PKM
---

Obsidian is one of the most useful pieces of software I've used.

If someone asked me to choose only two apps for life, VSCode and Obsidian would be my picks.

I've mostly been a multi-vault/multi-app note taker, treating each vault as a separate project or domain. The only issue with this approach for me was to think about where to put a note, and the constant context switching between vaults. I wanted a central point for all my knowledge, projects, and resources.

{% image_cc "./src/static/img/single-or-multiple-vaults.png", "", "", "Conflicts, conflicts" %}

Having tried single-vault systems in the past, I found that it was a bit overwhelming to have everything in one place, and I also missed the organization and separation of different domains. So this is my latest attempt at a single-vault system that does not make my self-proclaimed ADHD go haywire. 

The systems that I have tried (and was inspired from) include:
- [PARA Method](https://fortelabs.co/blog/para/)
- [Johnny Decimal's System](https://johnnydecimal.com/) - the best in my opinion but too rigid for my needs.
- This [Reddit comment](https://www.reddit.com/r/ObsidianMD/comments/1ei8riu/comment/lg57pki/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button)
- Another [Reddit comment](https://www.reddit.com/r/ObsidianMD/comments/18wmy8z/comment/kfyvid1/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button) - I really need to stop browsing Reddit.


Ultimately, every brain is different and a natural growth of a system is what works best for you. Here's a quick list of dos and don'ts:

- Do what works for you! Ask yourself what you need from your notes and how you use them. 
- Having an inbox folder is a great way to quickly capture ideas and notes without worrying about where they go.
- Tags are powerful but don't overthink the need to tag everything.
- Do not be affected by the pretty vaults and nice graphs and the productivity gurus' advice on how to structure your notes (that might or might not include me).
- Do not feel obligated to turn Obsidian into your everything app. It's just a note-taking app.
- *Try* not falling into the trap of fake productivity, where you spend more time organizing your notes than actually using them. Trying doesn't hurt.
- Obsidian is not meant for tabular data just yet. Dont @ me.

The bottom line is "Can you find what you need when you need it?".

So I wanted to share my own approach that has evolved over time. I call it "Vault 76" and it serves as a comprehensive knowledge management system for all my personal, professional, and academic content.

## The Tool Selection Problem

Before getting into the vault structure, I had to settle a bigger question: which app for what?

I was running three apps simultaneously - Apple Reminders, Apple Notes, and Obsidian - and everything was spread across all three. Finances in both Notes and Reminders. Travel in both. Goals everywhere. 301 items in Reminders with no real system.

The answer was simpler than I thought:

| App | Job |
|---|---|
| **Reminders** | Actionable tasks only. If it has a verb and needs to be *done*, it goes here. Siri + iPhone integration is unbeatable for quick capture. |
| **Obsidian** | Everything else - lists, knowledge, reference, projects. Cross-platform (Mac, Windows, Linux, iOS). |
| **Apple Notes** | iPad Pencil sketches only, then export to Obsidian. |

The forcing question: *if you'd be upset if it disappeared tomorrow, it belongs in Obsidian. If you complete it and forget it, Reminders.*

### TODOs are not Bucket Lists

One thing that was poisoning my Reminders was mixing task types. A TODO and a bucket list item look similar on the surface, but they're fundamentally different:

- **TODO** - something you're committing to do, with implied urgency. Lives in Reminders. You'd feel bad if it didn't get done this week.
- **Bucket List** - something you want to experience before you die, no timeline. Lives in Obsidian. Missing it this week changes nothing.

Mixing them creates guilt without progress. Seeing "learn Spanish" next to "buy milk" is a recipe for ignoring both.

> If you'd reschedule it, it's a TODO. If you'd reminisce about it, it's a bucket list.

## The Vault 76 System

The system uses a numbered hierarchy (0-8) that mirrors a natural workflow from capture to archive.

### Top-Level Organization

```md
vault-76/
├── 0. inbox 📥                    # Quick capture, daily notes, temporary items
├── 1. system 📊                   # Vault management, templates, scripts, attachments
├── 2. knowledge 🧠                # All learning content (theory + domain)
├── 3. projects 🚀                 # Active work, development, side projects
├── 4. career 💼                   # Job hunting, interviews, experience
├── 5. finance 💰                  # Money management, investments, taxes
├── 6. personal 👤                 # Health, hobbies, home, media, self
├── 7. archive 📦                  # Completed/inactive content
└── 8. config ⚙️                   # Vault setup, plugin notes, obsidian config docs
```

The numbered system creates a natural flow:

1. **Capture** (0. inbox) - Everything starts here via daily notes or quick capture
2. **Process** (1. system) - Templates, scripts and mental models live here
3. **Learn** (2. knowledge) - Reference material and learning notes live here
4. **Create** (3. projects) - Active work and development happens here
5. **Grow** (4. career) - Professional development and job hunting
6. **Manage** (5. finance) - Financial planning and tracking
7. **Live** (6. personal) - Hobbies, health, media and personal interests
8. **Archive** (7. archive) - Completed or outdated content
9. **Configure** (8. config) - Vault setup, plugin documentation, obsidian config notes

### Detailed Structure (Examples)

#### 0. inbox 📥
```md
0. inbox/
├── daily-notes/
├── quick-capture/
├── to-process/
└── meeting-notes/
```

#### 1. system 📊
```md
1. system/
├── templates/
│   ├── prompt.md
│   ├── services.md
│   ├── meeting-notes.md
├── scripts/
│   ├── rsync-to-git.sh
│   ├── convert-inline-latex.sh
│   ├── rename-images.sh
│   └── rename-property.py
└── mental-models/
    ├── app-tool-selection.md
    └── todos-vs-bucket-list.md
```

I added a `mental-models/` folder to `1. system` for decisions about the system itself - which app to use for what, how to distinguish note types, etc. Meta-notes about how you think, not what you think about.

#### 2. knowledge 🧠
```md
2. knowledge/
├── computer-science 💻/
├── data-engineering ⚙️/
├── data-science 🔬/
├── llm 🤖/
├── maths 🔢/
├── domain 🏦/
├── snippets ✂️/
├── tools-tech 🔧/
├── articles 📄/
└── education 🎓/
    └── msc-notes/
```

Articles saved from the web live here once read and worth keeping - not in inbox clippings (that's the queue), but here as processed reference.

#### 3. projects 🚀
```md
3. projects/
├── active/
│   ├── current-work/
│   └── side-projects/
├── development/
│   ├── carteakey-dev/
│   │   ├── blog/
│   └── hobby-dev/
├── homelab/
│   ├── guides/
│   ├── hardware/
│   ├── services/
│   └── ideas/
└── learning-projects/
```

#### 4. career 💼
```md
4. career/
├── job-search/
│   ├── applications/
│   ├── job-listings/
│   └── networking/
├── interviews/
│   ├── preparation/
│   ├── question-banks/
│   ├── company-research/
│   │   └── mcafee/
│   └── interview-logs/
├── resume/
│   ├── versions/
│   └── content/
├── experience/
│   └── tcs/
├── upskilling/
│   └── certifications/
└── people/
    └── professional-contacts/
```

#### 5. finance 💰
```md
5. finance/
├── budgeting/
├── investing/
├── credit-cards/
├── taxes/
└── side-income/
    ├── beer-money/
    └── freelancing/
```

#### 6. personal 👤
```md
6. personal/
├── health 🏥/
├── home 🏠/
├── hobbies 🎮/
├── media 🎬/
│   ├── movies/
│   └── shows/
├── mazda 🚗/
├── self 🪞/
└── user-manuals 📖/
```

`self/` covers inner life - relationships, personal philosophy, ramblings. `media/` is for notes and reviews after watching - the watchlist itself lives in Reminders.

#### 7. archive 📦
```md
7. archive/
├── past-projects 🗄️/
└── outbox 📤/
```

#### 8. config ⚙️

Notes about the vault itself - plugin setup guides, CSS snippet explanations, sync configuration. Not system templates (those are in `1. system`) but documentation about how the vault is configured and why.

---

The beauty of this structure is that it grows with you - whether you add new domains, change careers, or pick up new hobbies, there's a logical place for everything.

A template for this vault is available on [GitHub](https://github.com/carteakey/vault-76-template).

However, this is just my approach. The best system is the one you'll actually use consistently. Start simple, let it grow organically, and adjust as needed.
