import { getSafeJSON } from '../../shared/storage-utils.js';

// ── Open modal ───────────────────────────────────────

async function openEditor(settings) {
  if (settings) setSafeJSON('bansho-settings', settings);
  await miro.board.ui.openModal({ url: 'bansho/app.html', width: 1100, height: 720 });
}

// ── New Board ────────────────────────────────────────

document.getElementById('new-btn').onclick = async () => {
  localStorage.removeItem('bansho-settings');
  await openEditor(null);
};

// ── Edit Selected ────────────────────────────────────

document.getElementById('edit-btn').onclick = async () => {
  const sel = await miro.board.getSelection();
  const img = sel.find(i => i.type === 'image');
  if (!img) {
    await miro.board.notifications.showError('Select a Bansho board image first');
    return;
  }
  try {
    const cfg = JSON.parse(img.title);
    if (!cfg._banshoGen) throw new Error('Not a Bansho image');
    await openEditor(cfg);
  } catch (err) {
    console.warn('[bansho] editSelected: could not parse image title', err);
    await miro.board.notifications.showError('Selected image is not a Bansho board');
  }
};

// ── Collapsible ──────────────────────────────────────

let open = true;
document.getElementById('recents-header').addEventListener('click', () => {
  open = !open;
  document.getElementById('recents-body').classList.toggle('hidden', !open);
  document.getElementById('recents-chevron').classList.toggle('closed', !open);
});

// ── Recents ──────────────────────────────────────────

function renderRecents() {
  const recents = getSafeJSON('bansho-recents', []);
  const container = document.getElementById('recents-body');
  if (!recents.length) {
    container.innerHTML = '<p class="hint">No recent boards yet</p>';
    return;
  }
  container.innerHTML = '';
  recents.forEach(({ cfg }) => {
    const btn = document.createElement('button');
    btn.className = 'panel-card';
    const themeLabel = { light: 'Light', dark: 'Dark', chalk: 'Chalk' }[cfg.theme] || cfg.theme;

    const content = document.createElement('div');
    content.className = 'card-content';

    const nameEl = document.createElement('div');
    nameEl.className = 'card-name';
    nameEl.textContent = `${cfg.slots}-slot Bansho · ${themeLabel}`;

    const descEl = document.createElement('div');
    descEl.className = 'card-desc';
    descEl.textContent = cfg.mode === 'demo' ? 'Demo mode' : 'Blank';

    content.appendChild(nameEl);
    content.appendChild(descEl);
    btn.appendChild(content);
    btn.onclick = () => openEditor(cfg);
    container.appendChild(btn);
  });
}

window.addEventListener('focus', renderRecents);
renderRecents();
