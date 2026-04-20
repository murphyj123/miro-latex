import { getState, setState, escapeXml, placeOnBoard } from './spinner-core.js';

// ── DOM refs ─────────────────────────────────────────────
const diceArea = document.getElementById('dice-area');
const btnRoll = document.getElementById('btn-roll');
const diceTotalEl = document.getElementById('dice-total');
const totalValueEl = document.getElementById('total-value');
const colorSwatchesEl = document.getElementById('dice-color-swatches');
const btnPlace = document.getElementById('btn-place');

const DICE_COLORS = ['#1e293b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

// ── D6 pip patterns (3x3 grid, 1=pip, 0=empty) ─────────
const PIP_PATTERNS = {
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [0,0,1, 0,0,0, 1,0,0],
  3: [0,0,1, 0,1,0, 1,0,0],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

const FACE_ROTATIONS = {
  1: [0, 0],
  2: [0, -90],
  3: [-90, 0],
  4: [90, 0],
  5: [0, 90],
  6: [0, 180],
};

// ── Audio ────────────────────────────────────────────────
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx || audioCtx.state === 'closed') audioCtx = new AudioContext();
  return audioCtx;
}

function playRollSound() {
  if (!getState().diceSound) return;
  try {
    const ctx = getAudioCtx();
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
  if (!getState().diceSound) return;
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

// ── State helpers ────────────────────────────────────────
let rolling = false;
let selectedDie = 0; // Which die the color swatches apply to

function getDiceCount() { return getState().diceCount || 1; }
function getDiceSides() { return getState().diceSides || 6; }
function getShowTotal() { return getState().diceShowTotal !== false; }

// Per-die colors — stored as array, falls back to single diceColor
function getDiceColors() {
  const state = getState();
  const count = getDiceCount();
  const colors = state.diceColors || [];
  const fallback = state.diceColor || '#1e293b';
  return Array.from({ length: count }, (_, i) => colors[i] || fallback);
}

function setDieColor(index, color) {
  const colors = getDiceColors();
  colors[index] = color;
  setState({ diceColors: colors });
}

// ── Color swatches (in-modal) ────────────────────────────
function renderSwatches() {
  colorSwatchesEl.innerHTML = '';
  const colors = getDiceColors();
  const current = colors[selectedDie] || '#1e293b';
  DICE_COLORS.forEach((c) => {
    const btn = document.createElement('button');
    btn.className = 'modal-swatch' + (c === current ? ' active' : '');
    btn.style.background = c;
    btn.addEventListener('click', () => {
      setDieColor(selectedDie, c);
      renderSwatches();
      renderPlaceholder();
    });
    colorSwatchesEl.appendChild(btn);
  });
}

// ── Build a single 3D die ────────────────────────────────
function buildD6Face(value) {
  const grid = document.createElement('div');
  grid.className = 'pip-grid';
  const pattern = PIP_PATTERNS[value];
  for (let i = 0; i < 9; i++) {
    const pip = document.createElement('span');
    pip.className = pattern[i] ? 'pip' : 'pip empty';
    grid.appendChild(pip);
  }
  return grid;
}

function buildNumericFace(value, sides) {
  const frag = document.createDocumentFragment();
  const num = document.createElement('span');
  num.className = 'die-number';
  num.textContent = value;
  const label = document.createElement('span');
  label.className = 'die-label';
  label.textContent = `D${sides}`;
  frag.append(num, label);
  return frag;
}

function createDie(sides, color) {
  const scene = document.createElement('div');
  scene.className = 'die-scene';

  const cube = document.createElement('div');
  cube.className = 'die-cube';
  scene.appendChild(cube);

  if (sides === 6) {
    for (let f = 1; f <= 6; f++) {
      const face = document.createElement('div');
      face.className = `die-face die-face--${f}`;
      face.style.background = color;
      face.appendChild(buildD6Face(f));
      cube.appendChild(face);
    }
  } else {
    for (let f = 1; f <= 6; f++) {
      const face = document.createElement('div');
      face.className = `die-face die-face--${f}`;
      face.style.background = color;
      const val = Math.ceil(Math.random() * sides);
      face.appendChild(buildNumericFace(val, sides));
      cube.appendChild(face);
    }
  }

  return scene;
}

function showFace(scene, value, sides, landed) {
  const cube = scene.querySelector('.die-cube');

  if (sides === 6) {
    const [rx, ry] = FACE_ROTATIONS[value];
    cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  } else {
    const frontFace = cube.querySelector('.die-face--1');
    frontFace.innerHTML = '';
    frontFace.appendChild(buildNumericFace(value, sides));
    cube.style.transform = `rotateX(0deg) rotateY(0deg)`;
  }

  if (landed) {
    cube.classList.remove('rolling');
    cube.classList.add('landed');
  }
}

// ── Render ────────────────────────────────────────────────
function updateTotal(values) {
  if (values.length > 1 && getShowTotal()) {
    totalValueEl.textContent = values.reduce((a, b) => a + b, 0);
    diceTotalEl.classList.remove('hidden');
  } else {
    diceTotalEl.classList.add('hidden');
  }
}

function renderDice(values, sides, colors) {
  diceArea.innerHTML = '';
  const scenes = [];
  values.forEach((v, i) => {
    const color = colors[i] || colors[0] || '#1e293b';
    const scene = createDie(sides, color);
    showFace(scene, v, sides, false);

    // Click to select this die for color change
    scene.addEventListener('click', () => {
      if (rolling) return;
      selectedDie = i;
      highlightSelected();
      renderSwatches();
    });

    diceArea.appendChild(scene);
    scenes.push(scene);
  });
  updateTotal(values);
  highlightSelected();
  return scenes;
}

function highlightSelected() {
  const scenes = diceArea.querySelectorAll('.die-scene');
  scenes.forEach((s, i) => {
    s.classList.toggle('selected', i === selectedDie && scenes.length > 1);
  });
}

function renderPlaceholder() {
  const count = getDiceCount();
  const sides = getDiceSides();
  const colors = getDiceColors();
  const values = Array.from({ length: count }, () => Math.ceil(Math.random() * sides));
  const scenes = renderDice(values, sides, colors);
  scenes.forEach((s) => s.classList.add('placeholder'));
  diceTotalEl.classList.add('hidden');
}

// ── Roll animation ───────────────────────────────────────
function roll() {
  if (rolling) return;
  rolling = true;

  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  const count = getDiceCount();
  const sides = getDiceSides();
  const colors = getDiceColors();
  const finalValues = Array.from({ length: count }, () => Math.ceil(Math.random() * sides));

  diceArea.innerHTML = '';
  const scenes = [];
  for (let i = 0; i < count; i++) {
    const scene = createDie(sides, colors[i]);
    diceArea.appendChild(scene);
    scenes.push(scene);
  }

  const duration = 1400;
  const startTime = performance.now();
  let soundTimer = 0;

  playRollSound();

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);

    const totalSpinX = 720 + Math.random() * 360;
    const totalSpinY = 720 + Math.random() * 360;

    scenes.forEach((scene, i) => {
      const cube = scene.querySelector('.die-cube');
      cube.classList.add('rolling');

      const offsetX = (i * 47 + 23) % 360;
      const offsetY = (i * 71 + 41) % 360;
      const rx = offsetX + totalSpinX * ease;
      const ry = offsetY + totalSpinY * ease;

      cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });

    if (elapsed - soundTimer > 120 && t < 0.8) {
      soundTimer = elapsed;
      playRollSound();
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      scenes.forEach((scene, i) => {
        showFace(scene, finalValues[i], sides, true);
      });

      updateTotal(finalValues);

      playLandSound();
      rolling = false;
      setState({ lastDice: finalValues });
      btnPlace.classList.remove('hidden');

      // Re-attach click handlers for color selection
      scenes.forEach((scene, i) => {
        scene.addEventListener('click', () => {
          if (rolling) return;
          selectedDie = i;
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
  const state = getState();
  const values = state.lastDice;
  if (!values?.length) return;

  const colors = getDiceColors();
  const total = values.reduce((a, b) => a + b, 0);
  const dieW = 60, pad = 16, gap = 12;
  const w = pad * 2 + values.length * dieW + (values.length - 1) * gap;
  const h = values.length > 1 && getShowTotal() ? 120 : 90;

  let svg = '';
  values.forEach((v, i) => {
    const x = pad + i * (dieW + gap);
    svg += `<rect x="${x}" y="${pad}" width="${dieW}" height="${dieW}" rx="12" fill="${colors[i]}"/>`;
    svg += `<text x="${x + dieW/2}" y="${pad + dieW/2 + 1}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="24" font-weight="800" font-family="Inter,sans-serif">${v}</text>`;
  });

  if (values.length > 1 && getShowTotal()) {
    svg += `<text x="${w/2}" y="${pad + dieW + 24}" text-anchor="middle" fill="#14b8a6" font-size="18" font-weight="800" font-family="Inter,sans-serif">Total: ${total}</text>`;
  }

  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${svg}</svg>`;
  await placeOnBoard(svgStr, Math.max(w, 120), { _spinnerDice: true, values, colors }, { closeModal: true });
});

// ── Events ───────────────────────────────────────────────
btnRoll.addEventListener('click', roll);

// ── Init ─────────────────────────────────────────────────
renderSwatches();
renderPlaceholder();
