---
title: Turning an old webcam + RPi into a camera server
description:  Fun little weekend project
date: 2025-10-18T00:00:00.000Z
updated: 2025-10-18T00:00:00.000Z
tags:
  - Self-Host
  - RPi
---

I had this old webcam lying around which I haphazardly bought during the "COVID webcam shortage" era. It was never great, but it worked fine for occasional video calls.

{%image_cc "./src/static/img/rpi-webcam/c270.jpg"  , "", "w-1/2","Logitech C270 - aka the wall-eye, get it?" %}

Having nothing better to do on a weekend, I decided to repurpose it into a webcam server using a Raspberry Pi 4. Searching around, I found motion, a lightweight software that can turn a webcam into a streaming server with motion detection capabilities. However, I wanted something simple with
- Live streaming
- Instead of recording, just take snapshots every few seconds
- A simple web interface to view the stream and snapshots
- Lightweight enough to run on a Raspberry Pi 4
- Creates a timelapse video from the snapshots at the end of the day

After some cranking, I opted for a custom flask app that uses ffmpeg. The application uses FFmpeg to capture video from USB webcam and encode it into HLS (HTTP Live Streaming) format for web delivery. The Flask web server handles authentication, serves the video stream, manages snapshots, and provides a user-friendly interface for configuration and monitoring. The app runs as a systemd service for easy management and automatic startup on boot.

Here's an image while I'm typing this up:
{% image_cc  "./src/static/img/rpi-webcam/214703.jpg", "", "w-3/4", "Hello from the other side!" %}

Here's a timelapse sample collected over the day:
{% image_cc "./src/static/img/rpi-webcam/2025-10-14_timelapse.gif" , "", "", "Timelapse of the day (yes i wear the same t-shirt)" %}

I've got the dashboard running on my local network which is then proxied through Cloudflare Tunnel for remote access.

{% image_cc "./src/static/img/rpi-webcam/webcam-dashboard.png" , "", "", "Webcam Dashboard" %}

What I did realize was that while Pi did manage to mostly handle the server, it would often struggle with the load and I had to reduce the stream to 480p. So, I moved the setup to an old laptop instead, which worked much better.

Here's the GitHub repo if you want to try it out yourself:
[rpi-usb-webcam](https://github.com/carteakey/rpi-usb-webcam).