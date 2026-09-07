const { screen } = require('electron');
const { WINDOW_POINTER_POLL_MS } = require('../shared/config.cjs');

// Native mouse forwarding can stop while a click-through window is unfocused.
// Cursor and content bounds both use DIP, including on mixed-DPI Windows displays.
function trackWindowPointer(window) {
  let wasInside = false;
  const timer = setInterval(() => {
    if (window.isDestroyed() || !window.isVisible() || window.webContents.isDestroyed()) return;
    const cursor = screen.getCursorScreenPoint();
    const bounds = window.getContentBounds();
    const x = cursor.x - bounds.x;
    const y = cursor.y - bounds.y;
    const inside = x >= 0 && y >= 0 && x < bounds.width && y < bounds.height;
    // Repeat while inside so a renderer that just initialized also receives
    // the stationary pointer; send one null on leaving to clear stale hover.
    if (inside || wasInside) {
      const zoom = window.webContents.getZoomFactor();
      window.webContents.send('window-pointer', inside ? { x: x / zoom, y: y / zoom } : null);
    }
    wasInside = inside;
  }, WINDOW_POINTER_POLL_MS);
  timer.unref();
  window.once('closed', () => clearInterval(timer));
}

module.exports = { trackWindowPointer };
