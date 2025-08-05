---
title: Installing Copyparty on your server.
slug: install-copyparty
---

https://github.com/9001/copyparty 

## Installation Steps

The following steps will install Copyparty and set it up as a systemd service. This will start `/usr/local/bin/copyparty-sfx.py` and read the Copyparty config from `/etc/copyparty.conf`. You can find an example config here: [copyparty.conf](https://github.com/9001/copyparty/blob/hovudstraum/contrib/systemd/copyparty.conf).

```bash
sudo apt install firewall-cmd 

wget https://raw.githubusercontent.com/9001/copyparty/refs/heads/hovudstraum/contrib/systemd/copyparty.service -O $HOME/copyparty.service
wget https://raw.githubusercontent.com/9001/copyparty/refs/heads/hovudstraum/contrib/systemd/copyparty.conf -O $HOME/copyparty.conf
wget https://github.com/9001/copyparty/releases/latest/download/copyparty-sfx.py -O /usr/local/bin/copyparty-sfx.py
```

1. Create the Copyparty user and open the required firewall port:
    ```bash
    cd $HOME
    useradd -r -s /sbin/nologin -m -d /var/lib/copyparty copyparty
    firewall-cmd --permanent --add-port=3923/tcp  # --zone=libvirt
    firewall-cmd --reload
    ```

2. Copy the service and config files, and reload systemd:
    ```bash
    cp -pv copyparty.service /etc/systemd/system/
    cp -pv copyparty.conf /etc/
    restorecon -vr /etc/systemd/system/copyparty.service  # on fedora/rhel
    systemctl daemon-reload && systemctl enable --now copyparty
    ```

## Service Management

- Every time you edit the service file, run:
    ```bash
    systemctl daemon-reload
    systemctl restart copyparty
    ```
- If Copyparty fails to start, check its status:
    ```bash
    systemctl status copyparty
    ```
- View logs for troubleshooting:
    ```bash
    journalctl -fan 100
    tail -Fn 100 /var/log/copyparty/$(date +%Y-%m%d.log)
    ```

## Customization

- You may want to change `User=copyparty` and `/var/lib/copyparty/` to another user.
- Edit `/etc/copyparty.conf` to configure Copyparty.
- In the `ExecStart=` line, you can change `/usr/bin/python3` to another interpreter.

## Firewall Configuration Example

To enable all Copyparty features, open the necessary ports:

```bash
firewall-cmd --permanent --add-port={80,443,3921,3923,3945,3990}/tcp  # --zone=libvirt
firewall-cmd --permanent --add-port=12000-12099/tcp  # --zone=libvirt
firewall-cmd --permanent --add-port={69,1900,3969,5353}/udp  # --zone=libvirt
firewall-cmd --reload
```

Port usage reference:
- 69: TFTP
- 1900: SSDP
- 3921: FTP
- 3923: HTTP/HTTPS
- 3945: SMB
- 3969: TFTP
- 3990: FTPS
- 5353: mDNS
- 12000-12099: Passive FTP

## Optional: Install Cloudflared

To install Cloudflared for tunneling:

```bash
# Add Cloudflare GPG key
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
# Add this repo to your apt repositories
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list

# Install cloudflared
sudo apt-get update && sudo apt-get install cloudflared
```
