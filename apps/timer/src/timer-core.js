// Singleton timer state stored in localStorage so panel and modal stay in sync
const STORAGE_KEY = 'miro-timer-state';

function defaultState() {
  return {
    mode: 'countdown',
    totalSeconds: 300,
    remainingMs: 300000,
    running: false,
    startedAt: null,
    tickSound: true,
    darkTheme: false,
    alarmFiredAt: null,  // prevents double-alarm when panel + modal both open
  };
}

// ── In-memory state cache ────────────────────────────────
// Eliminates JSON.parse on every rAF frame (was 60×/sec while timer runs).
// Native 'storage' events keep the cache in sync when another window
// (e.g. the modal, another tab) writes to localStorage.
let _cache = null;

function _loadCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    _cache = raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch { _cache = defaultState(); }
}

window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) _loadCache();
});

_loadCache();

export function getState() {
  return _cache;
}

export function setState(state) {
  _cache = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // No dispatchEvent: same-window callers (panel buttons) call syncUI() directly.
  // Cross-window callers (modal) are synced via native browser storage events.
}

export function getRemainingMs() {
  const s = _cache;
  if (s.mode === 'stopwatch') {
    if (!s.running) return s.remainingMs;
    return s.remainingMs + (Date.now() - s.startedAt);
  }
  if (!s.running) return s.remainingMs;
  return Math.max(0, s.remainingMs - (Date.now() - s.startedAt));
}

export function start() {
  const s = getState();
  if (s.running) return;
  s.startedAt = Date.now();
  s.running = true;
  setState(s);
}

export function pause() {
  const s = getState();
  if (!s.running) return;
  s.remainingMs = getRemainingMs();
  s.running = false;
  s.startedAt = null;
  setState(s);
}

export function reset() {
  const s = getState();
  if (s.mode === 'stopwatch') {
    s.remainingMs = 0;
  } else {
    s.remainingMs = s.totalSeconds * 1000;
  }
  s.running = false;
  s.startedAt = null;
  setState(s);
}

export function setDuration(seconds) {
  const s = getState();
  s.totalSeconds = seconds;
  s.remainingMs = seconds * 1000;
  s.running = false;
  s.startedAt = null;
  setState(s);
}

export function setMode(mode) {
  const s = getState();
  s.mode = mode;
  if (mode === 'stopwatch') {
    s.remainingMs = 0;
  } else if (mode === 'clock') {
    // clock just displays wall time — no timer state needed
  } else {
    s.remainingMs = s.totalSeconds * 1000;
  }
  s.running = false;
  s.startedAt = null;
  s.alarmFiredAt = null;
  setState(s);
}

export function fireAlarm() {
  const s = getState();
  // Only fire if no alarm has been fired in the last 5s (prevents double-alarm)
  if (s.alarmFiredAt && Date.now() - s.alarmFiredAt < 5000) return false;
  s.alarmFiredAt = Date.now();
  setState(s);
  return true;
}

export function setTickSound(enabled) {
  const s = getState();
  s.tickSound = enabled;
  setState(s);
}

export function setDarkTheme(enabled) {
  const s = getState();
  s.darkTheme = enabled;
  setState(s);
}
