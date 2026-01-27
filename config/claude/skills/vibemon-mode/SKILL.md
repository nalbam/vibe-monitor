---
name: vibemon-mode
description: Use when you want to change vibe-monitor lock mode (first-project or on-thinking)
---

# Vibe Monitor - Lock Mode

Change how vibe-monitor automatically locks to projects.

## Lock Modes

| Mode | Description |
|------|-------------|
| `on-thinking` | Lock changes when any project enters thinking state (default) |
| `first-project` | Lock to the first project only, ignore subsequent projects |

## Action

To change lock mode, run:

```bash
# Set to on-thinking (recommended, default)
python3 ~/.claude/hooks/vibe-monitor.py --lock-mode on-thinking

# Set to first-project
python3 ~/.claude/hooks/vibe-monitor.py --lock-mode first-project
```

## Check Current Mode

```bash
python3 ~/.claude/hooks/vibe-monitor.py --lock-mode
```

## When to Use Each Mode

**on-thinking (default)**: Best for switching between multiple projects. The monitor automatically follows whichever project is actively thinking.

**first-project**: Best when you want to stay focused on one project. Once locked, other projects won't take over the display.
