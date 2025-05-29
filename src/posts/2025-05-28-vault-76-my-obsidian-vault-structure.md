---
title:  Vault 76 - My Obsidian Vault Structure
description: How I organize my notes and resources.
date: 2025-05-28
tags:
  - Obsidian
  - PKM
---

Obsidian is one of the most useful pieces of software I've used.

If someone asked me to choose only two apps for life, VSCode and Obsidian would be my picks.

I've mostly been a multi-vault/multi-app note taker, treating each vault as a separate project or domain. The only issue with this approach for me was to think about where to put a note, and the constant context switching between vaults. While I still use Apple Notes for personal notes and quick captures, I wanted a central point for all my knowledge, projects, and resources.

{% image_cc "./src/static/img/single-or-multiple-vaults.png", "", "", "Conflicts, conflicts" %}

Having tried single-vault systems in the past, I found that it was a bit overwhelming to have everything in one place, and I also missed the organization and separation of different domains. So this is my latest attempt at a single-vault system that does not make my self-proclaimed ADHD go haywire. 

The systems that I have tried (and was inspired from) include:
- [PARA Method](https://fortelabs.co/blog/para/)
- [Johnny Decimal's System](https://johnnydecimal.com/) - the best in my opinion but too rigid for my needs.
- This [Reddit comment](https://www.reddit.com/r/ObsidianMD/comments/1ei8riu/comment/lg57pki/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button)
- Another [Reddit comment](https://www.reddit.com/r/ObsidianMD/comments/18wmy8z/comment/kfyvid1/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button) - I really need to stop browsing Reddit.


Ultimately, every brain is different and a natural growth of a system is what works best for you. Here's a quick list of dos and don'ts:

- Do what works for you! 
- Having an inbox folder is a great way to quickly capture ideas and notes without worrying about where they go.
- Tags are powerful but don't overthink.
- Do not be affected by the pretty vaults and nice graphs and the productivity gurus' advice on how to structure your notes.
- Do not feel obligated to turn Obsidian into your everything app. It's just a note-taking app.
- *Try* not falling into the trap of fake productivity, where you spend more time organizing your notes than actually using them. Trying doesn't hurt.
- Obsidian is not meant for table-based data, or task management. Dont @ me.
- And most importantly, do not listen to me :) 

So I wanted to share my own approach that has evolved over time. I call it "Vault 76" (inspired by the Fallout universe) and it serves as a comprehensive knowledge management system for all my personal, professional, and academic content.

## The Vault 76 System

The system uses a numbered hierarchy (0-7) that mirrors a natural workflow of an inbox, organization and eventual archival.

### Top-Level Organization

```md
vault-76/
├── 0. inbox 📥                    # Quick capture, daily notes, temporary items
├── 1. system 📊                   # Vault management, templates, scripts
├── 2. knowledge 🧠                # All learning content (theory + domain)
├── 3. projects 🚀                 # Active work, development, assignments
├── 4. career 💼                   # Job hunting, resume, interviews
├── 5. finance 💰                  # Money management, investments, taxes
├── 6. personal 👤                 # Hobbies, gaming, personal interests
├── 7. archive 📦                  # Completed/inactive content
└── _attachments/                  # All media files, images, documents
```

The numbered system creates a natural flow:

1. **Capture** (0. inbox) - Everything starts here via daily notes or quick capture
2. **Process** (1. system) - Templates and scripts help organize and automate
3. **Learn** (2. knowledge) - Reference material and learning notes live here
4. **Create** (3. projects) - Active work and development happens here
5. **Grow** (4. career) - Professional development and job hunting
6. **Manage** (5. finance) - Financial planning and tracking
7. **Live** (6. personal) - Hobbies, health, and personal interests
8. **Archive** (7. archive) - Completed or outdated content

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
```

#### 2. knowledge 🧠
```md
2. knowledge/
├── computer-science/
│   ├── data-structures-algorithms/
│   ├── databases/
│   ├── system-design/
│   └── programming-languages/
├── data-science/
│   ├── machine-learning/
│   ├── deep-learning/
│   ├── statistics/
│   └── data-visualization/
├── llm/
├── maths/
├── domain/
│   ├── finance/
│   └── business/
├── tools-tech/
│   ├── sql/
│   ├── python/
└── education/
    └── msc-notes/
```

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
├── gaming/
│   └── emulation/
├── health/
├── travel/
└── hobbies/
```

#### 7. archive 📦
```md
7. archive/
├── completed-projects/
├── old-notes/
└── outbox/
```

The beauty of this structure is that it grows with you - whether you add new domains, change careers, or pick up new hobbies, there's a logical place for everything. 

However, this is just my approach. The best system is the one you'll actually use consistently. Start simple, let it grow organically, and adjust as needed.
