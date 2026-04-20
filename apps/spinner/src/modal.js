import { getState, setState, getColor, escapeXml, placeOnBoard, PALETTE } from './spinner-core.js';

// ── DOM refs ─────────────────────────────────────────────
const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');
const btnSpin = document.getElementById('btn-spin');
const btnRespin = document.getElementById('btn-respin');
const winnerDisplay = document.getElementById('winner-display');
const winnerName = document.getElementById('winner-name');
const nameChips = document.getElementById('name-chips');
const namesLabel = document.getElementById('names-label');
const removeWinnerCb = document.getElementById('remove-winner');
const spinSoundCb = document.getElementById('spin-sound');

// ── Canvas sizing ────────────────────────────────────────
const DPR = window.devicePixelRatio || 1;
const CSS_SIZE = 420;
canvas.width = CSS_SIZE * DPR;
canvas.height = CSS_SIZE * DPR;
canvas.style.width = CSS_SIZE + 'px';
canvas.style.height = CSS_SIZE + 'px';
ctx.scale(DPR, DPR);

const CX = CSS_SIZE / 2;
const CY = CSS_SIZE / 2;
const RADIUS = CSS_SIZE / 2 - 16;

// ── Audio ────────────────────────────────────────────────
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function tick() {
  const state = getState();
  if (!state.spinSound) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 600 + Math.random() * 400;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (_) {}
}

function fanfare() {
  const state = getState();
  if (!state.spinSound) return;
  try {
    const ctx = getAudioCtx();
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch (_) {}
}

// ── Wheel state ──────────────────────────────────────────
let angle = 0; // current rotation in radians
let spinning = false;
let rafId = null;

// Session-local names — removing a winner only affects this session, not the saved class
let sessionNames = [...(getState().names || [])];
const winnerHistory = []; // Track order of winners

// ── Draw wheel ───────────────────────────────────────────
function drawWheel(names, rotation) {
  ctx.clearRect(0, 0, CSS_SIZE, CSS_SIZE);
  const n = names.length;
  if (n === 0) return;
  const sliceAngle = (2 * Math.PI) / n;

  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(rotation);

  for (let i = 0; i < n; i++) {
    const a1 = i * sliceAngle - Math.PI / 2;
    const a2 = a1 + sliceAngle;

    // Segment
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, RADIUS, a1, a2);
    ctx.closePath();
    ctx.fillStyle = getColor(i);
    ctx.fill();

    // Segment border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text
    const midAngle = a1 + sliceAngle / 2;
    const textR = RADIUS * 0.62;
    ctx.save();
    ctx.rotate(midAngle);
    ctx.translate(textR, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#fff';
    ctx.font = `600 ${n > 16 ? 10 : n > 10 ? 12 : 14}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = names[i].length > 14 ? names[i].slice(0, 13) + '\u2026' : names[i];
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  // Center hub
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, 2 * Math.PI);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 21, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, 2 * Math.PI);
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  ctx.restore();
}

// ── Confetti ─────────────────────────────────────────────
let confetti = [];
let confettiRafId = null;

function spawnConfetti() {
  confetti = [];
  for (let i = 0; i < 60; i++) {
    confetti.push({
      x: CX,
      y: CY,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12 - 4,
      size: 4 + Math.random() * 6,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 15,
      alpha: 1,
    });
  }
  if (confettiRafId) cancelAnimationFrame(confettiRafId);
  animateConfetti();
}

function animateConfetti() {
  let alive = false;
  for (const p of confetti) {
    if (p.alpha <= 0) continue;
    alive = true;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.25;
    p.rotation += p.rotSpeed;
    p.alpha -= 0.012;

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    ctx.restore();
  }
  if (alive) {
    confettiRafId = requestAnimationFrame(() => {
      const state = getState();
      drawWheel(state.names || [], angle);
      animateConfetti();
    });
  }
}

// ── Spin animation ───────────────────────────────────────
function spin() {
  const state = getState();
  const names = sessionNames;
  if (names.length < 2 || spinning) return;

  // Resume audio on gesture
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  spinning = true;
  btnSpin.classList.add('spinning');
  btnSpin.textContent = '';
  winnerDisplay.classList.add('hidden');

  // Pick random target: 5-8 full rotations + random offset
  const spins = 5 + Math.random() * 3;
  const targetAngle = angle + spins * 2 * Math.PI + Math.random() * 2 * Math.PI;
  const totalAngle = targetAngle - angle;
  const duration = 4000 + Math.random() * 1000; // 4-5 seconds
  const startTime = performance.now();
  const startAngle = angle;

  // Track tick sounds per segment crossing
  let lastSegment = -1;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateSpin(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(t);
    angle = startAngle + totalAngle * eased;

    drawWheel(names, angle);

    // Tick sound on segment crossing
    const n = names.length;
    const sliceAngle = (2 * Math.PI) / n;
    const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const currentSegment = Math.floor(normalizedAngle / sliceAngle);
    if (currentSegment !== lastSegment) {
      lastSegment = currentSegment;
      if (t < 0.95) tick(); // don't tick at the very end
    }

    if (t < 1) {
      rafId = requestAnimationFrame(animateSpin);
    } else {
      spinning = false;
      btnSpin.classList.remove('spinning');
      btnSpin.textContent = 'SPIN';

      // Determine winner: the segment at the top (pointer position)
      // Pointer is at the top (12 o'clock = -PI/2)
      const finalAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      // The wheel is drawn starting at -PI/2, so the segment at top is:
      // Top = -PI/2 in unrotated space = -(rotation) in rotated space
      const pointerAngle = ((2 * Math.PI - finalAngle) % (2 * Math.PI));
      const winnerIdx = Math.floor(pointerAngle / sliceAngle) % n;
      const winner = names[winnerIdx];

      // Show winner
      winnerName.textContent = winner;
      winnerName.style.color = getColor(winnerIdx);
      winnerDisplay.classList.remove('hidden');
      btnPlaceWinner.classList.remove('hidden');
      setState({ lastWinner: winner });

      fanfare();
      spawnConfetti();
      winnerHistory.push(winner);

      // Remove winner from session only (not from saved class)
      if (state.removeWinner) {
        setTimeout(() => {
          sessionNames.splice(winnerIdx, 1);
          renderChips();
          drawWheel(sessionNames, angle);
        }, 2000);
      }
    }
  }

  rafId = requestAnimationFrame(animateSpin);
}

// ── Render name chips ────────────────────────────────────
function renderChips() {
  const names = sessionNames;
  namesLabel.textContent = `Names (${names.length})`;

  nameChips.innerHTML = '';
  names.forEach((name, i) => {
    const chip = document.createElement('span');
    chip.className = 'name-chip';
    chip.style.borderColor = getColor(i);
    chip.style.background = getColor(i) + '18';
    chip.textContent = name;
    nameChips.appendChild(chip);
  });

  btnSpin.disabled = names.length < 2;
}

function syncOptions() {
  const state = getState();
  removeWinnerCb.checked = state.removeWinner === true;
  spinSoundCb.checked = state.spinSound !== false;
}

// ── Place winner on board ────────────────────────────────
const btnPlaceWinner = document.getElementById('btn-place-winner');

btnPlaceWinner.addEventListener('click', async () => {
  const state = getState();
  const winner = state.lastWinner;
  if (!winner) return;

  // Find the winner's color
  const names = state.names || [];
  const idx = names.indexOf(winner);
  const color = idx >= 0 ? getColor(idx) : '#14b8a6';

  const w = 220, h = 80, r = 12;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" rx="${r}" fill="${color}"/>
    <text x="${w/2}" y="28" text-anchor="middle" fill="#fff" font-size="11" font-weight="600" font-family="Inter,sans-serif" opacity="0.8">WINNER</text>
    <text x="${w/2}" y="54" text-anchor="middle" fill="#fff" font-size="20" font-weight="800" font-family="Inter,sans-serif">${escapeXml(winner)}</text>
  </svg>`;

  await placeOnBoard(svg, 220, { _spinnerWinner: true, winner, color }, { closeModal: true });
});

// ── Events ───────────────────────────────────────────────
btnSpin.addEventListener('click', spin);
btnRespin.addEventListener('click', spin);

removeWinnerCb.addEventListener('change', () => {
  setState({ removeWinner: removeWinnerCb.checked });
});

spinSoundCb.addEventListener('change', () => {
  setState({ spinSound: spinSoundCb.checked });
});

window.addEventListener('storage', () => {
  // If names change externally, update session names
  sessionNames = [...(getState().names || [])];
  renderChips();
  syncOptions();
  if (!spinning) {
    drawWheel(sessionNames, angle);
  }
});

window.addEventListener('pagehide', () => {
  if (rafId) cancelAnimationFrame(rafId);
  if (confettiRafId) cancelAnimationFrame(confettiRafId);
});

// ── Init ─────────────────────────────────────────────────
syncOptions();
renderChips();
drawWheel(sessionNames, angle);
