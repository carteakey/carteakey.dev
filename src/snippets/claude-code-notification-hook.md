---
title: Claude Code Notification Hook
description: Configure a Notification hook to play a sound or run a custom command when Claude Code needs attention.
date: 2026-04-28T00:00:00.000Z
authored_by: ai-assisted
updated: 2026-04-28T00:00:00.000Z
slug: claude-code-notification-hook
---

In any terminal you can configure a Notification hook to play a sound or run a custom command when Claude needs your attention. Hooks run alongside the desktop notification rather than replacing it. Terminals such as Warp or Apple Terminal rely on a hook alone since Claude Code does not send them a desktop notification.

The example below plays a system sound on macOS.

**`~/.claude/settings.json`**

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [{ "type": "command", "command": "afplay /System/Library/Sounds/Glass.aiff" }]
      }
    ]
  }
}
```
