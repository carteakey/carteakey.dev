---
title: New Machine Setup (CachyOS)
description: Install essential tools and configure git on a fresh CachyOS / Arch-based machine.
date: 2026-02-23T00:00:00.000Z
authored_by: ai-assisted
updated: 2026-02-23T00:00:00.000Z
slug: new-machine-setup-cachyos
---

## Git Config

```bash
git config --global user.email "[EMAIL_ADDRESS]"
git config --global user.name ""
```

## CLI Tools

```bash
# GitHub CLI
sudo pacman -S github-cli

# Zed Editor
curl -f https://zed.dev/install.sh | sh

# Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# NordVPN
paru -S nordvpn-gui

# NVM + Node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
nvm install node
```

## AI Coding Agents

```bash
# OpenAI Codex
npm i -g @openai/codex

# Amp
curl -fsSL https://ampcode.com/install.sh | bash

# Gemini CLI
npm install -g @google/gemini-cli

# GitHub Copilot
curl -fsSL https://gh.io/copilot-install | bash

# Claude Code
curl -fsSL https://claude.ai/install.sh | bash
```

## SSH

```bash
sudo pacman -S openssh
sudo systemctl enable --now sshd
```

> See [Enable SSH on CachyOS](/snippets/enable-ssh-cachyos) for full SSH setup including firewall config.
