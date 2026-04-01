// New Graph -- clear settings, open modal
document.getElementById('new-btn').onclick = async () => {
  localStorage.removeItem('axes-settings');
  await miro.board.ui.openModal({ url: 'axes/app.html', width: 950, height: 650 });
};

// Edit Selected -- load from board item title
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
      localStorage.setItem('axes-settings', title);
      await miro.board.ui.openModal({ url: 'axes/app.html', width: 950, height: 650 });
    } else {
      await miro.board.notifications.showError('Selected item is not an axes image');
    }
  } catch {
    await miro.board.notifications.showError('Selected item has no axes data');
  }
};

// Recently used -- load from localStorage
function renderRecents() {
  const recents = JSON.parse(localStorage.getItem('axes-recents') || '[]');
  const container = document.getElementById('recents');
  if (recents.length === 0) {
    container.innerHTML = '<p class="hint">No recent graphs yet</p>';
    return;
  }
  container.innerHTML = '';
  recents.forEach((settings) => {
    const btn = document.createElement('button');
    btn.className = 'recent-card';
    btn.textContent = `x: ${settings.xMin} to ${settings.xMax},  y: ${settings.yMin} to ${settings.yMax}`;
    btn.onclick = async () => {
      localStorage.setItem('axes-settings', JSON.stringify(settings));
      await miro.board.ui.openModal({ url: 'axes/app.html', width: 950, height: 650 });
    };
    container.appendChild(btn);
  });
}

// Library -- named saved graphs
function renderLibrary() {
  const library = JSON.parse(localStorage.getItem('axes-library') || '[]');
  const container = document.getElementById('library');
  if (library.length === 0) {
    container.innerHTML = '<p class="hint">No saved graphs yet</p>';
    return;
  }
  container.innerHTML = '';
  library.forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'library-row';

    const btn = document.createElement('button');
    btn.className = 'library-card';
    btn.textContent = entry.name || `Graph ${index + 1}`;
    btn.title = `x: ${entry.settings.xMin} to ${entry.settings.xMax},  y: ${entry.settings.yMin} to ${entry.settings.yMax}`;
    btn.onclick = async () => {
      localStorage.setItem('axes-settings', JSON.stringify(entry.settings));
      await miro.board.ui.openModal({ url: 'axes/app.html', width: 950, height: 650 });
    };

    const del = document.createElement('button');
    del.className = 'library-delete';
    del.innerHTML = '&times;';
    del.title = 'Remove from library';
    del.onclick = () => {
      const updated = JSON.parse(localStorage.getItem('axes-library') || '[]');
      updated.splice(index, 1);
      localStorage.setItem('axes-library', JSON.stringify(updated));
      renderLibrary();
    };

    row.appendChild(btn);
    row.appendChild(del);
    container.appendChild(row);
  });
}

renderRecents();
renderLibrary();

// Re-render after modal closes (in case something was saved to library)
window.addEventListener('focus', () => {
  renderRecents();
  renderLibrary();
});
