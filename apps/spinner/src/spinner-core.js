// Singleton state for spinner + groups — localStorage keeps panel/modals in sync
import { getSafeJSON, setSafeJSON } from '../../shared/storage-utils.js';

const STATE_KEY = 'miro-spinner-state';
const CLASSES_KEY = 'miro-spinner-classes';

const PALETTE = [
  '#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#10b981', '#ec4899', '#f97316', '#06b6d4', '#6366f1',
  '#84cc16', '#e11d48', '#0ea5e9', '#a855f7', '#d946ef',
  '#22d3ee', '#fb923c', '#4ade80', '#f43f5e', '#818cf8',
];

function defaultState() {
  return {
    names: [],
    mode: 'spinner',        // 'spinner' | 'groups'
    // Spinner
    lastWinner: null,
    removeWinner: false,
    spinSound: true,
    // Groups
    groupCount: 3,
    groupMode: 'count',     // 'count' (N groups) | 'size' (groups of N)
    teams: [],              // [{ name, color }] — auto-generated if empty
    lastGroups: null,       // generated groups result
    // Dice
    diceCount: 1,
    diceSides: 6,
    diceSound: true,
    diceColor: '#1e293b',
    lastDice: null,
    // Coin
    coinCount: 1,
    coinColor: '#f59e0b',
    coinSound: true,
    diceShowTotal: true,
    // Assign
    tasks: [],
    assignMode: 'groups',    // 'one-to-one' | 'groups'
    lastAssignments: null,
    // Frames (shared by groups + assign)
    frameSize: 'medium',     // 'small' | 'medium' | 'large'
    frameColor: '#14b8a6',
  };
}

// ── In-memory cache ──────────────────────────────────────
let _cache = null;

function _loadCache() {
  const saved = getSafeJSON(STATE_KEY, null);
  _cache = saved ? { ...defaultState(), ...saved } : defaultState();
}

window.addEventListener('storage', (e) => {
  if (e.key === STATE_KEY) _loadCache();
});

_loadCache();

export function getState() {
  return _cache;
}

export function setState(patch) {
  _cache = { ..._cache, ...patch };
  setSafeJSON(STATE_KEY, _cache);
}

export function setNames(names) {
  setState({ names, lastWinner: null, lastGroups: null });
}

export function removeNameAtIndex(idx) {
  const names = [..._cache.names];
  names.splice(idx, 1);
  setState({ names });
}

// ── Colors ───────────────────────────────────────────────
export function getColor(index) {
  return PALETTE[index % PALETTE.length];
}

// ── Teams ────────────────────────────────────────────────
export function buildTeams(count) {
  const existing = _cache.teams || [];
  const teams = [];
  for (let i = 0; i < count; i++) {
    teams.push({
      name: existing[i]?.name || `Group ${i + 1}`,
      color: existing[i]?.color || PALETTE[i % PALETTE.length],
    });
  }
  return teams;
}

export function getTeamCount() {
  const s = _cache;
  const n = s.names?.length || 0;
  if (n === 0) return 0;
  if (s.groupMode === 'size') {
    return Math.ceil(n / Math.max(1, s.groupCount));
  }
  return Math.min(s.groupCount, n);
}

// ── Group generation ─────────────────────────────────────
export function generateGroups() {
  const s = _cache;
  const names = [...(s.names || [])];
  const teamCount = getTeamCount();
  if (teamCount < 2 || names.length < 2) return [];

  // Fisher-Yates shuffle
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }

  // Round-robin distribute
  const groups = Array.from({ length: teamCount }, () => []);
  names.forEach((name, i) => {
    groups[i % teamCount].push(name);
  });

  const teams = buildTeams(teamCount);
  setState({ lastGroups: groups, teams });
  return groups;
}

// ── Assignment generation ────────────────────────────
export function generateAssignments() {
  const s = _cache;
  const names = [...(s.names || [])];
  const tasks = [...(s.tasks || [])];
  if (!names.length || !tasks.length) return [];

  // Fisher-Yates shuffle names
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }

  if (s.assignMode === 'one-to-one') {
    // Each task gets one person (cycle tasks if more names than tasks)
    const assignments = tasks.map(() => []);
    names.forEach((name, i) => {
      assignments[i % tasks.length].push(name);
    });
    setState({ lastAssignments: { tasks, assignments, mode: 'one-to-one' } });
    return assignments;
  } else {
    // Groups mode: round-robin into task groups
    const assignments = tasks.map(() => []);
    names.forEach((name, i) => {
      assignments[i % tasks.length].push(name);
    });
    setState({ lastAssignments: { tasks, assignments, mode: 'groups' } });
    return assignments;
  }
}

// ── Saved classes ────────────────────────────────────────
export function getSavedClasses() {
  return getSafeJSON(CLASSES_KEY, []);
}

export function saveClass(name, names) {
  const classes = getSavedClasses();
  const idx = classes.findIndex((c) => c.name === name);
  if (idx >= 0) {
    classes[idx].names = names;
  } else {
    classes.push({ name, names });
  }
  setSafeJSON(CLASSES_KEY, classes);
}

export function deleteClass(name) {
  const classes = getSavedClasses().filter((c) => c.name !== name);
  setSafeJSON(CLASSES_KEY, classes);
}

// ── SVG helpers ──────────────────────────────────────────
export function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function svgToDataUrl(svgStr) {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
}

export async function placeOnBoard(svgStr, width, titleObj, { closeModal = false, directory = null } = {}) {
  const dataUrl = svgToDataUrl(svgStr);
  const vp = await miro.board.viewport.get();
  const cx = vp.x + vp.width / 2;
  const cy = vp.y + vp.height / 2;

  // Place main image (shift left if directory will go beside it)
  const mainX = directory ? cx - 100 : cx;
  await miro.board.createImage({
    url: dataUrl,
    x: mainX, y: cy,
    width,
    title: typeof titleObj === 'string' ? titleObj : JSON.stringify(titleObj),
  });

  // Place alphabetical directory to the right
  if (directory) {
    const dirSvg = generateDirectorySVG(directory.entries, directory.title);
    const dirUrl = svgToDataUrl(dirSvg);
    await miro.board.createImage({
      url: dirUrl,
      x: mainX + width / 2 + 130,
      y: cy,
      width: 220,
      title: '{}',
    });
  }

  if (closeModal) {
    try { miro.board.ui.closeModal(); } catch (_) {}
  }
}

// ── Alphabetical directory SVG ──────────────────────────
// entries: [{ name, group, color }] — sorted alphabetically
function generateDirectorySVG(entries, title) {
  const colW = 220, pad = 14, headerH = 32, rowH = 22;
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
  const h = pad * 2 + headerH + sorted.length * rowH + 8;

  let svg = '';
  // Background card
  svg += `<rect x="0" y="0" width="${colW}" height="${h}" rx="8" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>`;
  // Header
  svg += `<rect x="0" y="0" width="${colW}" height="${headerH}" rx="8" fill="#1e293b"/>`;
  svg += `<rect x="0" y="16" width="${colW}" height="${headerH - 16}" fill="#1e293b"/>`;
  svg += `<text x="${colW / 2}" y="${headerH / 2 + 1}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="11" font-weight="700" font-family="Inter,sans-serif">${escapeXml(title || 'Find Your Name')}</text>`;
  // Rows
  sorted.forEach((entry, i) => {
    const y = headerH + pad + i * rowH;
    // Colored dot
    svg += `<circle cx="${pad + 5}" cy="${y + 6}" r="4" fill="${entry.color}"/>`;
    // Name
    svg += `<text x="${pad + 16}" y="${y + 7}" dominant-baseline="central" fill="#1e293b" font-size="11" font-weight="600" font-family="Inter,sans-serif">${escapeXml(entry.name)}</text>`;
    // Group label (right-aligned)
    const groupLabel = entry.group.length > 16 ? entry.group.slice(0, 15) + '\u2026' : entry.group;
    svg += `<text x="${colW - pad}" y="${y + 7}" text-anchor="end" dominant-baseline="central" fill="#64748b" font-size="10" font-weight="500" font-family="Inter,sans-serif">${escapeXml(groupLabel)}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${colW} ${h}" width="${colW}" height="${h}">${svg}</svg>`;
}

// ── Place groups/assignments with frames + connectors ───
// Creates a frame per group, a directory card, and connector arrows
const FRAME_SIZES = {
  small:  { w: 400, h: 300 },
  medium: { w: 600, h: 450 },
  large:  { w: 900, h: 650 },
};

export async function placeWithFrames(headers, memberLists, colorFn, titleObj, { closeModal = false, dirTitle = 'Find Your Name' } = {}) {
  const vp = await miro.board.viewport.get();
  const cx = vp.x + vp.width / 2;
  const cy = vp.y + vp.height / 2;

  const state = _cache;
  const sizeKey = state.frameSize || 'medium';
  const { w: frameW, h: frameH } = FRAME_SIZES[sizeKey] || FRAME_SIZES.medium;
  const fColor = state.frameColor || '#14b8a6';
  const gap = 60;
  const count = headers.length;
  const totalW = count * frameW + (count - 1) * gap;
  const startX = cx - totalW / 2 + frameW / 2;

  // 1. Create frames
  const frames = [];
  for (let i = 0; i < count; i++) {
    const frame = await miro.board.createFrame({
      title: headers[i],
      x: startX + i * (frameW + gap),
      y: cy,
      width: frameW,
      height: frameH,
      style: { fillColor: fColor + '18' },
    });
    frames.push(frame);
  }

  // 2. Place member-list card images inside each frame
  for (let i = 0; i < count; i++) {
    const members = memberLists[i] || [];
    if (!members.length) continue;
    const cardSvg = generateSingleCardSVG(headers[i], members, colorFn(i));
    const cardUrl = svgToDataUrl(cardSvg);
    await miro.board.createImage({
      url: cardUrl,
      x: startX + i * (frameW + gap) - frameW / 2 + 110,
      y: cy - frameH / 2 + 20 + members.length * 12 + 40,
      width: 200,
      title: '{}',
    });
  }

  // 3. Build directory entries and place directory card to the left
  const dirEntries = memberLists.flatMap((members, i) =>
    members.map((name) => ({ name, group: headers[i], color: colorFn(i) }))
  );
  const dirSvg = generateDirectorySVG(dirEntries, dirTitle);
  const dirUrl = svgToDataUrl(dirSvg);
  const dirX = startX - frameW / 2 - 180;
  const dirImg = await miro.board.createImage({
    url: dirUrl,
    x: dirX,
    y: cy,
    width: 220,
    title: typeof titleObj === 'string' ? titleObj : JSON.stringify(titleObj),
  });

  // 4. Draw connector arrows from directory to each frame
  for (const frame of frames) {
    await miro.board.createConnector({
      start: { item: dirImg.id },
      end: { item: frame.id },
      shape: 'curved',
      style: {
        endStrokeCap: 'filled_arrow',
        strokeColor: '#14b8a6',
        strokeWidth: 2,
      },
    });
  }

  if (closeModal) {
    try { miro.board.ui.closeModal(); } catch (_) {}
  }
}

// ── Single-column card SVG (for inside a frame) ─────────
function generateSingleCardSVG(title, members, color) {
  const colW = 200, pad = 12, headerH = 32, rowH = 22;
  const h = pad * 2 + headerH + members.length * rowH + 8;
  let svg = '';
  svg += `<rect x="0" y="0" width="${colW}" height="${h}" rx="8" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>`;
  svg += `<rect x="0" y="0" width="${colW}" height="${headerH}" rx="8" fill="${color}"/>`;
  svg += `<rect x="0" y="16" width="${colW}" height="${headerH - 16}" fill="${color}"/>`;
  const label = title.length > 20 ? title.slice(0, 19) + '\u2026' : title;
  svg += `<text x="${colW / 2}" y="${headerH / 2 + 1}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="11" font-weight="700" font-family="Inter,sans-serif">${escapeXml(label)}</text>`;
  members.forEach((member, j) => {
    svg += `<text x="${pad + 4}" y="${headerH + pad + j * rowH + 7}" dominant-baseline="central" fill="#1e293b" font-size="11" font-weight="500" font-family="Inter,sans-serif">${escapeXml(member)}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${colW} ${h}" width="${colW}" height="${h}">${svg}</svg>`;
}

// ── Column-card SVG (shared by groups + assign) ─────────
export function generateCardsSVG(headers, memberLists, colorFn) {
  const colW = 180, pad = 16, headerH = 36, rowH = 24;
  const maxMembers = Math.max(...memberLists.map((m) => m.length));
  const h = pad * 2 + headerH + maxMembers * rowH + 8;
  const w = pad + headers.length * (colW + pad);
  let svg = '';
  headers.forEach((title, i) => {
    const x = pad + i * (colW + pad);
    const color = colorFn(i);
    svg += `<rect x="${x}" y="${pad}" width="${colW}" height="${h - pad * 2}" rx="8" fill="#fff" stroke="#e2e8f0" stroke-width="1"/>`;
    svg += `<rect x="${x}" y="${pad}" width="${colW}" height="${headerH}" rx="8" fill="${color}"/>`;
    svg += `<rect x="${x}" y="${pad + 20}" width="${colW}" height="${headerH - 20}" fill="${color}"/>`;
    const label = title.length > 18 ? title.slice(0, 17) + '\u2026' : title;
    svg += `<text x="${x + colW / 2}" y="${pad + headerH / 2 + 1}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="12" font-weight="700" font-family="Inter,sans-serif">${escapeXml(label)}</text>`;
    (memberLists[i] || []).forEach((member, j) => {
      svg += `<text x="${x + 14}" y="${pad + headerH + 12 + j * rowH}" dominant-baseline="hanging" fill="#1e293b" font-size="12" font-weight="500" font-family="Inter,sans-serif">${escapeXml(member)}</text>`;
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${svg}</svg>`;
}

export { PALETTE };
