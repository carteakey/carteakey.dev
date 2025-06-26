---
title: When Computers Finally Speak Human
description: The end of programming as we know it
date: 2025-06-26
updated: 2025-06-26
tags:
  - AI
  - Agents
---
 
**Note:** This post was partially augmented by AI—specifically, Claude Sonnet 4. I used AI assistance to refine my initial draft, structure my ideas, and improve the writing. Given the subject matter, it felt appropriate (and meta :)) to be transparent about this collaborative process. 

I spent two hours yesterday building six features for my website. I didn't write a single line of code. 

Instead, I had conversations. I told an AI agent "I want a workout tracking page that pulls from Strava" and watched it write the API integration. I described the visual style I wanted, and it matched my existing theme perfectly. When something broke, I said "this isn't working" and it debugged itself.

# The Pattern of Abstraction

{# Recently I was a guest speaker at my alma mater, and I was asked to share my thoughts on the future of the industry. I shared my belief that we're entering a new era of programming—one where the primary interface isn't syntax, but conversation. #}

Every few decades, programming gets easier to think about:

- **1940s: Machine code** → Flip switches, punch cards, think in pure binary
- **1950s: Assembly** → Mnemonics replace binary, but you still manage memory by hand
- **1960s-70s: Structured programming** → FORTRAN, COBOL, C—variables and functions, but still close to the machine
- **1980s-2020s: High-level languages** → C++, Java, Python—objects, garbage collection, closer to human thought
- **2020s: Natural language** → Just tell the computer what you want

Each transition followed the same pattern: the old guard predicted doom, early adopters struggled with clunky tools, then suddenly the new way became obviously better for most tasks.

COBOL programmers didn't disappear when Java arrived—they just became more specialized. The pattern repeats: abstraction layers don't replace what came before, they make it accessible to more people while pushing the experts toward harder problems.

# What I Actually Built

Here's what happened in those two hours:

**The Workout Page:**
- Me: "Create a page that shows my recent workouts from Strava"
- Agent: *Writes API integration, handles authentication, creates responsive cards*
- Me: "The spacing looks weird on mobile"
- Agent: *Fixes CSS, tests on different screen sizes*

**The Games Section:**
- Me: "I want to show my Steam games with playtime stats"
- Agent: *Researches Steam API, implements rate limiting, handles edge cases*
- Me: "Can you make it look more like the workout cards?"
- Agent: *Matches existing design system, maintains consistency*

**Plus four more features:** a Now page, Now archive, sitemap, and an accent color switcher.

The agent (Cline with Claude-Sonnet-4) understood my existing codebase, maintained my design patterns, and even caught bugs I would have missed. It wrote API integrations, understood my theming system, created new components, tested everything, and fixed errors—all through natural language conversation.

All of this using tools I already had: Cline VS Code extension with GitHub Copilot and Gemini-CLI. No additional subscriptions, no expensive AI services.

This would legitimately taken me weeks to build on my own, based on my below-average coding speed. 

# Controlling the Dragon

> A complex system that works is invariably found to have evolved from a simple system that worked. A complex system designed from scratch never works and cannot be patched up to make it work. You have to start over, beginning with a working simple system.
> 
> —John Gall, "Systemantics"

Claude 4 has by the grace of its capabilities, a behaviour of a child prodigy, tending to overcomplicate solutions to simple problems. 

I had to guide the agent with context and constraints. When it over-engineered something, I said "this is too complicated, simplify it." When the design didn't match my vision, I described what I wanted differently. I still needed to understand the code it generated, to know when something was wrong, and to make architectural decisions.

{# This is the key insight: I'm not a passive observer. I'm the director, guiding the AI to produce what I want. I still need to know enough about programming to ask the right questions, understand the implications of design choices, and ensure the final product meets my standards. #}

The difference is that my expertise is now focused on *what* to build and *how it should work*, rather than the mechanical process of typing it out.
{# 
# The Uncomfortable Truth

This transition is happening faster than previous ones. It took decades to move from assembly to high-level languages. The natural language shift is happening in years, maybe months.

Some roles will disappear. Junior developers who primarily write CRUD applications, copy-paste from Stack Overflow, and debug simple errors—AI can do that now. But new roles are emerging: AI prompt engineers, human-AI interface designers, AI code reviewers.

The question isn't whether this will happen—it's how quickly you adapt to it.

While eleventy is quite easy to work with, I still had to invest time learning its syntax and conventions. But now? The AI handles the syntax while I focus on the outcomes. #}

{# # The Bigger Picture

We're witnessing the commoditization of basic programming skills. Just as calculators didn't eliminate mathematicians but freed them to work on harder problems, AI won't eliminate programmers—it will free us to work on more interesting challenges.

The developers who thrive will be those who embrace this shift, who learn to work with AI rather than against it, and who focus on the uniquely human aspects of software development: creativity, judgment, and strategic thinking.
#} 

# Closing Thoughts

I personally love the democratization of programming, even though it **might** come at my expense of job security. I dont think critical thinking in humans will ever be invalidated as a job skill.

Programming is finally becoming what it was always meant to be: a conversation between humans and computers, where the computer is smart enough to understand what we actually want. 

The future belongs to those who can speak both languages—human and machine. The good news? We already know half of that conversation.


**Related Counterpoint:** Edsger W. Dijkstra, in his note ["On the foolishness of 'natural language programming'"](https://www.cs.utexas.edu/~EWD/transcriptions/EWD06xx/EWD667.html), argued that programming in natural language is fundamentally misguided. He observed that natural languages are inherently ambiguous, context-dependent, and optimized for human communication—not for the precision required in instructing machines.



{# # Counterpoint: On the Foolishness of "Natural Language Programming"

Edsger W. Dijkstra, in his note ["On the foolishness of 'natural language programming'"](https://www.cs.utexas.edu/~EWD/transcriptions/EWD06xx/EWD667.html), argued that programming in natural language is fundamentally misguided. He observed that natural languages are inherently ambiguous, context-dependent, and optimized for human communication—not for the precision required in instructing machines.

Dijkstra's core point: the very features that make natural language expressive and flexible for people are the same features that make it unsuitable for programming. Computers require unambiguous, formal instructions. Natural language, by contrast, is full of implicit assumptions, idioms, and room for interpretation.

Yet, as AI systems become more capable at interpreting intent, the boundary between "natural" and "formal" language is blurring. While Dijkstra's warnings remain relevant—especially regarding ambiguity and precision—modern AI agents are increasingly able to resolve context, clarify intent, and translate conversational requests into structured code.

The challenge is to harness the power of natural language interfaces without losing the rigor and reliability that programming demands. As we move forward, it's worth remembering Dijkstra's caution: clarity and precision are non-negotiable, no matter how "human" our conversations with computers become. #}

{# # The Skills That Matter Now

Programming isn't disappearing—it's evolving. The valuable skills are shifting:
Less important: Memorizing syntax, debugging typos, writing boilerplate
More important: System design, prompt engineering, code review, architectural decisions
I still need to understand what good code looks like to guide the AI. I need to know when something is wrong and how to fix it. But I don't need to remember the exact syntax for a forEach loop or how to configure webpack.
It's like being a director instead of a cameraman. You still need to understand cinematography, but you're not operating the equipment. #}

{# 
# What Stays Human
Despite the hype, humans remain essential for:
Complex system architecture → AI can write functions, but designing distributed systems requires deep understanding of trade-offs
Security and edge cases → AI generates code fast, but doesn't always think about what happens when things go wrong
Product decisions → What to build still requires human judgment
Code review and quality → Someone needs to ensure AI-generated code is maintainable and correct
The highest-paid programmers aren't writing more code—they're writing better code, making better decisions, and solving harder problems. #}
