import { getState, setState, generateAssignments, escapeXml, PALETTE } from './spinner-core.js';

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
  const svg = generateAssignSVG(tasks, assignments);
  const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  const vp = await miro.board.viewport.get();
  await miro.board.createImage({
    url: dataUrl,
    x: vp.x + vp.width / 2, y: vp.y + vp.height / 2,
    width: Math.min(tasks.length * 200, 800),
    title: JSON.stringify({ _spinnerAssign: true, names: state.names, tasks, assignMode: data.mode }),
  });
});

function generateAssignSVG(tasks, assignments) {
  const colW = 180, pad = 16, headerH = 36, rowH = 24;
  const maxMembers = Math.max(...assignments.map((a) => a.length));
  const h = pad * 2 + headerH + maxMembers * rowH + 8;
  const w = pad + tasks.length * (colW + pad);
  let svg = '';
  tasks.forEach((task, i) => {
    const x = pad + i * (colW + pad);
    const color = PALETTE[i % PALETTE.length];
    svg += `<rect x="${x}" y="${pad}" width="${colW}" height="${h - pad * 2}" rx="8" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>`;
    svg += `<rect x="${x}" y="${pad}" width="${colW}" height="${headerH}" rx="8" fill="${color}"/>`;
    svg += `<rect x="${x}" y="${pad + 20}" width="${colW}" height="${headerH - 20}" fill="${color}"/>`;
    const label = task.length > 18 ? task.slice(0, 17) + '\u2026' : task;
    svg += `<text x="${x + colW / 2}" y="${pad + headerH / 2 + 1}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="12" font-weight="700" font-family="Inter,sans-serif">${escapeXml(label)}</text>`;
    (assignments[i] || []).forEach((member, j) => {
      svg += `<text x="${x + 14}" y="${pad + headerH + 12 + j * rowH}" dominant-baseline="hanging" fill="#1e293b" font-size="12" font-weight="500" font-family="Inter,sans-serif">${escapeXml(member)}</text>`;
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${svg}</svg>`;
}

// ── Events ──────────────────────────────────────────────
btnShuffle.addEventListener('click', animatedShuffle);
window.addEventListener('storage', () => render());

// ── Init: play animation on first load ──────────────────
animatedShuffle();
