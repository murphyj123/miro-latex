// ── Exam Mode ───────────────────────────────────────────
const EXAM_KEY = 'miro-exam-state';

// ── DOM refs: Setup ─────────────────────────────────────
const setupScreen = document.getElementById('setup-screen');
const displayScreen = document.getElementById('display-screen');
const examNameInput = document.getElementById('exam-name');
const durationHours = document.getElementById('duration-hours');
const durationMinutes = document.getElementById('duration-minutes');
const readingTimeSelect = document.getElementById('reading-time');
const extra25Cb = document.getElementById('extra-25');
const extra50Cb = document.getElementById('extra-50');
const startModeRadios = document.querySelectorAll('input[name="start-mode"]');
const scheduledTimeInput = document.getElementById('scheduled-time');
const btnStartExam = document.getElementById('btn-start-exam');

// ── DOM refs: Display ───────────────────────────────────
const examNameDisplay = document.getElementById('exam-name-display');
const examDate = document.getElementById('exam-date');
const currentTimeEl = document.getElementById('current-time');
const phaseBadge = document.getElementById('phase-badge');
const timeRemainingEl = document.getElementById('time-remaining');
const timeElapsedEl = document.getElementById('time-elapsed');
const progressBar = document.getElementById('progress-bar');
const endTimesBody = document.getElementById('end-times-body');
const btnPause = document.getElementById('btn-pause');
const btnEnd = document.getElementById('btn-end');

// ── Audio ───────────────────────────────────────────────
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function beep(freq = 800, duration = 200) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (_e) { /* audio not available */ }
}

function multiBeep(freqs, duration = 200, gap = 250) {
  freqs.forEach((f, i) => {
    setTimeout(() => beep(f, duration), i * (duration + gap));
  });
}

function sustainedTone(freq, duration) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + duration / 1000 - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (_e) { /* audio not available */ }
}

// ── State management ────────────────────────────────────
function getState() {
  const raw = localStorage.getItem(EXAM_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

function setState(state) {
  localStorage.setItem(EXAM_KEY, JSON.stringify(state));
}

function clearState() {
  localStorage.removeItem(EXAM_KEY);
}

// ── Time calculations ───────────────────────────────────
function calcEndTimes(state) {
  const readingEnd = state.startTime + state.readingMin * 60000;
  const writingEnd = readingEnd + state.durationMin * 60000;
  const extra25End = readingEnd + state.durationMin * 60000 * 1.25;
  const extra50End = readingEnd + state.durationMin * 60000 * 1.5;
  return { readingEnd, writingEnd, extra25End, extra50End };
}

function getEffectiveNow(state) {
  if (state.paused) return state.pausedAt;
  return Date.now() - state.totalPausedMs;
}

function getCurrentPhase(state) {
  const now = getEffectiveNow(state);
  const ends = calcEndTimes(state);

  if (state.phase === 'ended') return 'ended';
  if (now < ends.readingEnd && state.readingMin > 0) return 'reading';
  if (now < ends.writingEnd) return 'writing';
  if (state.extra25 && now < ends.extra25End) return 'extra25';
  if (state.extra50 && now < ends.extra50End) return 'extra50';
  return 'ended';
}

function getPhaseRemaining(state) {
  const now = getEffectiveNow(state);
  const ends = calcEndTimes(state);
  const phase = getCurrentPhase(state);

  switch (phase) {
    case 'reading': return ends.readingEnd - now;
    case 'writing': return ends.writingEnd - now;
    case 'extra25': return ends.extra25End - now;
    case 'extra50': return ends.extra50End - now;
    default: return 0;
  }
}

function getPhaseStart(state) {
  const ends = calcEndTimes(state);
  const phase = getCurrentPhase(state);

  switch (phase) {
    case 'reading': return state.startTime;
    case 'writing': return ends.readingEnd;
    case 'extra25': return ends.writingEnd;
    case 'extra50': return ends.extra25End;
    default: return 0;
  }
}

function getPhaseDuration(state) {
  const ends = calcEndTimes(state);
  const phase = getCurrentPhase(state);

  switch (phase) {
    case 'reading': return state.readingMin * 60000;
    case 'writing': return state.durationMin * 60000;
    case 'extra25': return ends.extra25End - ends.writingEnd;
    case 'extra50': return state.extra25 ? ends.extra50End - ends.extra25End : ends.extra50End - ends.writingEnd;
    default: return 1;
  }
}

function getTotalElapsed(state) {
  const now = getEffectiveNow(state);
  return Math.max(0, now - state.startTime);
}

// ── Formatting ──────────────────────────────────────────
function fmtHMS(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtClock(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtClockShort(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Phase colours & labels ──────────────────────────────
function getPhaseColor(phase, remainingMs) {
  switch (phase) {
    case 'reading': return 'var(--color-blue)';
    case 'extra25':
    case 'extra50': return 'var(--color-purple)';
    case 'writing': {
      const minLeft = remainingMs / 60000;
      if (minLeft > 30) return 'var(--color-green)';
      if (minLeft > 15) return 'var(--color-amber)';
      return 'var(--color-red)';
    }
    default: return 'var(--color-red)';
  }
}

function getPhaseLabel(phase) {
  switch (phase) {
    case 'reading': return 'Reading Time';
    case 'writing': return 'Writing Time';
    case 'extra25': return 'Extra Time (25%)';
    case 'extra50': return 'Extra Time (50%)';
    case 'ended': return 'Exam Ended';
    default: return '';
  }
}

// ── Sound cues ──────────────────────────────────────────
let soundsPlayed = {};

function checkSoundCues(state) {
  const phase = getCurrentPhase(state);
  const remaining = getPhaseRemaining(state);
  const secLeft = Math.ceil(remaining / 1000);

  // Reading time end
  if (phase === 'writing' && !soundsPlayed.readingEnd) {
    soundsPlayed.readingEnd = true;
    if (state.readingMin > 0) {
      multiBeep([600, 800, 1000], 200, 50);
    }
  }

  // 5 minute warning during writing
  if (phase === 'writing' && secLeft <= 300 && secLeft > 298 && !soundsPlayed.fiveMin) {
    soundsPlayed.fiveMin = true;
    multiBeep([600, 600], 150, 100);
  }

  // Standard writing time end
  if (phase !== 'writing' && phase !== 'reading' && !soundsPlayed.writingEnd) {
    soundsPlayed.writingEnd = true;
    multiBeep([800, 800, 800], 200, 50);
    setTimeout(() => sustainedTone(600, 1000), 800);
  }

  // 25% extra end
  if (state.extra25 && (phase === 'extra50' || (phase === 'ended' && !state.extra50)) && !soundsPlayed.extra25End) {
    soundsPlayed.extra25End = true;
    multiBeep([700, 700], 200, 100);
  }

  // 50% extra end
  if (state.extra50 && phase === 'ended' && !soundsPlayed.extra50End) {
    soundsPlayed.extra50End = true;
    sustainedTone(500, 2000);
  }
}

// ── Display update ──────────────────────────────────────
let lastPhase = null;

function updateDisplay() {
  const state = getState();
  if (!state || state.phase === 'setup') return;

  const now = new Date();
  currentTimeEl.textContent = fmtClock(now);
  examDate.textContent = fmtDate(now);

  const phase = getCurrentPhase(state);
  const remaining = getPhaseRemaining(state);
  const elapsed = getTotalElapsed(state);
  const color = getPhaseColor(phase, remaining);

  // Phase badge
  phaseBadge.textContent = getPhaseLabel(phase);
  document.documentElement.style.setProperty('--color-phase', color);

  // Time remaining
  timeRemainingEl.textContent = fmtHMS(remaining);

  // Time elapsed
  timeElapsedEl.textContent = fmtHMS(elapsed);

  // Progress bar
  const phaseDur = getPhaseDuration(state);
  const phaseElapsed = phaseDur - remaining;
  const progress = phaseDur > 0 ? Math.min(1, Math.max(0, phaseElapsed / phaseDur)) : 0;
  progressBar.style.width = `${(progress * 100).toFixed(1)}%`;

  // Pause button
  btnPause.textContent = state.paused ? 'Resume' : 'Pause';

  // Phase flash
  if (lastPhase && lastPhase !== phase) {
    document.body.classList.add('phase-flash');
    setTimeout(() => document.body.classList.remove('phase-flash'), 600);
  }

  // Sound cues
  if (!state.paused) {
    checkSoundCues(state);
  }

  // Auto-update phase in state
  if (phase === 'ended' && state.phase !== 'ended') {
    state.phase = 'ended';
    setState(state);
  }

  lastPhase = phase;

  // Build end times table
  buildEndTimesTable(state, phase);
}

function buildEndTimesTable(state, currentPhase) {
  const ends = calcEndTimes(state);
  const pauseOffset = state.paused ? Date.now() - state.pausedAt + state.totalPausedMs : state.totalPausedMs;

  let rows = '';

  if (state.readingMin > 0) {
    const active = currentPhase === 'reading' ? ' class="active-row"' : '';
    rows += `<tr${active}><td>Reading ends</td><td>${fmtClockShort(ends.readingEnd + pauseOffset)}</td></tr>`;
  }

  const activeWriting = currentPhase === 'writing' ? ' class="active-row"' : '';
  rows += `<tr${activeWriting}><td>Standard end</td><td>${fmtClockShort(ends.writingEnd + pauseOffset)}</td></tr>`;

  if (state.extra25) {
    const active = currentPhase === 'extra25' ? ' class="active-row"' : '';
    rows += `<tr${active}><td>25% extra end</td><td>${fmtClockShort(ends.extra25End + pauseOffset)}</td></tr>`;
  }

  if (state.extra50) {
    const active = currentPhase === 'extra50' ? ' class="active-row"' : '';
    rows += `<tr${active}><td>50% extra end</td><td>${fmtClockShort(ends.extra50End + pauseOffset)}</td></tr>`;
  }

  endTimesBody.innerHTML = rows;
}

// ── Tick loop ───────────────────────────────────────────
function tick() {
  updateDisplay();
  requestAnimationFrame(tick);
}

// ── Setup handlers ──────────────────────────────────────
startModeRadios.forEach(r => {
  r.addEventListener('change', () => {
    scheduledTimeInput.disabled = r.value === 'now' && r.checked;
  });
});

// Set default scheduled time to current time + 5 min
const defaultTime = new Date(Date.now() + 5 * 60000);
scheduledTimeInput.value = `${String(defaultTime.getHours()).padStart(2, '0')}:${String(defaultTime.getMinutes()).padStart(2, '0')}`;

btnStartExam.addEventListener('click', () => {
  // Resume audio context on user gesture
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  // Force create audio context on first interaction
  if (!audioCtx) getAudioCtx();

  const name = examNameInput.value.trim() || 'Exam';
  const hours = parseInt(durationHours.value) || 0;
  const minutes = parseInt(durationMinutes.value) || 0;
  const durationMin = hours * 60 + minutes;
  const readingMin = parseInt(readingTimeSelect.value) || 0;
  const extra25 = extra25Cb.checked;
  const extra50 = extra50Cb.checked;

  if (durationMin <= 0) {
    durationHours.focus();
    return;
  }

  let startTime;
  const selectedMode = document.querySelector('input[name="start-mode"]:checked').value;
  if (selectedMode === 'now') {
    startTime = Date.now();
  } else {
    const [h, m] = scheduledTimeInput.value.split(':').map(Number);
    const scheduled = new Date();
    scheduled.setHours(h, m, 0, 0);
    if (scheduled.getTime() <= Date.now()) {
      // If time is in the past, assume tomorrow
      scheduled.setDate(scheduled.getDate() + 1);
    }
    startTime = scheduled.getTime();
  }

  const state = {
    name,
    durationMin,
    readingMin,
    extra25,
    extra50,
    startTime,
    phase: 'running',
    paused: false,
    pausedAt: null,
    totalPausedMs: 0,
  };

  setState(state);
  soundsPlayed = {};
  lastPhase = null;
  showDisplay(state);
});

// ── Pause / Resume ──────────────────────────────────────
btnPause.addEventListener('click', () => {
  const state = getState();
  if (!state) return;

  if (state.paused) {
    // Resume: add paused duration
    const pausedDuration = Date.now() - state.pausedAt;
    state.totalPausedMs += pausedDuration;
    state.paused = false;
    state.pausedAt = null;
  } else {
    state.paused = true;
    state.pausedAt = Date.now();
  }
  setState(state);
});

// ── End Exam ────────────────────────────────────────────
btnEnd.addEventListener('click', () => {
  if (!confirm('End this exam? This cannot be undone.')) return;
  const state = getState();
  if (state) {
    state.phase = 'ended';
    setState(state);
  }
});

// ── Show/hide screens ───────────────────────────────────
function showSetup() {
  setupScreen.style.display = '';
  displayScreen.style.display = 'none';
}

function showDisplay(state) {
  setupScreen.style.display = 'none';
  displayScreen.style.display = '';
  examNameDisplay.textContent = state.name;
  examDate.textContent = fmtDate(new Date());
}

// ── Init ────────────────────────────────────────────────
const existing = getState();
if (existing && existing.phase !== 'setup' && existing.phase !== 'ended') {
  showDisplay(existing);
} else {
  clearState();
  showSetup();
}

tick();
