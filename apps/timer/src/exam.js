// ── Exam Mode ───────────────────────────────────────────
import { getSafeJSON, setSafeJSON } from '../../shared/storage-utils.js';
import soniaReadingEnd from '../sounds/sonia/reading-end.mp3?url';
import soniaFiveMin from '../sounds/sonia/five-min-warning.mp3?url';
import soniaExtraTime from '../sounds/sonia/extra-time-start.mp3?url';
import soniaExtra25End from '../sounds/sonia/extra25-end.mp3?url';
import soniaExamEnd from '../sounds/sonia/exam-end.mp3?url';

import ryanReadingEnd from '../sounds/ryan/reading-end.mp3?url';
import ryanFiveMin from '../sounds/ryan/five-min-warning.mp3?url';
import ryanExtraTime from '../sounds/ryan/extra-time-start.mp3?url';
import ryanExtra25End from '../sounds/ryan/extra25-end.mp3?url';
import ryanExamEnd from '../sounds/ryan/exam-end.mp3?url';

import libbyReadingEnd from '../sounds/libby/reading-end.mp3?url';
import libbyFiveMin from '../sounds/libby/five-min-warning.mp3?url';
import libbyExtraTime from '../sounds/libby/extra-time-start.mp3?url';
import libbyExtra25End from '../sounds/libby/extra25-end.mp3?url';
import libbyExamEnd from '../sounds/libby/exam-end.mp3?url';

import ariaReadingEnd from '../sounds/aria/reading-end.mp3?url';
import ariaFiveMin from '../sounds/aria/five-min-warning.mp3?url';
import ariaExtraTime from '../sounds/aria/extra-time-start.mp3?url';
import ariaExtra25End from '../sounds/aria/extra25-end.mp3?url';
import ariaExamEnd from '../sounds/aria/exam-end.mp3?url';

const VOICES = {
  sonia: { label: 'Sonia · UK female (soft)', readingEnd: soniaReadingEnd, fiveMin: soniaFiveMin, extraTime: soniaExtraTime, extra25End: soniaExtra25End, examEnd: soniaExamEnd },
  libby: { label: 'Libby · UK female (warm)', readingEnd: libbyReadingEnd, fiveMin: libbyFiveMin, extraTime: libbyExtraTime, extra25End: libbyExtra25End, examEnd: libbyExamEnd },
  ryan:  { label: 'Ryan · UK male (friendly)', readingEnd: ryanReadingEnd, fiveMin: ryanFiveMin, extraTime: ryanExtraTime, extra25End: ryanExtra25End, examEnd: ryanExamEnd },
  aria:  { label: 'Aria · US female (clear)', readingEnd: ariaReadingEnd, fiveMin: ariaFiveMin, extraTime: ariaExtraTime, extra25End: ariaExtra25End, examEnd: ariaExamEnd },
};

const EXAM_KEY = 'miro-exam-state';

// ── Exam Presets ─────────────────────────────────────────
const PRESETS_KEY = 'miro-exam-presets';

function getPresets() {
  return getSafeJSON(PRESETS_KEY, []);
}

function savePresets(presets) {
  setSafeJSON(PRESETS_KEY, presets);
}

function presetLabel(p) {
  const dur = p.durationMin >= 60
    ? `${Math.floor(p.durationMin / 60)}h${p.durationMin % 60 ? ` ${p.durationMin % 60}m` : ''}`
    : `${p.durationMin}m`;
  const parts = [dur];
  if (p.readingMin) parts.push(`R${p.readingMin}m`);
  if (p.extra25) parts.push('+25%');
  if (p.extra50) parts.push('+50%');
  return parts.join(' · ');
}

function renderPresets() {
  const list = document.getElementById('exam-presets-list');
  const presets = getPresets();
  if (!presets.length) {
    list.innerHTML = '<span class="exam-presets-hint">No presets yet — configure an exam and click Save Preset</span>';
    return;
  }
  list.innerHTML = '';
  presets.forEach((p, i) => {
    const pill = document.createElement('div');
    pill.className = 'exam-preset-pill';
    const labelSpan = document.createElement('span');
    labelSpan.textContent = presetLabel(p);
    labelSpan.addEventListener('click', () => loadPreset(p));
    const delBtn = document.createElement('button');
    delBtn.className = 'exam-preset-del';
    delBtn.title = 'Delete preset';
    delBtn.textContent = '×';
    pill.appendChild(labelSpan);
    pill.appendChild(delBtn);
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const updated = getPresets();
      updated.splice(i, 1);
      savePresets(updated);
      renderPresets();
    });
    list.appendChild(pill);
  });
}

function loadPreset(p) {
  durationHours.value = Math.floor(p.durationMin / 60);
  durationMinutes.value = p.durationMin % 60;
  readingTimeSelect.value = String(p.readingMin || 0);
  extra25Cb.checked = !!p.extra25;
  extra50Cb.checked = !!p.extra50;
}

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
const examNotesInput = document.getElementById('exam-notes');
const examVolumeInput = document.getElementById('exam-volume');
const examVolumeValue = document.getElementById('exam-volume-value');
const examVoiceSelect = document.getElementById('exam-voice');
const soundModeRadios = document.querySelectorAll('input[name="sound-mode"]');
const btnPreviewVoice = document.getElementById('btn-preview-voice');
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
const btnLock = document.getElementById('btn-lock');
const lockIconOpen = btnLock.querySelector('.lock-icon-open');
const lockIconClosed = btnLock.querySelector('.lock-icon-closed');
const lockLabel = btnLock.querySelector('.lock-label');
const pauseInfo = document.getElementById('pause-info');
const pauseDurationEl = document.getElementById('pause-duration');
const notesEditor = document.getElementById('notes-editor');
const displayVolumeInput = document.getElementById('display-volume');

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
    const peak = 0.3 * getVolume();
    gain.gain.setValueAtTime(peak, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
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
    const peak = 0.3 * getVolume();
    gain.gain.setValueAtTime(peak, ctx.currentTime);
    gain.gain.setValueAtTime(peak, ctx.currentTime + duration / 1000 - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (_e) { /* audio not available */ }
}

function getVolume() {
  const s = getState();
  return (s && typeof s.volume === 'number') ? s.volume : 0.6;
}

function playVoice(url) {
  try {
    const audio = new Audio(url);
    audio.volume = getVolume();
    audio.play().catch(() => {});
  } catch (_e) { /* audio not available */ }
}

// ── State management ────────────────────────────────────
function getState() {
  return getSafeJSON(EXAM_KEY, null);
}

function setState(state) {
  setSafeJSON(EXAM_KEY, state);
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

function getVoiceSet(state) {
  return VOICES[state.voiceId] || VOICES.sonia;
}

function cueReadingEnd(state) {
  if (state.soundMode === 'tones') multiBeep([600, 800, 1000], 200, 50);
  else playVoice(getVoiceSet(state).readingEnd);
}

function cueFiveMin(state) {
  if (state.soundMode === 'tones') multiBeep([600, 600], 150, 100);
  else playVoice(getVoiceSet(state).fiveMin);
}

function cueExtraTimeStart(state) {
  if (state.soundMode === 'tones') {
    multiBeep([800, 800, 800], 200, 50);
    setTimeout(() => sustainedTone(600, 1000), 800);
  } else {
    playVoice(getVoiceSet(state).extraTime);
  }
}

function cueExtra25End(state) {
  if (state.soundMode === 'tones') multiBeep([700, 700], 200, 100);
  else playVoice(getVoiceSet(state).extra25End);
}

function cueExamEnd(state) {
  if (state.soundMode === 'tones') {
    multiBeep([800, 800, 800], 200, 50);
    setTimeout(() => sustainedTone(500, 1500), 800);
  } else {
    playVoice(getVoiceSet(state).examEnd);
  }
}

function checkSoundCues(state) {
  const phase = getCurrentPhase(state);
  const remaining = getPhaseRemaining(state);
  const secLeft = Math.ceil(remaining / 1000);

  // Reading time end
  if (phase === 'writing' && !soundsPlayed.readingEnd) {
    soundsPlayed.readingEnd = true;
    if (state.readingMin > 0) cueReadingEnd(state);
  }

  // 5 minute warning during writing
  if (phase === 'writing' && secLeft <= 300 && secLeft > 298 && !soundsPlayed.fiveMin) {
    soundsPlayed.fiveMin = true;
    cueFiveMin(state);
  }

  // 5 minute warning during 25% extra time
  if (phase === 'extra25' && secLeft <= 300 && secLeft > 298 && !soundsPlayed.fiveMinExtra25) {
    soundsPlayed.fiveMinExtra25 = true;
    cueFiveMin(state);
  }

  // 5 minute warning during 50% extra time
  if (phase === 'extra50' && secLeft <= 300 && secLeft > 298 && !soundsPlayed.fiveMinExtra50) {
    soundsPlayed.fiveMinExtra50 = true;
    cueFiveMin(state);
  }

  // Leaving writing phase — distinguish "extra time begins" vs "exam over"
  if (phase !== 'writing' && phase !== 'reading' && !soundsPlayed.writingEnd) {
    soundsPlayed.writingEnd = true;
    if (phase === 'extra25' || phase === 'extra50') cueExtraTimeStart(state);
    else cueExamEnd(state);
  }

  // 25% extra end — going to extra50 or final end
  if (state.extra25 && (phase === 'extra50' || (phase === 'ended' && !state.extra50)) && !soundsPlayed.extra25End) {
    soundsPlayed.extra25End = true;
    if (phase === 'extra50') cueExtra25End(state);
    else cueExamEnd(state);
  }

  // 50% extra end — exam over
  if (state.extra50 && phase === 'ended' && !soundsPlayed.extra50End) {
    soundsPlayed.extra50End = true;
    cueExamEnd(state);
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

  // Pause duration indicator
  if (state.paused) {
    pauseInfo.style.display = '';
    pauseDurationEl.textContent = fmtHMS(Date.now() - state.pausedAt);
  } else {
    pauseInfo.style.display = 'none';
  }

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
let rafId = null;

function tick() {
  updateDisplay();
  rafId = requestAnimationFrame(tick);
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
    notes: examNotesInput.value,
    locked: false,
    volume: parseInt(examVolumeInput.value, 10) / 100,
    soundMode: document.querySelector('input[name="sound-mode"]:checked').value,
    voiceId: examVoiceSelect.value,
  };

  setState(state);
  soundsPlayed = {};
  lastPhase = null;
  showDisplay(state);
});

// ── Pause / Resume ──────────────────────────────────────
btnPause.addEventListener('click', () => {
  const state = getState();
  if (!state || state.locked) return;

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
btnEnd.addEventListener('click', async () => {
  const s = getState();
  if (s && s.locked) return;
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  clearState();
  await miro.board.ui.closeModal();
});

// ── Lock toggle ─────────────────────────────────────────
function syncLockUI(locked) {
  btnLock.classList.toggle('locked', locked);
  btnLock.setAttribute('aria-pressed', locked ? 'true' : 'false');
  btnLock.title = locked ? 'Click to unlock controls' : 'Click to lock controls';
  lockIconOpen.style.display = locked ? 'none' : '';
  lockIconClosed.style.display = locked ? '' : 'none';
  lockLabel.textContent = locked ? 'Locked' : 'Unlocked';
  btnPause.disabled = locked;
  btnEnd.disabled = locked;
}

btnLock.addEventListener('click', () => {
  const s = getState();
  if (!s) return;
  s.locked = !s.locked;
  setState(s);
  syncLockUI(s.locked);
});

window.addEventListener('pagehide', () => {
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
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
  notesEditor.value = state.notes || '';
  autosizeNotes();
  syncLockUI(!!state.locked);
  displayVolumeInput.value = Math.round((state.volume ?? 0.6) * 100);
}

// ── Volume sliders ──────────────────────────────────────
examVolumeInput.addEventListener('input', () => {
  examVolumeValue.textContent = `${examVolumeInput.value}%`;
});

displayVolumeInput.addEventListener('input', () => {
  const s = getState();
  if (!s) return;
  s.volume = parseInt(displayVolumeInput.value, 10) / 100;
  setState(s);
});

// ── Sound mode (voice / tones) ──────────────────────────
function syncSoundModeUI() {
  const mode = document.querySelector('input[name="sound-mode"]:checked').value;
  examVoiceSelect.disabled = mode !== 'voice';
  btnPreviewVoice.disabled = mode !== 'voice';
}

soundModeRadios.forEach(r => r.addEventListener('change', syncSoundModeUI));
syncSoundModeUI();

// ── Voice change updates running exam ───────────────────
examVoiceSelect.addEventListener('change', () => {
  const s = getState();
  if (s && s.phase !== 'setup' && s.phase !== 'ended') {
    s.voiceId = examVoiceSelect.value;
    setState(s);
  }
});

// ── Preview voice ───────────────────────────────────────
btnPreviewVoice.addEventListener('click', () => {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  if (!audioCtx) getAudioCtx();
  const voiceId = examVoiceSelect.value;
  const voice = VOICES[voiceId] || VOICES.sonia;
  const audio = new Audio(voice.fiveMin);
  audio.volume = parseInt(examVolumeInput.value, 10) / 100;
  audio.play().catch(() => {});
});

function autosizeNotes() {
  notesEditor.style.height = 'auto';
  notesEditor.style.height = `${notesEditor.scrollHeight}px`;
}

notesEditor.addEventListener('input', () => {
  autosizeNotes();
  const s = getState();
  if (!s) return;
  s.notes = notesEditor.value;
  setState(s);
});

// ── Save Preset ─────────────────────────────────────────
document.getElementById('btn-save-preset').addEventListener('click', () => {
  const hours = parseInt(durationHours.value) || 0;
  const minutes = parseInt(durationMinutes.value) || 0;
  const durationMin = hours * 60 + minutes;
  if (durationMin <= 0) { durationHours.focus(); return; }
  const preset = {
    durationMin,
    readingMin: parseInt(readingTimeSelect.value) || 0,
    extra25: extra25Cb.checked,
    extra50: extra50Cb.checked,
  };
  const presets = getPresets();
  presets.unshift(preset);
  savePresets(presets.slice(0, 8)); // max 8 presets
  renderPresets();
});

// ── Init ────────────────────────────────────────────────
const existing = getState();
if (existing && existing.phase !== 'setup' && existing.phase !== 'ended') {
  showDisplay(existing);
} else {
  clearState();
  showSetup();
}

renderPresets();
tick();
