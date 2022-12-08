---
title: Building Mesa from Source (with VA-API) on Fedora.
description: Get back HW accelerated video playback on Fedora.
date: 2022-10-30
tags:
  - Fedora
  - Mesa
layout: layouts/post.njk
---

Fedora and openSUSE are [removing](https://linuxiac.com/fedora-and-opensuse-are-dropping-support-for-some-video-codecs/) H.264, H.265, and VC-1 VA-API video codecs support from Mesa to avoid potential patent issues.

## Why does it matter?

H26X's are currently the world’s most used HD video compression standards. Without Mesa supporting these codecs, any video playback will fallback to be CPU decoded, instead of GPU (which is inefficent, and may straight up not work on dated computers, and apps that heavily rely on video encoding / decoding.)

## Workaround / Fix

If you're on Fedora 37 Beta and have an AMD GPU, one of the easiest ways to get x264 hardware accelerated encoding back would be to build Mesa drivers from source. (Until we eventually get an [RPM Fusion](https://bugzilla.rpmfusion.org/show_bug.cgi?id=6426) package.)

Mesa have an option `-Dvideo-codecs` to do just that. (Credits to [iceixia](https://www.reddit.com/user/iceixia/) for his script)

## Steps

```bash
cd $HOME
sudo dnf install rpmdevtools
rpmdev-setuptree 	#Create RPM build tree within user's home directory
```

Download Mesa Source and build dependencies

```bash
dnf download --source mesa #Download the source rpm.
sudo dnf builddep mesa #Install whatever is needed to build the given .src.rpm, .nosrc.rpm or .spec file.
rpm --install *.src.rpm #Install the source rpm.
```

Add the missing video codec option to the mesa.spec file.

```bash
cd $HOME/rpmbuild/SPECS
sed -i '/^%meson #/a \ \ -Dvideo-codecs=h264dec,h264enc,h265dec,h265enc,vc1dec #' mesa.spec
```

Build the RPM package from spec. This should take a few minutes.

```bash
rpmbuild -bb mesa.spec
```

Install the newly compiled rpms.

```bash
cd $HOME/rpmbuild/RPMS/x86_64
sudo dnf install *.rpm
```

Run `vainfo` to check whether the driver supports H264.

```bash
sudo dnf install libva-utils
vainfo
```

It should show the supported profiles like this.

```bash
$ vainfo
libva info: VA-API version 0.39.4
vainfo: Supported profile and entrypoints
      VAProfileMPEG2Simple            :	VAEntrypointVLD
      VAProfileMPEG2Simple            :	VAEntrypointEncSlice
      VAProfileMPEG2Main              :	VAEntrypointVLD
      VAProfileMPEG2Main              :	VAEntrypointEncSlice
      VAProfileH264ConstrainedBaseline:	VAEntrypointVLD
      VAProfileH264ConstrainedBaseline:	VAEntrypointEncSlice
      VAProfileH264ConstrainedBaseline:	VAEntrypointEncSliceLP
      VAProfileH264Main               :	VAEntrypointVLD
      VAProfileH264Main               :	VAEntrypointEncSlice
      VAProfileH264Main               :	VAEntrypointEncSliceLP
      VAProfileH264High               :	VAEntrypointVLD
      VAProfileH264High               :	VAEntrypointEncSlice
      VAProfileH264High               :	VAEntrypointEncSliceLP
      VAProfileH264MultiviewHigh      :	VAEntrypointVLD
      VAProfileH264MultiviewHigh      :	VAEntrypointEncSlice
      VAProfileH264StereoHigh         :	VAEntrypointVLD
      VAProfileH264StereoHigh         :	VAEntrypointEncSlice
      VAProfileVC1Simple              :	VAEntrypointVLD
      VAProfileVC1Main                :	VAEntrypointVLD
      VAProfileVC1Advanced            :	VAEntrypointVLD
      VAProfileNone                   :	VAEntrypointVideoProc
      VAProfileJPEGBaseline           :	VAEntrypointVLD
      VAProfileJPEGBaseline           :	VAEntrypointEncPicture
      VAProfileVP8Version0_3          :	VAEntrypointVLD
      VAProfileVP8Version0_3          :	VAEntrypointEncSlice
      VAProfileHEVCMain               :	VAEntrypointVLD
      VAProfileHEVCMain               :	VAEntrypointEncSlice
```

While this may not be ideal, this should serve as a workaround until better solutions are in place.
