---
title: "Steam Deck Switch Emulation Guide 2026"
description: "Rights-conscious Steam Deck emulation setup: EmuDeck, Eden, migrating game files and saves, hashes, and tuning."
image: /img/blog-sketches/unique/playing-the-games-i-own-on-steam-deck-stamp-trim.png
imageAlt: "Monochrome pencil sketch of a handheld gaming PC showing pixel clouds alongside a microSD card, a retro game cartridge, and a game disc"
date: 2026-09-24
giscusTerm: "/blog/playing-the-games-i-own-on-steam-deck/"
authored_by: ai-assisted
draft: true
hidden: true
pinned: false
featured: false
tags:
  - Games
  - Linux
---

I wanted my Steam Deck to be the place where I play the games in my library, including older console games that are awkward to revisit on their original hardware. In September 2026, I set up [EmuDeck](https://emudeck.github.io/) for the broad emulator setup and [Eden](https://eden-emu.dev/) alongside it for Switch games. I moved a small existing library from my old FX505 laptop to the Deck, brought over the relevant BIOS and save data, and checked the files after transfer. The best moment was seeing an old *Super Mario Odyssey* save appear again.

This is a setup story for people who own their games and have a lawful way to use their own game files. It is not a source for downloads of commercial games, console keys, or firmware. The rules vary by country, and **ownership alone does not automatically authorize every copying or protection-bypass step**. More on that below.

## Keep the Deck setup small

[EmuDeck's SteamOS guide](https://emudeck.github.io/how-to-install-emudeck/steamos/) starts with a formatted SD card, then uses Desktop Mode to install and configure emulators. It creates an `Emulation` directory with separate `roms` and `bios` folders. I used that layout on the Deck's SD card instead of scattering large files through my home directory. EmuDeck is a setup tool and launcher integration, not a source of games or BIOS files.

Eden runs as a separate emulator alongside that layout. I kept the existing EmuDeck tools for PlayStation games and used Eden for my Switch library. There was no reason to install another front end or a pile of utilities just to make three games work. Putting the game library and Eden's NAND data on the SD card also leaves the internal drive for SteamOS and apps.

I also added Tailscale so I could reach the Deck over SSH. For this one-time migration, a direct `rsync` transfer from the laptop was simpler than staging everything on my NAS. A NAS would make sense if I wanted a long-lived backup or a shared library, but it was an unnecessary extra hop here. I did not need to publish any service on the internet.

## Move the files, then prove they arrived

My source laptop had one PS1 game, one PS2 game, and one Switch game to move. I copied their files into the matching EmuDeck folders on the Deck's SD card, then transferred the relevant BIOS and save data. The copy was roughly 15 GB across 205 files. I compared SHA-256 hashes on both ends before deleting the old EmuDeck library from the laptop. A successful copy command tells me the transfer finished; matching hashes tell me the files match.

If you are doing the same kind of move, keep the old library until the new one has passed three checks:

1. The files are in the folders the Deck's emulators actually scan.
2. Hashes or another whole-file comparison match the source.
3. The games and saves open on the Deck.

Those checks matter more than a fancy transfer tool. They also give you a way back when an emulator's save layout differs from the one on the old machine.

## Saves are more than timestamps

The trickiest part was *Odyssey*. An existing save archive contained a 2023 save, while the new Eden installation had its own profile layout. I compared the save files and looked for the matching game ID rather than assuming the newest-looking filename was the right one. My first placement used the wrong profile directory, and Eden displayed an orphaned-profile warning. After checking Eden's actual profile ID and moving the two save files under it, the game loaded the save correctly.

The lesson is to preserve both copies while you test. Save folders can be profile-specific; a file can be valid but attached to the wrong profile. Compare the contents where possible, keep a backup of the losing version, and launch the game before removing anything. File modification time is useful evidence, but an archive, transfer, or export can change it.

I also moved Eden's NAND data to the SD card and linked its default location to the new directory. That keeps the Deck's limited internal storage from slowly filling with firmware and save data. I checked the copied data before removing the duplicate. If your internal drive has plenty of room, leaving the default alone is simpler.

## A first performance pass

The setup works, so I am treating performance tuning as a measured follow-up. Eden is already set to **native 1× resolution**; its configuration value of `3` is an enum index, not a 3× multiplier. Docked mode is enabled. On a handheld screen, I would test handheld mode if a game stutters or battery life is poor, then compare it with docked mode in the same demanding scene. Eden's settings note that docked and handheld mode can change a game's resolution and behavior. The disk shader cache is already enabled, so I would keep that setting.

I would avoid copying someone else's full preset without testing the game I actually play. Emulation performance differs by title, build, graphics driver, and whether the Deck is plugged in. A smooth scene at the start of a game is not a useful stress test of a busy area later on.

## The ownership boundary

There is an important distinction between **running an emulator** and **getting a usable copy of a particular game**. Laws and license terms depend on where you live and on the game or device. In Canada, the [Copyright Act's private-copying provision](https://laws-lois.justice.gc.ca/eng/acts/c-42/section-29.22.html) has several conditions: the source copy must be non-infringing and legally obtained, the reproduction must be for private use, it cannot be given away, and it cannot require circumventing a technological protection measure. It also addresses what happens if you give away or sell the source copy. In the United States, [Section 1201](https://www.copyright.gov/1201/2018/faqs.html) separately restricts circumvention of access controls, subject to limited exemptions. Other places have different rules.

That means “I bought the game” is a starting point, not a universal permission slip. I am not suggesting that readers download commercial ROMs, BIOS, keys, or firmware from strangers, share copies, or bypass protection. Use your own lawfully sourced material only where your local law and applicable terms permit the steps involved. When that is unclear, stop and check before making the copy. This post is my technical experience, not legal advice.

## What I would do again

I would still choose the small setup: EmuDeck for the Deck-friendly folder structure, one additional emulator for the system I need, the game data on the SD card, and a direct transfer with hash verification. I would also bring saves over deliberately rather than treating them as an afterthought. Once the game launches and the right save appears, the technical work disappears and I can get back to playing.

There is one remaining optimization experiment: try *Odyssey* in handheld mode and compare smoothness and battery use against the current 1× docked setup. Everything else is already working, which is a good reason to stop tuning until I have a real problem to solve.
