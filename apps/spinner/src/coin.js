import { getState, setState } from './spinner-core.js';

// ── DOM refs ─────────────────────────────────────────────
const coin = document.getElementById('coin');
const btnFlip = document.getElementById('btn-flip');
const coinResult = document.getElementById('coin-result');
const resultText = document.getElementById('result-text');
const headsEl = coin.querySelector('.coin-heads');
const tailsEl = coin.querySelector('.coin-tails');

// ── Color map (color → darker shade) ────────────────────
const COLOR_DARKS = {
  '#f59e0b': '#d97706',
  '#94a3b8': '#64748b',
  '#ef4444': '#dc2626',
  '#3b82f6': '#2563eb',
  '#10b981': '#059669',
  '#8b5cf6': '#7c3aed',
};

// ── Audio ────────────────────────────────────────────────
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx || audioCtx.state === 'closed') audioCtx = new AudioContext();
  return audioCtx;
}

function playFlipSound() {
  if (!getState().coinSound) return;
  try {
    const ctx = getAudioCtx();
    // Metallic "ting" sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 1200;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);

    // Harmonic overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.value = 2400;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.08, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start();
    osc2.stop(ctx.currentTime + 0.2);
  } catch (_) {}
}

function playLandSound() {
  if (!getState().coinSound) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 600;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (_) {}
}

// ── Apply color ──────────────────────────────────────────
function applyColor() {
  const color = getState().coinColor || '#f59e0b';
  const dark = COLOR_DARKS[color] || color;
  document.documentElement.style.setProperty('--coin-color', color);
  document.documentElement.style.setProperty('--coin-color-dark', dark);
  headsEl.style.background = `linear-gradient(145deg, ${color}, ${dark})`;
  tailsEl.style.background = `linear-gradient(145deg, ${dark}, ${color})`;
}

// ── State ────────────────────────────────────────────────
let flipping = false;

// ── Flip animation ───────────────────────────────────────
function flip() {
  if (flipping) return;
  flipping = true;

  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  coinResult.classList.add('hidden');

  const isHeads = Math.random() < 0.5;

  // Spin: multiple full rotations + land on correct face
  // Heads = 0deg, Tails = 180deg (shows the backface)
  const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
  const targetY = fullSpins * 360 + (isHeads ? 0 : 180);

  // Also add a slight X tilt for 3D effect
  const tiltX = 10 + Math.random() * 20;

  const duration = 1600;
  const startTime = performance.now();

  // Get current rotation or start from 0
  const startY = 0;

  coin.classList.add('flipping');
  coin.classList.remove('landing');

  playFlipSound();

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);

    // Ease-out cubic
    const ease = 1 - Math.pow(1 - t, 3);

    const currentY = startY + targetY * ease;
    const currentTiltX = tiltX * Math.sin(t * Math.PI); // Tilt peaks in middle

    coin.style.transform = `rotateX(${currentTiltX}deg) rotateY(${currentY}deg)`;

    // Play tick sounds during the spin
    if (t > 0.1 && t < 0.6 && Math.random() < 0.08) {
      playFlipSound();
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      // Land
      coin.classList.remove('flipping');
      coin.classList.add('landing');
      coin.style.transform = `rotateX(0deg) rotateY(${isHeads ? 0 : 180}deg)`;

      resultText.textContent = isHeads ? 'Heads!' : 'Tails!';
      coinResult.classList.remove('hidden');

      playLandSound();
      flipping = false;
    }
  }

  requestAnimationFrame(animate);
}

// ── Events ───────────────────────────────────────────────
btnFlip.addEventListener('click', flip);

// ── Init ─────────────────────────────────────────────────
applyColor();
