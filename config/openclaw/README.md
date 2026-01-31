# VibeMon Bridge for OpenClaw

OpenClaw plugin that sends real-time agent status to VibeMon (ESP32/Desktop) via hooks.

---

## Installation

### 1. Copy Plugin

```bash
# Copy plugin to OpenClaw extensions directory
mkdir -p ~/.openclaw/extensions/vibemon-bridge
cp extensions/* ~/.openclaw/extensions/vibemon-bridge/
```

### 2. Enable Plugin

Edit `~/.openclaw/openclaw.json` and add to `plugins.entries`:

```json
"plugins": {
  "entries": {
    "vibemon-bridge": {
      "enabled": true,
      "config": {
        "projectName": "OpenClaw",
        "character": "claw",
        "serialEnabled": true,
        "debug": true
      }
    }
  }
}
```

### 3. Restart OpenClaw Gateway

```bash
# If running as service
systemctl --user restart openclaw-gateway

# Or restart manually
pkill -f openclaw
openclaw gateway start
```

### 4. Verify

Check OpenClaw logs for plugin loading:
```
[vibemon] Plugin loaded
[vibemon] Project: OpenClaw, Character: claw
[vibemon] Serial: true, HTTP: false
[vibemon] TTY device: /dev/ttyACM0
```

---

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `projectName` | `OpenClaw` | Project name on VibeMon display |
| `character` | `claw` | Character: `clawd`, `kiro`, `claw` |
| `serialEnabled` | `true` | Send to ESP32 via USB serial |
| `httpEnabled` | `false` | Send to VibeMon Desktop app |
| `httpUrl` | `http://127.0.0.1:19280/status` | Desktop app endpoint |
| `debug` | `false` | Enable verbose logging |

---

## Hooks Used

| Hook | VibeMon State |
|------|---------------|
| `gateway_start` | `start` |
| `before_agent_start` | `thinking` |
| `before_tool_call` | `working` (with tool name) |
| `after_tool_call` | `thinking` |
| `message_sent` | `done` (3s delay) |
| `agent_end` | `done` (fallback) |
| `session_end` | `done` |
| `gateway_stop` | `done` |

---

## Prerequisites

### Connect ESP32 via USB

**macOS:**
```bash
ls /dev/cu.usbmodem*
```

**Linux:**
```bash
ls -la /dev/ttyACM*
```

### Serial Permissions (Linux only)

```bash
sudo usermod -aG dialout $USER
# Logout/reboot required
```

---

## State Protocol

States sent to VibeMon:

| State | Color | Description |
|-------|-------|-------------|
| `start` | Cyan | Gateway/session started |
| `thinking` | Purple | Processing user prompt |
| `working` | Blue | Tool executing (includes `tool` field) |
| `done` | Green | Task completed |

Output format (NDJSON):
```json
{"state":"working","tool":"exec","project":"OpenClaw","character":"claw","ts":"2026-01-31T12:00:00Z"}
```

> Note: The `done → idle → sleep` transitions are handled by VibeMon device/app.

---

## Troubleshooting

### No USB Device Found

- **macOS:** `ls /dev/cu.usbmodem*`
- **Linux:** `ls /dev/ttyACM*`, `dmesg | tail`
- Try different USB port / cable

### Write Permission Denied (Linux)

```bash
groups $USER  # Should include 'dialout'
ls -la /dev/ttyACM0  # Check group
```

### Plugin Not Loading

- Check config JSON syntax
- Verify plugin directory: `~/.openclaw/extensions/vibemon-bridge/`
- Check OpenClaw logs for errors
