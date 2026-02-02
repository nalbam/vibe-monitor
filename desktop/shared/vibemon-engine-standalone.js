/**
 * VibeMon Engine - Standalone Version
 * Complete rendering engine for VibeMon in a single file
 *
 * Usage:
 *   const engine = createVibeMonEngine(container, { useEmoji: true });
 *   await engine.init();
 *   engine.setState({ state: 'working', tool: 'Bash' });
 *   engine.render();
 *   engine.startAnimation();
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const CONSTANTS = {
  DEFAULT_CHARACTER: "clawd",
  CHAR_SIZE: 128,
  SCALE: 2,
  COLOR_EYE: "#000000",
  COLOR_WHITE: "#FFFFFF",
  FLOAT_AMPLITUDE_X: 3,
  FLOAT_AMPLITUDE_Y: 5,
  CHAR_X_BASE: 22,
  CHAR_Y_BASE: 20,
  FRAME_INTERVAL: 100,
  FLOAT_CYCLE_FRAMES: 32,
  LOADING_DOT_COUNT: 4,
  THINKING_ANIMATION_SLOWDOWN: 3,
  BLINK_START_FRAME: 30,
  BLINK_END_FRAME: 31,
  PROJECT_NAME_MAX_LENGTH: 20,
  PROJECT_NAME_TRUNCATE_AT: 17,
  MODEL_NAME_MAX_LENGTH: 14,
  MODEL_NAME_TRUNCATE_AT: 11
};

// =============================================================================
// EMBEDDED STYLES
// =============================================================================

const ENGINE_STYLES = `
.vibemon-display {
  width: 172px;
  height: 320px;
  background: #000;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  image-rendering: pixelated;
}

.vibemon-display .vibemon-canvas {
  position: absolute;
  top: 20px;
  left: 22px;
  width: 128px;
  height: 128px;
  image-rendering: pixelated;
  transition: top 0.1s ease-out, left 0.1s ease-out;
}

.vibemon-display .vibemon-status-text {
  position: absolute;
  top: 160px;
  width: 100%;
  text-align: center;
  font-family: 'Courier New', monospace;
  font-size: 24px;
  font-weight: bold;
  color: white;
}

.vibemon-display .vibemon-loading-dots {
  position: absolute;
  top: 190px;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.vibemon-display .vibemon-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7BEF7B;
  transition: background 0.1s;
}

.vibemon-display .vibemon-dot.dim {
  background: #3a3a3a;
}

.vibemon-display .vibemon-info-text {
  position: absolute;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: white;
  left: 10px;
}

.vibemon-display .vibemon-project-text { top: 220px; }
.vibemon-display .vibemon-tool-text { top: 235px; }
.vibemon-display .vibemon-model-text { top: 250px; }
.vibemon-display .vibemon-memory-text { top: 265px; }

.vibemon-display .vibemon-memory-bar-container {
  position: absolute;
  top: 285px;
  left: 10px;
  width: 152px;
  height: 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.6);
  box-sizing: border-box;
}

.vibemon-display .vibemon-memory-bar {
  height: 100%;
  border-radius: 0px;
  transition: width 0.3s, background 0.3s;
}

.vibemon-display .vibemon-info-label {
  color: white;
  display: inline-flex;
  align-items: center;
}

.vibemon-display .vibemon-info-value {
  color: #aaa;
}

.vibemon-display .vibemon-pixel-icon {
  width: 8px;
  height: 8px;
  margin-right: 2px;
  image-rendering: pixelated;
  vertical-align: middle;
  display: none;
}

.vibemon-display .vibemon-emoji-icon {
  display: inline;
}
`;

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.id = 'vibemon-engine-styles';
  style.textContent = ENGINE_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}

// =============================================================================
// STATE AND CHARACTER DATA
// =============================================================================

const STATES = {
  start: { bgColor: "#00CCCC", text: "Hello!", eyeType: "normal", effect: "sparkle", showLoading: false, textColor: "#000000" },
  idle: { bgColor: "#00AA00", text: "Ready", eyeType: "normal", effect: "none", showLoading: false, textColor: "#FFFFFF" },
  thinking: { bgColor: "#9933FF", text: "Thinking", eyeType: "normal", effect: "thinking", showLoading: true, textColor: "#FFFFFF" },
  planning: { bgColor: "#008888", text: "Planning", eyeType: "normal", effect: "thinking", showLoading: true, textColor: "#FFFFFF" },
  working: { bgColor: "#0066CC", text: "Working", eyeType: "focused", effect: "sparkle", showLoading: true, textColor: "#FFFFFF" },
  packing: { bgColor: "#AAAAAA", text: "Packing", eyeType: "normal", effect: "thinking", showLoading: true, textColor: "#000000" },
  notification: { bgColor: "#FFCC00", text: "Input?", eyeType: "normal", effect: "alert", showLoading: false, textColor: "#000000" },
  sleep: { bgColor: "#111144", text: "Zzz...", eyeType: "blink", effect: "zzz", showLoading: false, textColor: "#FFFFFF" },
  done: { bgColor: "#00AA00", text: "Done!", eyeType: "happy", effect: "none", showLoading: false, textColor: "#FFFFFF" }
};

const CHARACTER_CONFIG = {
  clawd: { name: "clawd", displayName: "Clawd", color: "#D97757", eyes: { left: { x: 14, y: 22 }, right: { x: 44, y: 22 }, size: 6 }, effect: { x: 52, y: 4 } },
  kiro: { name: "kiro", displayName: "Kiro", color: "#FFFFFF", eyes: { left: { x: 30, y: 21 }, right: { x: 39, y: 21 }, w: 5, h: 8 }, effect: { x: 50, y: 3 } },
  claw: { name: "claw", displayName: "Claw", color: "#DD4444", eyes: { left: { x: 21, y: 16 }, right: { x: 38, y: 16 }, size: 6 }, effect: { x: 49, y: 4 } }
};

const TOOL_TEXTS = {
  bash: "Running", read: "Reading", edit: "Editing", write: "Writing",
  grep: "Searching", glob: "Scanning", task: "Working",
  webfetch: "Fetching", websearch: "Searching", default: "Working"
};

const DARK_BG_COLORS = Object.values(STATES).filter(s => s.textColor === '#FFFFFF').map(s => s.bgColor);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getWorkingText(tool) {
  return TOOL_TEXTS[(tool || '').toLowerCase()] || TOOL_TEXTS.default;
}

function lerpColor(color1, color2, ratio) {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  return `rgb(${Math.round(r1 + (r2 - r1) * ratio)}, ${Math.round(g1 + (g2 - g1) * ratio)}, ${Math.round(b1 + (b2 - b1) * ratio)})`;
}

function getMemoryGradient(percent) {
  const green = '#00AA00', yellow = '#FFCC00', red = '#FF4444';
  let startColor, endColor;

  if (percent < 75) {
    const ratio = percent / 75;
    startColor = lerpColor(green, yellow, ratio * 0.5);
    endColor = lerpColor(green, yellow, Math.min(1, ratio * 0.5 + 0.3));
  } else if (percent < 90) {
    const ratio = (percent - 75) / 15;
    startColor = lerpColor(yellow, red, ratio * 0.5);
    endColor = lerpColor(yellow, red, Math.min(1, ratio * 0.5 + 0.3));
  } else {
    const ratio = (percent - 90) / 10;
    startColor = lerpColor(yellow, red, 0.5 + ratio * 0.25);
    endColor = lerpColor(yellow, red, Math.min(1, 0.5 + ratio * 0.25 + 0.3));
  }
  return `linear-gradient(to right, ${startColor}, ${endColor})`;
}

function updateMemoryBar(memoryUsage, bgColor, elements) {
  const { memoryBar, memoryBarContainer } = elements;
  if (!memoryBar || !memoryBarContainer) return;

  if (!memoryUsage || memoryUsage <= 0) {
    memoryBarContainer.style.display = 'none';
    return;
  }

  memoryBarContainer.style.display = 'block';
  const isDarkBg = DARK_BG_COLORS.includes(bgColor);
  memoryBarContainer.style.borderColor = isDarkBg ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  memoryBarContainer.style.background = isDarkBg ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)';

  const clamped = Math.min(100, Math.max(0, memoryUsage));
  memoryBar.style.width = clamped + '%';
  memoryBar.style.background = getMemoryGradient(clamped);
}

// =============================================================================
// ANIMATION HELPERS
// =============================================================================

function getFloatOffset(animFrame) {
  const angle = (animFrame % CONSTANTS.FLOAT_CYCLE_FRAMES) * (2 * Math.PI / CONSTANTS.FLOAT_CYCLE_FRAMES);
  return { x: Math.cos(angle) * CONSTANTS.FLOAT_AMPLITUDE_X, y: Math.sin(angle) * CONSTANTS.FLOAT_AMPLITUDE_Y };
}

function needsAnimationRedraw(state, blinkFrame) {
  if (['start', 'thinking', 'planning', 'working', 'packing', 'sleep'].includes(state)) return true;
  if (state === 'idle') return blinkFrame === CONSTANTS.BLINK_START_FRAME || blinkFrame === CONSTANTS.BLINK_END_FRAME;
  return false;
}

// =============================================================================
// ICON DRAWING FUNCTIONS
// =============================================================================

function drawFolderIcon(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 3, 1);
  ctx.fillRect(0, 1, 8, 6);
  ctx.fillStyle = '#000000';
  ctx.fillRect(1, 2, 6, 1);
}

function drawToolIcon(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(1, 0, 6, 3);
  ctx.fillStyle = '#000000';
  ctx.fillRect(3, 0, 2, 1);
  ctx.fillStyle = color;
  ctx.fillRect(3, 3, 2, 5);
}

function drawRobotIcon(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(3, 0, 2, 1);
  ctx.fillRect(1, 1, 6, 5);
  ctx.fillStyle = '#000000';
  ctx.fillRect(2, 2, 1, 2);
  ctx.fillRect(5, 2, 1, 2);
  ctx.fillRect(2, 5, 4, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 2, 1, 2);
  ctx.fillRect(7, 2, 1, 2);
}

function drawBrainIcon(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(1, 0, 6, 7);
  ctx.fillRect(0, 1, 8, 5);
  ctx.fillStyle = '#000000';
  ctx.fillRect(4, 1, 1, 5);
  ctx.fillRect(2, 0, 1, 1);
  ctx.fillRect(5, 0, 1, 1);
}

const ICON_DRAW_FUNCS = [drawFolderIcon, drawToolIcon, drawRobotIcon, drawBrainIcon];

// =============================================================================
// CHARACTER AND EFFECTS RENDERING
// =============================================================================

const COLOR_EFFECT_ALT = '#FFA500';
const COLOR_SUNGLASSES_FRAME = '#111111';
const COLOR_SUNGLASSES_LENS = '#001100';
const COLOR_SUNGLASSES_SHINE = '#003300';

function getEyeCoverPosition(char) {
  const isKiro = char.name === 'kiro';
  const eyeW = char.eyes.w || char.eyes.size || 6;
  const eyeH = char.eyes.h || char.eyes.size || 6;
  const lensW = eyeW + 4;
  const lensH = eyeH + 2;
  const lensY = char.eyes.left.y - 1 - (isKiro ? 2 : 0);
  const leftLensX = char.eyes.left.x - 2 + (isKiro ? 2 : 0);
  const rightLensX = char.eyes.right.x - 2 + (isKiro ? 5 : 0);
  return { lensW, lensH, lensY, leftLensX, rightLensX };
}

function drawSunglasses(char, drawRect) {
  const { lensW, lensH, lensY, leftLensX, rightLensX } = getEyeCoverPosition(char);

  // Lenses
  drawRect(leftLensX, lensY, lensW, lensH, COLOR_SUNGLASSES_LENS);
  drawRect(leftLensX + 1, lensY + 1, 2, 1, COLOR_SUNGLASSES_SHINE);
  drawRect(rightLensX, lensY, lensW, lensH, COLOR_SUNGLASSES_LENS);
  drawRect(rightLensX + 1, lensY + 1, 2, 1, COLOR_SUNGLASSES_SHINE);

  // Frame
  drawRect(leftLensX - 1, lensY - 1, lensW + 2, 1, COLOR_SUNGLASSES_FRAME);
  drawRect(rightLensX - 1, lensY - 1, lensW + 2, 1, COLOR_SUNGLASSES_FRAME);
  drawRect(leftLensX - 1, lensY + lensH, lensW + 2, 1, COLOR_SUNGLASSES_FRAME);
  drawRect(rightLensX - 1, lensY + lensH, lensW + 2, 1, COLOR_SUNGLASSES_FRAME);
  drawRect(leftLensX - 1, lensY, 1, lensH, COLOR_SUNGLASSES_FRAME);
  drawRect(leftLensX + lensW, lensY, 1, lensH, COLOR_SUNGLASSES_FRAME);
  drawRect(rightLensX - 1, lensY, 1, lensH, COLOR_SUNGLASSES_FRAME);
  drawRect(rightLensX + lensW, lensY, 1, lensH, COLOR_SUNGLASSES_FRAME);

  // Bridge
  const bridgeY = lensY + Math.floor(lensH / 2);
  drawRect(leftLensX + lensW, bridgeY, rightLensX - leftLensX - lensW, 1, COLOR_SUNGLASSES_FRAME);
}

function drawBlinkEyes(char, drawRect) {
  const { lensW, lensH, lensY, leftLensX, rightLensX } = getEyeCoverPosition(char);

  drawRect(leftLensX, lensY, lensW, lensH, char.color);
  drawRect(rightLensX, lensY, lensW, lensH, char.color);

  const closedEyeY = lensY + Math.floor(lensH / 2);
  drawRect(leftLensX + 1, closedEyeY, lensW - 2, 2, CONSTANTS.COLOR_EYE);
  drawRect(rightLensX + 1, closedEyeY, lensW - 2, 2, CONSTANTS.COLOR_EYE);
}

function drawHappyEyes(char, drawRect) {
  const { lensW, lensH, lensY, leftLensX, rightLensX } = getEyeCoverPosition(char);

  drawRect(leftLensX, lensY, lensW, lensH, char.color);
  drawRect(rightLensX, lensY, lensW, lensH, char.color);

  const centerY = lensY + Math.floor(lensH / 2);
  const leftCX = leftLensX + Math.floor(lensW / 2);
  const rightCX = rightLensX + Math.floor(lensW / 2);

  // Left eye ^
  drawRect(leftCX - 2, centerY - 2, 2, 2, CONSTANTS.COLOR_EYE);
  drawRect(leftCX, centerY, 2, 2, CONSTANTS.COLOR_EYE);
  drawRect(leftCX - 2, centerY + 2, 2, 2, CONSTANTS.COLOR_EYE);

  // Right eye ^
  drawRect(rightCX + 1, centerY - 2, 2, 2, CONSTANTS.COLOR_EYE);
  drawRect(rightCX - 1, centerY, 2, 2, CONSTANTS.COLOR_EYE);
  drawRect(rightCX + 1, centerY + 2, 2, 2, CONSTANTS.COLOR_EYE);
}

function drawEyeType(eyeType, char, drawRect) {
  if (eyeType === 'focused') drawSunglasses(char, drawRect);
  else if (eyeType === 'blink') drawBlinkEyes(char, drawRect);
  else if (eyeType === 'happy') drawHappyEyes(char, drawRect);
}

function drawEffect(effect, char, animFrame, drawRect) {
  const { x: effectX, y: effectY } = char.effect;
  const effectColor = char.color === CONSTANTS.COLOR_WHITE ? COLOR_EFFECT_ALT : CONSTANTS.COLOR_WHITE;

  if (effect === 'sparkle') {
    const frame = animFrame % 4;
    drawRect(effectX + 2, effectY + 2, 2, 2, effectColor);
    if (frame === 0 || frame === 2) {
      drawRect(effectX + 2, effectY, 2, 2, effectColor);
      drawRect(effectX + 2, effectY + 4, 2, 2, effectColor);
      drawRect(effectX, effectY + 2, 2, 2, effectColor);
      drawRect(effectX + 4, effectY + 2, 2, 2, effectColor);
    } else {
      drawRect(effectX, effectY, 2, 2, effectColor);
      drawRect(effectX + 4, effectY, 2, 2, effectColor);
      drawRect(effectX, effectY + 4, 2, 2, effectColor);
      drawRect(effectX + 4, effectY + 4, 2, 2, effectColor);
    }
  } else if (effect === 'thinking') {
    drawRect(effectX, effectY + 6, 2, 2, effectColor);
    drawRect(effectX + 2, effectY + 3, 2, 2, effectColor);
    if ((animFrame % 12) < 6) {
      drawRect(effectX + 3, effectY - 2, 6, 2, effectColor);
      drawRect(effectX + 2, effectY, 8, 3, effectColor);
      drawRect(effectX + 3, effectY + 3, 6, 1, effectColor);
    } else {
      drawRect(effectX + 4, effectY - 1, 4, 2, effectColor);
      drawRect(effectX + 3, effectY + 1, 6, 2, effectColor);
    }
  } else if (effect === 'alert') {
    const color = '#000000';
    drawRect(effectX + 1, effectY, 4, 2, color);
    drawRect(effectX + 4, effectY + 2, 2, 2, color);
    drawRect(effectX + 2, effectY + 4, 2, 2, color);
    drawRect(effectX + 2, effectY + 6, 2, 2, color);
    drawRect(effectX + 2, effectY + 10, 2, 2, color);
  } else if (effect === 'zzz') {
    if ((animFrame % 20) < 10) {
      drawRect(effectX, effectY, 6, 1, effectColor);
      drawRect(effectX + 4, effectY + 1, 2, 1, effectColor);
      drawRect(effectX + 3, effectY + 2, 2, 1, effectColor);
      drawRect(effectX + 2, effectY + 3, 2, 1, effectColor);
      drawRect(effectX + 1, effectY + 4, 2, 1, effectColor);
      drawRect(effectX, effectY + 5, 6, 1, effectColor);
    }
  }
}

// =============================================================================
// CHARACTER RENDERER CLASS
// =============================================================================

class CharacterRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.characterImages = {};
    this.imagesLoaded = false;
    this.boundDrawRect = this.drawRect.bind(this);
  }

  async preloadImages(imageUrls) {
    if (this.imagesLoaded) return;

    const promises = Object.entries(imageUrls).map(([name, url]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { this.characterImages[name] = img; resolve(); };
        img.onerror = () => { console.warn(`Failed to load: ${url}`); resolve(); };
        img.src = url;
      });
    });

    await Promise.all(promises);
    this.imagesLoaded = true;
  }

  drawRect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * CONSTANTS.SCALE, y * CONSTANTS.SCALE, w * CONSTANTS.SCALE, h * CONSTANTS.SCALE);
  }

  drawCharacter(eyeType, effect, currentState, currentCharacter, animFrame) {
    const state = STATES[currentState] || STATES.idle;
    const char = CHARACTER_CONFIG[currentCharacter] || CHARACTER_CONFIG[CONSTANTS.DEFAULT_CHARACTER];

    // Background
    this.ctx.fillStyle = state.bgColor;
    this.ctx.fillRect(0, 0, CONSTANTS.CHAR_SIZE, CONSTANTS.CHAR_SIZE);

    // Character image
    const img = this.characterImages[currentCharacter];
    if (img) this.ctx.drawImage(img, 0, 0, CONSTANTS.CHAR_SIZE, CONSTANTS.CHAR_SIZE);

    // Eyes and effects
    drawEyeType(eyeType, char, this.boundDrawRect);
    drawEffect(effect, char, animFrame, this.boundDrawRect);
  }
}

// =============================================================================
// HTML TEMPLATE
// =============================================================================

const DISPLAY_HTML = `
<canvas class="vibemon-canvas" width="128" height="128"></canvas>
<div class="vibemon-status-text">Ready</div>
<div class="vibemon-loading-dots">
  <div class="vibemon-dot dim"></div>
  <div class="vibemon-dot dim"></div>
  <div class="vibemon-dot dim"></div>
  <div class="vibemon-dot dim"></div>
</div>
<div class="vibemon-info-text vibemon-project-text">
  <span class="vibemon-info-label"><span class="vibemon-emoji-icon">📂 </span><canvas class="vibemon-pixel-icon vibemon-icon-project" width="8" height="8"></canvas></span>
  <span class="vibemon-info-value vibemon-project-value">-</span>
</div>
<div class="vibemon-info-text vibemon-tool-text">
  <span class="vibemon-info-label"><span class="vibemon-emoji-icon">🛠️ </span><canvas class="vibemon-pixel-icon vibemon-icon-tool" width="8" height="8"></canvas></span>
  <span class="vibemon-info-value vibemon-tool-value">-</span>
</div>
<div class="vibemon-info-text vibemon-model-text">
  <span class="vibemon-info-label"><span class="vibemon-emoji-icon">🤖 </span><canvas class="vibemon-pixel-icon vibemon-icon-model" width="8" height="8"></canvas></span>
  <span class="vibemon-info-value vibemon-model-value">-</span>
</div>
<div class="vibemon-info-text vibemon-memory-text">
  <span class="vibemon-info-label"><span class="vibemon-emoji-icon">🧠 </span><canvas class="vibemon-pixel-icon vibemon-icon-memory" width="8" height="8"></canvas></span>
  <span class="vibemon-info-value vibemon-memory-value">-</span>
</div>
<div class="vibemon-memory-bar-container">
  <div class="vibemon-memory-bar"></div>
</div>
`;

// =============================================================================
// VIBEMON ENGINE CLASS
// =============================================================================

export class VibeMonEngine {
  constructor(container, options = {}) {
    this.container = container;
    this.useEmoji = options.useEmoji || false;
    this.characterImageUrls = options.characterImageUrls || {
      clawd: 'https://static.vibemon.io/characters/clawd.png',
      kiro: 'https://static.vibemon.io/characters/kiro.png',
      claw: 'https://static.vibemon.io/characters/claw.png'
    };

    this.canvas = null;
    this.ctx = null;
    this.dom = {};
    this.iconContexts = [];

    this.currentState = 'start';
    this.currentCharacter = 'clawd';
    this.currentProject = '-';
    this.currentTool = '-';
    this.currentModel = '-';
    this.currentMemory = 0;

    this.animFrame = 0;
    this.blinkFrame = 0;
    this.lastFrameTime = 0;
    this.animationRunning = false;
    this.animationFrameId = null;
    this.characterRenderer = null;

    // Pre-bind animation loop for performance
    this.boundAnimationLoop = this._animationLoop.bind(this);
  }

  _buildDOM() {
    this.container.innerHTML = DISPLAY_HTML;

    const q = (sel) => this.container.querySelector(sel);
    const qa = (sel) => this.container.querySelectorAll(sel);

    this.canvas = q('.vibemon-canvas');
    this.ctx = this.canvas?.getContext('2d');

    const iconProject = q('.vibemon-icon-project');
    const iconTool = q('.vibemon-icon-tool');
    const iconModel = q('.vibemon-icon-model');
    const iconMemory = q('.vibemon-icon-memory');

    // Cache icon contexts for performance
    this.iconContexts = [iconProject, iconTool, iconModel, iconMemory].map(el => el?.getContext('2d'));

    this.dom = {
      display: this.container,
      statusText: q('.vibemon-status-text'),
      loadingDots: q('.vibemon-loading-dots'),
      projectLine: q('.vibemon-project-text'),
      toolLine: q('.vibemon-tool-text'),
      modelLine: q('.vibemon-model-text'),
      memoryLine: q('.vibemon-memory-text'),
      projectValue: q('.vibemon-project-value'),
      toolValue: q('.vibemon-tool-value'),
      modelValue: q('.vibemon-model-value'),
      memoryValue: q('.vibemon-memory-value'),
      memoryBar: q('.vibemon-memory-bar'),
      memoryBarContainer: q('.vibemon-memory-bar-container'),
      infoTexts: qa('.vibemon-info-text'),
      infoLabels: qa('.vibemon-info-label'),
      infoValues: qa('.vibemon-info-value'),
      dots: qa('.vibemon-dot'),
      emojiIcons: qa('.vibemon-emoji-icon'),
      pixelIcons: qa('.vibemon-pixel-icon'),
    };
  }

  async init() {
    injectStyles();

    if (this.container && !this.container.querySelector('.vibemon-canvas')) {
      this._buildDOM();
    }

    if (this.ctx) {
      this.characterRenderer = new CharacterRenderer(this.ctx);
      await this.characterRenderer.preloadImages(this.characterImageUrls);
    }
    return this;
  }

  setState(data) {
    if (!data || typeof data !== 'object') return;

    const prevState = this.currentState;
    if (data.state !== undefined) this.currentState = data.state;
    if (data.character !== undefined) {
      this.currentCharacter = CHARACTER_CONFIG[data.character] ? data.character : CONSTANTS.DEFAULT_CHARACTER;
    }
    if (data.project !== undefined) this.currentProject = data.project || '-';
    if (data.tool !== undefined) this.currentTool = data.tool || '-';
    if (data.model !== undefined) this.currentModel = data.model || '-';
    if (data.memory !== undefined) this.currentMemory = data.memory || 0;

    if (this.currentState === 'idle' && prevState !== 'idle') {
      this.blinkFrame = 0;
    }
  }

  getStateObject() {
    return {
      state: this.currentState,
      character: this.currentCharacter,
      project: this.currentProject,
      tool: this.currentTool,
      model: this.currentModel,
      memory: this.currentMemory
    };
  }

  render() {
    this._renderBackground();
    this._renderStatusText();
    this._renderLoadingDots();
    this._renderInfoLines();
    this._renderMemoryBar();
    this._renderIcons();
    this._renderCharacter();
  }

  _renderBackground() {
    const state = STATES[this.currentState] || STATES.idle;
    if (this.dom.display) this.dom.display.style.background = state.bgColor;
  }

  _renderStatusText() {
    if (!this.dom.statusText) return;
    const state = STATES[this.currentState] || STATES.idle;

    let text = state.text;
    if (this.currentState === 'working') text = getWorkingText(this.currentTool);

    this.dom.statusText.textContent = text;
    this.dom.statusText.style.color = state.textColor;
  }

  _renderLoadingDots() {
    if (!this.dom.loadingDots) return;
    const state = STATES[this.currentState] || STATES.idle;
    this.dom.loadingDots.style.display = state.showLoading ? 'flex' : 'none';
  }

  _updateLoadingDots(slow = false) {
    if (!this.dom.dots) return;
    const frame = slow ? Math.floor(this.animFrame / CONSTANTS.THINKING_ANIMATION_SLOWDOWN) : this.animFrame;
    const activeIndex = frame % CONSTANTS.LOADING_DOT_COUNT;
    this.dom.dots.forEach((dot, i) => dot.classList.toggle('dim', i !== activeIndex));
  }

  _renderInfoLines() {
    const state = STATES[this.currentState] || STATES.idle;

    if (this.dom.toolLine) {
      this.dom.toolLine.style.display = this.currentState === 'working' ? 'block' : 'none';
    }

    const truncate = (str, max, at) => str.length > max ? str.substring(0, at) + '...' : str;

    if (this.dom.projectValue) this.dom.projectValue.textContent = truncate(this.currentProject, CONSTANTS.PROJECT_NAME_MAX_LENGTH, CONSTANTS.PROJECT_NAME_TRUNCATE_AT);
    if (this.dom.toolValue) this.dom.toolValue.textContent = this.currentTool;
    if (this.dom.modelValue) this.dom.modelValue.textContent = truncate(this.currentModel, CONSTANTS.MODEL_NAME_MAX_LENGTH, CONSTANTS.MODEL_NAME_TRUNCATE_AT);
    if (this.dom.memoryValue) this.dom.memoryValue.textContent = this.currentMemory > 0 ? this.currentMemory + '%' : '-';

    const showProject = this.currentProject && this.currentProject !== '-';
    if (this.dom.projectLine) this.dom.projectLine.style.display = showProject ? 'block' : 'none';
    if (this.dom.modelLine) this.dom.modelLine.style.display = this.currentModel && this.currentModel !== '-' ? 'block' : 'none';

    const showMemory = this.currentState !== 'start' && this.currentMemory > 0;
    if (this.dom.memoryLine) this.dom.memoryLine.style.display = showMemory ? 'block' : 'none';

    const textColor = state.textColor;
    this.dom.infoTexts?.forEach(el => el.style.color = textColor);
    this.dom.infoLabels?.forEach(el => el.style.color = textColor);
    this.dom.infoValues?.forEach(el => el.style.color = textColor);
  }

  _renderMemoryBar() {
    const state = STATES[this.currentState] || STATES.idle;
    const showMemory = this.currentState !== 'start' && this.currentMemory > 0;
    updateMemoryBar(showMemory ? this.currentMemory : null, state.bgColor, this.dom);
  }

  _renderIcons() {
    const state = STATES[this.currentState] || STATES.idle;

    this.dom.emojiIcons?.forEach(el => el.style.display = this.useEmoji ? 'inline' : 'none');
    this.dom.pixelIcons?.forEach(el => el.style.display = this.useEmoji ? 'none' : 'inline-block');

    if (!this.useEmoji) {
      const color = state.textColor;
      const bgColor = state.bgColor;

      this.iconContexts.forEach((ctx, i) => {
        if (ctx) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, 8, 8);
          ICON_DRAW_FUNCS[i](ctx, color);
        }
      });
    }
  }

  _renderCharacter() {
    if (!this.characterRenderer) return;
    const state = STATES[this.currentState] || STATES.idle;
    this.characterRenderer.drawCharacter(state.eyeType, state.effect, this.currentState, this.currentCharacter, this.animFrame);
  }

  _updateFloatingPosition() {
    if (!this.canvas) return;
    const offset = getFloatOffset(this.animFrame);
    this.canvas.style.left = (CONSTANTS.CHAR_X_BASE + offset.x) + 'px';
    this.canvas.style.top = (CONSTANTS.CHAR_Y_BASE + offset.y) + 'px';
  }

  _animationLoop(timestamp) {
    if (!this.animationRunning) return;

    if (timestamp - this.lastFrameTime < CONSTANTS.FRAME_INTERVAL) {
      this.animationFrameId = requestAnimationFrame(this.boundAnimationLoop);
      return;
    }

    this.lastFrameTime = timestamp;
    this.animFrame++;
    this._updateFloatingPosition();

    if (this.currentState === 'idle') {
      this.blinkFrame++;
      if (this.blinkFrame > CONSTANTS.BLINK_END_FRAME) this.blinkFrame = 0;
    }

    if (needsAnimationRedraw(this.currentState, this.blinkFrame)) {
      const slow = ['thinking', 'planning', 'packing'].includes(this.currentState);
      if (['thinking', 'planning', 'working', 'packing'].includes(this.currentState)) {
        this._updateLoadingDots(slow);
      }

      const state = STATES[this.currentState];
      if (state && this.characterRenderer) {
        this.characterRenderer.drawCharacter(state.eyeType, state.effect, this.currentState, this.currentCharacter, this.animFrame);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.boundAnimationLoop);
  }

  startAnimation() {
    if (this.animationRunning) return;
    this.animationRunning = true;
    this.animationFrameId = requestAnimationFrame(this.boundAnimationLoop);
  }

  stopAnimation() {
    this.animationRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  cleanup() {
    this.stopAnimation();
  }
}

// =============================================================================
// FACTORY AND EXPORTS
// =============================================================================

export function createVibeMonEngine(container, options = {}) {
  return new VibeMonEngine(container, options);
}

export { STATES as states, CHARACTER_CONFIG, CONSTANTS };
export const CHARACTER_NAMES = Object.keys(CHARACTER_CONFIG);
export const DEFAULT_CHARACTER = CONSTANTS.DEFAULT_CHARACTER;
