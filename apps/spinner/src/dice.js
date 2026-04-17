import { getState, setState } from './spinner-core.js';

// ── DOM refs ─────────────────────────────────────────────
const diceArea = document.getElementById('dice-area');
const btnRoll = document.getElementById('btn-roll');
const diceTotalEl = document.getElementById('dice-total');
const totalValueEl = document.getElementById('total-value');
const diceCountLabel = document.getElementById('dice-count-label');
const btnMinus = document.getElementById('dice-minus');
const btnPlus = document.getElementById('dice-plus');
const diceSidesSelect = document.getElementById('dice-sides');

// ── D6 pip layouts (positions as % of die face) ─────────
const PIP_LAYOUTS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
};

// ── Audio ────────────────────────────────────────────────
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx || audioCtx.state === 'closed') audioCtx = new AudioContext();
  return audioCtx;
}

function playRollSound() {
  const state = getState();
  if (!state.diceSound) return;
  try {
    const ctx = getAudioCtx();
    // Short noise burst for dice rattle
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch (_) {}
}

function playLandSound() {
  const state = getState();
  if (!state.diceSound) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 200;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (_) {}
}

// ── State ────────────────────────────────────────────────
let rolling = false;

function getDiceCount() {
  return getState().diceCount || 1;
}

function getDiceSides() {
  return getState().diceSides || 6;
}

// ── Render dice ──────────────────────────────────────────
function createDieElement(value, sides) {
  const die = document.createElement('div');
  die.className = 'die';

  if (sides === 6) {
    // Render pips
    die.classList.add('die-d6');
    const pips = PIP_LAYOUTS[value] || [];
    pips.forEach(([x, y]) => {
      const pip = document.createElement('span');
      pip.className = 'pip';
      pip.style.left = x + '%';
      pip.style.top = y + '%';
      die.appendChild(pip);
    });
  } else {
    // Render number for non-d6
    die.classList.add('die-numeric');
    const num = document.createElement('span');
    num.className = 'die-number';
    num.textContent = value;
    const label = document.createElement('span');
    label.className = 'die-sides-label';
    label.textContent = `D${sides}`;
    die.append(num, label);
  }

  return die;
}

function renderDice(values, sides) {
  diceArea.innerHTML = '';
  values.forEach((v) => {
    diceArea.appendChild(createDieElement(v, sides));
  });

  if (values.length > 1) {
    const total = values.reduce((a, b) => a + b, 0);
    totalValueEl.textContent = total;
    diceTotalEl.classList.remove('hidden');
  } else {
    diceTotalEl.classList.add('hidden');
  }
}

function renderPlaceholder() {
  const count = getDiceCount();
  const sides = getDiceSides();
  const values = Array.from({ length: count }, () => Math.ceil(Math.random() * sides));
  renderDice(values, sides);
  // Dim them to indicate not yet rolled
  diceArea.querySelectorAll('.die').forEach((d) => d.classList.add('placeholder'));
  diceTotalEl.classList.add('hidden');
}

// ── Roll animation ───────────────────────────────────────
function roll() {
  if (rolling) return;
  rolling = true;

  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  const count = getDiceCount();
  const sides = getDiceSides();
  const finalValues = Array.from({ length: count }, () => Math.ceil(Math.random() * sides));

  const duration = 1200;
  const startTime = performance.now();
  let lastSwap = 0;

  playRollSound();

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);

    // Swap interval increases as it slows down (easeOutCubic)
    const interval = 50 + 200 * t * t;

    if (elapsed - lastSwap > interval) {
      lastSwap = elapsed;
      const tempValues = Array.from({ length: count }, () => Math.ceil(Math.random() * sides));
      renderDice(tempValues, sides);

      // Add tumble animation class
      diceArea.querySelectorAll('.die').forEach((d) => {
        d.classList.add('tumbling');
      });

      if (t < 0.85) playRollSound();
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      // Final result
      renderDice(finalValues, sides);
      rolling = false;
      playLandSound();

      // Pop animation on final dice
      diceArea.querySelectorAll('.die').forEach((d) => {
        d.classList.add('landed');
      });

      setState({ lastDice: finalValues });
    }
  }

  requestAnimationFrame(animate);
}

// ── Controls ─────────────────────────────────────────────
function syncControls() {
  const count = getDiceCount();
  const sides = getDiceSides();
  diceCountLabel.textContent = count;
  diceSidesSelect.value = sides;
}

btnRoll.addEventListener('click', roll);

btnMinus.addEventListener('click', () => {
  const count = Math.max(1, getDiceCount() - 1);
  setState({ diceCount: count });
  syncControls();
  renderPlaceholder();
});

btnPlus.addEventListener('click', () => {
  const count = Math.min(6, getDiceCount() + 1);
  setState({ diceCount: count });
  syncControls();
  renderPlaceholder();
});

diceSidesSelect.addEventListener('change', () => {
  setState({ diceSides: parseInt(diceSidesSelect.value) });
  syncControls();
  renderPlaceholder();
});

window.addEventListener('storage', () => {
  syncControls();
});

// ── Init ─────────────────────────────────────────────────
syncControls();
renderPlaceholder();
