// Side panel — actions + formula library
import { formulaLibrary } from './formula-library.js';

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
}

function svgToDataUrl(svgElement) {
  const clone = svgElement.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const vb = clone.getAttribute('viewBox');
  let minX = 0, minY = 0, w, h;
  if (vb) {
    const parts = vb.split(/[\s,]+/).map(Number);
    minX = parts[0]; minY = parts[1]; w = parts[2]; h = parts[3];
  } else {
    w = svgElement.scrollWidth; h = svgElement.scrollHeight;
  }

  const pad = Math.max(w, h) * 0.15;
  const nX = minX - pad, nY = minY - pad, nW = w + pad * 2, nH = h + pad * 2;
  clone.setAttribute('viewBox', `${nX} ${nY} ${nW} ${nH}`);
  clone.setAttribute('width', nW);
  clone.setAttribute('height', nH);

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', nX); bg.setAttribute('y', nY);
  bg.setAttribute('width', nW); bg.setAttribute('height', nH);
  bg.setAttribute('fill', '#ffffff');
  clone.insertBefore(bg, clone.firstChild);

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(clone.outerHTML)))}`;
}

async function renderLatex(latex) {
  const container = await MathJax.tex2svgPromise(latex);
  MathJax.startup.document.clear();
  MathJax.startup.document.updateDocument();
  return container.querySelector('svg');
}

// Convert selected text → image
async function convertSelection() {
  const btn = document.getElementById('convert-selection');
  btn.disabled = true;
  try {
    const selection = await miro.board.getSelection();
    if (selection.length === 0) {
      await miro.board.notifications.showError('Select a text item on the board first');
      return;
    }
    let converted = 0;
    for (const item of selection) {
      const raw = item.content || item.plainText || '';
      if (!raw) continue;
      const doc = new DOMParser().parseFromString(raw, 'text/html');
      const latex = doc.body.textContent.trim();
      if (!latex) continue;
      const svg = await renderLatex(latex);
      if (svg) {
        const url = svgToDataUrl(svg);
        await miro.board.createImage({
          url, x: item.x + (item.width || 200) + 50, y: item.y,
          width: 300, title: latex,
        });
        converted++;
      }
    }
    if (converted === 0) {
      await miro.board.notifications.showError('No text content found');
    }
  } catch (err) {
    await miro.board.notifications.showError('Error: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

// Load LaTeX from selected image → editor
async function editSelected() {
  try {
    const selection = await miro.board.getSelection();
    if (selection.length === 0) {
      await miro.board.notifications.showError('Select a LaTeX image on the board first');
      return;
    }
    const latex = selection[0].title || '';
    if (!latex || latex === 'LaTeX') {
      await miro.board.notifications.showError('Selected item has no LaTeX source');
      return;
    }
    localStorage.setItem('miro-latex', latex);
    await miro.board.ui.openModal({ url: 'modal.html', width: 900, height: 600 });
  } catch (err) {
    await miro.board.notifications.showError('Error: ' + err.message);
  }
}

// Open the full editor
async function openModal() {
  try {
    await miro.board.ui.openModal({ url: 'modal.html', width: 900, height: 600 });
  } catch (err) {
    await miro.board.notifications.showError('Failed to open editor');
  }
}

// Open modal with library pre-selected
async function openLibrary(subjectName) {
  try {
    localStorage.setItem('miro-latex-lib-subject', subjectName || '');
    await miro.board.ui.openModal({ url: 'modal.html', width: 900, height: 600 });
  } catch (err) {
    await miro.board.notifications.showError('Failed to open library');
  }
}

// Build subject buttons for the panel
function buildSubjectButtons() {
  const container = document.getElementById('panel-subjects');

  for (const subj of formulaLibrary) {
    const btn = document.createElement('button');
    btn.className = 'panel-subject-btn';
    btn.onclick = () => openLibrary(subj.subject);

    const icon = document.createElement('span');
    icon.className = 'panel-subject-icon';
    icon.textContent = subj.subject.replace('IB ', '').charAt(0);

    const text = document.createElement('span');
    text.className = 'panel-subject-text';

    const name = document.createElement('span');
    name.className = 'panel-subject-name';
    name.textContent = subj.subject.replace('IB ', '');

    const count = document.createElement('span');
    count.className = 'panel-subject-count';
    const total = subj.categories.reduce((sum, c) => sum + c.formulae.length, 0);
    count.textContent = total + ' formulae';

    text.appendChild(name);
    text.appendChild(count);
    btn.appendChild(icon);
    btn.appendChild(text);
    container.appendChild(btn);
  }
}

function renderRecents() {
  const section = document.getElementById('recent-section');
  const list = document.getElementById('recent-list');
  const recents = JSON.parse(localStorage.getItem('miro-latex-recent') || '[]');
  list.innerHTML = '';
  if (recents.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';
  for (const item of recents) {
    const btn = document.createElement('button');
    btn.className = 'recent-item';
    btn.textContent = item.latex;
    btn.title = item.latex;
    btn.onclick = () => {
      localStorage.setItem('miro-latex', item.latex);
      miro.board.ui.openModal({ url: 'modal.html', width: 900, height: 600 });
    };
    list.appendChild(btn);
  }
}

function newDocument() {
  localStorage.removeItem('miro-latex');
  miro.board.ui.openModal({ url: 'modal.html', width: 900, height: 600 });
}

async function init() {
  // Fresh start on panel load
  localStorage.removeItem('miro-latex');

  document.getElementById('open-modal').onclick = openModal;
  document.getElementById('convert-selection').onclick = convertSelection;
  document.getElementById('edit-selected').onclick = editSelected;
  document.getElementById('new-btn').onclick = newDocument;

  // Help
  const helpOverlay = document.getElementById('help-overlay');
  document.getElementById('help-btn').onclick = () => helpOverlay.classList.add('visible');
  document.getElementById('help-close').onclick = () => helpOverlay.classList.remove('visible');
  helpOverlay.onclick = (e) => { if (e.target === helpOverlay) helpOverlay.classList.remove('visible'); };

  buildSubjectButtons();
  renderRecents();

  // Re-render recents when panel regains focus (e.g. after modal closes)
  window.addEventListener('focus', renderRecents);
}

window.addEventListener('load', init);
