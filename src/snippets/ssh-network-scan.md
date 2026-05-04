---
title: Local Network SSH Scan
description: A bash script to scan the local network (via ARP table) and check for active SSH responders.
date: 2026-05-03T00:00:00.000Z
authored_by: kchauhan
updated: 2026-05-03T00:00:00.000Z
slug: ssh-network-scan
---

This script parses your local ARP table to find active IP addresses and then attempts a quick SSH connection to each to see which devices are reachable and running an SSH server. This is particularly useful for finding Raspberry Pis or other headless devices on your network.

**`scan_ssh.sh`**

```bash
#!/bin/bash

# Set the timeout duration in seconds
TIMEOUT_DURATION=5 
username="pi" # Change this to your default user

# Get the list of IP addresses from the ARP table
ips=$(arp -a | awk '{print $2}' | tr -d '()')

# Loop over each IP address
for ip in $ips; do
    # Skip the gateway (common default)
    if [ "$ip" == "10.0.0.1" ]; then
        echo "Skipping 10.0.0.1 (Gateway)"
        continue
    fi

    echo "Checking SSH on $ip..."

    # Use SSH with BatchMode and a short timeout to check availability
    ssh -o BatchMode=yes -o ConnectTimeout=2 "$username@$ip" exit &>/dev/null
    
    if [ $? -eq 0 ]; then
       echo "✅ SSH is UP on $ip"
    else
       echo "❌ SSH is not responding on $ip"
    fi
done
```

### How it works:
- `arp -a`: Retrieves the current ARP cache (devices your machine has recently talked to).
- `BatchMode=yes`: Prevents SSH from asking for a password or interaction.
- `ConnectTimeout=2`: Ensures the script doesn't hang on dead IPs.
- `&>/dev/null`: Silences the SSH output so you only see the script's custom echo messages.
