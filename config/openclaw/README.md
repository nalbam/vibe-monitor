# ESP32 Status Bridge Setup Guide

`vibemon-bridge.mjs` is a bridge that tails **OpenClaw Gateway logs (JSONL)** and streams the current status to **ESP32-C6 (USB Serial, `/dev/ttyACM*`)** as **NDJSON (JSON + `\n`)**.

- Input (what the bridge reads): OpenClaw log file (`/tmp/openclaw/openclaw-YYYY-MM-DD.log`)
- Output (what goes to ESP32): `/dev/ttyACM0` (Linux) or `/dev/cu.usbmodem*` (macOS)
- Output example:
```json
{"state":"working","tool":"exec","project":"OpenClaw","character":"claw"}
```

> Note: The `done → idle` transition is handled by **VibeMon**. The bridge only sends **thinking/planning/working/done**.

---

## 1) File Structure

- `scripts/vibemon-bridge.mjs`: Bridge script (Node.js)
- `scripts/vibemon-bridge.plist`: launchd user service (macOS)
- `scripts/vibemon-bridge.service`: systemd user service (Linux)

---

## 2) Prerequisites

### 2.1 Connect ESP32 via USB

**macOS:**
```bash
ls /dev/cu.usbmodem*
```

**Linux:**
```bash
ls -la /dev/ttyACM*
dmesg | tail -n 50
```

### 2.2 Serial Permissions

**macOS:** No additional permissions needed.

**Linux:** Add your user to the `dialout` group:
```bash
sudo usermod -aG dialout $USER
# Logout/reboot may be required for changes to take effect
```

If permissions are missing, you'll see a warning like:
- `Found /dev/ttyACM0 but not writable. Check permissions (dialout group) ...`

### 2.3 Verify OpenClaw Logs Exist
The bridge tails the following log by default:
- `OPENCLAW_LOG_DIR=/tmp/openclaw`
- File pattern: `openclaw-YYYY-MM-DD.log`

Verify:
```bash
ls -la /tmp/openclaw
```

> If the log path is different, set the `OPENCLAW_LOG_DIR` environment variable accordingly.

---

## 3) Quick Start (Manual Testing)

Before setting up as a service, test manually first.

```bash
cd ~/.openclaw/workspace
node scripts/vibemon-bridge.mjs
```

If working correctly, you'll see logs on stderr:
```
==================================================
VibeMon Bridge for OpenClaw
==================================================
Using tty: /dev/ttyACM0
Tailing log: /tmp/openclaw/openclaw-2026-01-31.log
Debug mode: OFF (set DEBUG=1 to enable)
Supported patterns:
  - Tool patterns: 4
  - Session state patterns: 4
  - JSON formats: 6 variants
==================================================
```

For debugging, enable debug mode:
```bash
DEBUG=1 node scripts/vibemon-bridge.mjs
```

---

## 4) Environment Variables

The bridge uses the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECT_NAME` | `OpenClaw` | Project name displayed on ESP32 |
| `OPENCLAW_LOG_DIR` | `/tmp/openclaw` | OpenClaw log directory |
| `DEBUG` | `false` | Enable debug logging (`1` or `true`) |

Example:
```bash
PROJECT_NAME=OpenClaw \
OPENCLAW_LOG_DIR=/tmp/openclaw \
DEBUG=1 \
node scripts/vibemon-bridge.mjs
```

---

## 5) State Specification (ESP32 Input Protocol)

The bridge sends only these states:

- `thinking`: User submitted prompt (run started) / generating response
- `planning`: Prompt interpretation/planning phase (based on embedded run prompt start/end)
- `working`: Tool execution in progress (includes `tool` field)
- `done`: Task completed (reply delivered or run ended)

Additional fields for `working` state:
- `tool`: e.g., `exec`, `web_search`, `browser`, ...

Common fields:
- `project`: `PROJECT_NAME` (default: `OpenClaw`)
- `character`: `claw` (fixed)
- `ts`: ISO timestamp

---

## 6) Running as a User Service

### 6.1 macOS (launchd)

```bash
# Copy plist to LaunchAgents
cp ~/.openclaw/workspace/scripts/vibemon-bridge.plist ~/Library/LaunchAgents/

# Load the service
launchctl load ~/Library/LaunchAgents/vibemon-bridge.plist

# Check status
launchctl list | grep vibemon

# View logs
tail -f /tmp/vibemon-bridge.log
tail -f /tmp/vibemon-bridge.error.log

# Unload (stop) the service
launchctl unload ~/Library/LaunchAgents/vibemon-bridge.plist
```

### 6.2 Linux (systemd user service)

```bash
# Create user systemd directory
mkdir -p ~/.config/systemd/user

# Copy the service file
cp ~/.openclaw/workspace/scripts/vibemon-bridge.service ~/.config/systemd/user/

# Reload systemd
systemctl --user daemon-reload

# Enable and start
systemctl --user enable --now vibemon-bridge.service

# Check status
systemctl --user status vibemon-bridge.service

# View logs
journalctl --user -u vibemon-bridge.service -f

# Stop the service
systemctl --user stop vibemon-bridge.service

# Disable the service
systemctl --user disable vibemon-bridge.service
```

#### Enable linger (optional, for headless servers)

By default, user services stop when the user logs out. To keep them running:

```bash
sudo loginctl enable-linger $USER
```

---

## 7) Troubleshooting

### 7.1 No USB Device Found

**macOS:**
- Check `ls /dev/cu.usbmodem*`
- Try different USB ports
- Verify cable supports data transfer

**Linux:**
- Check `ls /dev/ttyACM*`
- Check recognition logs with `dmesg | tail`
- Verify board reset/boot mode

### 7.2 Write Permission Denied (Linux)
- Verify the group is `dialout` with `ls -la /dev/ttyACM0`
- Confirm your user is in the `dialout` group:
```bash
groups $USER
```

### 7.3 OpenClaw Log File Not Found
- The bridge only watches **today's** file: `openclaw-YYYY-MM-DD.log`
- Verify `OPENCLAW_LOG_DIR` matches the actual log path
- Confirm Gateway is writing logs to that location

### 7.4 Service not starting

**Linux:**
```bash
# Check detailed status
systemctl --user status vibemon-bridge.service -l

# Check journal logs
journalctl --user -u vibemon-bridge.service --no-pager -n 50
```

**macOS:**
```bash
# Check if loaded
launchctl list | grep vibemon

# View error log
cat /tmp/vibemon-bridge.error.log
```

---

## 8) Log Format Resilience

The bridge supports multiple log formats for resilience against OpenClaw updates:

**JSON Formats:**
- `{"0": "...", "1": "..."}`
- `{"subsystem": "...", "message": "..."}`
- `{"msg": "...", "module": "..."}`
- `{"text": "..."}` or `{"log": "..."}`
- `[subsystem, message]` (array)

**State Detection Patterns:**
- `session state: prev=idle new=processing`
- `state changed: idle -> processing`
- `session.state = processing`
- `{"state": "processing"}`

**Tool Detection Patterns:**
- `embedded run tool start: tool=exec`
- `tool_call started tool=exec`
- `executing tool: exec`
- `[tool:exec] start`

The bridge automatically handles log file rotation at midnight.
