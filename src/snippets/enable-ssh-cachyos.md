---
title: Enable SSH on CachyOS
description: Install and enable the OpenSSH server on CachyOS (Arch-based), start it on boot, and open the firewall.
date: 2026-02-23T00:00:00.000Z
updated: 2026-02-23T00:00:00.000Z
slug: enable-ssh-cachyos
---

CachyOS is Arch-based, so `pacman` handles packages and `systemctl` handles services.

## 1. Install OpenSSH

```bash
sudo pacman -S openssh
```

## 2. Enable and Start the SSH Service

```bash
sudo systemctl enable --now sshd
```

The `--now` flag both enables the service on boot and starts it immediately. Verify it's running:

```bash
systemctl status sshd
```

## 3. Allow SSH Through the Firewall (UFW)

```bash
sudo ufw allow ssh
```

Or explicitly by port:

```bash
sudo ufw allow 22/tcp
```

If UFW isn't enabled yet:

```bash
sudo ufw enable
```

## 4. Connect

```bash
ssh username@host
```

Replace `username` with your CachyOS username and `host` with the machine's IP or hostname.

> See the [ArchWiki page on OpenSSH](https://wiki.archlinux.org/title/OpenSSH) for advanced configuration.
