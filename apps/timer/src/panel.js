import {
  getState, setState, getRemainingMs,
  start, pause, reset, setDuration, setMode,
  setTickSound, setDarkTheme, fireAlarm,
} from './timer-core.js';

// ── DOM refs ─────────────────────────────────────────────
const timeDigits = document.getElementById('time-digits');
const timeLabel = document.getElementById('time-label');
const ringProgress = document.getElementById('ring-progress');
const ringGlow = document.getElementById('ring-glow');
const ringContainer = document.getElementById('ring-container');
const btnStart = document.getElementById('btn-start');
const startLabel = document.getElementById('start-label');
const startIcon = document.getElementById('start-icon');
const btnReset = document.getElementById('btn-reset');
const btnModal = document.getElementById('btn-modal');
const presetsSection = document.getElementById('presets-section');
const presetPills = document.querySelectorAll('.preset-pill:not(.card-dur-pill)');
const modeBtns = document.querySelectorAll('.mode-btn');
const tickSoundCb = document.getElementById('tick-sound');
const darkThemeCb = document.getElementById('dark-theme');
const customMin = document.getElementById('custom-min');
const customSec = document.getElementById('custom-sec');
const btnSet = document.getElementById('btn-set');
const btnPlaceCard = document.getElementById('btn-place-card');
const cardLabel = document.getElementById('card-label');
const cardDurPills = document.querySelectorAll('.card-dur-pill');

// ── Ring geometry ────────────────────────────────────────
const RING_RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
ringProgress.style.strokeDasharray = CIRCUMFERENCE;
ringGlow.style.strokeDasharray = CIRCUMFERENCE;

// ── Audio ────────────────────────────────────────────────
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function beep(frequency = 800, duration = 200) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) { /* audio not available */ }
}

function playAlarm() {
  // Three ascending beeps
  beep(600, 200);
  setTimeout(() => beep(800, 200), 250);
  setTimeout(() => beep(1000, 400), 500);
}

// ── State helpers ────────────────────────────────────────
let lastTickSecond = -1;
let alarmPlayed = false;

function formatTime(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatClock() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
}

function getColor(state, remaining) {
  if (state.mode === 'stopwatch') return 'var(--color-blue)';
  const total = state.totalSeconds * 1000;
  if (total === 0) return 'var(--color-green)';
  const pct = remaining / total;
  if (pct > 0.5) return 'var(--color-green)';
  if (pct > 0.1) return 'var(--color-amber)';
  return 'var(--color-red)';
}

function updateProgressRing(state, remaining) {
  let progress;
  if (state.mode === 'clock') {
    const now = new Date();
    progress = (now.getSeconds() + now.getMilliseconds() / 1000) / 60;
    ringProgress.style.stroke = 'var(--color-blue)';
    ringGlow.style.stroke = 'var(--color-blue)';
    document.documentElement.style.setProperty('--color-active', 'var(--color-blue)');
  } else {
    const total = state.totalSeconds * 1000;
    if (state.mode === 'stopwatch') {
      const cycle = total > 0 ? total : 60000;
      progress = (remaining % cycle) / cycle;
    } else {
      progress = total > 0 ? remaining / total : 0;
    }
    const color = getColor(state, remaining);
    ringProgress.style.stroke = color;
    ringGlow.style.stroke = color;
    document.documentElement.style.setProperty('--color-active', color);
  }
  const offset = CIRCUMFERENCE * (1 - progress);
  ringProgress.style.strokeDashoffset = offset;
  ringGlow.style.strokeDashoffset = offset;
}

function updateDisplay(state, remaining) {
  if (state.mode === 'clock') {
    timeDigits.textContent = formatClock();
    timeLabel.textContent = 'current time';
    btnStart.classList.remove('running');
    startLabel.textContent = 'Start';
    startIcon.setAttribute('points', '4,2 14,8 4,14');
    return;
  }
  timeDigits.textContent = formatTime(remaining);
  timeLabel.textContent = state.mode === 'stopwatch' ? 'elapsed' : 'remaining';

  if (state.running) {
    btnStart.classList.add('running');
    startLabel.textContent = 'Pause';
    startIcon.setAttribute('points', '4,2 4,14 7,14 7,2 9,2 9,14 12,14 12,2');
  } else {
    btnStart.classList.remove('running');
    startLabel.textContent = 'Start';
    startIcon.setAttribute('points', '4,2 14,8 4,14');
  }
}

function syncUI() {
  const state = getState();
  const isClockMode = state.mode === 'clock';

  // Mode
  modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === state.mode));
  presetsSection.style.display = state.mode === 'countdown' ? '' : 'none';

  // Disable start/reset in clock mode
  btnStart.disabled = isClockMode;
  btnStart.style.opacity = isClockMode ? '0.35' : '';
  btnReset.disabled = isClockMode;
  btnReset.style.opacity = isClockMode ? '0.35' : '';

  // Presets
  presetPills.forEach(p => {
    p.classList.toggle('active', parseInt(p.dataset.seconds) === state.totalSeconds && state.mode === 'countdown');
  });

  // Options
  tickSoundCb.checked = state.tickSound !== false;
  darkThemeCb.checked = state.darkTheme === true;
  document.body.classList.toggle('dark', state.darkTheme === true);

  // Custom inputs
  if (!state.running && state.mode === 'countdown') {
    customMin.value = Math.floor(state.totalSeconds / 60);
    customSec.value = state.totalSeconds % 60;
  }
}

// ── Tick loop ────────────────────────────────────────────
function tick() {
  const state = getState();
  const remaining = getRemainingMs();

  updateDisplay(state, remaining);
  updateProgressRing(state, remaining);

  // Countdown-specific logic
  if (state.mode === 'countdown' && state.running) {
    const secLeft = Math.ceil(remaining / 1000);

    // Tick sound in last 10 seconds
    if (state.tickSound && secLeft <= 10 && secLeft > 0 && secLeft !== lastTickSecond) {
      lastTickSecond = secLeft;
      beep(1200, 80);
    }

    // Alarm at zero — fireAlarm() is atomic via localStorage, prevents double-alarm
    if (remaining <= 0 && !alarmPlayed) {
      alarmPlayed = true;
      pause();
      if (fireAlarm()) {
        playAlarm();
        document.body.classList.add('alarm-active');
        setTimeout(() => document.body.classList.remove('alarm-active'), 3000);
      }
    }
  }

  // Reset alarm flag when timer is reset
  if (!state.running && state.mode === 'countdown') {
    const total = state.totalSeconds * 1000;
    if (remaining >= total - 100) {
      alarmPlayed = false;
      lastTickSecond = -1;
    }
  }

  requestAnimationFrame(tick);
}

// ── Event listeners ──────────────────────────────────────
btnStart.addEventListener('click', () => {
  const state = getState();
  if (state.running) {
    pause();
  } else {
    // Resume audio context on user gesture
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    alarmPlayed = false;
    start();
  }
  syncUI();
});

btnReset.addEventListener('click', () => {
  reset();
  alarmPlayed = false;
  lastTickSecond = -1;
  document.body.classList.remove('alarm-active');
  syncUI();
});

presetPills.forEach(pill => {
  pill.addEventListener('click', () => {
    const sec = parseInt(pill.dataset.seconds);
    setDuration(sec);
    alarmPlayed = false;
    lastTickSecond = -1;
    syncUI();
  });
});

btnSet.addEventListener('click', () => {
  const min = parseInt(customMin.value) || 0;
  const sec = parseInt(customSec.value) || 0;
  const total = min * 60 + sec;
  if (total > 0) {
    setDuration(total);
    alarmPlayed = false;
    lastTickSecond = -1;
    syncUI();
  }
});

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setMode(btn.dataset.mode);
    alarmPlayed = false;
    lastTickSecond = -1;
    syncUI();
  });
});

tickSoundCb.addEventListener('change', () => setTickSound(tickSoundCb.checked));
darkThemeCb.addEventListener('change', () => {
  setDarkTheme(darkThemeCb.checked);
  syncUI();
});

btnModal.addEventListener('click', async () => {
  await miro.board.ui.openModal({ url: 'timer/modal.html', width: 600, height: 520 });
});

const btnExam = document.getElementById('btn-exam');
btnExam.addEventListener('click', async () => {
  await miro.board.ui.openModal({ url: 'timer/exam.html', width: 900, height: 650 });
});

// Listen for storage events from modal
window.addEventListener('storage', () => syncUI());

// ── Timer Cards ───────────────────────────────────────────
let cardDurationSeconds = 300;

cardDurPills.forEach(pill => {
  pill.addEventListener('click', () => {
    cardDurPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    cardDurationSeconds = parseInt(pill.dataset.seconds);
  });
});

btnPlaceCard.addEventListener('click', async () => {
  const label = cardLabel.value.trim();
  const mins = Math.round(cardDurationSeconds / 60);
  const title = label || `Timer — ${mins} min`;

  try {
    await miro.board.createAppCard({
      title,
      description: String(cardDurationSeconds),
      fields: [{ value: `${mins} min`, tooltip: 'Click to open timer' }],
      status: 'connected',
    });
    const orig = btnPlaceCard.innerHTML;
    btnPlaceCard.textContent = '✓ Placed!';
    cardLabel.value = '';
    setTimeout(() => { btnPlaceCard.innerHTML = orig; }, 1800);
  } catch (e) {
    console.error('App card creation failed:', e);
  }
});

// ── Init ─────────────────────────────────────────────────

// Load duration from a board card click (set by index.js via localStorage)
const cardPreset = localStorage.getItem('timer-card-load');
if (cardPreset) {
  try {
    const { seconds } = JSON.parse(cardPreset);
    if (seconds > 0) {
      setMode('countdown');
      setDuration(seconds);
    }
  } catch { /* ignore */ }
  localStorage.removeItem('timer-card-load');
}

syncUI();
tick();
