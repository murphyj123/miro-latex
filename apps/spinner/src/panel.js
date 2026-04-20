import {
  getState, setState, setNames, removeNameAtIndex, getColor,
  buildTeams, getTeamCount, generateGroups, generateAssignments,
  getSavedClasses, saveClass, deleteClass,
  escapeXml, PALETTE, placeOnBoard, placeWithFrames,
} from './spinner-core.js';
import { getSafeJSON } from '../../shared/storage-utils.js';

const DICE_COLORS = ['#1e293b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
const COIN_COLORS = ['#f59e0b', '#94a3b8', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];

// ── DOM refs ─────────────────────────────────────────────
const namesSection = document.getElementById('names-section');
const nameInput = document.getElementById('name-input');
const btnAdd = document.getElementById('btn-add');
const csvPaste = document.getElementById('csv-paste');
const btnImport = document.getElementById('btn-import');
const nameList = document.getElementById('name-list');
const namesLabel = document.getElementById('names-label');
const btnClear = document.getElementById('btn-clear');
const modeTabs = document.querySelectorAll('.mode-tab');

// Spinner
const removeWinnerCb = document.getElementById('remove-winner');
const spinSoundCb = document.getElementById('spin-sound');
const btnSpin = document.getElementById('btn-spin');
const btnPlaceSpinner = document.getElementById('btn-place-spinner');

// Groups
const groupModeSelect = document.getElementById('group-mode');
const groupCountInput = document.getElementById('group-count');
const teamList = document.getElementById('team-list');
const btnGenerate = document.getElementById('btn-generate');
const btnPlaceGroups = document.getElementById('btn-place-groups');

// Dice
const btnRoll = document.getElementById('btn-roll');
const diceCountLabel = document.getElementById('dice-count-label');
const diceMinus = document.getElementById('dice-minus');
const dicePlus = document.getElementById('dice-plus');
const diceSidesSelect = document.getElementById('dice-sides');
const diceShowTotalCb = document.getElementById('dice-show-total');
const diceSoundCb = document.getElementById('dice-sound');
const diceColorsEl = document.getElementById('dice-colors');

// Coin
const btnFlip = document.getElementById('btn-flip');
const coinCountLabel = document.getElementById('coin-count-label');
const coinMinus = document.getElementById('coin-minus');
const coinPlus = document.getElementById('coin-plus');
const coinSoundCb = document.getElementById('coin-sound');
const coinColorsEl = document.getElementById('coin-colors');

// Assign
const taskInput = document.getElementById('task-input');
const btnAddTask = document.getElementById('btn-add-task');
const taskListEl = document.getElementById('task-list');
const btnClearTasks = document.getElementById('btn-clear-tasks');
const assignModeSelect = document.getElementById('assign-mode');
const btnAssign = document.getElementById('btn-assign');
const btnPlaceAssign = document.getElementById('btn-place-assign');

// Saved classes
const classSelect = document.getElementById('class-select');
const btnNew = document.getElementById('btn-new');
const btnSaveClass = document.getElementById('btn-save-class');
const btnDeleteClass = document.getElementById('btn-delete-class');
const saveDialog = document.getElementById('save-dialog');
const saveClassNameInput = document.getElementById('save-class-name');
const saveOk = document.getElementById('save-ok');
const saveCancel = document.getElementById('save-cancel');

// ══════════════════════════════════════════════════════════
// MODE TABS (at the top — controls everything)
// ══════════════════════════════════════════════════════════

const MODES_WITH_NAMES = ['spinner', 'groups', 'assign'];

function setMode(mode) {
  setState({ mode });
  modeTabs.forEach((t) => t.classList.toggle('active', t.dataset.mode === mode));
  document.getElementById('mode-spinner').classList.toggle('hidden', mode !== 'spinner');
  document.getElementById('mode-groups').classList.toggle('hidden', mode !== 'groups');
  document.getElementById('mode-dice').classList.toggle('hidden', mode !== 'dice');
  document.getElementById('mode-coin').classList.toggle('hidden', mode !== 'coin');
  document.getElementById('mode-assign').classList.toggle('hidden', mode !== 'assign');

  // Show names section only for modes that use names
  namesSection.classList.toggle('hidden', !MODES_WITH_NAMES.includes(mode));

  if (mode === 'groups') renderTeams();
  if (mode === 'dice') syncDiceOptions();
  if (mode === 'coin') syncCoinOptions();
  if (mode === 'assign') { syncAssignOptions(); renderTasks(); }
}

modeTabs.forEach((tab) => {
  tab.addEventListener('click', () => setMode(tab.dataset.mode));
});

// ══════════════════════════════════════════════════════════
// SHARED: Name management
// ══════════════════════════════════════════════════════════

const emptyState = document.getElementById('empty-state');

function renderNames() {
  const state = getState();
  const names = state.names || [];
  const hasNames = names.length > 0;
  const hasEnough = names.length >= 2;

  namesLabel.textContent = `Names (${names.length})`;
  btnSpin.disabled = !hasEnough;
  btnPlaceSpinner.disabled = !hasEnough;
  btnGenerate.disabled = !hasEnough;
  btnPlaceGroups.disabled = !hasEnough || !state.lastGroups;
  btnAssign.disabled = !(names.length >= 1 && (state.tasks || []).length > 0);
  btnPlaceAssign.disabled = !state.lastAssignments;

  // Show/hide empty state vs name list
  emptyState.classList.toggle('hidden', hasNames);
  namesLabel.classList.toggle('hidden', !hasNames);
  nameList.classList.toggle('hidden', !hasNames);
  btnClear.classList.toggle('hidden', !hasNames);

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
      renderTeams();
    });

    row.append(dot, label, del);
    nameList.appendChild(row);
  });
}

function addName() {
  const val = nameInput.value.trim();
  if (!val) return;
  setNames([...(getState().names || []), val]);
  nameInput.value = '';
  nameInput.focus();
  renderNames();
  renderTeams();
}

btnAdd.addEventListener('click', addName);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addName(); });

btnImport.addEventListener('click', () => {
  const raw = csvPaste.value.trim();
  if (!raw) return;
  const parsed = raw.split(/[,\n\r\t]+/).map((s) => s.trim()).filter(Boolean);
  if (!parsed.length) return;
  setNames([...(getState().names || []), ...parsed]);
  csvPaste.value = '';
  renderNames();
  renderTeams();
});

btnClear.addEventListener('click', () => {
  setNames([]);
  renderNames();
  renderTeams();
});

// ══════════════════════════════════════════════════════════
// SAVED CLASSES
// ══════════════════════════════════════════════════════════

function renderClassList() {
  const classes = getSavedClasses();
  classSelect.innerHTML = '<option value="">— Select a class —</option>';
  classes.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = `${c.name} (${c.names.length})`;
    classSelect.appendChild(opt);
  });
}

classSelect.addEventListener('change', () => {
  const name = classSelect.value;
  if (!name) return;
  const cls = getSavedClasses().find((c) => c.name === name);
  if (cls) {
    setNames([...cls.names]);
    renderNames();
    renderTeams();
  }
});

btnSaveClass.addEventListener('click', () => {
  const names = getState().names || [];
  if (names.length === 0) return;
  saveClassNameInput.value = classSelect.value || '';
  saveDialog.classList.remove('hidden');
  saveClassNameInput.focus();
});

saveOk.addEventListener('click', () => {
  const name = saveClassNameInput.value.trim();
  if (!name) return;
  saveClass(name, [...(getState().names || [])]);
  saveDialog.classList.add('hidden');
  renderClassList();
  classSelect.value = name;
});

saveCancel.addEventListener('click', () => saveDialog.classList.add('hidden'));
saveClassNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveOk.click();
  if (e.key === 'Escape') saveCancel.click();
});

btnDeleteClass.addEventListener('click', () => {
  const name = classSelect.value;
  if (!name) return;
  deleteClass(name);
  classSelect.value = '';
  renderClassList();
});

btnNew.addEventListener('click', () => {
  setNames([]);
  classSelect.value = '';
  renderNames();
  renderTeams();
});

// ══════════════════════════════════════════════════════════
// SPINNER MODE
// ══════════════════════════════════════════════════════════

function syncSpinnerOptions() {
  const state = getState();
  removeWinnerCb.checked = state.removeWinner === true;
  spinSoundCb.checked = state.spinSound !== false;
}

removeWinnerCb.addEventListener('change', () => setState({ removeWinner: removeWinnerCb.checked }));
spinSoundCb.addEventListener('change', () => setState({ spinSound: spinSoundCb.checked }));

btnSpin.addEventListener('click', async () => {
  await miro.board.ui.openModal({ url: 'spinner/modal.html', width: 720, height: 520 });
});

btnPlaceSpinner.addEventListener('click', async () => {
  const state = getState();
  const names = state.names || [];
  if (names.length < 2) return;
  const svg = generateWheelSVG(names);
  await placeOnBoard(svg, 400, { _spinner: true, names, removeWinner: state.removeWinner });
});

function generateWheelSVG(names) {
  const size = 400, cx = 200, cy = 200, r = 190, n = names.length;
  const sliceAngle = (2 * Math.PI) / n;
  let paths = '';
  for (let i = 0; i < n; i++) {
    const a1 = i * sliceAngle - Math.PI / 2;
    const a2 = (i + 1) * sliceAngle - Math.PI / 2;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${sliceAngle > Math.PI ? 1 : 0},1 ${x2},${y2} Z" fill="${getColor(i)}"/>`;
    const mid = a1 + sliceAngle / 2, tx = cx + r * .65 * Math.cos(mid), ty = cy + r * .65 * Math.sin(mid);
    const label = names[i].length > 12 ? names[i].slice(0, 11) + '\u2026' : names[i];
    paths += `<text x="${tx}" y="${ty}" transform="rotate(${mid * 180 / Math.PI},${tx},${ty})" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="12" font-weight="600" font-family="Inter,sans-serif">${escapeXml(label)}</text>`;
  }
  paths += `<circle cx="${cx}" cy="${cy}" r="22" fill="#1e293b"/><circle cx="${cx}" cy="${cy}" r="18" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="4" fill="#1e293b"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${paths}</svg>`;
}

// ══════════════════════════════════════════════════════════
// GROUPS MODE
// ══════════════════════════════════════════════════════════

function renderTeams() {
  const state = getState();
  const count = getTeamCount();
  const teams = buildTeams(count);
  setState({ teams });
  teamList.innerHTML = '';
  teams.forEach((team, i) => {
    const row = document.createElement('div');
    row.className = 'team-row';
    const swatch = document.createElement('button');
    swatch.className = 'team-swatch';
    swatch.style.background = team.color;
    swatch.title = 'Change colour';
    swatch.addEventListener('click', () => {
      const idx = PALETTE.indexOf(team.color);
      const updatedTeams = [...getState().teams];
      updatedTeams[i] = { ...updatedTeams[i], color: PALETTE[(idx + 1) % PALETTE.length] };
      setState({ teams: updatedTeams });
      renderTeams();
    });
    const input = document.createElement('input');
    input.className = 'team-name-input';
    input.value = team.name;
    input.addEventListener('change', () => {
      const updatedTeams = [...getState().teams];
      updatedTeams[i] = { ...updatedTeams[i], name: input.value.trim() || `Group ${i + 1}` };
      setState({ teams: updatedTeams });
    });
    row.append(swatch, input);
    teamList.appendChild(row);
  });
}

groupModeSelect.addEventListener('change', () => { setState({ groupMode: groupModeSelect.value }); renderTeams(); });
groupCountInput.addEventListener('change', () => { setState({ groupCount: Math.max(2, parseInt(groupCountInput.value) || 2) }); renderTeams(); });

btnGenerate.addEventListener('click', async () => {
  generateGroups();
  await miro.board.ui.openModal({ url: 'spinner/groups.html', width: 740, height: 520 });
});

btnPlaceGroups.addEventListener('click', async () => {
  const state = getState();
  const groups = state.lastGroups;
  const teams = state.teams || [];
  if (!groups?.length) return;
  const headers = groups.map((_, i) => teams[i]?.name || `Group ${i + 1}`);
  const colorFn = (i) => teams[i]?.color || getColor(i);
  await placeWithFrames(headers, groups, colorFn,
    { _spinnerGroups: true, names: state.names, teams },
    { dirTitle: 'Find Your Group' });
});

// ══════════════════════════════════════════════════════════
// DICE MODE
// ══════════════════════════════════════════════════════════

function renderColorSwatches(container, colors, stateKey) {
  container.innerHTML = '';
  const current = getState()[stateKey] || colors[0];
  colors.forEach((c) => {
    const btn = document.createElement('button');
    btn.className = 'color-swatch' + (c === current ? ' active' : '');
    btn.style.background = c;
    btn.addEventListener('click', () => {
      setState({ [stateKey]: c });
      renderColorSwatches(container, colors, stateKey);
    });
    container.appendChild(btn);
  });
}

function syncDiceOptions() {
  const state = getState();
  diceCountLabel.textContent = state.diceCount || 1;
  diceSidesSelect.value = state.diceSides || 6;
  diceShowTotalCb.checked = state.diceShowTotal !== false;
  diceSoundCb.checked = state.diceSound !== false;
  renderColorSwatches(diceColorsEl, DICE_COLORS, 'diceColor');
}

diceMinus.addEventListener('click', () => { setState({ diceCount: Math.max(1, (getState().diceCount || 1) - 1) }); syncDiceOptions(); });
dicePlus.addEventListener('click', () => { setState({ diceCount: Math.min(6, (getState().diceCount || 1) + 1) }); syncDiceOptions(); });
diceSidesSelect.addEventListener('change', () => setState({ diceSides: parseInt(diceSidesSelect.value) }));
diceShowTotalCb.addEventListener('change', () => setState({ diceShowTotal: diceShowTotalCb.checked }));
diceSoundCb.addEventListener('change', () => setState({ diceSound: diceSoundCb.checked }));

btnRoll.addEventListener('click', async () => {
  await miro.board.ui.openModal({ url: 'spinner/dice.html', width: 560, height: 420 });
});

// ══════════════════════════════════════════════════════════
// COIN MODE
// ══════════════════════════════════════════════════════════

function syncCoinOptions() {
  const state = getState();
  coinCountLabel.textContent = state.coinCount || 1;
  coinSoundCb.checked = state.coinSound !== false;
  renderColorSwatches(coinColorsEl, COIN_COLORS, 'coinColor');
}

coinMinus.addEventListener('click', () => { setState({ coinCount: Math.max(1, (getState().coinCount || 1) - 1) }); syncCoinOptions(); });
coinPlus.addEventListener('click', () => { setState({ coinCount: Math.min(6, (getState().coinCount || 1) + 1) }); syncCoinOptions(); });
coinSoundCb.addEventListener('change', () => setState({ coinSound: coinSoundCb.checked }));

btnFlip.addEventListener('click', async () => {
  const count = getState().coinCount || 1;
  const w = count > 2 ? 560 : 420;
  const h = count > 3 ? 480 : 400;
  await miro.board.ui.openModal({ url: 'spinner/coin.html', width: w, height: h });
});

// ══════════════════════════════════════════════════════════
// ASSIGN MODE
// ══════════════════════════════════════════════════════════

function renderTasks() {
  const tasks = getState().tasks || [];
  const names = getState().names || [];
  const hasTasks = tasks.length > 0;
  const canAssign = hasTasks && names.length >= 1;

  taskListEl.innerHTML = '';
  btnClearTasks.classList.toggle('hidden', !hasTasks);
  btnAssign.disabled = !canAssign;
  btnPlaceAssign.disabled = !getState().lastAssignments;

  tasks.forEach((task, i) => {
    const row = document.createElement('div');
    row.className = 'task-row';

    const num = document.createElement('span');
    num.className = 'task-number';
    num.textContent = i + 1;

    const label = document.createElement('span');
    label.className = 'task-label';
    label.textContent = task;

    const del = document.createElement('button');
    del.className = 'task-delete';
    del.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>';
    del.addEventListener('click', () => {
      const updated = [...(getState().tasks || [])];
      updated.splice(i, 1);
      setState({ tasks: updated, lastAssignments: null });
      renderTasks();
    });

    row.append(num, label, del);
    taskListEl.appendChild(row);
  });
}

function addTask() {
  const val = taskInput.value.trim();
  if (!val) return;
  setState({ tasks: [...(getState().tasks || []), val], lastAssignments: null });
  taskInput.value = '';
  taskInput.focus();
  renderTasks();
}

function syncAssignOptions() {
  const state = getState();
  assignModeSelect.value = state.assignMode || 'groups';
}

btnAddTask.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });

btnClearTasks.addEventListener('click', () => {
  setState({ tasks: [], lastAssignments: null });
  renderTasks();
});

assignModeSelect.addEventListener('change', () => {
  setState({ assignMode: assignModeSelect.value });
});

btnAssign.addEventListener('click', async () => {
  generateAssignments();
  await miro.board.ui.openModal({ url: 'spinner/assign.html', width: 740, height: 520 });
});

btnPlaceAssign.addEventListener('click', async () => {
  const state = getState();
  const data = state.lastAssignments;
  if (!data) return;
  const { tasks, assignments } = data;
  const colorFn = (i) => PALETTE[i % PALETTE.length];
  await placeWithFrames(tasks, assignments, colorFn,
    { _spinnerAssign: true, names: state.names, tasks, assignMode: data.mode },
    { dirTitle: 'Find Your Task' });
});

// ══════════════════════════════════════════════════════════
// STORAGE SYNC
// ══════════════════════════════════════════════════════════

window.addEventListener('storage', () => {
  renderNames();
  renderTeams();
  syncSpinnerOptions();
  syncDiceOptions();
  syncCoinOptions();
  syncAssignOptions();
  renderTasks();
  renderClassList();
});

// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════

const loadPreset = getSafeJSON('spinner-load', null);
localStorage.removeItem('spinner-load');
if (loadPreset?.names?.length) {
  // Loading from a board image — use those names
  setNames(loadPreset.names);
  if (loadPreset.removeWinner != null) setState({ removeWinner: loadPreset.removeWinner });
} else if (!loadPreset) {
  // Fresh open — start with empty names so teacher selects a class
  setNames([]);
}
if (loadPreset?.diceColor) setState({ diceColor: loadPreset.diceColor });
if (loadPreset?.coinColor) setState({ coinColor: loadPreset.coinColor });
if (loadPreset?.tasks) setState({ tasks: loadPreset.tasks });
if (loadPreset?.assignMode) setState({ assignMode: loadPreset.assignMode });

syncSpinnerOptions();
renderNames();
renderTeams();
renderTasks();
renderClassList();
setMode(loadPreset?.mode || getState().mode || 'spinner');

if (loadPreset?.autoSpin) {
  miro.board.ui.openModal({ url: 'spinner/modal.html', width: 720, height: 520 });
}
if (loadPreset?.autoOpen === 'groups') {
  generateGroups();
  miro.board.ui.openModal({ url: 'spinner/groups.html', width: 740, height: 520 });
}
if (loadPreset?.autoOpen === 'dice') {
  miro.board.ui.openModal({ url: 'spinner/dice.html', width: 560, height: 420 });
}
if (loadPreset?.autoOpen === 'coin') {
  const count = getState().coinCount || 1;
  const w = count > 2 ? 560 : 420;
  const h = count > 3 ? 480 : 400;
  miro.board.ui.openModal({ url: 'spinner/coin.html', width: w, height: h });
}
if (loadPreset?.autoOpen === 'assign') {
  generateAssignments();
  miro.board.ui.openModal({ url: 'spinner/assign.html', width: 740, height: 520 });
}
