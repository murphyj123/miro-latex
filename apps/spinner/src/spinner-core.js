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

export { PALETTE };
