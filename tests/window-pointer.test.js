jest.mock('electron', () => ({ screen: { getCursorScreenPoint: jest.fn() } }));
const { EventEmitter } = require('node:events');
const { screen } = require('electron');
const { trackWindowPointer } = require('../src/modules/window-pointer.cjs');
const { WINDOW_POINTER_POLL_MS } = require('../src/shared/config.cjs');

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('DIP cursor positions map to content coordinates without applying display scale again', () => {
  const window = new EventEmitter();
  Object.assign(window, {
    isDestroyed: () => false, isVisible: () => true,
    getContentBounds: () => ({ x: -1000, y: 200, width: 134, height: 138 }),
    webContents: { isDestroyed: () => false, getZoomFactor: () => 1, send: jest.fn() }
  });
  screen.getCursorScreenPoint.mockReturnValue({ x: -950, y: 260 });
  trackWindowPointer(window);
  jest.advanceTimersByTime(WINDOW_POINTER_POLL_MS * 2);
  expect(window.webContents.send).toHaveBeenCalledTimes(2);
  expect(window.webContents.send).toHaveBeenLastCalledWith('window-pointer', { x: 50, y: 60 });
  screen.getCursorScreenPoint.mockReturnValue({ x: 0, y: 0 });
  jest.advanceTimersByTime(WINDOW_POINTER_POLL_MS * 2);
  expect(window.webContents.send).toHaveBeenCalledTimes(3);
  expect(window.webContents.send).toHaveBeenLastCalledWith('window-pointer', null);
  window.emit('closed');
  screen.getCursorScreenPoint.mockReturnValue({ x: -950, y: 260 });
  jest.advanceTimersByTime(WINDOW_POINTER_POLL_MS);
  expect(window.webContents.send).toHaveBeenCalledTimes(3);
});

test('hidden windows are not polled for cursor position', () => {
  const window = new EventEmitter();
  Object.assign(window, { isDestroyed: () => false, isVisible: () => false });
  screen.getCursorScreenPoint.mockClear();
  trackWindowPointer(window);
  jest.advanceTimersByTime(WINDOW_POINTER_POLL_MS);
  expect(screen.getCursorScreenPoint).not.toHaveBeenCalled();
  window.emit('closed');
});
