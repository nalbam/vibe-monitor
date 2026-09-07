const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadPreload() {
  const ipc = Object.assign(new EventEmitter(), { invoke: jest.fn(), send: jest.fn() });
  let api;
  const contextBridge = { exposeInMainWorld: (_name, value) => { api = value; } };
  const console = { error: jest.fn() };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/preload.js'), 'utf8'), {
    require: () => ({ contextBridge, ipcRenderer: ipc }), process: { platform: 'win32' }, console
  });
  return { ipc, api, console };
}

test.each([
  ['state-update', 'onStateUpdate', { state: 'working', character: 'clawd' }],
  ['display-options', 'onDisplayOptions', { characterScale: 50, devMode: true }]
])('%s delivered during image initialization is replayed when the renderer subscribes', (channel, method, latest) => {
  const { ipc, api } = loadPreload();
  ipc.emit(channel, {}, { stale: true });
  ipc.emit(channel, {}, latest);
  const callback = jest.fn();
  const unsubscribe = api[method](callback);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith(latest);
  const next = { ...latest, next: true };
  ipc.emit(channel, {}, next);
  expect(callback).toHaveBeenLastCalledWith(next);
  unsubscribe();
  ipc.emit(channel, {}, { stopped: true });
  expect(callback).toHaveBeenCalledTimes(2);
});

test('one failing subscriber does not prevent other subscribers from receiving state', () => {
  const { api, ipc, console } = loadPreload();
  const unsubscribe = api.onStateUpdate(() => { throw new Error('subscriber failure'); });
  const callback = jest.fn();
  api.onStateUpdate(callback);
  const state = { state: 'working' };
  ipc.emit('state-update', {}, state);
  expect(callback).toHaveBeenCalledWith(state);
  expect(console.error).toHaveBeenCalledTimes(1);
  unsubscribe();
});
