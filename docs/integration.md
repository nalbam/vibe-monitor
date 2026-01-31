# Integration Guide

Vibe Monitor receives status updates from AI coding assistants through their hook systems.

## Quick Install (Recommended)

```bash
curl -fsSL https://nalbam.github.io/vibe-monitor/install.py | python3
```

The script will:
1. Ask which tool to configure (Claude Code, Kiro, OpenClaw, or all)
2. Download and copy hook scripts and configuration files
3. Optionally create `.env.local` from example
4. Merge hooks into `settings.json` (Claude Code only)

---

## Claude Code Setup (Manual)

Claude Code uses **hooks** and **statusline** to send data to Vibe Monitor.

| Source | Data Provided | JSON Fields |
|--------|---------------|-------------|
| **Hook** | state, tool, project | `.hook_event_name`, `.tool_name`, `.cwd` |
| **Statusline** | model, memory | `.model.display_name`, `.context_window.used_percentage` |

### 1. Copy scripts

```bash
mkdir -p ~/.claude/hooks

cp config/claude/hooks/vibe-monitor.py ~/.claude/hooks/
chmod +x ~/.claude/hooks/vibe-monitor.py

cp config/claude/statusline.py ~/.claude/statusline.py
chmod +x ~/.claude/statusline.py
```

### 2. Configure environment variables

```bash
cp config/claude/.env.example ~/.claude/.env.local
```

Edit `~/.claude/.env.local`:

```bash
# Debug mode (optional, 1: enabled, 0: disabled)
# export DEBUG=1

# Cache file for project metadata (model, memory)
# Default: ~/.claude/statusline-cache.json
export VIBEMON_CACHE_PATH="~/.claude/statusline-cache.json"

# Desktop App URL (auto-launches via npx if not running)
# e.g., http://127.0.0.1:19280
export VIBEMON_DESKTOP_URL=""

# ESP32 USB Serial port (optional)
# Supports wildcard patterns (e.g., /dev/cu.usbmodem*) - uses first match
# e.g., /dev/cu.usbserial-0001, /dev/ttyUSB0, /dev/cu.usbmodem*
# Check with: ls /dev/cu.* or ls /dev/tty*
export VIBEMON_SERIAL_PORT="/dev/cu.usbmodem*"

# ESP32 HTTP URL (optional)
# e.g., http://192.168.1.100
export VIBEMON_ESP32_URL=""
```

### 3. Register in `~/.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/vibe-monitor.py" }] }
    ],
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/vibe-monitor.py" }] }
    ],
    "PreToolUse": [
      { "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/vibe-monitor.py" }] }
    ],
    "Notification": [
      { "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/vibe-monitor.py" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/vibe-monitor.py" }] }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "python3 ~/.claude/statusline.py"
  }
}
```

### 4. Statusline Display

Claude Code statusline shows project, model, and memory usage:

```
📂 vibe-monitor │ 🤖 Opus 4.5 │ 🧠 ━━━━━━━━╌╌ 80%
```

### Claude Code Hook Events

| Event | Vibe Monitor State | Description |
|-------|-------------------|-------------|
| `SessionStart` | `start` | Session begins |
| `UserPromptSubmit` | `thinking` | User submits prompt |
| `PreToolUse` | `working` | Tool execution starts |
| `Notification` | `notification` | User input needed |
| `Stop` | `done` | Agent turn ends |

---

## Kiro Setup (Manual)

Kiro uses `.kiro.hook` files that call the `vibe-monitor.py` script.

### 1. Copy scripts

```bash
mkdir -p ~/.kiro/hooks

cp config/kiro/hooks/vibe-monitor.py ~/.kiro/hooks/
chmod +x ~/.kiro/hooks/vibe-monitor.py

cp config/kiro/hooks/*.kiro.hook ~/.kiro/hooks/
```

### 2. Configure environment (Optional)

```bash
cp config/kiro/.env.example ~/.kiro/.env.local
```

Edit `~/.kiro/.env.local`:

```bash
# Desktop App URL (auto-launches via npx if not running)
export VIBEMON_DESKTOP_URL="http://127.0.0.1:19280"

# ESP32 USB Serial port (optional)
# export VIBEMON_SERIAL_PORT="/dev/cu.usbmodem1101"
```

### Kiro Hook Events

| Hook File | Event | State |
|-----------|-------|-------|
| `vibe-monitor-prompt-submit.kiro.hook` | `promptSubmit` | `thinking` |
| `vibe-monitor-file-created.kiro.hook` | `fileCreated` | `working` |
| `vibe-monitor-file-edited.kiro.hook` | `fileSaved` | `working` |
| `vibe-monitor-file-deleted.kiro.hook` | `fileDeleted` | `working` |
| `vibe-monitor-agent-stop.kiro.hook` | `agentStop` | `done` |

---

## OpenClaw Setup (Manual)

OpenClaw uses a log-tailing bridge script (`esp32-status-bridge.mjs`) to send status to ESP32.

> **Note:** OpenClaw integration is primarily designed for ESP32 hardware (USB Serial).

### 1. Copy scripts

```bash
mkdir -p ~/.openclaw/workspace/scripts

cp config/openclaw/scripts/esp32-status-bridge.mjs ~/.openclaw/workspace/scripts/
cp config/openclaw/scripts/sera-esp32-bridge.service ~/.openclaw/workspace/scripts/
```

### 2. Configure environment

```bash
# Project name displayed on ESP32
export SERA_PROJECT="Sera"

# OpenClaw log directory
export OPENCLAW_LOG_DIR="/tmp/openclaw"
```

### 3. Run manually (for testing)

```bash
cd ~/.openclaw/workspace
node scripts/esp32-status-bridge.mjs
```

### 4. Run as systemd service (recommended)

```bash
sudo cp ~/.openclaw/workspace/scripts/sera-esp32-bridge.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sera-esp32-bridge.service
```

See [OpenClaw Setup Guide](../config/openclaw/README.md) for detailed instructions.

### OpenClaw Events

| Event | State | Description |
|-------|-------|-------------|
| Run start | `thinking` | User prompt submitted |
| Planning | `planning` | Prompt interpretation |
| Tool execution | `working` | Tool running (exec, web_search, etc.) |
| Run end | `done` | Task completed |

---

## Target Behavior

### Status Updates

Status updates are sent to **all configured targets** (not priority-based):
- Desktop App (HTTP) - if `VIBEMON_DESKTOP_URL` is set
- ESP32 USB Serial - if `VIBEMON_SERIAL_PORT` is set
- ESP32 HTTP - if `VIBEMON_ESP32_URL` is set

### Commands (lock, unlock, etc.)

Commands try targets in order and stop on first success:
1. **Desktop App** - if `VIBEMON_DESKTOP_URL` is set
2. **ESP32 HTTP** - if `VIBEMON_ESP32_URL` is set
3. **ESP32 USB Serial** - if `VIBEMON_SERIAL_PORT` is set

---

## Event Mapping Comparison

| Action | Claude Code | Kiro | OpenClaw | State |
|--------|-------------|------|----------|-------|
| User input | `UserPromptSubmit` | `promptSubmit` | Run start | `thinking` |
| Planning | - | - | Embedded run | `planning` |
| File/Tool operations | `PreToolUse` | `fileCreated/fileSaved/fileDeleted` | Tool execution | `working` |
| Agent done | `Stop` | `agentStop` | Run end | `done` |
| Notification | `Notification` | - | - | `notification` |
