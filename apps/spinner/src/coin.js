import { getState, setState, escapeXml } from './spinner-core.js';

// ── DOM refs ─────────────────────────────────────────────
const coinArea = document.getElementById('coin-area');
const btnFlip = document.getElementById('btn-flip');
const coinResult = document.getElementById('coin-result');
const resultText = document.getElementById('result-text');
const colorSwatchesEl = document.getElementById('coin-color-swatches');
const btnPlace = document.getElementById('btn-place');
const labelSelect = document.getElementById('label-select');

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
let lastResults = null;
let selectedCoin = 0;

function getCoinCount() { return getState().coinCount || 1; }

function getCoinColors() {
  const state = getState();
  const count = getCoinCount();
  const colors = state.coinColors || [];
  const fallback = state.coinColor || '#f59e0b';
  return Array.from({ length: count }, (_, i) => colors[i] || fallback);
}

function setCoinColor(index, color) {
  const colors = getCoinColors();
  colors[index] = color;
  setState({ coinColors: colors });
}

function getLabels() {
  const val = labelSelect.value;
  const parts = val.split('/');
  return { side1: parts[0], side2: parts[1] || parts[0] };
}

// ── Color swatches (in-modal) ────────────────────────────
function renderSwatches() {
  colorSwatchesEl.innerHTML = '';
  const colors = getCoinColors();
  const current = colors[selectedCoin] || '#f59e0b';
  COIN_COLORS.forEach((c) => {
    const btn = document.createElement('button');
    btn.className = 'modal-swatch' + (c === current ? ' active' : '');
    btn.style.background = c;
    btn.addEventListener('click', () => {
      setCoinColor(selectedCoin, c);
      renderSwatches();
      renderCoins();
    });
    colorSwatchesEl.appendChild(btn);
  });
}

// ── Build a single 3D coin ───────────────────────────────
function createCoin(color, labels) {
  const dark = COLOR_DARKS[color] || color;

  const stage = document.createElement('div');
  stage.className = 'coin-stage';

  const coin = document.createElement('div');
  coin.className = 'coin';

  const heads = document.createElement('div');
  heads.className = 'coin-face coin-heads';
  heads.style.background = `linear-gradient(145deg, ${color}, ${dark})`;
  heads.textContent = labels.side1;

  const tails = document.createElement('div');
  tails.className = 'coin-face coin-tails';
  tails.style.background = `linear-gradient(145deg, ${dark}, ${color})`;
  tails.textContent = labels.side2;

  coin.append(heads, tails);
  stage.appendChild(coin);
  return stage;
}

// ── Render coins ─────────────────────────────────────────
function renderCoins() {
  const count = getCoinCount();
  const colors = getCoinColors();
  const labels = getLabels();
  coinArea.innerHTML = '';
  coinArea.className = 'coin-area coins-' + Math.min(count, 6);
  for (let i = 0; i < count; i++) {
    const stage = createCoin(colors[i], labels);
    stage.addEventListener('click', () => {
      if (flipping) return;
      selectedCoin = i;
      highlightSelected();
      renderSwatches();
    });
    coinArea.appendChild(stage);
  }
  highlightSelected();
}

function highlightSelected() {
  const stages = coinArea.querySelectorAll('.coin-stage');
  stages.forEach((s, i) => {
    s.classList.toggle('selected', i === selectedCoin && stages.length > 1);
  });
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
      const fullSpins = 5 + (i % 3);
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

      const labels = getLabels();
      const side1Count = results.filter(Boolean).length;
      const side2Count = count - side1Count;

      if (count === 1) {
        resultText.textContent = results[0] ? `${labels.side1}!` : `${labels.side2}!`;
      } else {
        const parts = [];
        if (side1Count) parts.push(`${side1Count} ${labels.side1}`);
        if (side2Count) parts.push(`${side2Count} ${labels.side2}`);
        resultText.textContent = parts.join(', ');
      }
      coinResult.classList.remove('hidden');

      playLandSound();
      flipping = false;
      lastResults = results;
      btnPlace.classList.remove('hidden');

      // Re-attach click handlers
      stages.forEach((s, i) => {
        s.addEventListener('click', () => {
          if (flipping) return;
          selectedCoin = i;
          highlightSelected();
          renderSwatches();
        });
      });
      highlightSelected();
    }
  }

  requestAnimationFrame(animate);
}

// ── Place on Board ───────────────────────────────────────
btnPlace.addEventListener('click', async () => {
  if (!lastResults) return;

  const colors = getCoinColors();
  const labels = getLabels();
  const count = lastResults.length;
  const coinR = 30, pad = 16, gap = 12;
  const w = pad * 2 + count * coinR * 2 + (count - 1) * gap;
  const h = count > 1 ? 110 : 90;

  let svg = '';
  lastResults.forEach((isSide1, i) => {
    const color = colors[i];
    const dark = COLOR_DARKS[color] || color;
    const cx = pad + coinR + i * (coinR * 2 + gap);
    const cy = pad + coinR;
    const label = isSide1 ? labels.side1 : labels.side2;
    const fontSize = label.length > 3 ? 12 : label.length > 1 ? 16 : 22;
    svg += `<circle cx="${cx}" cy="${cy}" r="${coinR}" fill="${isSide1 ? color : dark}"/>`;
    svg += `<text x="${cx}" y="${cy + 1}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="${fontSize}" font-weight="800" font-family="Inter,sans-serif">${escapeXml(label)}</text>`;
  });

  if (count > 1) {
    const s1Count = lastResults.filter(Boolean).length;
    const s2Count = count - s1Count;
    const parts = [];
    if (s1Count) parts.push(`${s1Count} ${labels.side1}`);
    if (s2Count) parts.push(`${s2Count} ${labels.side2}`);
    svg += `<text x="${w/2}" y="${pad + coinR * 2 + 20}" text-anchor="middle" fill="${colors[0]}" font-size="13" font-weight="700" font-family="Inter,sans-serif">${escapeXml(parts.join(' / '))}</text>`;
  }

  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${svg}</svg>`;
  const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
  const vp = await miro.board.viewport.get();
  await miro.board.createImage({
    url: dataUrl,
    x: vp.x + vp.width / 2, y: vp.y + vp.height / 2,
    width: Math.max(w, 100),
    title: JSON.stringify({ _spinnerCoin: true, results: lastResults, colors, labels: labelSelect.value }),
  });
});

// ── Events ───────────────────────────────────────────────
btnFlip.addEventListener('click', flip);
labelSelect.addEventListener('change', renderCoins);

// ── Init ─────────────────────────────────────────────────
renderSwatches();
renderCoins();
