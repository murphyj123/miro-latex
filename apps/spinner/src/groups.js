import { getState, setState, generateGroups, getColor, escapeXml } from './spinner-core.js';

const grid = document.getElementById('groups-grid');
const btnShuffle = document.getElementById('btn-shuffle');
const btnPlace = document.getElementById('btn-place');

// ── Render groups (final state) ──────────────────────────
function render() {
  const state = getState();
  const groups = state.lastGroups || [];
  const teams = state.teams || [];

  grid.innerHTML = '';
  groups.forEach((members, i) => {
    const card = document.createElement('div');
    card.className = 'group-card';

    const color = teams[i]?.color || '#14b8a6';
    const name = teams[i]?.name || `Group ${i + 1}`;

    const header = document.createElement('div');
    header.className = 'group-card-header';
    header.style.background = color;
    header.textContent = name;

    const body = document.createElement('div');
    body.className = 'group-card-body';

    members.forEach((member) => {
      const row = document.createElement('div');
      row.className = 'group-member';
      row.textContent = member;
      body.appendChild(row);
    });

    const count = document.createElement('div');
    count.className = 'group-count';
    count.textContent = `${members.length} member${members.length !== 1 ? 's' : ''}`;

    card.append(header, body, count);
    grid.appendChild(card);
  });

  const cols = groups.length <= 3 ? groups.length : groups.length <= 6 ? 3 : 4;
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
}

// ── Shuffle animation ────────────────────────────────────
// Names appear in a "pool" at the top, then fly into their group cards
function animatedShuffle() {
  generateGroups();

  const state = getState();
  const groups = state.lastGroups || [];
  const teams = state.teams || [];
  if (!groups.length) return;

  // Build the empty card shells
  grid.innerHTML = '';
  const cols = groups.length <= 3 ? groups.length : groups.length <= 6 ? 3 : 4;
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  const bodyEls = [];
  groups.forEach((members, i) => {
    const card = document.createElement('div');
    card.className = 'group-card';

    const color = teams[i]?.color || '#14b8a6';
    const name = teams[i]?.name || `Group ${i + 1}`;

    const header = document.createElement('div');
    header.className = 'group-card-header';
    header.style.background = color;
    header.textContent = name;

    const body = document.createElement('div');
    body.className = 'group-card-body';

    const count = document.createElement('div');
    count.className = 'group-count';
    count.textContent = `${members.length} member${members.length !== 1 ? 's' : ''}`;

    card.append(header, body, count);
    grid.appendChild(card);
    bodyEls.push(body);
  });

  // Build a flat list of (name, groupIdx) pairs, shuffled for stagger
  const entries = [];
  groups.forEach((members, gi) => {
    members.forEach((name) => entries.push({ name, gi }));
  });
  // Shuffle entry order for visual interest
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }

  // Stagger: drop each name into its group card
  const stagger = Math.min(120, 2000 / entries.length);
  entries.forEach((entry, idx) => {
    setTimeout(() => {
      const row = document.createElement('div');
      row.className = 'group-member animate-in';
      row.textContent = entry.name;
      bodyEls[entry.gi].appendChild(row);
    }, idx * stagger);
  });
}

// ── Place on Board ───────────────────────────────────────
btnPlace.addEventListener('click', async () => {
  const state = getState();
  const groups = state.lastGroups;
  const teams = state.teams || [];
  if (!groups?.length) return;

  const svg = generateGroupsSVG(groups, teams);
  const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  const vp = await miro.board.viewport.get();
  await miro.board.createImage({
    url: dataUrl,
    x: vp.x + vp.width / 2, y: vp.y + vp.height / 2,
    width: Math.min(groups.length * 200, 800),
    title: JSON.stringify({ _spinnerGroups: true, names: state.names, teams }),
  });
});

function generateGroupsSVG(groups, teams) {
  const colW = 180, pad = 16, headerH = 36, rowH = 24;
  const maxMembers = Math.max(...groups.map((g) => g.length));
  const h = pad * 2 + headerH + maxMembers * rowH + 8;
  const w = pad + groups.length * (colW + pad);
  let svg = '';
  groups.forEach((members, i) => {
    const x = pad + i * (colW + pad);
    const color = teams[i]?.color || getColor(i);
    const name = teams[i]?.name || `Group ${i + 1}`;
    svg += `<rect x="${x}" y="${pad}" width="${colW}" height="${h - pad * 2}" rx="8" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>`;
    svg += `<rect x="${x}" y="${pad}" width="${colW}" height="${headerH}" rx="8" fill="${color}"/>`;
    svg += `<rect x="${x}" y="${pad + 20}" width="${colW}" height="${headerH - 20}" fill="${color}"/>`;
    svg += `<text x="${x + colW / 2}" y="${pad + headerH / 2 + 1}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="13" font-weight="700" font-family="Inter,sans-serif">${escapeXml(name)}</text>`;
    members.forEach((member, j) => {
      svg += `<text x="${x + 14}" y="${pad + headerH + 12 + j * rowH}" dominant-baseline="hanging" fill="#1e293b" font-size="12" font-weight="500" font-family="Inter,sans-serif">${escapeXml(member)}</text>`;
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${svg}</svg>`;
}

// ── Events ───────────────────────────────────────────────
btnShuffle.addEventListener('click', animatedShuffle);
window.addEventListener('storage', () => render());

// ── Init: play animation on first load ───────────────────
animatedShuffle();
