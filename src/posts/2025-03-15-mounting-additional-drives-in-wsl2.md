---
title: Mounting additional drives in WSL2 (draft)
description: Y'all got any more of that...storage
date: 2025-03-15T19:59:51.454Z
updated: 2025-03-15T19:59:51.459Z
tags:
  - WSL
  - Linux
hidden: true
---
WSL IO performance. 

Native ext4 drive for

* Extending storage
* backup drive



1) Backup all data

2) Remove all partitions

3) Mount as bare drive
wsl --mount \\.\PHYSICALDRIVE5 --bare

4) Format as ext4
sudo mkfs.ext4 /dev/sdd

5) Unmount and mount as filesystem.

Tip: Automount on boot.