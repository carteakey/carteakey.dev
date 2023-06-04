---
title: Remoting into WSL2 externally - the simple way.
description: Simple is better than complex.
date: 2023-06-04T19:07:39.634Z
tags:
  - WSL
  - Linux
---
So you have a Windows PC with WSL2 installed in it and want to SSH into it from another device like a Mac. The reason can be remote development, preference for a Linux environment, or any other. 

Sounds simple enough on paper, you SSH into your Windows machine and run `wsl.exe` - but that does not work. With the latest versions of WSL2, one is unable to access the wsl executable over ssh.

```bash
kchauhan@MacBook-Air ~ % ssh fx505

kchauhan@FX505 C:\Users\kchauhan>wsl
The file cannot be accessed by the system.
```

But, there are many other (but confusing) ways to do it as per the internet.

* Uninstalling the latest WSL from Microsoft Store and installing older versions using `wsl --install --inbox` and using [this popular guide](https://www.hanselman.com/blog/the-easy-way-how-to-ssh-into-bash-and-wsl2-on-windows-10-from-an-external-machine) by Hanselman.
* [Bridge Networking](<[https://randombytes.substack.com/p/bridged-networking-under-wsl](https://randombytes.substack.com/p/bridged-networking-under-wsl> "https\://randombytes.substack.com/p/bridged-networking-under-wsl") - Apparently only for Windows Pro users.
* [These folks](https://stackoverflow.com/questions/61002681/connecting-to-wsl2-server-via-local-network) - recommend netsh, port forwarding, and all networking stuff that my lizard brain cannot handle. 

The one that I find easy is [this brilliant solution](https://superuser.com/a/1763873 "https\://superuser.com/a/1763873") - that uses [ProxyJump](https://www.redhat.com/sysadmin/ssh-proxy-bastion-proxyjump) feature of SSH and makes the whole process simple. Let's figure out how to do that. 

## Configure SSH Server on Windows

We need to set up the SSH server on Windows to allow SSH connections. Here are some quick steps to do that.

### On your Host (Windows)

1. Go to **Optional Features** in Windows settings. Click on **View Features** and add **OpenSSH Server.**
2. Hit `Win+R` > `services.msc` to open the Services Console.
3. Double-click the **OpenSSH SSH server** service and set the **Startup Type** to **Automatic**
4. Start the service.
5. Assuming you have a single-user system (See [here](https://superuser.com/a/1651276) for more details) - Comment below from your `C:\ProgramData\ssh\sshd_config` file. This will allow the authorized keys to work (in our next steps).

```bash
Match Group administrators
       AuthorizedKeysFile __PROGRAMDATA__/ssh/administrators_authorized_keys
```

### On your Client (The external device we will SSH into WSL from)

1. SSH into Windows device. (The password will be the one you use to sign into your Microsoft account)

```bash
ssh username@<ip_of_your_windows_pc> 
```

2. If it works fine, Exit the SSH session and generate the ssh keys for passwordless entry.  Run `ssh-keygen` to generate a key pair (Hit `Enter` on all options for default mode).
3. Copy these keys to the Windows system. The usual `ssh-copy-id` only works on `*nix` systems. (*Godammit, Windows!* ). So we'll do it manually.

Open the ssh folder on your client.

```bash
cd ~/.ssh
```

Create an SFTP session, transfer the id_rsa.pub key, and rename it to `authorized_keys`.

```bash
sftp username@<ip_of_your_windows_pc> 
cd .ssh
put id_rsa.pub authorized_keys
```

4. SSH should now work without the password.

```bash
ssh <username>@<ip_of_your_windows_pc> 
```

5. We will add this entry to our SSH config.

Example `$HOME/.ssh/config` - replace `windows` with your preference.

```yaml
Host windows
        User <username>
        HostName <ip_of_your_windows_pc> 
        IdentityFile ~/.ssh/id_rsa
```

6. That's it. Now we just need to run `ssh windows` to open an SSH connection.

## Configure SSH Server on WSL2

This one should be much easier. Below steps are for Ubuntu WSL. 

### On your WSL environment

Install **openssh-server**.

```bash
sudo apt install openssh-server
```

Enable the ssh service.

```bash
sudo systemctl enable --now ssh
```

Copy the same `authorized_keys` we previously created to WSL as well. (Simplest approach).

```bash
cd /mnt/c/Users/<username>/.ssh
cp authorized_keys ~/.ssh/
```

## Running WSL on Startup

Again, lots of heavy solutions out there, the one that I find easy enough is just setting Default Terminal in **Windows Terminal** to wsl and running it on startup.

![](/img/wsl_startup.png)

## Proxy Jumping

With all done, we should be now able to SSH directly into WSL using the below ssh command.

```bash
ssh -J <windows_host_username>@<ip_of_your_windows_pc> <wsl_username>@localhost
```

If this works, let's add this to our SSH config to make it as simple as an `ssh wsl`.

Our final `$HOME/.ssh/config` should look like this.

```yaml
Host windows
        User <username>
        HostName <ip_of_your_windows_pc> 
        IdentityFile ~/.ssh/id_rsa

Host wsl
		User <wsl_username>
        HostName localhost
        ProxyJump windows
```

And that's it.