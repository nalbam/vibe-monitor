# ESP32 File Split Implementation Plan

> **Status: COMPLETED** — This plan was executed on 2026-03-01. File names and structure have since evolved (e.g., `vibemon-app.ino` → `esp32.ino`, `wifi.h` → `wifi_manager.h`, added `ui_elements.h`). See the actual files in `esp32/` for current structure.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the monolithic `vibemon-app.ino` (1783 lines) into 8 focused files for maintainability.

**Architecture:** Extract logical sections from `vibemon-app.ino` into `.h` files following the existing Arduino IDE pattern (same as `sprites.h`). Each file gets `#ifndef` include guards. The `.ino` becomes a thin orchestrator (~80 lines) with `setup()`, `loop()`, and `#include` directives in dependency order.

**Tech Stack:** Arduino IDE, ESP32-C6, LovyanGFX, ArduinoJson, WebSocketsClient

---

### Task 1: Create `config.h` — Constants & Macros

**Files:**
- Create: `config.h`

**Step 1: Create `config.h`**

Extract from `vibemon-app.ino` lines 40-88 (Section 2: Constants & Macros).

```cpp
/*
 * VibeMon Configuration
 * Constants, macros, and compile-time settings
 */

#ifndef CONFIG_H
#define CONFIG_H

// Version string
#define VERSION "v1.8.1"

// Screen size
#define SCREEN_WIDTH  172
#define SCREEN_HEIGHT 320

// Layout positions (adjusted for 128x128 character on 172x320 screen)
#define CHAR_X_BASE   22   // (172 - 128) / 2 = 22
#define CHAR_Y_BASE   18   // Base Y position (float ±5px → 13~23)
#define FLOAT_AMPLITUDE_X 3  // Floating animation amplitude X (pixels)
#define FLOAT_AMPLITUDE_Y 5  // Floating animation amplitude Y (pixels)
#define STATUS_TEXT_Y 160  // size 3 (24px) → bottom 184
#define LOADING_Y     190  // dots after status text (gap 6px) → bottom ~198
#define PROJECT_Y     204  // info rows: 25px spacing (+1px from previous 24px)
#define TOOL_Y        229
#define MODEL_Y       254
#define MEMORY_Y      279  // font ~14px → bottom 293
#define MEMORY_BAR_X  10
#define MEMORY_BAR_Y  299  // 5px gap after memory text
#define MEMORY_BAR_W  152
#define MEMORY_BAR_H  6    // bar bottom 303 → 17px bottom margin
#define BRAND_Y       308  // start screen only (size 1, 8px)

// Animation timing
#define BLINK_INTERVAL       3200  // Blink interval in idle state (ms)
#define BLINK_DURATION        100  // Blink closed-eye hold duration (ms)

// State timeouts
#define IDLE_TIMEOUT 60000            // 1 minute (start/done -> idle)
#define SLEEP_TIMEOUT 300000          // 5 minutes (idle -> sleep)

// JSON buffer size for StaticJsonDocument
// Increased to 1024 for WebSocket nested payloads:
// {"type":"status","data":{"state":"...", "project":"...", "model":"...", ...}}
#define JSON_BUFFER_SIZE 1024

// Project lock modes
#define LOCK_MODE_FIRST_PROJECT 0
#define LOCK_MODE_ON_THINKING 1
#define MAX_PROJECTS 10

// WiFi connection
#define WIFI_CONNECT_ATTEMPTS  20  // Max connection attempts before giving up
#define WIFI_CONNECT_DELAY_MS 500  // Delay between each attempt (ms)
#define WIFI_FAIL_RESTART_MS 2000  // Delay before reboot on connection failure (ms)

// Safe string copy: always null-terminates, requires array (not pointer) as dst
#define safeCopyStr(dst, src) do { strncpy(dst, src, sizeof(dst)-1); dst[sizeof(dst)-1]='\0'; } while(0)

#endif // CONFIG_H
```

**Step 2: Verify** — File should be ~65 lines.

---

### Task 2: Create `state.h` — Global Variables & State Helpers

**Files:**
- Create: `state.h`

**Step 1: Create `state.h`**

Extract from `vibemon-app.ino` lines 90-278 (Sections 3+4: Global Variables + State & Utility Helpers).

Contents:
- `Preferences preferences;`
- Sprite buffer (`charSprite`, `spriteInitialized`)
- State variables (`currentState`, `previousState`, `currentCharacter`, etc.)
- Blink animation state machine (`BlinkPhase` enum)
- Project lock variables (`projectList`, `lockedProject`, `lockMode`)
- Dirty rect tracking flags
- Serial input buffer
- WiFi/WebSocket variables (inside `#ifdef USE_WIFI` / `#ifdef USE_WEBSOCKET`)
- Forward declaration: `void transitionToState(AppState newState, bool resetTimer = true);`
- Helper functions: `parseState()`, `getStateString()`, `isLoadingState()`, `isActiveState()`
- `checkSleepTimer()`

**Important:** Include `<Preferences.h>` at top. Use `extern int animFrame;` from sprites.h.

**Key dependency:** `checkSleepTimer()` calls `transitionToState()` which is forward-declared here but defined in `display.h`. This works because Arduino IDE compiles all `.h` files as one translation unit.

**Step 2: Verify** — File should be ~200 lines.

---

### Task 3: Create `display.h` — Graphics & Display Functions

**Files:**
- Create: `display.h`

**Step 1: Create `display.h`**

Extract from `vibemon-app.ino` lines 607-958 (Sections 7+8: Graphics & Display + Transition Helper).

Contents:
- Floating animation lookup tables (`FLOAT_TABLE_X`, `FLOAT_TABLE_Y`)
- `getFloatOffsetX()`, `getFloatOffsetY()`
- `drawConnectionIndicator()`
- `drawStartScreen()`
- `truncateText()`, `drawInfoRow()`
- `drawStatus()` — the main render function
- `clearPreviousEdges()`
- `updateAnimation()`
- `updateBlink()`
- `transitionToState()` — the actual implementation (forward-declared in state.h)

**Important:** This file depends on globals from `state.h` and draw functions from `sprites.h`. Both are included before this file.

**Step 2: Verify** — File should be ~360 lines.

---

### Task 4: Create `project_lock.h` — Project Lock Functions

**Files:**
- Create: `project_lock.h`

**Step 1: Create `project_lock.h`**

Extract from `vibemon-app.ino` lines 280-381 (Section 5: Project Lock Functions).

Contents:
- `projectExists()`
- `addProjectToList()`
- `lockProject()` — calls `drawStatus()` (defined in display.h, included before)
- `unlockProject()`
- `setLockMode()`
- `getLockModeString()`
- `parseLockMode()`
- `isLockedToDifferentProject()`

**Key dependency:** `lockProject()` calls `drawStatus()` from display.h. Since display.h is included before project_lock.h, this resolves correctly.

**Step 2: Verify** — File should be ~110 lines.

---

### Task 5: Create `input.h` — Input Processing

**Files:**
- Create: `input.h`

**Step 1: Create `input.h`**

Extract from `vibemon-app.ino` lines 383-605 (Section 6: Status & Input Processing).

Contents:
- `buildStatusJson()`
- `handleCommand()`
- Forward declaration: `bool processStatusData(JsonObject doc);`
- `handleWebSocketMessage()` — calls `processStatusData()`
- `processInput()` — main entry point for all input (Serial/HTTP/WebSocket)
- `processStatusData()` — parses state/project/tool/model/memory/character, triggers redraw

**Key dependency:** `processStatusData()` calls `drawStatus()` from display.h. `handleCommand()` calls `lockProject()`/`unlockProject()` from project_lock.h.

**Step 2: Verify** — File should be ~230 lines.

---

### Task 6: Create `wifi_portal.h` — WiFi Configuration HTML Page

**Files:**
- Create: `wifi_portal.h`

**Step 1: Create `wifi_portal.h`**

Extract from `vibemon-app.ino` lines 1216-1460 (the `getConfigPage()` function).

Contents:
- `getConfigPage()` — returns the full HTML/CSS/JS string for the WiFi captive portal

This is a pure data function with no external dependencies. Wrapping in `#ifdef USE_WIFI` for consistency.

**Step 2: Verify** — File should be ~250 lines.

---

### Task 7: Create `wifi.h` — WiFi, HTTP & WebSocket

**Files:**
- Create: `wifi.h`

**Step 1: Create `wifi.h`**

Extract from `vibemon-app.ino` lines 1058-1783 (Section 10: WiFi Functions), EXCLUDING `getConfigPage()` (now in wifi_portal.h).

Contents (all inside `#ifdef USE_WIFI`):
- `loadWiFiCredentials()`, `saveWiFiCredentials()`
- `loadWebSocketToken()`, `saveWebSocketToken()` (inside `#ifdef USE_WEBSOCKET`)
- `startProvisioningMode()`
- `setupProvisioningServer()` — calls `getConfigPage()` from wifi_portal.h
- `setupWiFi()`
- HTTP handlers: `handleStatus()`, `handleStatusGet()`, `handleHealth()`, `handleLock()`, `handleUnlock()`, `handleLockModeGet()`, `handleLockModePost()`, `handleReboot()`
- `checkWiFiConnection()`
- `setupWebSocket()`, `webSocketEvent()` (inside `#ifdef USE_WEBSOCKET`)

**Important:** Keep the `#ifdef USE_WIFI` / `#ifdef USE_WEBSOCKET` conditional compilation guards intact.

**Step 2: Verify** — File should be ~480 lines.

---

### Task 8: Rewrite `vibemon-app.ino` — Thin Orchestrator

**Files:**
- Modify: `vibemon-app.ino` (complete rewrite from 1783 to ~80 lines)

**Step 1: Rewrite `vibemon-app.ino`**

The .ino file becomes a thin orchestrator with only:
1. File header comment
2. Library `#include` directives (external libraries)
3. App module `#include` directives (in dependency order)
4. `setup()` function
5. `loop()` function

```cpp
/*
 * VibeMon
 * ESP32-C6-LCD-1.47 (172x320, ST7789V2)
 *
 * Pixel art character (128x128) with animated states
 * USB Serial + HTTP support
 */

// =============================================================================
// External Libraries
// =============================================================================

#include "TFT_Compat.h"
#include <ArduinoJson.h>
#include <Preferences.h>
#include "sprites.h"

// WiFi configuration (create credentials.h from credentials.h.example)
#if __has_include("credentials.h")
#include "credentials.h"
#endif

// WiFi (HTTP fallback, optional)
#ifdef USE_WIFI
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>

// WebSocket client (optional, requires USE_WIFI)
#ifdef USE_WEBSOCKET
#include <WebSocketsClient.h>
#endif
#endif

// =============================================================================
// App Modules (order matters: dependency chain)
// =============================================================================

#include "config.h"
#include "state.h"
#include "display.h"
#include "project_lock.h"
#include "input.h"

#ifdef USE_WIFI
#include "wifi_portal.h"
#include "wifi.h"
#endif

// =============================================================================
// setup() & loop()
// =============================================================================

void setup() {
  // ... (unchanged from current lines 964-1010)
}

void loop() {
  // ... (unchanged from current lines 1013-1056)
}
```

**Step 2: Verify** — File should be ~80 lines (includes) + setup (~48 lines) + loop (~44 lines) ≈ 170 lines total (well under 200).

---

### Task 9: Compilation Verification

**Step 1: Verify compilation**

Open Arduino IDE and verify the sketch compiles without errors for ESP32-C6 target.

**Expected result:** No compilation errors. Binary size should be identical (±few bytes) to before the split.

**Step 2: Verify behavior**

Flash to device (or test via Serial) and confirm:
- Start screen displays correctly
- State transitions work (send JSON via Serial)
- WiFi connects (if enabled)
- WebSocket connects (if enabled)
- All HTTP endpoints respond correctly

---

## Summary

| Before | After |
|--------|-------|
| `vibemon-app.ino` (1783 lines) | `vibemon-app.ino` (~170 lines) |
| | `config.h` (~65 lines) |
| | `state.h` (~200 lines) |
| | `display.h` (~360 lines) |
| | `project_lock.h` (~110 lines) |
| | `input.h` (~230 lines) |
| | `wifi_portal.h` (~250 lines) |
| | `wifi.h` (~480 lines) |
| **Total: 1783 lines** | **Total: ~1865 lines** (slight increase from headers/guards) |

Each file is well within the 200-800 line guideline. The largest file (`wifi.h` ~480 lines) is acceptable as it's a self-contained WiFi module with conditional compilation.
