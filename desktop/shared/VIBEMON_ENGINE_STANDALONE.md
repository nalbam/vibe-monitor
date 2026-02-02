# VibeMon Engine - Standalone Version

## Overview

This is a **completely standalone** version of the VibeMon Engine that includes everything in a single JavaScript file:

- ✅ All character rendering logic
- ✅ All animation and effects
- ✅ All icon rendering (pixel art)
- ✅ State management
- ✅ Memory bar visualization
- ✅ No external dependencies (except character images)

## File Size

- **908 lines** of self-contained code
- **~30 KB** uncompressed

## What's Included

The standalone file contains:
- **States data**: All 9 states (start, idle, thinking, planning, working, packing, notification, done, sleep)
- **Character configs**: clawd, kiro, claw with eye positions and colors
- **Animation system**: Floating, blinking, matrix rain, sparkles, thinking bubbles, zzz effects
- **Icon rendering**: Pixel art icons for project, tool, model, memory
- **Memory bar**: Color-coded gradient bar (green/yellow/red)
- **Text variations**: Random text for thinking/planning/working states

## Usage

### Basic Setup

```javascript
import { createVibeMonEngine } from './vibemon-engine-standalone.js';

// 1. Get canvas and DOM elements
const canvas = document.getElementById('character-canvas');
const domElements = {
  display: document.getElementById('display'),
  titleText: document.getElementById('title-text'),
  statusText: document.getElementById('status-text'),
  loadingDots: document.getElementById('loading-dots'),
  projectLine: document.getElementById('project-line'),
  toolLine: document.getElementById('tool-line'),
  modelLine: document.getElementById('model-line'),
  memoryLine: document.getElementById('memory-line'),
  projectValue: document.getElementById('project-value'),
  toolValue: document.getElementById('tool-value'),
  modelValue: document.getElementById('model-value'),
  memoryValue: document.getElementById('memory-value'),
  memoryBar: document.getElementById('memory-bar'),
  memoryBarContainer: document.getElementById('memory-bar-container'),
  infoTexts: document.querySelectorAll('.info-text'),
  infoLabels: document.querySelectorAll('.info-label'),
  infoValues: document.querySelectorAll('.info-value'),
  dots: document.querySelectorAll('.dot')
};

// 2. Create engine with options
const engine = createVibeMonEngine(canvas, domElements, {
  useEmoji: true, // or false for pixel art icons
  characterImageUrls: {
    clawd: './path/to/clawd-128.png',
    kiro: './path/to/kiro-128.png',
    claw: './path/to/claw-128.png'
  }
});

// 3. Initialize (loads images)
await engine.init();

// 4. Set state and render
engine.setState({
  state: 'working',
  character: 'clawd',
  project: 'my-project',
  tool: 'Bash',
  model: 'claude-3',
  memory: 75
});
engine.render();

// 5. Start animation
engine.startAnimation();
```

### Update State

```javascript
// Update any state property
engine.setState({ state: 'thinking' });
engine.render();

// Update multiple properties
engine.setState({
  state: 'working',
  tool: 'Python',
  memory: 85
});
engine.render();
```

### Cleanup

```javascript
// Stop animation and cleanup
engine.cleanup();
```

## Character Images

You need to provide character images (128x128 PNG):

```javascript
characterImageUrls: {
  clawd: 'https://example.com/clawd-128.png',  // Orange cat
  kiro: 'https://example.com/kiro-128.png',    // White ghost
  claw: 'https://example.com/claw-128.png'     // Red cat
}
```

Or use relative paths:
```javascript
characterImageUrls: {
  clawd: './assets/characters/clawd-128.png',
  kiro: './assets/characters/kiro-128.png',
  claw: './assets/characters/claw-128.png'
}
```

## Required HTML Structure

Your HTML needs these elements:

```html
<!-- Canvas for character -->
<canvas id="character-canvas" width="128" height="128"></canvas>

<!-- Display container -->
<div id="display">
  <!-- Status text -->
  <div id="status-text"></div>
  
  <!-- Loading dots -->
  <div id="loading-dots">
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
  </div>
  
  <!-- Info lines -->
  <div id="project-line">
    <span class="emoji-icon">📂 </span>
    <canvas class="pixel-icon" id="icon-project" width="8" height="8"></canvas>
    <span id="project-value"></span>
  </div>
  
  <div id="tool-line">
    <span class="emoji-icon">🛠️ </span>
    <canvas class="pixel-icon" id="icon-tool" width="8" height="8"></canvas>
    <span id="tool-value"></span>
  </div>
  
  <div id="model-line">
    <span class="emoji-icon">🤖 </span>
    <canvas class="pixel-icon" id="icon-model" width="8" height="8"></canvas>
    <span id="model-value"></span>
  </div>
  
  <div id="memory-line">
    <span class="emoji-icon">🧠 </span>
    <canvas class="pixel-icon" id="icon-memory" width="8" height="8"></canvas>
    <span id="memory-value"></span>
  </div>
  
  <!-- Memory bar -->
  <div id="memory-bar-container">
    <div id="memory-bar"></div>
  </div>
</div>
```

## States

Available states:
- `start` - Cyan background, "Hello!", sparkle effect
- `idle` - Green background, "Ready", blinking
- `thinking` - Purple background, "Thinking", thought bubble, slow dots
- `planning` - Teal background, "Planning", thought bubble, slow dots
- `working` - Blue background, "Working", matrix rain + sunglasses, fast dots
- `packing` - Gray background, "Packing", thought bubble, slow dots
- `notification` - Yellow background, "Input?", alert effect
- `done` - Green background, "Done!", happy eyes
- `sleep` - Dark blue background, "Zzz...", sleeping + zzz effect

## Characters

Available characters:
- `clawd` - Orange cat (default)
- `kiro` - White ghost
- `claw` - Red cat

## API Reference

### `createVibeMonEngine(canvas, domElements, options)`

Creates a new VibeMon Engine instance.

**Parameters:**
- `canvas` - HTML canvas element (128x128)
- `domElements` - Object with DOM element references
- `options` - Configuration object:
  - `useEmoji` - Boolean, use emoji icons (default: false)
  - `characterImageUrls` - Object mapping character names to image URLs

**Returns:** VibeMonEngine instance

### `engine.init()`

Initialize the engine and load character images.

**Returns:** Promise that resolves when images are loaded

### `engine.setState(data)`

Update engine state.

**Parameters:**
- `data.state` - State name (string)
- `data.character` - Character name (string)
- `data.project` - Project name (string)
- `data.tool` - Tool name (string)
- `data.model` - Model name (string)
- `data.memory` - Memory percentage (number 0-100)

### `engine.render()`

Render all UI elements based on current state.

### `engine.startAnimation()`

Start the animation loop.

### `engine.stopAnimation()`

Stop the animation loop.

### `engine.cleanup()`

Stop animation and cleanup resources.

### `engine.getStateObject()`

Get current state as an object.

**Returns:** Object with state, character, project, tool, model, memory

## Use in Other Projects

This standalone file can be used in any web project:

1. **Copy the file**: `vibemon-engine-standalone.js`
2. **Add character images**: 128x128 PNG files
3. **Create HTML structure**: Canvas + required DOM elements
4. **Import and use**:
   ```javascript
   import { createVibeMonEngine } from './vibemon-engine-standalone.js';
   ```

That's it! No other dependencies needed.

## Differences from Original

The standalone version:
- ✅ Includes all JSON data inline (no separate files needed)
- ✅ Includes all utility functions inline
- ✅ Includes all rendering logic inline
- ✅ Single file - easy to copy and use
- ❌ Slightly larger file size (but still only 30KB)
- ❌ Character images still need to be provided separately

## Browser Compatibility

Works in all modern browsers that support:
- ES6 modules
- Canvas API
- requestAnimationFrame
- Promise/async-await

## License

Same as the main Vibe Monitor project.
