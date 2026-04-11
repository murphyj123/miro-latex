import { getSafeJSON, setSafeJSON } from '../../shared/storage-utils.js';
import { makeCollapsible } from '../../shared/ui-helpers.js';

// ── Open modal helpers ───────────────────────────────

async function openEditor(settings) {
  if (settings) setSafeJSON('axes-settings', settings);
  await miro.board.ui.openModal({ url: 'axes/app.html', width: 950, height: 650 });
}

// ── New Graph ────────────────────────────────────────

document.getElementById('new-btn').onclick = async () => {
  localStorage.removeItem('axes-settings');
  await openEditor(null);
};

// ── Edit Selected ────────────────────────────────────

document.getElementById('edit-btn').onclick = async () => {
  const selection = await miro.board.getSelection();
  if (selection.length === 0) {
    await miro.board.notifications.showError('Select an axes image first');
    return;
  }
  const title = selection[0].title;
  try {
    const settings = JSON.parse(title);
    if (settings._axesGen) {
      await openEditor(settings);
    } else {
      await miro.board.notifications.showError('Selected item is not an axes image');
    }
  } catch (err) {
    console.warn('[axes] editSelected: could not parse image title', err);
    await miro.board.notifications.showError('Selected item has no axes data');
  }
};

// ── Collapsible sections ─────────────────────────────

makeCollapsible('recents-header', 'recents-chevron', 'recents-body');
makeCollapsible('library-header', 'library-chevron', 'library-body');

// ── Recents ──────────────────────────────────────────

let _lastRecentsJson = null;
let _lastLibraryJson = null;

function renderRecents() {
  const json = localStorage.getItem('axes-recents') || '[]';
  if (json === _lastRecentsJson) return;
  _lastRecentsJson = json;
  const recents = getSafeJSON('axes-recents', []);
  const container = document.getElementById('recents-body');
  if (recents.length === 0) {
    container.innerHTML = '<p class="hint">No recent graphs yet</p>';
    return;
  }
  container.innerHTML = '';
  recents.forEach((settings) => {
    const btn = document.createElement('button');
    btn.className = 'recent-card';
    const label = document.createElement('span');
    label.className = 'recent-card-label';
    label.textContent = `x: ${settings.xMin} to ${settings.xMax},  y: ${settings.yMin} to ${settings.yMax}`;
    btn.appendChild(label);
    btn.onclick = () => openEditor(settings);
    container.appendChild(btn);
  });
}

// ── Rename dialog ────────────────────────────────────

let _renameCallback = null;

function showRenameDialog(currentName, callback) {
  const overlay = document.getElementById('rename-overlay');
  const input = document.getElementById('rename-input');
  input.value = currentName;
  overlay.classList.remove('hidden');
  input.focus();
  input.select();
  _renameCallback = callback;
}

function closeRenameDialog() {
  document.getElementById('rename-overlay').classList.add('hidden');
  _renameCallback = null;
}

document.getElementById('rename-cancel').onclick = closeRenameDialog;

document.getElementById('rename-ok').onclick = () => {
  const val = document.getElementById('rename-input').value.trim();
  if (_renameCallback && val) _renameCallback(val);
  closeRenameDialog();
};

document.getElementById('rename-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('rename-ok').click();
  if (e.key === 'Escape') closeRenameDialog();
});

// ── Library ──────────────────────────────────────────

function renderLibrary() {
  const json = localStorage.getItem('axes-library') || '[]';
  if (json === _lastLibraryJson) return;
  _lastLibraryJson = json;
  const library = getSafeJSON('axes-library', []);
  const container = document.getElementById('library-body');
  if (library.length === 0) {
    container.innerHTML = '<p class="hint">No saved graphs yet</p>';
    return;
  }
  container.innerHTML = '';
  library.forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'library-row';

    const card = document.createElement('button');
    card.className = 'library-card';
    const nameEl = document.createElement('span');
    nameEl.className = 'library-card-name';
    nameEl.textContent = entry.name || `Graph ${index + 1}`;
    card.title = `x: ${entry.settings.xMin} to ${entry.settings.xMax},  y: ${entry.settings.yMin} to ${entry.settings.yMax}`;
    card.appendChild(nameEl);
    card.onclick = () => openEditor(entry.settings);

    const renameBtn = document.createElement('button');
    renameBtn.className = 'icon-btn icon-btn-rename';
    renameBtn.title = 'Rename';
    renameBtn.innerHTML = `<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 1.5l2.5 2.5-6 6H3v-2.5l6-6z"/></svg>`;
    renameBtn.onclick = (e) => {
      e.stopPropagation();
      showRenameDialog(entry.name || '', (newName) => {
        const updated = getSafeJSON('axes-library', []);
        if (updated[index]) updated[index].name = newName;
        setSafeJSON('axes-library', updated);
        renderLibrary();
      });
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn icon-btn-delete';
    deleteBtn.title = 'Remove';
    deleteBtn.innerHTML = `<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="2" y1="2" x2="11" y2="11"/><line x1="11" y1="2" x2="2" y2="11"/></svg>`;
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      const updated = getSafeJSON('axes-library', []);
      updated.splice(index, 1);
      setSafeJSON('axes-library', updated);
      renderLibrary();
    };

    row.appendChild(card);
    row.appendChild(renameBtn);
    row.appendChild(deleteBtn);
    container.appendChild(row);
  });
}

// ── Init ─────────────────────────────────────────────

renderRecents();
renderLibrary();

window.addEventListener('focus', () => {
  renderRecents();
  renderLibrary();
});
