---
title: Headless Mode on CachyOS
description: Free up RAM by stopping all GUI services using systemd targets — useful when running LLMs locally on a TTY.
date: 2026-02-25T00:00:00.000Z
updated: 2026-02-25T00:00:00.000Z
slug: headless-mode-cachyos
---

Free up RAM by switching to `multi-user.target`, which stops the display manager, compositor, and all graphical services without touching active TTY sessions.

## Enter headless mode

```bash
sudo systemctl isolate multi-user.target
```

## Restore the GUI

```bash
sudo systemctl isolate graphical.target
```

## Fish shell functions

Add to `~/.config/fish/functions/` for quick access.

**`~/.config/fish/functions/headless-mode.fish`**

```fish
function headless-mode
    sudo systemctl isolate multi-user.target
    systemctl --user stop openclaw-gateway 2>/dev/null
    sudo sync
    sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'
    free -h
end
```

**`~/.config/fish/functions/headless-mode-off.fish`**

```fish
function headless-mode-off
    sudo systemctl isolate graphical.target
    systemctl --user start openclaw-gateway 2>/dev/null
end
```

## TTY tab splitting

Without a display server, use `zellij` for split panes and tabs:

```bash
sudo pacman -S zellij
zellij
```

Keybindings are shown on screen.

## Fix sudo lockout after failed attempts

If `sudo` rejects your password even after changing it:

```bash
faillock --reset
```

PAM locks accounts after repeated failures and does not clear the lock on password change.
