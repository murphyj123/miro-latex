import { getState, generateAssignments, generateCardsSVG, placeOnBoard, PALETTE } from './spinner-core.js';

const grid = document.getElementById('assign-grid');
const btnShuffle = document.getElementById('btn-shuffle');
const btnPlace = document.getElementById('btn-place');

// ── Render assignments (final state) ────────────────────
function render() {
  const data = getState().lastAssignments;
  if (!data) return;

  const { tasks, assignments } = data;
  grid.innerHTML = '';
  const cols = tasks.length <= 3 ? tasks.length : tasks.length <= 6 ? 3 : 4;
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  tasks.forEach((task, i) => {
    const card = document.createElement('div');
    card.className = 'assign-card';

    const color = PALETTE[i % PALETTE.length];

    const header = document.createElement('div');
    header.className = 'assign-card-header';
    header.style.background = color;
    header.textContent = task;

    const body = document.createElement('div');
    body.className = 'assign-card-body';

    (assignments[i] || []).forEach((member) => {
      const row = document.createElement('div');
      row.className = 'assign-member';
      row.textContent = member;
      body.appendChild(row);
    });

    const count = document.createElement('div');
    count.className = 'assign-count';
    const n = (assignments[i] || []).length;
    count.textContent = `${n} student${n !== 1 ? 's' : ''}`;

    card.append(header, body, count);
    grid.appendChild(card);
  });
}

// ── Animated shuffle ────────────────────────────────────
function animatedShuffle() {
  generateAssignments();

  const data = getState().lastAssignments;
  if (!data) return;

  const { tasks, assignments } = data;

  grid.innerHTML = '';
  const cols = tasks.length <= 3 ? tasks.length : tasks.length <= 6 ? 3 : 4;
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  const bodyEls = [];
  tasks.forEach((task, i) => {
    const card = document.createElement('div');
    card.className = 'assign-card';

    const color = PALETTE[i % PALETTE.length];

    const header = document.createElement('div');
    header.className = 'assign-card-header';
    header.style.background = color;
    header.textContent = task;

    const body = document.createElement('div');
    body.className = 'assign-card-body';

    const count = document.createElement('div');
    count.className = 'assign-count';
    const n = (assignments[i] || []).length;
    count.textContent = `${n} student${n !== 1 ? 's' : ''}`;

    card.append(header, body, count);
    grid.appendChild(card);
    bodyEls.push(body);
  });

  // Build flat list of (name, taskIdx) pairs, shuffled for visual stagger
  const entries = [];
  assignments.forEach((members, ti) => {
    members.forEach((name) => entries.push({ name, ti }));
  });
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }

  const stagger = Math.min(120, 2000 / entries.length);
  entries.forEach((entry, idx) => {
    setTimeout(() => {
      const row = document.createElement('div');
      row.className = 'assign-member animate-in';
      row.textContent = entry.name;
      bodyEls[entry.ti].appendChild(row);
    }, idx * stagger);
  });
}

// ── Place on Board ──────────────────────────────────────
btnPlace.addEventListener('click', async () => {
  const state = getState();
  const data = state.lastAssignments;
  if (!data) return;

  const { tasks, assignments } = data;
  const svg = generateCardsSVG(tasks, assignments, (i) => PALETTE[i % PALETTE.length]);
  await placeOnBoard(svg, Math.min(tasks.length * 200, 800), { _spinnerAssign: true, names: state.names, tasks, assignMode: data.mode }, true);
});

// ── Events ──────────────────────────────────────────────
btnShuffle.addEventListener('click', animatedShuffle);
window.addEventListener('storage', () => render());

// ── Init: play animation on first load ──────────────────
animatedShuffle();
