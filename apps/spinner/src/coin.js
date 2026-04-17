import { getState, setState } from './spinner-core.js';

// ── DOM refs ─────────────────────────────────────────────
const coinArea = document.getElementById('coin-area');
const btnFlip = document.getElementById('btn-flip');
const coinResult = document.getElementById('coin-result');
const resultText = document.getElementById('result-text');
const colorSwatchesEl = document.getElementById('coin-color-swatches');

const COIN_COLORS = ['#f59e0b', '#94a3b8', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];

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

// ── State helpers ────────────────────────────────────────
let flipping = false;

function getCoinCount() { return getState().coinCount || 1; }
function getCoinColor() { return getState().coinColor || '#f59e0b'; }

// ── Color swatches (in-modal) ────────────────────────────
function renderSwatches() {
  colorSwatchesEl.innerHTML = '';
  const current = getCoinColor();
  COIN_COLORS.forEach((c) => {
    const btn = document.createElement('button');
    btn.className = 'modal-swatch' + (c === current ? ' active' : '');
    btn.style.background = c;
    btn.addEventListener('click', () => {
      setState({ coinColor: c });
      renderSwatches();
      renderCoins();
    });
    colorSwatchesEl.appendChild(btn);
  });
}

// ── Build a single 3D coin ───────────────────────────────
function createCoin(color) {
  const dark = COLOR_DARKS[color] || color;

  const stage = document.createElement('div');
  stage.className = 'coin-stage';

  const coin = document.createElement('div');
  coin.className = 'coin';

  const heads = document.createElement('div');
  heads.className = 'coin-face coin-heads';
  heads.style.background = `linear-gradient(145deg, ${color}, ${dark})`;
  heads.textContent = 'H';

  const tails = document.createElement('div');
  tails.className = 'coin-face coin-tails';
  tails.style.background = `linear-gradient(145deg, ${dark}, ${color})`;
  tails.textContent = 'T';

  coin.append(heads, tails);
  stage.appendChild(coin);
  return stage;
}

// ── Render coins ─────────────────────────────────────────
function renderCoins() {
  const count = getCoinCount();
  const color = getCoinColor();
  coinArea.innerHTML = '';
  // Set size class
  coinArea.className = 'coin-area coins-' + Math.min(count, 6);
  for (let i = 0; i < count; i++) {
    coinArea.appendChild(createCoin(color));
  }
}

// ── Flip animation ───────────────────────────────────────
function flip() {
  if (flipping) return;
  flipping = true;

  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  coinResult.classList.add('hidden');

  const count = getCoinCount();
  const results = Array.from({ length: count }, () => Math.random() < 0.5);

  const stages = coinArea.querySelectorAll('.coin-stage');
  const coins = Array.from(stages).map((s) => s.querySelector('.coin'));

  const duration = 1600;
  const startTime = performance.now();

  coins.forEach((c) => {
    c.classList.add('flipping');
    c.classList.remove('landing');
  });

  playFlipSound();

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);

    coins.forEach((c, i) => {
      const fullSpins = 5 + (i % 3); // Slightly different speeds
      const targetY = fullSpins * 360 + (results[i] ? 0 : 180);
      const tiltX = (12 + i * 5) * Math.sin(t * Math.PI);
      const currentY = targetY * ease;
      c.style.transform = `rotateX(${tiltX}deg) rotateY(${currentY}deg)`;
    });

    if (t > 0.1 && t < 0.6 && Math.random() < 0.06) {
      playFlipSound();
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      coins.forEach((c, i) => {
        c.classList.remove('flipping');
        c.classList.add('landing');
        c.style.transform = `rotateX(0deg) rotateY(${results[i] ? 0 : 180}deg)`;
      });

      const headsCount = results.filter(Boolean).length;
      const tailsCount = count - headsCount;

      if (count === 1) {
        resultText.textContent = results[0] ? 'Heads!' : 'Tails!';
      } else {
        const parts = [];
        if (headsCount) parts.push(`${headsCount} Heads`);
        if (tailsCount) parts.push(`${tailsCount} Tails`);
        resultText.textContent = parts.join(', ');
      }
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
renderSwatches();
renderCoins();
