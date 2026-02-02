import { createVibeMonEngine } from './shared/vibemon-engine-standalone.js';

// VibeMon engine instance
let vibeMonEngine = null;

// IPC cleanup function
let cleanupStateListener = null;

// Initialize
async function init() {
  const container = document.getElementById('vibemon-display');

  // Get platform info for emoji detection
  let useEmoji = false;
  if (window.electronAPI?.getPlatform) {
    const platform = window.electronAPI.getPlatform();
    useEmoji = platform === 'darwin';
  }

  // Create and initialize VibeMon engine with local character images
  vibeMonEngine = createVibeMonEngine(container, {
    useEmoji,
    characterImageUrls: {
      clawd: './assets/characters/clawd-128.png',
      kiro: './assets/characters/kiro-128.png',
      claw: './assets/characters/claw-128.png'
    }
  });
  await vibeMonEngine.init();

  // Initial render and start animation
  vibeMonEngine.render();
  vibeMonEngine.startAnimation();

  // Listen for state updates from main process
  if (window.electronAPI) {
    cleanupStateListener = window.electronAPI.onStateUpdate((data) => {
      // Validate incoming data
      if (!data || typeof data !== 'object') return;

      // Update state in VibeMon engine
      vibeMonEngine.setState(data);
      vibeMonEngine.render();
    });
  }

  // Right-click context menu (works on all platforms)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (window.electronAPI?.showContextMenu) {
      window.electronAPI.showContextMenu();
    }
  });

  // Click to focus terminal (iTerm2/Ghostty on macOS)
  document.addEventListener('click', (e) => {
    // Ignore right-click
    if (e.button !== 0) return;
    if (window.electronAPI?.focusTerminal) {
      window.electronAPI.focusTerminal();
    }
  });
}

// Cleanup on unload
function cleanup() {
  if (vibeMonEngine) {
    vibeMonEngine.cleanup();
    vibeMonEngine = null;
  }
  if (cleanupStateListener) {
    cleanupStateListener();
    cleanupStateListener = null;
  }
}

// Initialize on load
window.onload = init;
window.onbeforeunload = cleanup;
window.onunload = cleanup;
