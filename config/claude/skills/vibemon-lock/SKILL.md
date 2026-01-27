---
name: vibemon-lock
description: Use when you want to lock vibe-monitor to current project, preventing display updates from other projects
---

# Vibe Monitor - Project Lock

Lock vibe-monitor to the current project to prevent display updates from other projects.

## Action

Run the following command:

```bash
python3 ~/.claude/hooks/vibe-monitor.py --lock
```

This locks the monitor to your current project directory.

## Other Commands

```bash
# Unlock (allow all projects)
python3 ~/.claude/hooks/vibe-monitor.py --unlock

# Lock specific project by name
python3 ~/.claude/hooks/vibe-monitor.py --lock "project-name"

# Check current status
python3 ~/.claude/hooks/vibe-monitor.py --status
```

## Behavior When Locked

- Display updates from other projects are ignored
- Other projects still appear in the project list (Tray menu)
- Use Tray menu > Project Lock to switch projects or unlock
