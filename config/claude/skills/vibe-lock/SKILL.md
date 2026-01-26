---
name: vibe-lock
description: Use when you want to lock vibe-monitor to current project, preventing display updates from other projects
---

# Vibe Lock

Lock vibe-monitor to the current project.

## Usage

Run the following command to lock the current project:

```bash
curl -s -X POST http://127.0.0.1:19280/lock \
  -H "Content-Type: application/json" \
  -d "{\"project\":\"$(basename $(pwd))\"}"
```

## Related Commands

```bash
# Unlock
curl -s -X POST http://127.0.0.1:19280/unlock

# Check status
curl -s http://127.0.0.1:19280/status | jq

# Lock specific project
curl -s -X POST http://127.0.0.1:19280/lock \
  -H "Content-Type: application/json" \
  -d '{"project":"project-name"}'
```

## When Locked

- Display updates from other projects are ignored
- Other projects still get added to the project list
- Use Tray menu → Project Lock to switch or unlock
