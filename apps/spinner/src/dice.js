import { getState, setState } from './spinner-core.js';

// ── DOM refs ─────────────────────────────────────────────
const diceArea = document.getElementById('dice-area');
const btnRoll = document.getElementById('btn-roll');
const diceTotalEl = document.getElementById('dice-total');
const totalValueEl = document.getElementById('total-value');

// ── D6 pip patterns (3x3 grid, 1=pip, 0=empty) ─────────
const PIP_PATTERNS = {
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [0,0,1, 0,0,0, 1,0,0],
  3: [0,0,1, 0,1,0, 1,0,0],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

// ── Rotation targets to show each face ──────────────────
// These map a face value to the rotation needed to bring it to front
const FACE_ROTATIONS = {
  1: [0, 0],       // front
  2: [0, -90],     // right
  3: [-90, 0],     // top
  4: [90, 0],      // bottom
  5: [0, 90],      // left
  6: [0, 180],     // back
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

// ── State ────────────────────────────────────────────────
let rolling = false;

function getDiceCount() { return getState().diceCount || 1; }
function getDiceSides() { return getState().diceSides || 6; }
function getDiceColor() { return getState().diceColor || '#1e293b'; }

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
    // Build all 6 faces with pips
    for (let f = 1; f <= 6; f++) {
      const face = document.createElement('div');
      face.className = `die-face die-face--${f}`;
      face.style.background = color;
      face.appendChild(buildD6Face(f));
      cube.appendChild(face);
    }
  } else {
    // For non-D6, use 6 random faces (we rotate to show the result)
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

// ── Set die rotation to show a value ─────────────────────
function showFace(scene, value, sides, landed) {
  const cube = scene.querySelector('.die-cube');

  if (sides === 6) {
    const [rx, ry] = FACE_ROTATIONS[value];
    cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  } else {
    // For non-D6: put the result number on face 1 (front) and rotate to face 1
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
function renderDice(values, sides, color) {
  diceArea.innerHTML = '';
  const scenes = [];
  values.forEach((v) => {
    const scene = createDie(sides, color);
    showFace(scene, v, sides, false);
    diceArea.appendChild(scene);
    scenes.push(scene);
  });

  if (values.length > 1) {
    totalValueEl.textContent = values.reduce((a, b) => a + b, 0);
    diceTotalEl.classList.remove('hidden');
  } else {
    diceTotalEl.classList.add('hidden');
  }

  return scenes;
}

function renderPlaceholder() {
  const count = getDiceCount();
  const sides = getDiceSides();
  const color = getDiceColor();
  const values = Array.from({ length: count }, () => Math.ceil(Math.random() * sides));
  const scenes = renderDice(values, sides, color);
  scenes.forEach((s) => s.classList.add('placeholder'));
  diceTotalEl.classList.add('hidden');
}

// ── Roll animation (CSS 3D tumble) ───────────────────────
function roll() {
  if (rolling) return;
  rolling = true;

  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  const count = getDiceCount();
  const sides = getDiceSides();
  const color = getDiceColor();
  const finalValues = Array.from({ length: count }, () => Math.ceil(Math.random() * sides));

  // Create fresh dice
  diceArea.innerHTML = '';
  const scenes = [];
  for (let i = 0; i < count; i++) {
    const scene = createDie(sides, color);
    diceArea.appendChild(scene);
    scenes.push(scene);
  }

  // Tumble animation — spin cubes with RAF, decelerating
  const duration = 1400;
  const startTime = performance.now();
  let soundTimer = 0;

  playRollSound();

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);

    // Eased progress (easeOutCubic)
    const ease = 1 - Math.pow(1 - t, 3);

    // Total rotation scales: multiple full spins early, slows down
    const totalSpinX = 720 + Math.random() * 360;
    const totalSpinY = 720 + Math.random() * 360;

    scenes.forEach((scene, i) => {
      const cube = scene.querySelector('.die-cube');
      cube.classList.add('rolling');

      // Each die gets slightly different rotation speed for variety
      const offsetX = (i * 47 + 23) % 360;
      const offsetY = (i * 71 + 41) % 360;
      const rx = offsetX + totalSpinX * ease;
      const ry = offsetY + totalSpinY * ease;

      cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });

    // Play rattle sounds periodically
    if (elapsed - soundTimer > 120 && t < 0.8) {
      soundTimer = elapsed;
      playRollSound();
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      // Land on final values
      scenes.forEach((scene, i) => {
        showFace(scene, finalValues[i], sides, true);
      });

      if (count > 1) {
        totalValueEl.textContent = finalValues.reduce((a, b) => a + b, 0);
        diceTotalEl.classList.remove('hidden');
      } else {
        diceTotalEl.classList.add('hidden');
      }

      playLandSound();
      rolling = false;
      setState({ lastDice: finalValues });
    }
  }

  requestAnimationFrame(animate);
}

// ── Events ───────────────────────────────────────────────
btnRoll.addEventListener('click', roll);

// ── Init ─────────────────────────────────────────────────
renderPlaceholder();
