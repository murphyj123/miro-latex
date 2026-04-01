// Modal — full-featured LaTeX editor with symbols, templates, and preview
import { symbolGroups } from './latex-data.js';
import { formulaLibrary } from './formula-library.js';
import functionPlot from 'function-plot';

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
}

function svgToDataUrl(svgElement, bgColor, textColor) {
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
  bg.setAttribute('fill', bgColor);
  clone.insertBefore(bg, clone.firstChild);

  // Apply text colour to all rendered elements
  clone.setAttribute('color', textColor);
  clone.querySelectorAll('[fill]').forEach((el) => {
    const f = el.getAttribute('fill');
    if (f === 'currentColor' || f === '#000' || f === '#000000' || f === 'black') {
      el.setAttribute('fill', textColor);
    }
  });
  clone.querySelectorAll('[stroke]').forEach((el) => {
    const s = el.getAttribute('stroke');
    if (s === 'currentColor' || s === '#000' || s === '#000000' || s === 'black') {
      el.setAttribute('stroke', textColor);
    }
  });

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(clone.outerHTML)))}`;
}

async function renderLatex(latex) {
  const container = await MathJax.tex2svgPromise(latex);
  MathJax.startup.document.clear();
  MathJax.startup.document.updateDocument();
  return container.querySelector('svg');
}

// Insert text at cursor
function insertAtCursor(texinput, text) {
  texinput.focus();
  const start = texinput.selectionStart;
  const end = texinput.selectionEnd;
  const before = texinput.value.substring(0, start);
  const after = texinput.value.substring(end);
  texinput.value = before + text + after;
  texinput.selectionStart = texinput.selectionEnd = start + text.length;
}

function insertLatex(latex) {
  const texinput = document.getElementById('modal-texinput');
  texinput.focus();
  insertAtCursor(texinput, latex);
  localStorage.setItem('miro-latex', texinput.value);
  convert();
}

// Wrap selected text with a LaTeX command, or insert empty if no selection
function wrapSelection(command) {
  const texinput = document.getElementById('modal-texinput');
  const start = texinput.selectionStart;
  const end = texinput.selectionEnd;
  const selected = texinput.value.substring(start, end);
  texinput.focus();

  if (selected) {
    // Wrap selection: \command{selected text}
    const wrapped = command.replace('{}', '{' + selected + '}');
    insertAtCursor(texinput, wrapped);
  } else {
    // No selection: insert empty and place cursor inside braces
    insertAtCursor(texinput, command);
    // Move cursor back to inside the braces
    const bracePos = command.lastIndexOf('}');
    if (bracePos > 0) {
      const offset = command.length - bracePos;
      texinput.selectionStart = texinput.selectionEnd = texinput.selectionStart - offset;
    }
  }
  localStorage.setItem('miro-latex', texinput.value);
  convert();
}

function prepareLatex(input) {
  // If already in an environment, pass through as-is
  if (input.includes('\\begin{')) return input;

  // Split on lines. If multiple non-empty lines exist, treat each as a
  // separate expression and join with \\ inside gathered.
  const lines = input.split('\n').map((l) => l.trim()).filter((l) => l);
  if (lines.length > 1) {
    return '\\begin{gathered}\n' + lines.join(' \\\\\n') + '\n\\end{gathered}';
  }
  return input;
}

async function convert() {
  const raw = document.getElementById('modal-texinput').value.trim();
  const output = document.getElementById('modal-texoutput');
  output.textContent = '';
  if (!raw) return;

  const input = prepareLatex(raw);
  try {
    const svg = await renderLatex(input);
    if (svg) {
      const wrapper = svg.parentElement || document.createElement('div');
      if (!svg.parentElement) wrapper.appendChild(svg);
      output.appendChild(wrapper);
    }
  } catch (err) {
    const pre = document.createElement('pre');
    // Strip MathJax internal details — show only the relevant part
    let msg = err.message || String(err);
    const match = msg.match(/TeX parse error:\s*(.*)/i) || msg.match(/Error:\s*(.*)/i);
    if (match) msg = match[1];
    pre.textContent = msg;
    pre.className = 'error-text';
    output.appendChild(pre);
  }
}

async function placeOnBoard() {
  let svg = document.getElementById('modal-texoutput').querySelector('svg');
  if (!svg) {
    await convert();
    svg = document.getElementById('modal-texoutput').querySelector('svg');
    if (!svg) {
      await miro.board.notifications.showError('No LaTeX to place — check your input');
      return;
    }
  }

  const bgColor = document.getElementById('modal-bg-color').value;
  const textColor = document.getElementById('modal-text-color').value;
  const latex = document.getElementById('modal-texinput').value.trim();
  const url = svgToDataUrl(svg, bgColor, textColor);

  const vp = await miro.board.viewport.get();
  const cx = vp.x + vp.width / 2;
  const cy = vp.y + vp.height / 2;

  const imgSize = parseInt(document.getElementById('modal-img-size').value, 10) || 400;
  await miro.board.createImage({
    url, x: cx, y: cy, width: imgSize, title: latex || 'LaTeX',
  });

  // Save to recent
  const recents = JSON.parse(localStorage.getItem('miro-latex-recent') || '[]');
  const entry = { latex: latex.substring(0, 100), time: Date.now() };
  const filtered = recents.filter(r => r.latex !== entry.latex);
  filtered.unshift(entry);
  localStorage.setItem('miro-latex-recent', JSON.stringify(filtered.slice(0, 8)));

  // Close the modal after placing
  miro.board.ui.closeModal();
}

function buildToolbar() {
  const bar = document.getElementById('modal-symbol-bar');

  for (const [groupName, symbols] of symbolGroups) {
    const wrapper = document.createElement('div');
    wrapper.className = 'toolbar-dropdown';

    const trigger = document.createElement('button');
    trigger.className = 'toolbar-dropdown-trigger';
    trigger.textContent = groupName;
    wrapper.appendChild(trigger);

    const menu = document.createElement('div');
    menu.className = 'toolbar-dropdown-menu';
    for (const [display, latex] of symbols) {
      const btn = document.createElement('button');
      btn.className = 'toolbar-btn';
      btn.textContent = display;
      btn.onclick = () => { insertLatex(latex); menu.classList.remove('open'); };
      menu.appendChild(btn);
    }
    wrapper.appendChild(menu);

    trigger.onclick = (e) => {
      e.stopPropagation();
      bar.querySelectorAll('.toolbar-dropdown-menu.open').forEach((m) => {
        if (m !== menu) m.classList.remove('open');
      });
      menu.classList.toggle('open');
    };

    bar.appendChild(wrapper);
  }

  document.addEventListener('click', () => {
    bar.querySelectorAll('.toolbar-dropdown-menu.open').forEach((m) => m.classList.remove('open'));
  });
}

function buildFormattingBar() {
  const bar = document.getElementById('fmt-bar');

  const groups = [
    // Text formatting — these wrap selected text
    [
      { label: 'B', tip: 'Bold', latex: '\\mathbf{}', wrap: true },
      { label: 'I', tip: 'Italic', latex: '\\mathit{}', wrap: true, cls: 'fmt-italic' },
      { label: 'U', tip: 'Underline', latex: '\\underline{}', wrap: true },
      { label: 'Tt', tip: 'Text mode', latex: '\\text{}', wrap: true },
      { label: '<s>S</s>', tip: 'Strikethrough', latex: '\\cancel{}', wrap: true },
    ],
    // Math
    [
      { label: 'a/b', tip: 'Fraction', latex: '\\frac{}{}', wrap: false, cursor: -3 },
      { label: '\u221A', tip: 'Square root', latex: '\\sqrt{}', wrap: true },
      { label: 'x\u207F', tip: 'Superscript', latex: 'x^{}', wrap: true },
      { label: 'x\u2099', tip: 'Subscript', latex: 'x_{}', wrap: true },
    ],
    // Layout
    [
      { label: '\u21B5', tip: 'New line', latex: '\n' },
      { label: '&', tip: 'Alignment point (for aligned/array)', latex: '& ' },
    ],
    // Decorations
    [
      { label: '\u25A1', tip: 'Boxed', latex: '\\boxed{}', wrap: true },
      { label: '\uD83C\uDFA8', tip: 'Colour', latex: '\\color{red}{}', wrap: true },
      { label: '\u2014', tip: 'Horizontal rule', latex: '\\rule{6cm}{0.4pt}' },
      { label: '\u23DF', tip: 'Underbrace', latex: '\\underbrace{}_{}', cursor: -4 },
    ],
    // Structures
    [
      { label: 'Align', tip: 'Aligned equations', latex: '\\begin{aligned}\n  & \n\\end{aligned}' },
      { label: 'Cases', tip: 'Piecewise', latex: '\\begin{cases}\n  & \\text{if } \\\\\n  & \\text{if } \n\\end{cases}' },
      { label: 'Matrix', tip: '2×2 Matrix', latex: '\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}' },
      { label: 'Table', tip: 'Table', latex: '\\begin{array}{|c|c|c|}\n\\hline\n  &  &  \\\\\n\\hline\n  &  &  \\\\\n\\hline\n\\end{array}' },
    ],
  ];

  // Brackets as a dropdown menu
  const bracketGroup = document.createElement('div');
  bracketGroup.className = 'toolbar-dropdown';
  bracketGroup.style.display = 'inline-flex';

  const bracketTrigger = document.createElement('button');
  bracketTrigger.className = 'fmt-btn';
  bracketTrigger.type = 'button';
  bracketTrigger.textContent = '( )';
  bracketTrigger.title = 'Brackets';
  bracketGroup.appendChild(bracketTrigger);

  const bracketMenu = document.createElement('div');
  bracketMenu.className = 'toolbar-dropdown-menu';
  const brackets = [
    ['( )', '\\left( \\right)', -8],
    ['[ ]', '\\left[ \\right]', -8],
    ['{ }', '\\left\\{ \\right\\}', -9],
    ['| |', '\\left| \\right|', -8],
    ['\u2016 \u2016', '\\left\\| \\right\\|', -9],
    ['\u2308 \u2309', '\\lceil \\rceil', -7],
    ['\u230A \u230B', '\\lfloor \\rfloor', -8],
  ];
  for (const [label, latex, cursor] of brackets) {
    const btn = document.createElement('button');
    btn.className = 'toolbar-btn';
    btn.textContent = label;
    btn.onclick = () => {
      const texinput = document.getElementById('modal-texinput');
      texinput.focus();
      insertAtCursor(texinput, latex);
      if (cursor) texinput.selectionStart = texinput.selectionEnd = texinput.selectionStart + cursor;
      localStorage.setItem('miro-latex', texinput.value);
      convert();
      bracketMenu.classList.remove('open');
    };
    bracketMenu.appendChild(btn);
  }
  bracketGroup.appendChild(bracketMenu);
  bracketTrigger.onclick = (e) => {
    e.stopPropagation();
    bracketMenu.classList.toggle('open');
  };
  document.addEventListener('click', () => bracketMenu.classList.remove('open'));

  groups.forEach((group, gi) => {
    if (gi > 0) {
      const sep = document.createElement('span');
      sep.className = 'fmt-sep';
      bar.appendChild(sep);
    }
    group.forEach((item) => {
      const btn = document.createElement('button');
      btn.className = 'fmt-btn' + (item.cls ? ' ' + item.cls : '');
      btn.type = 'button';
      btn.innerHTML = item.label;
      if (item.tip) btn.title = item.tip;
      btn.addEventListener('click', () => {
        if (item.wrap) {
          wrapSelection(item.latex);
        } else {
          const texinput = document.getElementById('modal-texinput');
          texinput.focus();
          insertAtCursor(texinput, item.latex);
          // Move cursor if needed
          if (item.cursor) {
            texinput.selectionStart = texinput.selectionEnd = texinput.selectionStart + item.cursor;
          }
          localStorage.setItem('miro-latex', texinput.value);
          convert();
        }
      });
      bar.appendChild(btn);
    });
    // Insert bracket dropdown after Layout group (index 2)
    if (gi === 2) {
      bar.appendChild(bracketGroup);
    }
  });
}

function buildLibraryOverlay() {
  const libOverlay = document.createElement('div');
  libOverlay.className = 'lib-overlay';
  libOverlay.id = 'modal-library-overlay';

  libOverlay.innerHTML = `
    <div class="lib-modal">
      <div class="lib-modal-header">
        <span class="lib-modal-title">Formula Library</span>
        <input type="text" class="lib-modal-search" placeholder="Search formulae..." />
        <button type="button" class="lib-modal-close">&times;</button>
      </div>
      <div class="lib-modal-body">
        <nav class="lib-sidebar" id="lib-sidebar"></nav>
        <div class="lib-content" id="lib-content"></div>
      </div>
    </div>
  `;

  document.body.appendChild(libOverlay);

  const sidebar = libOverlay.querySelector('#lib-sidebar');
  const content = libOverlay.querySelector('#lib-content');
  const searchInput = libOverlay.querySelector('.lib-modal-search');
  const closeBtn = libOverlay.querySelector('.lib-modal-close');
  let activeSubject = null;
  let activeCategory = null;

  function renderCategoryPreviews(container) {
    const previews = container.querySelectorAll('.lib-formula-preview:not([data-rendered])');
    previews.forEach((span) => {
      span.dataset.rendered = '1';
      const latex = span.dataset.latex;
      MathJax.tex2svgPromise(latex).then((node) => {
        MathJax.startup.document.clear();
        MathJax.startup.document.updateDocument();
        span.appendChild(node);
      }).catch(() => {
        const code = document.createElement('code');
        code.textContent = latex.length > 40 ? latex.substring(0, 37) + '...' : latex;
        code.style.cssText = 'color:#999;font-size:10px';
        span.appendChild(code);
      });
    });
  }

  function renderSidebar(filter) {
    sidebar.innerHTML = '';
    const q = (filter || '').toLowerCase();

    for (const subj of formulaLibrary) {
      const subjBtn = document.createElement('div');
      subjBtn.className = 'lib-sidebar-subject' + (activeSubject === subj.subject ? ' active' : '');
      subjBtn.textContent = subj.subject.replace('IB ', '');
      subjBtn.onclick = () => { activeSubject = subj.subject; activeCategory = null; renderSidebar(filter); renderContent(filter); };
      sidebar.appendChild(subjBtn);

      // Show category sub-items when subject is active
      if (activeSubject === subj.subject) {
        for (const cat of subj.categories) {
          const matchCount = q ? cat.formulae.filter(([l, x]) =>
            l.toLowerCase().includes(q) || x.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q)
          ).length : cat.formulae.length;
          if (q && matchCount === 0) continue;

          const catBtn = document.createElement('div');
          catBtn.className = 'lib-sidebar-category' + (activeCategory === cat.name ? ' active' : '');
          catBtn.textContent = cat.name;
          const count = document.createElement('span');
          count.className = 'lib-sidebar-count';
          count.textContent = matchCount;
          catBtn.appendChild(count);
          catBtn.onclick = (e) => { e.stopPropagation(); activeCategory = cat.name; renderSidebar(filter); renderContent(filter); };
          sidebar.appendChild(catBtn);
        }
      }
    }
  }

  function renderContent(filter) {
    content.innerHTML = '';
    const q = (filter || '').toLowerCase();

    if (!activeSubject) {
      content.innerHTML = '<div style="padding:40px;text-align:center;color:#bbb">Select a subject from the sidebar</div>';
      return;
    }

    const subj = formulaLibrary.find((s) => s.subject === activeSubject);
    if (!subj) return;

    const catsToShow = activeCategory
      ? subj.categories.filter((c) => c.name === activeCategory)
      : subj.categories;

    for (const cat of catsToShow) {
      const filtered = q
        ? cat.formulae.filter(([l, x]) => l.toLowerCase().includes(q) || x.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q))
        : cat.formulae;
      if (filtered.length === 0) continue;

      if (!activeCategory) {
        const catTitle = document.createElement('div');
        catTitle.className = 'lib-content-cat-title';
        catTitle.textContent = cat.name;
        content.appendChild(catTitle);
      }

      const grid = document.createElement('div');
      grid.className = 'lib-content-grid';

      for (const [label, latex] of filtered) {
        const card = document.createElement('button');
        card.className = 'lib-content-card';
        card.type = 'button';

        const name = document.createElement('div');
        name.className = 'lib-content-card-name';
        name.textContent = label;

        const preview = document.createElement('div');
        preview.className = 'lib-formula-preview';
        preview.dataset.latex = latex;

        card.appendChild(preview);
        card.appendChild(name);

        card.onclick = () => {
          insertLatex(latex);
          libOverlay.classList.remove('visible');
          searchInput.value = '';
        };

        grid.appendChild(card);
      }

      content.appendChild(grid);
      renderCategoryPreviews(grid);
    }

    if (content.children.length === 0) {
      content.innerHTML = '<div style="padding:40px;text-align:center;color:#bbb">No formulae found</div>';
    }
  }

  // Default to first subject
  if (formulaLibrary.length > 0) {
    activeSubject = formulaLibrary[0].subject;
  }

  document.getElementById('modal-library-btn').onclick = () => {
    if (!libOverlay.classList.contains('visible')) {
      searchInput.value = '';
      renderSidebar('');
      renderContent('');
    }
    libOverlay.classList.toggle('visible');
    if (libOverlay.classList.contains('visible')) {
      setTimeout(() => searchInput.focus(), 50);
    }
  };

  searchInput.addEventListener('input', debounce(() => {
    const q = searchInput.value;
    renderSidebar(q);
    renderContent(q);
  }, 200));

  closeBtn.onclick = () => libOverlay.classList.remove('visible');
  libOverlay.onclick = (e) => { if (e.target === libOverlay) libOverlay.classList.remove('visible'); };

  // Return a function to open the library with a specific subject pre-selected
  return function openWithSubject(subjectName) {
    if (subjectName) {
      const subj = formulaLibrary.find((s) => s.subject === subjectName);
      if (subj) activeSubject = subj.subject;
    }
    searchInput.value = '';
    renderSidebar('');
    renderContent('');
    libOverlay.classList.add('visible');
    setTimeout(() => searchInput.focus(), 50);
  };
}

const GRAPH_DEFAULT_COLORS = ['#14b8a6', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];

function buildGraphOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'graph-overlay';
  overlay.id = 'modal-graph-overlay';

  overlay.innerHTML = `
    <div class="graph-modal">
      <div class="graph-modal-header">
        <span class="graph-modal-title">Function Graph</span>
        <button type="button" class="graph-modal-close">&times;</button>
      </div>
      <div class="graph-modal-body">
        <div class="graph-controls">
          <div class="graph-functions" id="graph-functions">
            <div class="graph-fn-row" data-index="0">
              <input type="text" class="graph-fn-input" placeholder="e.g. x^2, sin(x), ln(x)" value="x^2" />
              <input type="color" class="graph-fn-color" value="#14b8a6" />
              <button type="button" class="graph-fn-remove" title="Remove" style="visibility:hidden">&times;</button>
            </div>
          </div>
          <button type="button" class="graph-add-fn-btn" id="graph-add-fn">+ Add function</button>

          <div class="graph-range-group">
            <div class="graph-range-row">
              <label class="graph-range-label">x-min</label>
              <input type="number" class="graph-range-input" id="graph-xmin" value="-10" />
              <label class="graph-range-label">x-max</label>
              <input type="number" class="graph-range-input" id="graph-xmax" value="10" />
            </div>
            <div class="graph-range-row">
              <label class="graph-range-label">y-min</label>
              <input type="number" class="graph-range-input" id="graph-ymin" value="-10" />
              <label class="graph-range-label">y-max</label>
              <input type="number" class="graph-range-input" id="graph-ymax" value="10" />
            </div>
          </div>

          <label class="graph-check">
            <input type="checkbox" id="graph-grid" checked />
            <span>Show grid</span>
          </label>

          <button type="button" class="place-btn graph-place-btn" id="graph-place">Place on Board</button>
        </div>
        <div class="graph-preview-area">
          <div id="graph-preview"></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('.graph-modal-close');
  const fnContainer = overlay.querySelector('#graph-functions');
  const addFnBtn = overlay.querySelector('#graph-add-fn');
  const placeBtn = overlay.querySelector('#graph-place');

  function getFunctions() {
    const rows = fnContainer.querySelectorAll('.graph-fn-row');
    const fns = [];
    rows.forEach((row) => {
      const expr = row.querySelector('.graph-fn-input').value.trim();
      const color = row.querySelector('.graph-fn-color').value;
      if (expr) fns.push({ fn: expr, color });
    });
    return fns;
  }

  function updateGraph() {
    const fns = getFunctions();
    if (fns.length === 0) return;

    const xMin = parseFloat(document.getElementById('graph-xmin').value) || -10;
    const xMax = parseFloat(document.getElementById('graph-xmax').value) || 10;
    const yMin = parseFloat(document.getElementById('graph-ymin').value) || -10;
    const yMax = parseFloat(document.getElementById('graph-ymax').value) || 10;
    const showGrid = document.getElementById('graph-grid').checked;

    try {
      functionPlot({
        target: '#graph-preview',
        width: 400,
        height: 300,
        xAxis: { domain: [xMin, xMax] },
        yAxis: { domain: [yMin, yMax] },
        grid: showGrid,
        data: fns,
      });
    } catch (err) {
      const preview = document.getElementById('graph-preview');
      preview.textContent = '';
      const div = document.createElement('div');
      div.className = 'graph-error';
      div.textContent = err.message || 'Invalid expression';
      preview.appendChild(div);
    }
  }

  const debouncedUpdate = debounce(updateGraph, 250);

  function updateRemoveButtons() {
    const rows = fnContainer.querySelectorAll('.graph-fn-row');
    rows.forEach((row) => {
      const btn = row.querySelector('.graph-fn-remove');
      btn.style.visibility = rows.length > 1 ? 'visible' : 'hidden';
    });
  }

  function addFunctionRow() {
    const rows = fnContainer.querySelectorAll('.graph-fn-row');
    if (rows.length >= 5) return;

    const idx = rows.length;
    const row = document.createElement('div');
    row.className = 'graph-fn-row';
    row.dataset.index = idx;
    row.innerHTML = `
      <input type="text" class="graph-fn-input" placeholder="e.g. sin(x)" />
      <input type="color" class="graph-fn-color" value="${GRAPH_DEFAULT_COLORS[idx] || '#14b8a6'}" />
      <button type="button" class="graph-fn-remove" title="Remove">&times;</button>
    `;
    fnContainer.appendChild(row);

    row.querySelector('.graph-fn-input').addEventListener('input', debouncedUpdate);
    row.querySelector('.graph-fn-color').addEventListener('input', debouncedUpdate);
    row.querySelector('.graph-fn-remove').addEventListener('click', () => {
      row.remove();
      updateRemoveButtons();
      debouncedUpdate();
    });

    updateRemoveButtons();
    if (rows.length >= 4) addFnBtn.style.display = 'none';
    row.querySelector('.graph-fn-input').focus();
  }

  addFnBtn.addEventListener('click', addFunctionRow);

  // Wire up change listeners on initial row and range inputs
  fnContainer.querySelector('.graph-fn-input').addEventListener('input', debouncedUpdate);
  fnContainer.querySelector('.graph-fn-color').addEventListener('input', debouncedUpdate);

  ['graph-xmin', 'graph-xmax', 'graph-ymin', 'graph-ymax'].forEach((id) => {
    document.getElementById(id).addEventListener('input', debouncedUpdate);
  });
  document.getElementById('graph-grid').addEventListener('change', debouncedUpdate);

  // Place on board
  placeBtn.addEventListener('click', async () => {
    const svgEl = document.querySelector('#graph-preview svg');
    if (!svgEl) {
      await miro.board.notifications.showError('No graph to place — enter a function');
      return;
    }

    const clone = svgEl.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const svgStr = clone.outerHTML;
    const url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`;

    const fns = getFunctions();
    const title = fns.map((f) => f.fn).join(', ');

    const vp = await miro.board.viewport.get();
    const cx = vp.x + vp.width / 2;
    const cy = vp.y + vp.height / 2;

    await miro.board.createImage({ url, x: cx, y: cy, width: 500, title: title || 'Graph' });
    overlay.classList.remove('visible');
  });

  // Open / close
  document.getElementById('modal-graph-btn').addEventListener('click', () => {
    overlay.classList.toggle('visible');
    if (overlay.classList.contains('visible')) {
      // Reset add-fn button visibility
      const rows = fnContainer.querySelectorAll('.graph-fn-row');
      addFnBtn.style.display = rows.length >= 5 ? 'none' : '';
      setTimeout(updateGraph, 50);
    }
  });

  closeBtn.addEventListener('click', () => overlay.classList.remove('visible'));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('visible');
  });
}

async function init() {
  buildFormattingBar();
  buildToolbar();

  const texinput = document.getElementById('modal-texinput');

  // Restore saved LaTeX
  const saved = localStorage.getItem('miro-latex');
  if (saved) {
    texinput.value = saved;
    convert();
  }

  // Auto-save on input
  texinput.addEventListener('input', debounce(() => {
    localStorage.setItem('miro-latex', texinput.value);
    convert();
  }, 150));

  document.getElementById('modal-place').onclick = placeOnBoard;
  document.getElementById('modal-clear').onclick = () => {
    texinput.value = '';
    localStorage.removeItem('miro-latex');
    document.getElementById('modal-texoutput').textContent = '';
    texinput.focus();
  };

  // Image size slider
  const imgSizeSlider = document.getElementById('modal-img-size');
  const sizeValueSpan = document.getElementById('modal-size-value');
  imgSizeSlider.addEventListener('input', () => {
    sizeValueSpan.textContent = imgSizeSlider.value;
  });

  // Keyboard shortcuts
  texinput.addEventListener('keydown', (e) => {
    // Shift+Enter → new line (prepareLatex handles the \\ wrapping)
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      insertAtCursor(texinput, '\n');
      localStorage.setItem('miro-latex', texinput.value);
      convert();
    }
    // Ctrl/Cmd+Enter → place on board
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      placeOnBoard();
    }
    // Tab → insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      insertAtCursor(texinput, '  ');
    }
  });

  // Ctrl+L to open library (global shortcut)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      document.getElementById('modal-library-btn').click();
    }
  });

  // Help overlay
  const helpOverlay = document.getElementById('modal-help-overlay');
  document.getElementById('modal-help-btn').onclick = () => helpOverlay.classList.toggle('visible');
  document.getElementById('modal-help-close').onclick = () => helpOverlay.classList.remove('visible');
  helpOverlay.onclick = (e) => { if (e.target === helpOverlay) helpOverlay.classList.remove('visible'); };

  // Library overlay
  const openLibraryFn = buildLibraryOverlay();

  // Graph overlay
  buildGraphOverlay();

  // Auto-open library if launched from panel subject button
  const libSubject = localStorage.getItem('miro-latex-lib-subject');
  if (libSubject) {
    localStorage.removeItem('miro-latex-lib-subject');
    setTimeout(() => openLibraryFn(libSubject), 100);
  }

  // Colour swatches
  document.querySelectorAll('.swatch').forEach((swatch) => {
    const input = swatch.querySelector('input[type="color"]');
    const dot = swatch.querySelector('.swatch-dot');
    dot.addEventListener('click', () => input.click());
    input.addEventListener('input', () => { dot.style.background = input.value; });
  });
}

window.addEventListener('load', init);
