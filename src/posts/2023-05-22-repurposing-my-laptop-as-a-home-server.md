---
title: "Repurposing my laptop as a Home Server."
description: Putting old hardware to good use.
date: 2023-05-22T16:38:56.031Z
tags:
  - Linux
  - Docker
---
I recently switched to a Macbook Air (M2) as my primary computer, leaving behind a loud and heavy ASUS-FX505 which I had bought as a gaming PC and served me well for over 3 years. It was still a quite capable device (Ryzen 3550h, 16gigs of RAM, SSD + 1 TB HDD), therefore it made sense to make it act as a secondary computing device, where I can offload my media and development computes.

There is a whole universe around self-hosting (see r/selfhosted) where having a home server can serve many purposes including, but not limited to -

* Remote development, with your server doing all the hard work and long builds and jobs.
* Media server, using services like Plex, Jellyfin, Navidrome.
* Network drives (NextCloud, rdrive)
* and a lot more...

![](/img/rabbit-hole.png)

Here are some of my opinions, tips, and tricks on doing so. This is going to be a multi-part article.

## Uninstalling Windows

Windows + WSL2 is great, you get the best of both worlds (Windows and Linux). 

However, it makes sense when the device in question is your primary PC. As a home server, windows becomes too much bloat, period. If you prefer a Linux development environment, remoting into WSL looks like this (Although recent versions of WSL have made this even harder).

`Mac > Windows > Linux (WSL2)`

If you  create docker environments it becomes

`Mac > Windows > Docker (WSL2) > Linux Image`

![](/img/inception-deeper.gif "OS within an OS within an OS")

Nevertheless, too much work and performance overhead, when we have a much better solution, going all Linux.

`Mac > Linux`

## Choosing a server distro.

Can't go wrong with Ubuntu server or Debian. There are Fedora, RHEL, and others as well. If you're new, better to go with Ubuntu server, its popularity has the advantage that any problems you face will likely have been faced by someone else already and would have an online forum on it. 

Moreover, docker has changed the game and introduced another abstraction, where your base OS (as long as it's Linux) starts mattering less and less.

## Dockerize everything.

Gone are the days where you have to worry about dependencies, correct version, adding repositories, bloating your main os, worrying about cleanup etc. Almost all popular services now offer a docker image, which you can spin up by just downloading a compose file and running `docker compose up -d`. 

I also have a repository [server-compose](https://github.com/carteakey/server-compose), a collection of sample docker-compose files for popular self-hosted applications. 

## Ubuntu Server tips & tricks.

I bashed my head, so you don't have to :(

### Don't suspend on lid close.

Since a headless home server does not need a display, we can turn off that lid and keep the laptop running. Most of our work will be through the SSH terminal.

Edit `/etc/systemd/logind.conf`.

Change ...

```bash
HandleLidSwitch=suspend
```

To ...

```bash
HandleLidSwitch=ignore
```

Restart logind service
```bash
sudo systemctl restart systemd-logind.service 
```

### Automatic Suspend on defined intervals.

To save some energy, we can automatically suspend the computer at defined intervals (e.g. every midnight). We can use the `cron` utility. `

Open the `crontab` file in your default text editor with `sudo` privileges

```bash
sudo crontab -e
```

In the `crontab` file, add the following line at the end: 

```bash
0 0 * * * systemctl suspend`
```

This line sets up a cron job that runs at midnight every day and executes the `systemctl suspend` command, which suspends the system.

### Automatic Suspend on Power Disconnect

If you don't want the laptop server to be running on battery, and want it to automatically suspend in case there is a power loss, we can do that too!

1. Create a script `power-monitor.sh` in your home directory containing the below code.

```bash
#!/bin/bash

while true; do
  # Check the power status using the acpi command
  
  # Read the power status from the /sys/class/power_supply/AC/online file
  power_status=$(cat /sys/class/power_supply/AC0/online)
  
  if [[ $power_status == "0" ]]; then
    # Shut down the laptop
    sudo systemctl suspend
  fi
  
# Sleep for a few seconds before checking again
  sleep 5
done
```

Note that the power_status may vary depending on your hardware.

1. Let's create a systemd service to run this script continuously. Create a file `power-monitor.service` in `/etc/systemd/system/` 

```bash
sudo vi /etc/systemd/system/power-monitor.sh
```

2. Configure the service 

```bash
[Unit]
Description=Power Monitor Service

[Service]
Type=simple
ExecStart=/home/your_user/power-monitor.sh

[Install]
WantedBy=multi-user.target
```

3. Enable & Start the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable power-monitor.service
sudo systemctl start power-monitor.service
```

### Wake-on-LAN

To unsuspend the system remotely, it's a little more involved and depends on the laptop's hardware. If the laptop is new and supports sleep states that allow it to be woken up from the Wi-Fi (Wake-on-WLAN), it's as simple as installing `wakeonlan` and sending a magic packet to the mac address of the server

```bash
wakeonlan server-mac-address-here
```

There are also apps like UpSnap, which can wrap this up in a simple dashboard with on/off buttons.

If your laptop only supports Wake-on-LAN, you can connect it to your router through a LAN cable and send the magic packet to the ethernet Mac address.

However, in my case, not only it did not support Wake-on-LAN, but my router was also way too far to hook it up, which meant I needed something always on and connected to the home server through the ethernet and sending magic packets through that. Fortunately, I had a Raspberry Pi lying around. This warrants another article :D

## Wrapping up

That's a wrap for this one! 
Self-hosting and home servers are a time sink! But it's a fun way of learning about Linux, Docker, and Networking in general, which is always good to have. Not to mention some very useful and powerful use cases that come out of it.