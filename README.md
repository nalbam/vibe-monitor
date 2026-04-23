# VibeMon

[![npm version](https://img.shields.io/npm/v/vibemon.svg)](https://www.npmjs.com/package/vibemon)
[![npm downloads](https://img.shields.io/npm/dm/vibemon.svg)](https://www.npmjs.com/package/vibemon)
[![license](https://img.shields.io/npm/l/vibemon.svg)](https://github.com/nalbam/vibemon-app/blob/main/LICENSE)

**Real-time status monitor for AI assistants with pixel art character display.**

See at a glance what your AI assistant is doing — thinking, working, or waiting for input. A cute pixel art character visually represents the current state.

## Supported Tools

| Tool | Description |
|------|-------------|
| **[Claude Code](https://claude.ai/code)** | Anthropic's official AI coding assistant |
| **[Codex](https://openai.com/codex)** | OpenAI's AI coding agent |
| **[Kiro](https://kiro.dev/)** | AWS's AI coding assistant |
| **[OpenClaw](https://openclaw.ai/)** | Open-source computer use agent |

## What It Monitors

| Field | Description | Example |
|-------|-------------|---------|
| **State** | Current activity state | `working`, `idle`, `notification` |
| **Project** | Active project directory | `vibemon-app` |
| **Tool** | Currently executing tool | `Bash`, `Read`, `Edit` |
| **Model** | Active model | `Opus 4.5`, `Sonnet` |
| **Memory** | Context window usage | `45%` |

## Quick Start

### Desktop App

```bash
npx vibemon
```

That's it! The app launches in the system tray and listens on `http://127.0.0.1:19280`.

### ESP32 Hardware

1. Set `BOARD_TYPE` in `credentials.h` and flash firmware (ESP32-C6-LCD-1.47 or 1.9)
2. Device creates WiFi AP: `VibeMon-Setup` (password: `vibemon123`)
3. Connect and configure WiFi + WebSocket token via web interface
4. Device connects and displays AI assistant status

See [ESP32 Setup Guide](docs/esp32-setup.md) for detailed instructions.

## Preview

![VibeMon Demo](images/demo.gif)

## Platforms

| Platform | Description | Best For |
|----------|-------------|----------|
| **ESP32 Hardware** | Dedicated LCD display (172×320 or 170×320, selected via `BOARD_TYPE`) | Primary, always-on desk companion |
| **Desktop App** | Electron app with system tray | Alternative for non-hardware users |

## Documentation

- [Features](docs/features.md) - States, animations, window modes
- [API Reference](docs/api.md) - Complete HTTP API documentation
- [ESP32 Setup Guide](docs/esp32-setup.md) - WiFi provisioning, WebSocket token configuration

For full documentation, visit **[vibemon.io/docs](https://vibemon.io/docs)**.

## States

| State | Color | Description |
|-------|-------|-------------|
| `start` | Cyan | Session begins |
| `idle` | Green | Waiting for input |
| `thinking` | Purple | Processing prompt |
| `planning` | Teal | Plan mode active |
| `working` | Blue | Tool executing |
| `packing` | Gray | Context compacting |
| `notification` | Yellow | User input needed |
| `done` | Green | Tool completed |
| `sleep` | Navy | 5min inactivity |
| `alert` | Red | Critical error/failure |

See [Features](docs/features.md) for animations, working state text, and more.

## Characters

| Character | Color | Auto-selected for |
|-----------|-------|-------------------|
| `clawd` | Orange | Claude Code |
| `codex` | Green | Codex |
| `kiro` | White | Kiro |
| `claw` | Red | OpenClaw |

## HTTP API

Default port: `19280`

### POST /status

Update monitor status:

```bash
curl -X POST http://127.0.0.1:19280/status \
  -H "Content-Type: application/json" \
  -d '{"state":"working","tool":"Bash","project":"my-project"}'
```

### GET /status

Get all windows' status:

```bash
curl http://127.0.0.1:19280/status
```

### POST /quit

Stop the application:

```bash
curl -X POST http://127.0.0.1:19280/quit
```

See [API Reference](docs/api.md) for all endpoints.

## Window Mode

| Mode | Description |
|------|-------------|
| `multi` | One window per project (max 5) - **Default** |
| `single` | One window with project lock support |

Switch via system tray menu or API:

```bash
curl -X POST http://127.0.0.1:19280/window-mode \
  -H "Content-Type: application/json" \
  -d '{"mode":"single"}'
```

## Project Lock

Lock the monitor to a specific project (single-window mode only):

```bash
# Lock
python3 ~/.claude/hooks/vibemon.py --lock

# Unlock
python3 ~/.claude/hooks/vibemon.py --unlock
```

See [Features](docs/features.md) for lock modes and CLI commands.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Window not appearing | Check system tray, or run `curl -X POST http://127.0.0.1:19280/show` |
| Port already in use | Check with `lsof -i :19280` |
| Hook not working | Verify Python 3: `python3 --version` |
| Captive portal doesn't open | Navigate to `http://192.168.4.1` manually |
| WiFi connection fails | Check password, ensure 2.4GHz network |
| Device won't enter setup mode | Send `POST /wifi-reset` to clear credentials |

See [Features](docs/features.md) for desktop app details, [ESP32 Setup Guide](docs/esp32-setup.md) for hardware troubleshooting.

## Version History

- **v1.9.1**: Docs tray menu shortcut, documentation improvements
- **v1.9**: Electron 35 security upgrade (ASAR Integrity Bypass fix)
- **v1.8**: Alert state (red, always-on-top), exclamation mark effect on ESP32
- **v1.7**: Open at Login option, Always on Top menu reordering, working state text standardized
- **v1.6**: ESP32 display layout improvements, code refactoring
- **v1.5**: WebSocket support, static engine CDN
- **v1.4**: New claw character, ESP32 claw support, image-based character rendering
- **v1.3**: Multi-window mode, window mode API, enhanced lock modes
- **v1.2**: Project lock, modular architecture, npx support
- **v1.1**: Desktop app, system tray, memory bar gradient
- **v1.0**: Pixel art character, web simulator

## License

MIT
