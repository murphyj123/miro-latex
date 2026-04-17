// Singleton spinner state stored in localStorage so panel and modal stay in sync
import { getSafeJSON, setSafeJSON } from '../../shared/storage-utils.js';

const STORAGE_KEY = 'miro-spinner-state';

const PALETTE = [
  '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6',
  '#10b981', '#ec4899', '#f97316', '#06b6d4', '#6366f1',
  '#84cc16', '#e11d48', '#0ea5e9', '#a855f7', '#d946ef',
  '#22d3ee', '#fb923c', '#4ade80', '#f43f5e', '#818cf8',
];

function defaultState() {
  return {
    names: [],
    lastWinner: null,
    removeWinner: false,
    spinSound: true,
  };
}

let _cache = null;

function _loadCache() {
  const saved = getSafeJSON(STORAGE_KEY, null);
  _cache = saved ? { ...defaultState(), ...saved } : defaultState();
}

window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) _loadCache();
});

_loadCache();

export function getState() {
  return _cache;
}

export function setState(patch) {
  _cache = { ..._cache, ...patch };
  setSafeJSON(STORAGE_KEY, _cache);
}

export function setNames(names) {
  setState({ names, lastWinner: null });
}

export function removeNameAtIndex(idx) {
  const names = [..._cache.names];
  names.splice(idx, 1);
  setState({ names });
}

export function getColor(index) {
  return PALETTE[index % PALETTE.length];
}

export { PALETTE };
