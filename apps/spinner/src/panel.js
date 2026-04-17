import { getState, setState, setNames, removeNameAtIndex, getColor } from './spinner-core.js';
import { getSafeJSON } from '../../shared/storage-utils.js';

// ── DOM refs ─────────────────────────────────────────────
const nameInput = document.getElementById('name-input');
const btnAdd = document.getElementById('btn-add');
const csvPaste = document.getElementById('csv-paste');
const btnImport = document.getElementById('btn-import');
const nameList = document.getElementById('name-list');
const namesLabel = document.getElementById('names-label');
const removeWinnerCb = document.getElementById('remove-winner');
const spinSoundCb = document.getElementById('spin-sound');
const btnSpin = document.getElementById('btn-spin');
const btnPlace = document.getElementById('btn-place');
const btnClear = document.getElementById('btn-clear');

// ── Render ───────────────────────────────────────────────
function renderNames() {
  const state = getState();
  const names = state.names || [];
  namesLabel.textContent = `Names (${names.length})`;
  btnSpin.disabled = names.length < 2;
  btnPlace.disabled = names.length < 2;

  nameList.innerHTML = '';
  names.forEach((name, i) => {
    const row = document.createElement('div');
    row.className = 'name-row';

    const dot = document.createElement('span');
    dot.className = 'name-dot';
    dot.style.background = getColor(i);

    const label = document.createElement('span');
    label.className = 'name-label';
    label.textContent = name;

    const del = document.createElement('button');
    del.className = 'name-delete';
    del.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>';
    del.addEventListener('click', () => {
      removeNameAtIndex(i);
      renderNames();
    });

    row.append(dot, label, del);
    nameList.appendChild(row);
  });
}

function syncOptions() {
  const state = getState();
  removeWinnerCb.checked = state.removeWinner === true;
  spinSoundCb.checked = state.spinSound !== false;
}

// ── Add name ─────────────────────────────────────────────
function addName() {
  const val = nameInput.value.trim();
  if (!val) return;
  const state = getState();
  setNames([...(state.names || []), val]);
  nameInput.value = '';
  nameInput.focus();
  renderNames();
}

btnAdd.addEventListener('click', addName);
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addName();
});

// ── CSV import ───────────────────────────────────────────
btnImport.addEventListener('click', () => {
  const raw = csvPaste.value.trim();
  if (!raw) return;
  const parsed = raw
    .split(/[,\n\r\t]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parsed.length === 0) return;
  const state = getState();
  setNames([...(state.names || []), ...parsed]);
  csvPaste.value = '';
  renderNames();
});

// ── Options ──────────────────────────────────────────────
removeWinnerCb.addEventListener('change', () => {
  setState({ removeWinner: removeWinnerCb.checked });
});

spinSoundCb.addEventListener('change', () => {
  setState({ spinSound: spinSoundCb.checked });
});

// ── Spin (open modal) ────────────────────────────────────
btnSpin.addEventListener('click', async () => {
  await miro.board.ui.openModal({
    url: 'spinner/modal.html',
    width: 720,
    height: 520,
  });
});

// ── Place on Board ───────────────────────────────────────
btnPlace.addEventListener('click', async () => {
  const state = getState();
  const names = state.names || [];
  if (names.length < 2) return;

  const svg = generateWheelSVG(names);
  const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));

  const vp = await miro.board.viewport.get();
  await miro.board.createImage({
    url: dataUrl,
    x: vp.x + vp.width / 2,
    y: vp.y + vp.height / 2,
    width: 400,
    title: JSON.stringify({
      _spinner: true,
      names,
      removeWinner: state.removeWinner,
    }),
  });
});

function generateWheelSVG(names) {
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;
  const n = names.length;
  const sliceAngle = (2 * Math.PI) / n;

  let paths = '';
  for (let i = 0; i < n; i++) {
    const a1 = i * sliceAngle - Math.PI / 2;
    const a2 = (i + 1) * sliceAngle - Math.PI / 2;
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    const large = sliceAngle > Math.PI ? 1 : 0;
    const color = getColor(i);

    paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${color}"/>`;

    // Text label
    const midAngle = a1 + sliceAngle / 2;
    const textR = r * 0.65;
    const tx = cx + textR * Math.cos(midAngle);
    const ty = cy + textR * Math.sin(midAngle);
    const deg = (midAngle * 180) / Math.PI;
    const truncName = names[i].length > 12 ? names[i].slice(0, 11) + '\u2026' : names[i];
    paths += `<text x="${tx}" y="${ty}" transform="rotate(${deg},${tx},${ty})" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="12" font-weight="600" font-family="Inter,sans-serif">${escapeXml(truncName)}</text>`;
  }

  // Center circle
  paths += `<circle cx="${cx}" cy="${cy}" r="22" fill="#1e293b"/>`;
  paths += `<circle cx="${cx}" cy="${cy}" r="18" fill="#fff"/>`;
  paths += `<circle cx="${cx}" cy="${cy}" r="4" fill="#1e293b"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${paths}</svg>`;
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Clear ────────────────────────────────────────────────
btnClear.addEventListener('click', () => {
  setNames([]);
  renderNames();
});

// ── Storage sync ─────────────────────────────────────────
window.addEventListener('storage', () => {
  renderNames();
  syncOptions();
});

// ── Init ─────────────────────────────────────────────────
// Load from board image click
const loadPreset = getSafeJSON('spinner-load', null);
localStorage.removeItem('spinner-load');
if (loadPreset && loadPreset.names?.length) {
  setNames(loadPreset.names);
  if (loadPreset.removeWinner != null) {
    setState({ removeWinner: loadPreset.removeWinner });
  }
}

syncOptions();
renderNames();
