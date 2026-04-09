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

export function getState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  return { ...defaultState(), ...JSON.parse(raw) };
}

export function setState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Broadcast to other contexts (panel <-> modal)
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEY,
    newValue: JSON.stringify(state),
  }));
}

export function getRemainingMs() {
  const s = getState();
  if (s.mode === 'stopwatch') {
    if (!s.running) return s.remainingMs;
    const elapsed = Date.now() - s.startedAt;
    return s.remainingMs + elapsed;
  }
  if (!s.running) return s.remainingMs;
  const elapsed = Date.now() - s.startedAt;
  return Math.max(0, s.remainingMs - elapsed);
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
