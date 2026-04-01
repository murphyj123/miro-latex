/* ── Interactive Maths Templates ──────────────────── */

const SVG_NS = 'http://www.w3.org/2000/svg';
function getEl(id) { return document.getElementById(id); }

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/* ── Shared config-UI helpers ───────────────────────── */

function makeRow(...children) {
  const row = document.createElement('div');
  row.className = 'cfg-row';
  children.forEach((c) => row.appendChild(c));
  return row;
}

function makeField(labelText, inputEl, extraClass) {
  const f = document.createElement('div');
  f.className = 'cfg-field' + (extraClass ? ' ' + extraClass : '');
  const lbl = document.createElement('div');
  lbl.className = 'cfg-field-label';
  lbl.textContent = labelText;
  f.appendChild(lbl);
  f.appendChild(inputEl);
  return f;
}

function makeInput(id, type, value, extra) {
  const inp = document.createElement('input');
  inp.className = 'cfg-input';
  inp.id = id;
  inp.type = type;
  inp.value = value ?? '';
  if (extra) {
    for (const [k, v] of Object.entries(extra)) inp.setAttribute(k, v);
  }
  return inp;
}

function makeSmallInput(id, type, value, extra) {
  const inp = makeInput(id, type, value, extra);
  inp.classList.add('cfg-input-sm');
  return inp;
}

function makeSelect(id, options, selected) {
  const sel = document.createElement('select');
  sel.className = 'cfg-select';
  sel.id = id;
  options.forEach(([val, label]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    if (val === selected) opt.selected = true;
    sel.appendChild(opt);
  });
  return sel;
}

function makeCheck(id, labelText, checked) {
  const lbl = document.createElement('label');
  lbl.className = 'cfg-check';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.id = id;
  cb.checked = !!checked;
  const span = document.createElement('span');
  span.textContent = labelText;
  lbl.appendChild(cb);
  lbl.appendChild(span);
  return lbl;
}

function makeSwatch(id, colour) {
  const wrap = document.createElement('label');
  wrap.className = 'cfg-swatch';
  const inp = document.createElement('input');
  inp.type = 'color';
  inp.id = id;
  inp.value = colour || '#3498db';
  const dot = document.createElement('span');
  dot.className = 'cfg-swatch-dot';
  dot.style.background = inp.value;
  inp.addEventListener('input', () => { dot.style.background = inp.value; });
  wrap.appendChild(inp);
  wrap.appendChild(dot);
  return wrap;
}

function makeLabel(text) {
  const lbl = document.createElement('div');
  lbl.className = 'cfg-label';
  lbl.textContent = text;
  return lbl;
}

function makeDivider() {
  const hr = document.createElement('hr');
  hr.className = 'cfg-divider';
  return hr;
}

function makeTitle(text) {
  const h = document.createElement('div');
  h.className = 'cfg-title';
  h.textContent = text;
  return h;
}

function $(id) { return document.getElementById(id); }

/* ── SVG text helper ────────────────────────────────── */

function svgText(text, x, y, attrs) {
  const el = svgEl('text', {
    x, y,
    'font-family': 'Inter, Arial, sans-serif',
    'font-size': '12',
    fill: '#333',
    'text-anchor': 'middle',
    ...attrs,
  });
  el.textContent = text;
  return el;
}

/* ── Gradient defs helper ───────────────────────────── */

function addRadialGradient(defs, id, colour) {
  const grad = svgEl('radialGradient', { id, cx: '35%', cy: '35%', r: '65%' });
  const lighter = lightenColour(colour, 40);
  grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': lighter }));
  grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': colour }));
  defs.appendChild(grad);
}

function lightenColour(hex, pct) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.min(255, r + Math.round((255 - r) * pct / 100));
  g = Math.min(255, g + Math.round((255 - g) * pct / 100));
  b = Math.min(255, b + Math.round((255 - b) * pct / 100));
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

/* ================================================================
   1. Number Line (configurable)
   ================================================================ */

const numberLine = {
  name: 'Number Line',
  category: 'Number',

  renderConfig(container) {
    container.appendChild(makeTitle('Number Line'));

    container.appendChild(makeRow(
      makeField('Min', makeSmallInput('nl-min', 'number', '-10', { min: '-100', max: '100' })),
      makeField('Max', makeSmallInput('nl-max', 'number', '10', { min: '-100', max: '100' })),
      makeField('Step', makeSmallInput('nl-step', 'number', '1', { min: '0.1', step: '0.1' })),
    ));

    container.appendChild(makeRow(
      makeField('Minor Divisions', makeSmallInput('nl-minor', 'number', '0', { min: '0', max: '10' })),
      makeField('Orientation', makeSelect('nl-orient', [['horizontal', 'Horizontal'], ['vertical', 'Vertical']], 'horizontal')),
      makeField('Number Format', makeSelect('nl-format', [['integer', 'Integer'], ['decimal', 'Decimal'], ['fraction', 'Fraction']], 'integer')),
    ));

    container.appendChild(makeRow(
      makeCheck('nl-labels', 'Show Labels', true),
      makeCheck('nl-arrows', 'Show Arrows', true),
    ));

    container.appendChild(makeDivider());
    container.appendChild(makeLabel('Highlight Points (comma separated)'));
    container.appendChild(makeRow(
      makeField('Points', makeInput('nl-highlights', 'text', '', { placeholder: 'e.g. -3, 0, 2.5' })),
    ));

    container.appendChild(makeRow(
      makeField('Title', makeInput('nl-title', 'text', '')),
    ));
  },

  readConfig() {
    const highlights = (getEl('nl-highlights')?.value || '').split(',')
      .map((s) => s.trim()).filter(Boolean).map(Number).filter((n) => !isNaN(n)).slice(0, 5);
    return {
      min: parseFloat(getEl('nl-min')?.value) || -10,
      max: parseFloat(getEl('nl-max')?.value) || 10,
      step: parseFloat(getEl('nl-step')?.value) || 1,
      minor: parseInt(getEl('nl-minor')?.value, 10) || 0,
      orientation: getEl('nl-orient')?.value || 'horizontal',
      showLabels: getEl('nl-labels')?.checked ?? true,
      showArrows: getEl('nl-arrows')?.checked ?? true,
      numberFormat: getEl('nl-format')?.value || 'integer',
      highlights,
      title: getEl('nl-title')?.value || '',
    };
  },

  generateSVG(s) {
    if (s.min >= s.max) s.max = s.min + 1;
    if (s.step <= 0) s.step = 1;

    const isVert = s.orientation === 'vertical';
    const W = isVert ? 120 : 560;
    const H = isVert ? 500 : 100;
    const titleH = s.title ? 24 : 0;

    const svg = svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${W} ${H + titleH}`, width: W, height: H + titleH });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H + titleH, fill: '#ffffff' }));

    if (s.title) {
      svg.appendChild(svgText(s.title, W / 2, 16, { 'font-size': '14', 'font-weight': '600' }));
    }

    const defs = svgEl('defs', {});
    if (s.showArrows) {
      const marker = svgEl('marker', { id: 'nl-arrow', markerWidth: '8', markerHeight: '6', refX: '8', refY: '3', orient: 'auto' });
      marker.appendChild(svgEl('polygon', { points: '0 0, 8 3, 0 6', fill: '#333' }));
      defs.appendChild(marker);
      const markerR = svgEl('marker', { id: 'nl-arrow-rev', markerWidth: '8', markerHeight: '6', refX: '0', refY: '3', orient: 'auto' });
      markerR.appendChild(svgEl('polygon', { points: '8 0, 0 3, 8 6', fill: '#333' }));
      defs.appendChild(markerR);
    }
    svg.appendChild(defs);

    const pad = 30;
    const range = s.max - s.min;

    function mapPos(val) {
      if (isVert) {
        const plotH = H - 2 * pad;
        return titleH + pad + plotH - ((val - s.min) / range) * plotH;
      }
      const plotW = W - 2 * pad;
      return pad + ((val - s.min) / range) * plotW;
    }

    function formatVal(val) {
      if (s.numberFormat === 'decimal') return val.toFixed(1);
      if (s.numberFormat === 'fraction') {
        if (Number.isInteger(val)) return String(val);
        const denom = Math.round(1 / s.step);
        const numer = Math.round(val * denom);
        const g = gcd(Math.abs(numer), denom);
        return `${numer / g}/${denom / g}`;
      }
      return String(Math.round(val));
    }

    // Main line
    const lineAttrs = { stroke: '#333', 'stroke-width': '2' };
    if (isVert) {
      const cx = W / 2;
      const line = svgEl('line', { x1: cx, y1: mapPos(s.max), x2: cx, y2: mapPos(s.min), ...lineAttrs });
      if (s.showArrows) { line.setAttribute('marker-start', 'url(#nl-arrow)'); line.setAttribute('marker-end', 'url(#nl-arrow-rev)'); }
      svg.appendChild(line);

      // Ticks and labels
      let val = Math.ceil(s.min / s.step) * s.step;
      for (; val <= s.max + s.step * 0.001; val += s.step) {
        const y = mapPos(val);
        svg.appendChild(svgEl('line', { x1: cx - 6, y1: y, x2: cx + 6, y2: y, stroke: '#333', 'stroke-width': '1.5' }));
        if (s.showLabels) {
          svg.appendChild(svgText(formatVal(val), cx - 14, y + 4, { 'text-anchor': 'end', 'font-size': '11' }));
        }
        // Minor ticks
        if (s.minor > 0 && val + s.step <= s.max + s.step * 0.001) {
          const minorStep = s.step / (s.minor + 1);
          for (let m = 1; m <= s.minor; m++) {
            const my = mapPos(val + m * minorStep);
            svg.appendChild(svgEl('line', { x1: cx - 3, y1: my, x2: cx + 3, y2: my, stroke: '#999', 'stroke-width': '1' }));
          }
        }
      }

      // Highlighted points
      s.highlights.forEach((p) => {
        if (p >= s.min && p <= s.max) {
          const y = mapPos(p);
          svg.appendChild(svgEl('circle', { cx: cx, cy: y, r: '5', fill: '#e74c3c', stroke: '#c0392b', 'stroke-width': '1.5' }));
        }
      });
    } else {
      const cy = titleH + H / 2;
      const line = svgEl('line', { x1: mapPos(s.min), y1: cy, x2: mapPos(s.max), y2: cy, ...lineAttrs });
      if (s.showArrows) { line.setAttribute('marker-end', 'url(#nl-arrow)'); line.setAttribute('marker-start', 'url(#nl-arrow-rev)'); }
      svg.appendChild(line);

      let val = Math.ceil(s.min / s.step) * s.step;
      for (; val <= s.max + s.step * 0.001; val += s.step) {
        const x = mapPos(val);
        svg.appendChild(svgEl('line', { x1: x, y1: cy - 6, x2: x, y2: cy + 6, stroke: '#333', 'stroke-width': '1.5' }));
        if (s.showLabels) {
          svg.appendChild(svgText(formatVal(val), x, cy + 20, { 'font-size': '11' }));
        }
        if (s.minor > 0 && val + s.step <= s.max + s.step * 0.001) {
          const minorStep = s.step / (s.minor + 1);
          for (let m = 1; m <= s.minor; m++) {
            const mx = mapPos(val + m * minorStep);
            svg.appendChild(svgEl('line', { x1: mx, y1: cy - 3, x2: mx, y2: cy + 3, stroke: '#999', 'stroke-width': '1' }));
          }
        }
      }

      s.highlights.forEach((p) => {
        if (p >= s.min && p <= s.max) {
          const x = mapPos(p);
          svg.appendChild(svgEl('circle', { cx: x, cy: cy, r: '5', fill: '#e74c3c', stroke: '#c0392b', 'stroke-width': '1.5' }));
        }
      });
    }

    return svg;
  },
};

/* Helper: GCD for fraction formatting */
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

/* ================================================================
   2. Red-Yellow Counters
   ================================================================ */

const redYellowCounters = {
  name: 'Red-Yellow Counters',
  category: 'Number',

  renderConfig(container) {
    container.appendChild(makeTitle('Red-Yellow Counters'));

    container.appendChild(makeRow(
      makeField('Number of Counters', makeSmallInput('ryc-num', 'number', '6', { min: '1', max: '20' })),
      makeField('Counter Size', makeSmallInput('ryc-size', 'number', '40', { min: '20', max: '80' })),
      makeField('Layout', makeSelect('ryc-layout', [['row', 'Row'], ['grid', 'Grid'], ['circle', 'Circle']], 'row')),
    ));

    container.appendChild(makeDivider());
    container.appendChild(makeLabel('Counter Colours (check = yellow, uncheck = red)'));

    const counterGrid = document.createElement('div');
    counterGrid.id = 'ryc-toggles';
    counterGrid.style.display = 'flex';
    counterGrid.style.gap = '6px';
    counterGrid.style.flexWrap = 'wrap';
    counterGrid.style.marginBottom = '8px';
    container.appendChild(counterGrid);

    // Build initial toggles
    this._buildToggles(6);

    // Rebuild on count change
    const numInput = getEl('ryc-num');
    numInput.addEventListener('change', () => {
      this._buildToggles(parseInt(numInput.value, 10) || 6);
    });
  },

  _buildToggles(n) {
    const wrap = getEl('ryc-toggles');
    if (!wrap) return;
    // Preserve existing states
    const old = [];
    wrap.querySelectorAll('input[type="checkbox"]').forEach((cb) => old.push(cb.checked));
    wrap.innerHTML = '';
    for (let i = 0; i < Math.min(n, 20); i++) {
      const lbl = document.createElement('label');
      lbl.className = 'cfg-check';
      lbl.style.minWidth = '40px';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = `ryc-c${i}`;
      cb.checked = i < old.length ? old[i] : false;
      const span = document.createElement('span');
      span.textContent = `#${i + 1}`;
      span.style.fontSize = '10px';
      lbl.appendChild(cb);
      lbl.appendChild(span);
      wrap.appendChild(lbl);
    }
  },

  readConfig() {
    const n = Math.min(parseInt(getEl('ryc-num')?.value, 10) || 6, 20);
    const colours = [];
    for (let i = 0; i < n; i++) {
      const cb = $(`ryc-c${i}`);
      colours.push(cb?.checked ? 'yellow' : 'red');
    }
    return {
      num: n,
      size: parseInt(getEl('ryc-size')?.value, 10) || 40,
      layout: getEl('ryc-layout')?.value || 'row',
      colours,
    };
  },

  generateSVG(s) {
    const r = s.size / 2;
    const gap = 10;
    const positions = [];

    if (s.layout === 'row') {
      const totalW = s.num * s.size + (s.num - 1) * gap;
      for (let i = 0; i < s.num; i++) {
        positions.push({ x: r + i * (s.size + gap), y: r });
      }
      const W = totalW + 20;
      const H = s.size + 20;
      return this._buildSVG(W, H, 10, 10, positions, s);
    }

    if (s.layout === 'grid') {
      const cols = Math.ceil(Math.sqrt(s.num));
      const rows = Math.ceil(s.num / cols);
      for (let i = 0; i < s.num; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        positions.push({ x: r + col * (s.size + gap), y: r + row * (s.size + gap) });
      }
      const W = cols * (s.size + gap) - gap + 20;
      const H = rows * (s.size + gap) - gap + 20;
      return this._buildSVG(W, H, 10, 10, positions, s);
    }

    // circle layout
    const circleR = Math.max(s.size, s.num * (s.size + gap) / (2 * Math.PI));
    for (let i = 0; i < s.num; i++) {
      const angle = (2 * Math.PI * i) / s.num - Math.PI / 2;
      positions.push({ x: circleR + r + Math.cos(angle) * circleR, y: circleR + r + Math.sin(angle) * circleR });
    }
    const W = (circleR + r) * 2 + 20;
    const H = (circleR + r) * 2 + 20;
    return this._buildSVG(W, H, 10, 10, positions, s);
  },

  _buildSVG(W, H, offX, offY, positions, s) {
    const svg = svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

    const defs = svgEl('defs', {});
    addRadialGradient(defs, 'ryc-red-grad', '#e74c3c');
    addRadialGradient(defs, 'ryc-yellow-grad', '#f1c40f');
    svg.appendChild(defs);

    const r = s.size / 2;
    positions.forEach((p, i) => {
      const isYellow = s.colours[i] === 'yellow';
      const cx = offX + p.x;
      const cy = offY + p.y;
      // Shadow
      svg.appendChild(svgEl('circle', { cx: cx + 1, cy: cy + 2, r: r, fill: 'rgba(0,0,0,0.12)' }));
      // Main counter
      svg.appendChild(svgEl('circle', {
        cx, cy, r,
        fill: isYellow ? 'url(#ryc-yellow-grad)' : 'url(#ryc-red-grad)',
        stroke: isYellow ? '#d4ac0d' : '#c0392b',
        'stroke-width': '1.5',
      }));
      // Highlight arc for 3D effect
      svg.appendChild(svgEl('circle', {
        cx: cx - r * 0.2, cy: cy - r * 0.2, r: r * 0.35,
        fill: 'rgba(255,255,255,0.25)',
      }));
    });

    return svg;
  },
};

/* ================================================================
   3. Algebra Tiles
   ================================================================ */

const algebraTiles = {
  name: 'Algebra Tiles',
  category: 'Algebra',

  renderConfig(container) {
    container.appendChild(makeTitle('Algebra Tiles'));

    container.appendChild(makeRow(
      makeField('Expression', makeInput('at-expr', 'text', '2x^2 + 3x - 1', { placeholder: 'e.g. 2x^2 + 3x - 1' })),
    ));

    container.appendChild(makeRow(
      makeField('Layout', makeSelect('at-layout', [['horizontal', 'Horizontal'], ['area_model', 'Area Model']], 'horizontal')),
    ));

    container.appendChild(makeRow(
      makeField('Positive Colour', makeSwatch('at-pos-col', '#3498db')),
      makeField('Negative Colour', makeSwatch('at-neg-col', '#e74c3c')),
      makeCheck('at-labels', 'Show Labels', true),
    ));
  },

  readConfig() {
    return {
      expression: getEl('at-expr')?.value || '2x^2 + 3x - 1',
      layout: getEl('at-layout')?.value || 'horizontal',
      posColour: getEl('at-pos-col')?.value || '#3498db',
      negColour: getEl('at-neg-col')?.value || '#e74c3c',
      showLabels: getEl('at-labels')?.checked ?? true,
    };
  },

  _parseExpr(expr) {
    // Parse expression into tiles: [{type:'x2'|'x'|'1', coeff:number}]
    const tiles = [];
    // Normalize: replace − with -, handle spaces
    let s = expr.replace(/−/g, '-').replace(/\s+/g, '');
    // Match terms like +3x^2, -x, +5, etc.
    const re = /([+-]?)(\d*)(x\^2|x)?/g;
    let m;
    while ((m = re.exec(s)) !== null) {
      if (!m[0]) { re.lastIndex++; continue; }
      const sign = m[1] === '-' ? -1 : 1;
      const num = m[2] === '' ? 1 : parseInt(m[2], 10);
      const coeff = sign * num;
      if (m[3] === 'x^2') {
        tiles.push({ type: 'x2', coeff });
      } else if (m[3] === 'x') {
        tiles.push({ type: 'x', coeff });
      } else if (m[2] !== '') {
        tiles.push({ type: '1', coeff });
      }
    }
    return tiles;
  },

  generateSVG(s) {
    const tiles = this._parseExpr(s.expression);
    // Expand tiles into individual pieces
    const pieces = [];
    tiles.forEach((t) => {
      const count = Math.abs(t.coeff);
      const positive = t.coeff > 0;
      for (let i = 0; i < count; i++) {
        pieces.push({ type: t.type, positive });
      }
    });

    if (pieces.length === 0) {
      pieces.push({ type: '1', positive: true });
    }

    const x2Size = 60;
    const xW = 24;
    const xH = 60;
    const unitSize = 24;
    const gap = 6;

    // Calculate layout
    let totalW = gap;
    const tileRects = [];
    pieces.forEach((p) => {
      let w, h;
      if (p.type === 'x2') { w = x2Size; h = x2Size; }
      else if (p.type === 'x') { w = xW; h = xH; }
      else { w = unitSize; h = unitSize; }
      tileRects.push({ x: totalW, y: 0, w, h, ...p });
      totalW += w + gap;
    });

    const maxH = Math.max(...tileRects.map((t) => t.h));
    // Center vertically
    tileRects.forEach((t) => { t.y = (maxH - t.h) / 2; });

    const padX = 16;
    const padY = 16;
    const W = totalW + padX * 2;
    const H = maxH + padY * 2;

    const svg = svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

    tileRects.forEach((t) => {
      const colour = t.positive ? s.posColour : s.negColour;
      const lightCol = lightenColour(colour, 20);
      const x = padX + t.x;
      const y = padY + t.y;

      // Tile rectangle
      svg.appendChild(svgEl('rect', {
        x, y, width: t.w, height: t.h,
        fill: lightCol, stroke: colour, 'stroke-width': '2', rx: '3',
      }));

      // Label
      if (s.showLabels) {
        let label;
        if (t.type === 'x2') label = t.positive ? 'x\u00B2' : '-x\u00B2';
        else if (t.type === 'x') label = t.positive ? 'x' : '-x';
        else label = t.positive ? '1' : '-1';
        svg.appendChild(svgText(label, x + t.w / 2, y + t.h / 2 + 4, { 'font-size': '11', fill: '#fff', 'font-weight': '600' }));
      }

      // Dimension labels on edges for x2 and x
      if (s.showLabels && t.type === 'x2') {
        svg.appendChild(svgText('x', x + t.w / 2, y - 4, { 'font-size': '9', fill: '#666' }));
        svg.appendChild(svgText('x', x - 6, y + t.h / 2 + 3, { 'font-size': '9', fill: '#666', 'text-anchor': 'end' }));
      } else if (s.showLabels && t.type === 'x') {
        svg.appendChild(svgText('1', x + t.w / 2, y - 4, { 'font-size': '9', fill: '#666' }));
        svg.appendChild(svgText('x', x - 6, y + t.h / 2 + 3, { 'font-size': '9', fill: '#666', 'text-anchor': 'end' }));
      }
    });

    return svg;
  },
};

/* ================================================================
   4. Right-Angled Triangle (configurable)
   ================================================================ */

const rightAngledTriangle = {
  name: 'Right-Angled Triangle',
  category: 'Geometry',

  renderConfig(container) {
    container.appendChild(makeTitle('Right-Angled Triangle'));

    container.appendChild(makeRow(
      makeField('Base', makeSmallInput('rat-base', 'number', '5', { min: '1', max: '50' })),
      makeField('Height', makeSmallInput('rat-height', 'number', '4', { min: '1', max: '50' })),
    ));

    container.appendChild(makeRow(
      makeField('Angle Position', makeSelect('rat-angle-pos', [['bottom-left', 'Bottom-Left'], ['bottom-right', 'Bottom-Right']], 'bottom-left')),
      makeField('Label Style', makeSelect('rat-label-style', [['abc', 'a, b, c'], ['OAH', 'O, A, H'], ['custom', 'Custom']], 'abc')),
    ));

    container.appendChild(makeRow(
      makeField('Custom Base Label', makeSmallInput('rat-lbl-base', 'text', '')),
      makeField('Custom Height Label', makeSmallInput('rat-lbl-height', 'text', '')),
      makeField('Custom Hyp. Label', makeSmallInput('rat-lbl-hyp', 'text', '')),
    ));

    container.appendChild(makeRow(
      makeCheck('rat-show-hyp', 'Hypotenuse Label', true),
      makeCheck('rat-show-angle', 'Show Angle', true),
      makeCheck('rat-show-ra', 'Right Angle Marker', true),
    ));
    container.appendChild(makeRow(
      makeCheck('rat-show-dim', 'Show Dimensions', true),
      makeCheck('rat-show-area', 'Area Formula', false),
    ));
  },

  readConfig() {
    return {
      base: parseFloat(getEl('rat-base')?.value) || 5,
      height: parseFloat(getEl('rat-height')?.value) || 4,
      anglePos: getEl('rat-angle-pos')?.value || 'bottom-left',
      labelStyle: getEl('rat-label-style')?.value || 'abc',
      customBase: getEl('rat-lbl-base')?.value || '',
      customHeight: getEl('rat-lbl-height')?.value || '',
      customHyp: getEl('rat-lbl-hyp')?.value || '',
      showHyp: getEl('rat-show-hyp')?.checked ?? true,
      showAngle: getEl('rat-show-angle')?.checked ?? true,
      showRA: getEl('rat-show-ra')?.checked ?? true,
      showDim: getEl('rat-show-dim')?.checked ?? true,
      showArea: getEl('rat-show-area')?.checked ?? false,
    };
  },

  generateSVG(s) {
    const pad = 50;
    const scale = 40;
    const bPx = s.base * scale;
    const hPx = s.height * scale;
    const W = bPx + pad * 2;
    const H = hPx + pad * 2 + (s.showArea ? 30 : 0);

    const svg = svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

    // Triangle vertices
    let A, B, C; // A = right angle, B = base end, C = top
    if (s.anglePos === 'bottom-left') {
      A = { x: pad, y: pad + hPx };           // bottom-left (right angle)
      B = { x: pad + bPx, y: pad + hPx };     // bottom-right
      C = { x: pad, y: pad };                  // top-left
    } else {
      A = { x: pad + bPx, y: pad + hPx };     // bottom-right (right angle)
      B = { x: pad, y: pad + hPx };            // bottom-left
      C = { x: pad + bPx, y: pad };            // top-right
    }

    // Triangle fill and outline
    svg.appendChild(svgEl('polygon', {
      points: `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`,
      fill: '#eaf2ff', stroke: '#2c3e50', 'stroke-width': '2', 'stroke-linejoin': 'round',
    }));

    // Right angle marker at A
    if (s.showRA) {
      const raSize = 12;
      const dirB = { x: (B.x - A.x) > 0 ? 1 : -1, y: 0 };
      const dirC = { x: 0, y: (C.y - A.y) > 0 ? 1 : -1 };
      const p1 = { x: A.x + dirB.x * raSize, y: A.y };
      const p2 = { x: A.x + dirB.x * raSize, y: A.y + dirC.y * raSize };
      const p3 = { x: A.x, y: A.y + dirC.y * raSize };
      svg.appendChild(svgEl('polyline', {
        points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`,
        fill: 'none', stroke: '#2c3e50', 'stroke-width': '1.5',
      }));
    }

    // Angle arc at B (non-right angle)
    if (s.showAngle) {
      const arcR = 20;
      const angleRad = Math.atan2(s.height, s.base);
      if (s.anglePos === 'bottom-left') {
        // Angle at B (bottom-right)
        const startX = B.x - arcR;
        const startY = B.y;
        const endX = B.x + arcR * Math.cos(Math.PI - angleRad);
        const endY = B.y + arcR * Math.sin(-angleRad);
        svg.appendChild(svgEl('path', {
          d: `M ${startX} ${startY} A ${arcR} ${arcR} 0 0 0 ${endX} ${endY}`,
          fill: 'none', stroke: '#e74c3c', 'stroke-width': '1.5',
        }));
        const degrees = Math.round(angleRad * 180 / Math.PI);
        svg.appendChild(svgText(`${degrees}\u00B0`, B.x - arcR - 8, B.y - 10, { 'font-size': '10', fill: '#e74c3c' }));
      } else {
        // Angle at B (bottom-left)
        const startX = B.x + arcR;
        const startY = B.y;
        const endX = B.x + arcR * Math.cos(-angleRad);
        const endY = B.y - arcR * Math.sin(angleRad);
        svg.appendChild(svgEl('path', {
          d: `M ${startX} ${startY} A ${arcR} ${arcR} 0 0 0 ${endX} ${endY}`,
          fill: 'none', stroke: '#e74c3c', 'stroke-width': '1.5',
        }));
        const degrees = Math.round(angleRad * 180 / Math.PI);
        svg.appendChild(svgText(`${degrees}\u00B0`, B.x + arcR + 8, B.y - 10, { 'font-size': '10', fill: '#e74c3c' }));
      }
    }

    // Side labels
    let baseLbl, heightLbl, hypLbl;
    if (s.labelStyle === 'abc') { baseLbl = 'a'; heightLbl = 'b'; hypLbl = 'c'; }
    else if (s.labelStyle === 'OAH') { baseLbl = 'A'; heightLbl = 'O'; hypLbl = 'H'; }
    else { baseLbl = s.customBase || ''; heightLbl = s.customHeight || ''; hypLbl = s.customHyp || ''; }

    // Base label (along bottom)
    if (s.showDim || baseLbl) {
      const label = s.showDim ? `${baseLbl ? baseLbl + ' = ' : ''}${s.base}` : baseLbl;
      svg.appendChild(svgText(label, (A.x + B.x) / 2, A.y + 20, { 'font-size': '12', 'font-weight': '600' }));
    }

    // Height label (along vertical side)
    if (s.showDim || heightLbl) {
      const label = s.showDim ? `${heightLbl ? heightLbl + ' = ' : ''}${s.height}` : heightLbl;
      const offsetX = s.anglePos === 'bottom-left' ? -18 : 18;
      svg.appendChild(svgText(label, A.x + offsetX, (A.y + C.y) / 2, {
        'font-size': '12', 'font-weight': '600',
        'text-anchor': s.anglePos === 'bottom-left' ? 'end' : 'start',
      }));
    }

    // Hypotenuse label
    if (s.showHyp) {
      const hyp = Math.sqrt(s.base ** 2 + s.height ** 2);
      const label = s.showDim ? `${hypLbl ? hypLbl + ' = ' : ''}${hyp.toFixed(2)}` : hypLbl;
      const mx = (B.x + C.x) / 2;
      const my = (B.y + C.y) / 2;
      const offsetDir = s.anglePos === 'bottom-left' ? 1 : -1;
      svg.appendChild(svgText(label, mx + 14 * offsetDir, my, {
        'font-size': '12', 'font-weight': '600',
      }));
    }

    // Area formula
    if (s.showArea) {
      const area = (s.base * s.height / 2);
      svg.appendChild(svgText(`Area = \u00BD \u00D7 ${s.base} \u00D7 ${s.height} = ${area}`, W / 2, H - 10, {
        'font-size': '12', fill: '#555',
      }));
    }

    return svg;
  },
};

/* ================================================================
   5. Double Number Line
   ================================================================ */

const doubleNumberLine = {
  name: 'Double Number Line',
  category: 'Number',

  renderConfig(container) {
    container.appendChild(makeTitle('Double Number Line'));

    container.appendChild(makeRow(
      makeField('Top Label', makeInput('dnl-top-label', 'text', 'Cost (\u00A3)')),
      makeField('Bottom Label', makeInput('dnl-bottom-label', 'text', 'Quantity')),
    ));

    container.appendChild(makeRow(
      makeField('Number of ticks', makeSmallInput('dnl-ticks', 'number', '5', { min: '3', max: '10' })),
    ));

    const pairsDiv = document.createElement('div');
    pairsDiv.id = 'dnl-pairs-wrap';
    container.appendChild(pairsDiv);

    const defaultTop = [0, 5, 10, 15, 20];
    const defaultBot = [0, 1, 2, 3, 4];

    const buildPairs = () => {
      const n = Math.min(10, Math.max(3, parseInt(getEl('dnl-ticks')?.value, 10) || 5));
      const wrap = getEl('dnl-pairs-wrap');
      const oldTop = [], oldBot = [];
      wrap.querySelectorAll('[data-dnl-top]').forEach(el => oldTop.push(el.value));
      wrap.querySelectorAll('[data-dnl-bot]').forEach(el => oldBot.push(el.value));
      wrap.innerHTML = '';

      // Header row
      const hdr = document.createElement('div');
      hdr.className = 'cfg-row';
      hdr.style.marginBottom = '2px';
      const hTop = document.createElement('div');
      hTop.className = 'cfg-field';
      hTop.style.cssText = 'flex:1;';
      const hTopLbl = document.createElement('div');
      hTopLbl.className = 'cfg-field-label';
      hTopLbl.textContent = 'Top value';
      hTop.appendChild(hTopLbl);
      const hBot = document.createElement('div');
      hBot.className = 'cfg-field';
      hBot.style.cssText = 'flex:1;';
      const hBotLbl = document.createElement('div');
      hBotLbl.className = 'cfg-field-label';
      hBotLbl.textContent = 'Bottom value';
      hBot.appendChild(hBotLbl);
      hdr.appendChild(hTop);
      hdr.appendChild(hBot);
      wrap.appendChild(hdr);

      for (let i = 0; i < n; i++) {
        const tv = i < oldTop.length ? oldTop[i] : (defaultTop[i] !== undefined ? String(defaultTop[i]) : '');
        const bv = i < oldBot.length ? oldBot[i] : (defaultBot[i] !== undefined ? String(defaultBot[i]) : '');
        const r = document.createElement('div');
        r.className = 'cfg-row';
        r.style.marginBottom = '2px';

        const fTop = document.createElement('div');
        fTop.className = 'cfg-field';
        fTop.style.cssText = 'flex:1;';
        const tInp = document.createElement('input');
        tInp.type = 'text';
        tInp.className = 'cfg-input cfg-input-sm';
        tInp.value = tv;
        tInp.setAttribute('data-dnl-top', i);
        tInp.placeholder = 'Tick ' + (i + 1);
        fTop.appendChild(tInp);

        const fBot = document.createElement('div');
        fBot.className = 'cfg-field';
        fBot.style.cssText = 'flex:1;';
        const bInp = document.createElement('input');
        bInp.type = 'text';
        bInp.className = 'cfg-input cfg-input-sm';
        bInp.value = bv;
        bInp.setAttribute('data-dnl-bot', i);
        bInp.placeholder = 'Tick ' + (i + 1);
        fBot.appendChild(bInp);

        r.appendChild(fTop);
        r.appendChild(fBot);
        wrap.appendChild(r);
      }
    };

    getEl('dnl-ticks').addEventListener('change', buildPairs);
    getEl('dnl-ticks').addEventListener('input', buildPairs);
    buildPairs();

    container.appendChild(makeRow(
      makeCheck('dnl-arrows', 'Show Arrows', true),
      makeField('Title', makeInput('dnl-title', 'text', '')),
    ));
  },

  readConfig() {
    const topValues = [], bottomValues = [];
    document.querySelectorAll('[data-dnl-top]').forEach(el => {
      const v = el.value.trim();
      if (v) topValues.push(v);
    });
    document.querySelectorAll('[data-dnl-bot]').forEach(el => {
      const v = el.value.trim();
      if (v) bottomValues.push(v);
    });
    return {
      topLabel: getEl('dnl-top-label')?.value || '',
      bottomLabel: getEl('dnl-bottom-label')?.value || '',
      topValues,
      bottomValues,
      showArrows: getEl('dnl-arrows')?.checked ?? true,
      title: getEl('dnl-title')?.value || '',
    };
  },

  generateSVG(s) {
    const n = Math.max(s.topValues.length, s.bottomValues.length, 2);
    const W = 560;
    const titleH = s.title ? 28 : 0;
    const H = 140 + titleH;
    const padL = 70;
    const padR = 30;
    const lineW = W - padL - padR;

    const svg = svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

    const defs = svgEl('defs', {});
    if (s.showArrows) {
      const marker = svgEl('marker', { id: 'dnl-arrow', markerWidth: '8', markerHeight: '6', refX: '8', refY: '3', orient: 'auto' });
      marker.appendChild(svgEl('polygon', { points: '0 0, 8 3, 0 6', fill: '#333' }));
      defs.appendChild(marker);
    }
    svg.appendChild(defs);

    if (s.title) {
      svg.appendChild(svgText(s.title, W / 2, 18, { 'font-size': '14', 'font-weight': '600' }));
    }

    const topY = titleH + 35;
    const botY = titleH + 95;
    const tickH = 8;

    // Top line
    const topLine = svgEl('line', { x1: padL, y1: topY, x2: padL + lineW, y2: topY, stroke: '#2c3e50', 'stroke-width': '2' });
    if (s.showArrows) topLine.setAttribute('marker-end', 'url(#dnl-arrow)');
    svg.appendChild(topLine);

    // Bottom line
    const botLine = svgEl('line', { x1: padL, y1: botY, x2: padL + lineW, y2: botY, stroke: '#2c3e50', 'stroke-width': '2' });
    if (s.showArrows) botLine.setAttribute('marker-end', 'url(#dnl-arrow)');
    svg.appendChild(botLine);

    // Top label
    svg.appendChild(svgText(s.topLabel, padL - 8, topY + 4, { 'font-size': '11', 'font-weight': '600', 'text-anchor': 'end', fill: '#2980b9' }));
    // Bottom label
    svg.appendChild(svgText(s.bottomLabel, padL - 8, botY + 4, { 'font-size': '11', 'font-weight': '600', 'text-anchor': 'end', fill: '#27ae60' }));

    // Place values
    const maxVals = Math.max(s.topValues.length, s.bottomValues.length);
    for (let i = 0; i < maxVals; i++) {
      const x = padL + (i / (maxVals - 1)) * (lineW - 10);

      // Top tick + value
      svg.appendChild(svgEl('line', { x1: x, y1: topY - tickH, x2: x, y2: topY + tickH, stroke: '#2c3e50', 'stroke-width': '1.5' }));
      if (i < s.topValues.length) {
        svg.appendChild(svgText(s.topValues[i], x, topY - tickH - 5, { 'font-size': '11', fill: '#2980b9', 'font-weight': '600' }));
      }

      // Bottom tick + value
      svg.appendChild(svgEl('line', { x1: x, y1: botY - tickH, x2: x, y2: botY + tickH, stroke: '#2c3e50', 'stroke-width': '1.5' }));
      if (i < s.bottomValues.length) {
        svg.appendChild(svgText(s.bottomValues[i], x, botY + tickH + 14, { 'font-size': '11', fill: '#27ae60', 'font-weight': '600' }));
      }

      // Connecting dashed line
      svg.appendChild(svgEl('line', {
        x1: x, y1: topY + tickH + 2, x2: x, y2: botY - tickH - 2,
        stroke: '#bdc3c7', 'stroke-width': '1', 'stroke-dasharray': '3,3',
      }));
    }

    return svg;
  },
};

/* ================================================================
   6. Place Value Counters
   ================================================================ */

const placeValueCounters = {
  name: 'Place Value Counters',
  category: 'Number',

  renderConfig(container) {
    container.appendChild(makeTitle('Place Value Counters'));

    container.appendChild(makeRow(
      makeField('Thousands', makeSmallInput('pvc-th', 'number', '1', { min: '0', max: '9' })),
      makeField('Hundreds', makeSmallInput('pvc-h', 'number', '3', { min: '0', max: '9' })),
      makeField('Tens', makeSmallInput('pvc-t', 'number', '4', { min: '0', max: '9' })),
      makeField('Ones', makeSmallInput('pvc-o', 'number', '7', { min: '0', max: '9' })),
    ));

    container.appendChild(makeRow(
      makeCheck('pvc-headings', 'Show Headings', true),
      makeField('Layout', makeSelect('pvc-layout', [['columns', 'Columns'], ['scattered', 'Scattered']], 'columns')),
    ));
  },

  readConfig() {
    return {
      thousands: Math.min(9, Math.max(0, parseInt(getEl('pvc-th')?.value, 10) || 0)),
      hundreds: Math.min(9, Math.max(0, parseInt(getEl('pvc-h')?.value, 10) || 0)),
      tens: Math.min(9, Math.max(0, parseInt(getEl('pvc-t')?.value, 10) || 0)),
      ones: Math.min(9, Math.max(0, parseInt(getEl('pvc-o')?.value, 10) || 0)),
      showHeadings: getEl('pvc-headings')?.checked ?? true,
      layout: getEl('pvc-layout')?.value || 'columns',
    };
  },

  generateSVG(s) {
    const columns = [
      { label: 'Th', value: '1000', count: s.thousands, colour: '#e74c3c' },
      { label: 'H', value: '100', count: s.hundreds, colour: '#e67e22' },
      { label: 'T', value: '10', count: s.tens, colour: '#3498db' },
      { label: 'O', value: '1', count: s.ones, colour: '#27ae60' },
    ];

    const r = 20;
    const gap = 8;
    const colW = r * 2 + 20;
    const headH = s.showHeadings ? 30 : 0;
    const maxCount = Math.max(1, ...columns.map((c) => c.count));
    const H = headH + maxCount * (r * 2 + gap) + 20;
    const W = columns.length * colW + 20;

    const svg = svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

    const defs = svgEl('defs', {});
    columns.forEach((col) => {
      addRadialGradient(defs, `pvc-grad-${col.label}`, col.colour);
    });
    svg.appendChild(defs);

    columns.forEach((col, ci) => {
      const cx = 10 + ci * colW + colW / 2;

      // Column heading
      if (s.showHeadings) {
        svg.appendChild(svgText(col.label, cx, 18, { 'font-size': '13', 'font-weight': '700', fill: col.colour }));
        // Separator line
        svg.appendChild(svgEl('line', {
          x1: 10 + ci * colW, y1: headH - 2,
          x2: 10 + ci * colW + colW, y2: headH - 2,
          stroke: '#e0e0e0', 'stroke-width': '1',
        }));
      }

      // Counters
      for (let i = 0; i < col.count; i++) {
        let cy;
        if (s.layout === 'scattered') {
          cy = headH + 10 + r + i * (r * 2 + gap) + (Math.random() - 0.5) * 6;
        } else {
          cy = headH + 10 + r + i * (r * 2 + gap);
        }
        // Shadow
        svg.appendChild(svgEl('circle', { cx: cx + 1, cy: cy + 2, r, fill: 'rgba(0,0,0,0.1)' }));
        // Counter
        svg.appendChild(svgEl('circle', {
          cx, cy, r,
          fill: `url(#pvc-grad-${col.label})`,
          stroke: col.colour, 'stroke-width': '1.5',
        }));
        // Value text
        svg.appendChild(svgText(col.value, cx, cy + 4, { 'font-size': '10', fill: '#fff', 'font-weight': '700' }));
      }
    });

    return svg;
  },
};

/* ================================================================
   7. Ten Frames
   ================================================================ */

const tenFrames = {
  name: 'Ten Frames',
  category: 'Number',

  renderConfig(container) {
    container.appendChild(makeTitle('Ten Frames'));

    container.appendChild(makeRow(
      makeField('Number of Frames', makeSmallInput('tf-frames', 'number', '1', { min: '1', max: '4' })),
    ));

    // Per-frame filled counts
    const filledDiv = document.createElement('div');
    filledDiv.id = 'tf-filled-wrap';
    container.appendChild(filledDiv);
    this._buildFilledInputs(1, filledDiv);

    getEl('tf-frames').addEventListener('change', () => {
      const n = Math.min(4, Math.max(1, parseInt(getEl('tf-frames').value, 10) || 1));
      this._buildFilledInputs(n, getEl('tf-filled-wrap'));
    });

    container.appendChild(makeRow(
      makeField('Counter Colour', makeSwatch('tf-colour', '#e74c3c')),
      makeCheck('tf-show-num', 'Show Frame Number', false),
    ));
  },

  _buildFilledInputs(n, wrap) {
    const old = [];
    wrap.querySelectorAll('input[type="number"]').forEach((inp) => old.push(inp.value));
    wrap.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'cfg-row';
    for (let i = 0; i < n; i++) {
      const val = i < old.length ? old[i] : '5';
      row.appendChild(makeField(`Frame ${i + 1} filled`, makeSmallInput(`tf-filled-${i}`, 'number', val, { min: '0', max: '10' })));
    }
    wrap.appendChild(row);
  },

  readConfig() {
    const nFrames = Math.min(4, Math.max(1, parseInt(getEl('tf-frames')?.value, 10) || 1));
    const filled = [];
    for (let i = 0; i < nFrames; i++) {
      filled.push(Math.min(10, Math.max(0, parseInt($(`tf-filled-${i}`)?.value, 10) || 0)));
    }
    return {
      nFrames,
      filled,
      colour: getEl('tf-colour')?.value || '#e74c3c',
      showNum: getEl('tf-show-num')?.checked ?? false,
    };
  },

  generateSVG(s) {
    const cellSize = 40;
    const cols = 5;
    const rows = 2;
    const frameGap = 20;
    const pad = 16;
    const labelH = s.showNum ? 18 : 0;

    const frameW = cols * cellSize;
    const frameH = rows * cellSize;
    const W = s.nFrames * frameW + (s.nFrames - 1) * frameGap + pad * 2;
    const H = frameH + pad * 2 + labelH;

    const svg = svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

    const defs = svgEl('defs', {});
    addRadialGradient(defs, 'tf-counter-grad', s.colour);
    svg.appendChild(defs);

    for (let f = 0; f < s.nFrames; f++) {
      const ox = pad + f * (frameW + frameGap);
      const oy = pad;

      // Frame label
      if (s.showNum) {
        svg.appendChild(svgText(`Frame ${f + 1}`, ox + frameW / 2, oy + frameH + 16, { 'font-size': '11', fill: '#666' }));
      }

      // Grid outline
      svg.appendChild(svgEl('rect', {
        x: ox, y: oy, width: frameW, height: frameH,
        fill: '#f9f9f9', stroke: '#2c3e50', 'stroke-width': '2', rx: '3',
      }));

      // Internal grid lines
      for (let c = 1; c < cols; c++) {
        svg.appendChild(svgEl('line', {
          x1: ox + c * cellSize, y1: oy,
          x2: ox + c * cellSize, y2: oy + frameH,
          stroke: '#2c3e50', 'stroke-width': '1',
        }));
      }
      svg.appendChild(svgEl('line', {
        x1: ox, y1: oy + cellSize,
        x2: ox + frameW, y2: oy + cellSize,
        stroke: '#2c3e50', 'stroke-width': '1',
      }));

      // Counters (fill top row left-to-right, then bottom row)
      for (let i = 0; i < s.filled[f]; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const cx = ox + col * cellSize + cellSize / 2;
        const cy = oy + row * cellSize + cellSize / 2;
        const r = cellSize * 0.35;
        svg.appendChild(svgEl('circle', { cx: cx + 1, cy: cy + 1, r, fill: 'rgba(0,0,0,0.1)' }));
        svg.appendChild(svgEl('circle', { cx, cy, r, fill: 'url(#tf-counter-grad)', stroke: s.colour, 'stroke-width': '1.5' }));
      }
    }

    return svg;
  },
};

/* ================================================================
   8. Part-Whole Model (Cherry Model)
   ================================================================ */

const partWholeModel = {
  name: 'Part-Whole Model',
  category: 'Number',

  renderConfig(container) {
    container.appendChild(makeTitle('Part-Whole Model (Cherry Model)'));

    container.appendChild(makeRow(
      makeField('Whole Value', makeInput('pw-whole', 'text', '10')),
    ));
    container.appendChild(makeRow(
      makeField('Part 1', makeInput('pw-part1', 'text', '7')),
      makeField('Part 2', makeInput('pw-part2', 'text', '3')),
    ));
    container.appendChild(makeRow(
      makeCheck('pw-whole-label', 'Show "Whole" label', true),
      makeCheck('pw-part-labels', 'Show "Part" labels', true),
    ));
  },

  readConfig() {
    return {
      whole: getEl('pw-whole')?.value || '',
      part1: getEl('pw-part1')?.value || '',
      part2: getEl('pw-part2')?.value || '',
      showWholeLabel: getEl('pw-whole-label')?.checked ?? true,
      showPartLabels: getEl('pw-part-labels')?.checked ?? true,
    };
  },

  generateSVG(s) {
    const W = 320;
    const H = 240;
    const wholeR = 40;
    const partR = 35;
    const wholeCx = W / 2;
    const wholeCy = 55;
    const part1Cx = W / 2 - 70;
    const part1Cy = 185;
    const part2Cx = W / 2 + 70;
    const part2Cy = 185;

    const svg = svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

    // Connecting lines (drawn first, behind circles)
    svg.appendChild(svgEl('line', {
      x1: wholeCx, y1: wholeCy + wholeR,
      x2: part1Cx, y2: part1Cy - partR,
      stroke: '#2c3e50', 'stroke-width': '2.5', 'stroke-linecap': 'round',
    }));
    svg.appendChild(svgEl('line', {
      x1: wholeCx, y1: wholeCy + wholeR,
      x2: part2Cx, y2: part2Cy - partR,
      stroke: '#2c3e50', 'stroke-width': '2.5', 'stroke-linecap': 'round',
    }));

    // Whole circle
    svg.appendChild(svgEl('circle', { cx: wholeCx, cy: wholeCy, r: wholeR, fill: '#eaf2ff', stroke: '#2980b9', 'stroke-width': '2.5' }));
    svg.appendChild(svgText(s.whole, wholeCx, wholeCy + 5, { 'font-size': '18', 'font-weight': '700', fill: '#2c3e50' }));
    if (s.showWholeLabel) {
      svg.appendChild(svgText('Whole', wholeCx, wholeCy - wholeR - 6, { 'font-size': '10', fill: '#7f8c8d' }));
    }

    // Part 1 circle
    svg.appendChild(svgEl('circle', { cx: part1Cx, cy: part1Cy, r: partR, fill: '#fef9e7', stroke: '#f39c12', 'stroke-width': '2.5' }));
    svg.appendChild(svgText(s.part1, part1Cx, part1Cy + 5, { 'font-size': '16', 'font-weight': '700', fill: '#2c3e50' }));
    if (s.showPartLabels) {
      svg.appendChild(svgText('Part', part1Cx, part1Cy + partR + 16, { 'font-size': '10', fill: '#7f8c8d' }));
    }

    // Part 2 circle
    svg.appendChild(svgEl('circle', { cx: part2Cx, cy: part2Cy, r: partR, fill: '#fef9e7', stroke: '#f39c12', 'stroke-width': '2.5' }));
    svg.appendChild(svgText(s.part2, part2Cx, part2Cy + 5, { 'font-size': '16', 'font-weight': '700', fill: '#2c3e50' }));
    if (s.showPartLabels) {
      svg.appendChild(svgText('Part', part2Cx, part2Cy + partR + 16, { 'font-size': '10', fill: '#7f8c8d' }));
    }

    return svg;
  },
};

/* ================================================================
   9. Ratio Bar
   ================================================================ */

const ratioBar = {
  name: 'Ratio Bar',
  category: 'Number',

  _rbPalette: ['#3498db','#e74c3c','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#34495e'],
  _buildRbSwatches(container, n) {
    container.innerHTML = '';
    const r = makeRow();
    for (let i = 0; i < n; i++) {
      r.appendChild(makeField(`Part ${i + 1}`, makeSwatch(`rb-col-${i}`, this._rbPalette[i % this._rbPalette.length])));
    }
    container.appendChild(r);
  },
  renderConfig(container) {
    container.appendChild(makeTitle('Ratio Bar'));

    const ratioInput = makeInput('rb-ratio', 'text', '3:2');
    container.appendChild(makeRow(
      makeField('Ratio (e.g. 3:2)', ratioInput),
      makeField('Total Value (optional)', makeSmallInput('rb-total', 'number', '', { placeholder: 'e.g. 50' })),
    ));

    container.appendChild(makeRow(
      makeField('Labels (comma sep.)', makeInput('rb-labels', 'text', 'Boys, Girls')),
      makeCheck('rb-values', 'Show Values', true),
    ));

    container.appendChild(makeLabel('Colours'));
    const swatchContainer = document.createElement('div');
    swatchContainer.id = 'rb-colours-container';
    container.appendChild(swatchContainer);
    this._buildRbSwatches(swatchContainer, 2);

    ratioInput.addEventListener('change', () => {
      const parts = (ratioInput.value || '').split(':').filter(Boolean);
      this._buildRbSwatches(swatchContainer, Math.max(1, parts.length));
    });
  },

  readConfig() {
    const ratioParts = (getEl('rb-ratio')?.value || '3:2').split(':').map((s) => parseInt(s.trim(), 10) || 1);
    const labels = (getEl('rb-labels')?.value || '').split(',').map((s) => s.trim());
    const colours = [];
    for (let i = 0; i < ratioParts.length; i++) {
      const el = document.getElementById(`rb-col-${i}`);
      colours.push(el ? el.value : this._rbPalette[i % this._rbPalette.length]);
    }
    return {
      ratioParts,
      labels,
      colours,
      total: parseFloat(getEl('rb-total')?.value) || 0,
      showValues: getEl('rb-values')?.checked ?? true,
    };
  },

  generateSVG(s) {
    const W = 500;
    const barH = 50;
    const pad = 30;
    const topPad = 20;
    const bottomPad = s.total > 0 ? 50 : 30;
    const H = topPad + barH + bottomPad;
    const barW = W - pad * 2;

    const svg = svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

    const totalParts = s.ratioParts.reduce((a, b) => a + b, 0);
    let x = pad;

    const defaultColours = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

    s.ratioParts.forEach((part, i) => {
      const w = (part / totalParts) * barW;
      const colour = s.colours[i] || defaultColours[i % defaultColours.length];

      // Section
      svg.appendChild(svgEl('rect', {
        x, y: topPad, width: w, height: barH,
        fill: colour, stroke: '#fff', 'stroke-width': '2', rx: i === 0 ? '4' : '0',
      }));
      // Round corners on last segment
      if (i === s.ratioParts.length - 1) {
        svg.appendChild(svgEl('rect', {
          x, y: topPad, width: w, height: barH,
          fill: colour, rx: '4',
        }));
      }

      // Label
      const label = s.labels[i] || `Part ${i + 1}`;
      svg.appendChild(svgText(label, x + w / 2, topPad + barH / 2 - 2, { 'font-size': '12', 'font-weight': '600', fill: '#fff' }));

      // Ratio number
      svg.appendChild(svgText(String(part), x + w / 2, topPad + barH / 2 + 14, { 'font-size': '11', fill: 'rgba(255,255,255,0.8)' }));

      // Value if total given
      if (s.showValues && s.total > 0) {
        const val = (part / totalParts) * s.total;
        svg.appendChild(svgText(Number.isInteger(val) ? String(val) : val.toFixed(1), x + w / 2, topPad + barH + 18, { 'font-size': '11', 'font-weight': '600', fill: '#555' }));
      }

      x += w;
    });

    // Overall bar outline
    svg.appendChild(svgEl('rect', {
      x: pad, y: topPad, width: barW, height: barH,
      fill: 'none', stroke: '#2c3e50', 'stroke-width': '2', rx: '4',
    }));

    // Total value with brace
    if (s.total > 0) {
      const braceY = topPad + barH + 28;
      svg.appendChild(svgEl('line', { x1: pad, y1: braceY, x2: pad + barW, y2: braceY, stroke: '#555', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: pad, y1: braceY - 4, x2: pad, y2: braceY + 4, stroke: '#555', 'stroke-width': '1' }));
      svg.appendChild(svgEl('line', { x1: pad + barW, y1: braceY - 4, x2: pad + barW, y2: braceY + 4, stroke: '#555', 'stroke-width': '1' }));
      svg.appendChild(svgText(`Total: ${s.total}`, W / 2, braceY + 16, { 'font-size': '12', 'font-weight': '600', fill: '#333' }));
    }

    return svg;
  },
};

/* ================================================================
   10. Coordinate Grid with Points
   ================================================================ */

const coordinateGrid = {
  name: 'Coordinate Grid',
  category: 'Algebra',

  renderConfig(container) {
    container.appendChild(makeTitle('Coordinate Grid with Points'));

    container.appendChild(makeRow(
      makeField('x Min', makeSmallInput('cg-xmin', 'number', '-6')),
      makeField('x Max', makeSmallInput('cg-xmax', 'number', '6')),
      makeField('y Min', makeSmallInput('cg-ymin', 'number', '-6')),
      makeField('y Max', makeSmallInput('cg-ymax', 'number', '6')),
    ));
    container.appendChild(makeRow(
      makeField('Grid Step', makeSmallInput('cg-step', 'number', '1', { min: '0.5', step: '0.5' })),
      makeCheck('cg-grid', 'Show Grid', true),
      makeCheck('cg-labels', 'Show Labels', true),
      makeCheck('cg-connect', 'Connect Points', false),
    ));

    container.appendChild(makeDivider());
    container.appendChild(makeLabel('Points (up to 10)'));

    const pointsDiv = document.createElement('div');
    pointsDiv.id = 'cg-points-wrap';
    container.appendChild(pointsDiv);

    // Build initial 3 point rows
    for (let i = 0; i < 3; i++) {
      this._addPointRow(pointsDiv, i);
    }

    const addBtn = document.createElement('button');
    addBtn.className = 'bar-btn';
    addBtn.textContent = '+ Add Point';
    addBtn.style.marginTop = '4px';
    addBtn.addEventListener('click', () => {
      const count = pointsDiv.querySelectorAll('.seg-row').length;
      if (count < 10) this._addPointRow(pointsDiv, count);
    });
    container.appendChild(addBtn);
  },

  _addPointRow(wrap, i) {
    const row = document.createElement('div');
    row.className = 'seg-row';
    row.innerHTML = `
      <input class="cfg-input cfg-input-sm" id="cg-pl-${i}" type="text" value="${String.fromCharCode(65 + i)}" placeholder="Label" style="width:50px">
      <input class="cfg-input cfg-input-sm" id="cg-px-${i}" type="number" value="${i}" placeholder="x">
      <input class="cfg-input cfg-input-sm" id="cg-py-${i}" type="number" value="${i}" placeholder="y">
    `;
    wrap.appendChild(row);
  },

  readConfig() {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const lbl = $(`cg-pl-${i}`);
      const px = $(`cg-px-${i}`);
      const py = $(`cg-py-${i}`);
      if (!lbl) break;
      if (px.value !== '' && py.value !== '') {
        points.push({ label: lbl.value, x: parseFloat(px.value) || 0, y: parseFloat(py.value) || 0 });
      }
    }
    return {
      xMin: parseFloat(getEl('cg-xmin')?.value) || -6,
      xMax: parseFloat(getEl('cg-xmax')?.value) || 6,
      yMin: parseFloat(getEl('cg-ymin')?.value) || -6,
      yMax: parseFloat(getEl('cg-ymax')?.value) || 6,
      step: parseFloat(getEl('cg-step')?.value) || 1,
      showGrid: getEl('cg-grid')?.checked ?? true,
      showLabels: getEl('cg-labels')?.checked ?? true,
      connect: getEl('cg-connect')?.checked ?? false,
      points,
    };
  },

  generateSVG(s) {
    if (s.xMin >= s.xMax) s.xMax = s.xMin + 1;
    if (s.yMin >= s.yMax) s.yMax = s.yMin + 1;

    const W = 500;
    const H = 500;
    const padL = 40;
    const padR = 20;
    const padT = 20;
    const padB = 36;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const svg = svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

    const rangeX = s.xMax - s.xMin;
    const rangeY = s.yMax - s.yMin;
    function mapX(v) { return padL + ((v - s.xMin) / rangeX) * plotW; }
    function mapY(v) { return padT + ((s.yMax - v) / rangeY) * plotH; }

    // Grid
    if (s.showGrid) {
      let gx = Math.ceil(s.xMin / s.step) * s.step;
      for (; gx <= s.xMax; gx += s.step) {
        svg.appendChild(svgEl('line', {
          x1: mapX(gx), y1: padT, x2: mapX(gx), y2: padT + plotH,
          stroke: '#e8e8e8', 'stroke-width': '0.8',
        }));
      }
      let gy = Math.ceil(s.yMin / s.step) * s.step;
      for (; gy <= s.yMax; gy += s.step) {
        svg.appendChild(svgEl('line', {
          x1: padL, y1: mapY(gy), x2: padL + plotW, y2: mapY(gy),
          stroke: '#e8e8e8', 'stroke-width': '0.8',
        }));
      }
    }

    // Axes
    const originX = Math.max(s.xMin, Math.min(s.xMax, 0));
    const originY = Math.max(s.yMin, Math.min(s.yMax, 0));

    svg.appendChild(svgEl('line', { x1: mapX(s.xMin), y1: mapY(originY), x2: mapX(s.xMax), y2: mapY(originY), stroke: '#333', 'stroke-width': '1.5' }));
    svg.appendChild(svgEl('line', { x1: mapX(originX), y1: mapY(s.yMin), x2: mapX(originX), y2: mapY(s.yMax), stroke: '#333', 'stroke-width': '1.5' }));

    // Tick labels
    if (s.showLabels) {
      let tx = Math.ceil(s.xMin / s.step) * s.step;
      for (; tx <= s.xMax + s.step * 0.001; tx += s.step) {
        const val = Math.round(tx * 1000) / 1000;
        if (Math.abs(val) < s.step * 0.001) continue;
        const sx = mapX(val);
        svg.appendChild(svgEl('line', { x1: sx, y1: mapY(originY) - 3, x2: sx, y2: mapY(originY) + 3, stroke: '#333', 'stroke-width': '1' }));
        svg.appendChild(svgText(String(val), sx, mapY(originY) + 16, { 'font-size': '10', fill: '#555' }));
      }
      let ty = Math.ceil(s.yMin / s.step) * s.step;
      for (; ty <= s.yMax + s.step * 0.001; ty += s.step) {
        const val = Math.round(ty * 1000) / 1000;
        if (Math.abs(val) < s.step * 0.001) continue;
        const sy = mapY(val);
        svg.appendChild(svgEl('line', { x1: mapX(originX) - 3, y1: sy, x2: mapX(originX) + 3, y2: sy, stroke: '#333', 'stroke-width': '1' }));
        svg.appendChild(svgText(String(val), mapX(originX) - 8, sy + 4, { 'font-size': '10', fill: '#555', 'text-anchor': 'end' }));
      }
      // Origin
      svg.appendChild(svgText('0', mapX(originX) - 8, mapY(originY) + 14, { 'font-size': '10', fill: '#555', 'text-anchor': 'end' }));
    }

    // Connect points
    if (s.connect && s.points.length > 1) {
      for (let i = 0; i < s.points.length - 1; i++) {
        const a = s.points[i];
        const b = s.points[i + 1];
        svg.appendChild(svgEl('line', {
          x1: mapX(a.x), y1: mapY(a.y), x2: mapX(b.x), y2: mapY(b.y),
          stroke: '#2980b9', 'stroke-width': '2',
        }));
      }
    }

    // Plot points
    const pointColours = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#c0392b', '#2c3e50', '#16a085'];
    s.points.forEach((p, i) => {
      const px = mapX(p.x);
      const py = mapY(p.y);
      svg.appendChild(svgEl('circle', { cx: px, cy: py, r: '5', fill: pointColours[i % pointColours.length], stroke: '#fff', 'stroke-width': '1.5' }));
      if (p.label) {
        svg.appendChild(svgText(p.label, px + 10, py - 8, { 'font-size': '11', 'font-weight': '600', fill: pointColours[i % pointColours.length], 'text-anchor': 'start' }));
      }
    });

    return svg;
  },
};

/* ================================================================
   11. Area Model (Multiplication)
   ================================================================ */

const areaModelMult = {
  name: 'Area Model (Multiplication)',
  category: 'Number',

  renderConfig(container) {
    container.appendChild(makeTitle('Area Model (Multiplication)'));

    container.appendChild(makeRow(
      makeField('Multiplicand', makeSmallInput('am-a', 'number', '23', { min: '1', max: '999' })),
      makeField('Multiplier', makeSmallInput('am-b', 'number', '14', { min: '1', max: '999' })),
    ));

    container.appendChild(makeRow(
      makeCheck('am-partial', 'Show Partial Products', true),
      makeCheck('am-dims', 'Show Dimensions', true),
    ));

    container.appendChild(makeRow(
      makeField('Colour 1', makeSwatch('am-col1', '#3498db')),
      makeField('Colour 2', makeSwatch('am-col2', '#2ecc71')),
      makeField('Colour 3', makeSwatch('am-col3', '#f39c12')),
      makeField('Colour 4', makeSwatch('am-col4', '#e74c3c')),
    ));
  },

  readConfig() {
    return {
      a: Math.max(1, parseInt(getEl('am-a')?.value, 10) || 23),
      b: Math.max(1, parseInt(getEl('am-b')?.value, 10) || 14),
      showPartial: getEl('am-partial')?.checked ?? true,
      showDims: getEl('am-dims')?.checked ?? true,
      colours: [
        getEl('am-col1')?.value || '#3498db',
        getEl('am-col2')?.value || '#2ecc71',
        getEl('am-col3')?.value || '#f39c12',
        getEl('am-col4')?.value || '#e74c3c',
      ],
    };
  },

  _expand(n) {
    // Split a number into place-value parts: 234 -> [200, 30, 4]
    const parts = [];
    const s = String(n);
    for (let i = 0; i < s.length; i++) {
      const digit = parseInt(s[i], 10);
      if (digit !== 0) {
        parts.push(digit * Math.pow(10, s.length - 1 - i));
      }
    }
    if (parts.length === 0) parts.push(0);
    return parts;
  },

  generateSVG(s) {
    const aParts = this._expand(s.a);
    const bParts = this._expand(s.b);
    const rows = bParts.length;
    const cols = aParts.length;

    const cellW = 100;
    const cellH = 60;
    const headerH = 30;
    const headerW = 50;
    const pad = 20;

    const gridW = cols * cellW;
    const gridH = rows * cellH;
    const W = headerW + gridW + pad * 2;
    const H = headerH + gridH + pad * 2 + 30; // extra for total

    const svg = svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

    const ox = pad + headerW;
    const oy = pad + headerH;
    let colIdx = 0;

    // Column headers (aParts)
    if (s.showDims) {
      aParts.forEach((val, ci) => {
        svg.appendChild(svgText(String(val), ox + ci * cellW + cellW / 2, oy - 10, { 'font-size': '13', 'font-weight': '700', fill: '#333' }));
      });
    }

    // Row headers (bParts)
    if (s.showDims) {
      bParts.forEach((val, ri) => {
        svg.appendChild(svgText(String(val), ox - 8, oy + ri * cellH + cellH / 2 + 4, { 'font-size': '13', 'font-weight': '700', fill: '#333', 'text-anchor': 'end' }));
      });
    }

    // Cells
    bParts.forEach((bVal, ri) => {
      aParts.forEach((aVal, ci) => {
        const x = ox + ci * cellW;
        const y = oy + ri * cellH;
        const colour = s.colours[colIdx % s.colours.length];
        colIdx++;

        svg.appendChild(svgEl('rect', {
          x, y, width: cellW, height: cellH,
          fill: lightenColour(colour, 50), stroke: colour, 'stroke-width': '2',
        }));

        if (s.showPartial) {
          const product = aVal * bVal;
          svg.appendChild(svgText(String(product), x + cellW / 2, y + cellH / 2 + 5, { 'font-size': '14', 'font-weight': '700', fill: '#333' }));
        }
      });
    });

    // Dimension labels on top-left
    if (s.showDims) {
      svg.appendChild(svgText('\u00D7', ox - 20, oy - 10, { 'font-size': '14', 'font-weight': '700', fill: '#333' }));
    }

    // Total
    const total = s.a * s.b;
    svg.appendChild(svgText(`${s.a} \u00D7 ${s.b} = ${total}`, W / 2, H - 12, { 'font-size': '14', 'font-weight': '700', fill: '#2c3e50' }));

    return svg;
  },
};

/* ================================================================
   12. Fraction Number Line
   ================================================================ */

const fractionNumberLine = {
  name: 'Fraction Number Line',
  category: 'Number',

  renderConfig(container) {
    container.appendChild(makeTitle('Fraction Number Line'));

    container.appendChild(makeRow(
      makeField('Min Value', makeSmallInput('fnl-min', 'number', '0')),
      makeField('Max Value', makeSmallInput('fnl-max', 'number', '2')),
      makeField('Denominator', makeSmallInput('fnl-denom', 'number', '4', { min: '2', max: '12' })),
    ));

    container.appendChild(makeRow(
      makeCheck('fnl-improper', 'Show Improper Fractions', false),
    ));

    container.appendChild(makeDivider());
    container.appendChild(makeLabel('Highlight Fractions (comma sep., e.g. 1/4, 3/4, 5/4)'));
    container.appendChild(makeRow(
      makeField('Fractions', makeInput('fnl-marks', 'text', '1/4, 1/2, 3/4', { placeholder: 'e.g. 1/4, 3/4' })),
    ));
  },

  readConfig() {
    const marked = (getEl('fnl-marks')?.value || '').split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
      const parts = s.split('/');
      if (parts.length === 2) return { n: parseInt(parts[0], 10), d: parseInt(parts[1], 10) };
      return { n: parseFloat(s), d: 1 };
    }).filter((f) => !isNaN(f.n) && !isNaN(f.d) && f.d !== 0).slice(0, 5);

    return {
      min: parseFloat(getEl('fnl-min')?.value) ?? 0,
      max: parseFloat(getEl('fnl-max')?.value) ?? 2,
      denom: Math.min(12, Math.max(2, parseInt(getEl('fnl-denom')?.value, 10) || 4)),
      showImproper: getEl('fnl-improper')?.checked ?? false,
      marked,
    };
  },

  generateSVG(s) {
    if (s.min >= s.max) s.max = s.min + 1;

    const W = 560;
    const H = 100;
    const padL = 30;
    const padR = 30;
    const lineY = 45;
    const lineW = W - padL - padR;
    const range = s.max - s.min;

    const svg = svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

    // Defs for arrow
    const defs = svgEl('defs', {});
    const marker = svgEl('marker', { id: 'fnl-arrow', markerWidth: '8', markerHeight: '6', refX: '8', refY: '3', orient: 'auto' });
    marker.appendChild(svgEl('polygon', { points: '0 0, 8 3, 0 6', fill: '#333' }));
    defs.appendChild(marker);
    const markerR = svgEl('marker', { id: 'fnl-arrow-rev', markerWidth: '8', markerHeight: '6', refX: '0', refY: '3', orient: 'auto' });
    markerR.appendChild(svgEl('polygon', { points: '8 0, 0 3, 8 6', fill: '#333' }));
    defs.appendChild(markerR);
    svg.appendChild(defs);

    function mapX(val) { return padL + ((val - s.min) / range) * lineW; }

    // Main line
    const line = svgEl('line', { x1: padL, y1: lineY, x2: padL + lineW, y2: lineY, stroke: '#333', 'stroke-width': '2' });
    line.setAttribute('marker-end', 'url(#fnl-arrow)');
    line.setAttribute('marker-start', 'url(#fnl-arrow-rev)');
    svg.appendChild(line);

    // Fraction ticks
    const totalTicks = Math.round(range * s.denom);
    for (let i = 0; i <= totalTicks; i++) {
      const val = s.min + i / s.denom;
      if (val < s.min - 0.001 || val > s.max + 0.001) continue;
      const x = mapX(val);
      const isWhole = i % s.denom === 0;
      const tickH = isWhole ? 8 : 5;

      svg.appendChild(svgEl('line', {
        x1: x, y1: lineY - tickH, x2: x, y2: lineY + tickH,
        stroke: '#333', 'stroke-width': isWhole ? '1.5' : '1',
      }));

      // Label
      let label;
      if (isWhole) {
        label = String(Math.round(val));
      } else {
        const numer = Math.round(s.min * s.denom) + i;
        if (s.showImproper || numer <= s.denom) {
          const g = gcd(Math.abs(numer), s.denom);
          label = `${numer / g}/${s.denom / g}`;
        } else {
          // Mixed number: convert
          const whole = Math.floor(numer / s.denom);
          const rem = numer % s.denom;
          if (rem === 0) {
            label = String(whole);
          } else {
            const g = gcd(Math.abs(rem), s.denom);
            label = `${whole} ${rem / g}/${s.denom / g}`;
          }
        }
      }
      svg.appendChild(svgText(label, x, lineY + tickH + 14, { 'font-size': isWhole ? '11' : '9', fill: '#555' }));
    }

    // Highlighted fractions
    s.marked.forEach((frac) => {
      const val = frac.n / frac.d;
      if (val >= s.min && val <= s.max) {
        const x = mapX(val);
        svg.appendChild(svgEl('circle', { cx: x, cy: lineY, r: '6', fill: '#e74c3c', stroke: '#c0392b', 'stroke-width': '1.5' }));
        // Label above
        const g = gcd(Math.abs(frac.n), frac.d);
        svg.appendChild(svgText(`${frac.n / g}/${frac.d / g}`, x, lineY - 14, { 'font-size': '11', 'font-weight': '600', fill: '#e74c3c' }));
      }
    });

    return svg;
  },
};

/* ================================================================
   13. Transformation Grid
   ================================================================ */

const transformationGrid = {
  name: 'Transformation Grid',
  category: 'Geometry',

  _shapePresets: {
    none: { label: '-- Choose preset --', vertices: '' },
    square: { label: 'Square', vertices: '1,1 3,1 3,3 1,3' },
    triangle: { label: 'Triangle', vertices: '1,1 4,1 2.5,4' },
    lshape: { label: 'L-shape', vertices: '1,1 3,1 3,2 2,2 2,4 1,4' },
  },

  _buildParamsUI(container, type) {
    container.innerHTML = '';
    switch (type) {
      case 'reflection':
        container.appendChild(makeRow(
          makeField('Axis', makeSelect('tg-ref-axis', [
            ['x-axis', 'x-axis'], ['y-axis', 'y-axis'], ['x=N', 'x = N'], ['y=N', 'y = N'],
          ], 'y-axis')),
          makeField('N (for x=N / y=N)', makeSmallInput('tg-ref-n', 'number', '0')),
        ));
        break;
      case 'rotation':
        container.appendChild(makeRow(
          makeField('Angle (\u00b0)', makeSmallInput('tg-rot-angle', 'number', '90', { min: '-360', max: '360', step: '1' })),
          makeField('Centre x', makeSmallInput('tg-rot-cx', 'number', '0')),
          makeField('Centre y', makeSmallInput('tg-rot-cy', 'number', '0')),
        ));
        break;
      case 'translation':
        container.appendChild(makeRow(
          makeField('dx', makeSmallInput('tg-trans-dx', 'number', '3')),
          makeField('dy', makeSmallInput('tg-trans-dy', 'number', '2')),
        ));
        break;
      case 'enlargement':
        container.appendChild(makeRow(
          makeField('Scale factor', makeSmallInput('tg-enl-sf', 'number', '2', { step: '0.5' })),
          makeField('Centre x', makeSmallInput('tg-enl-cx', 'number', '0')),
          makeField('Centre y', makeSmallInput('tg-enl-cy', 'number', '0')),
        ));
        break;
    }
  },

  renderConfig(container) {
    container.appendChild(makeTitle('Transformation Grid'));

    container.appendChild(makeRow(
      makeField('x Min', makeSmallInput('tg-xmin', 'number', '-8')),
      makeField('x Max', makeSmallInput('tg-xmax', 'number', '8')),
      makeField('y Min', makeSmallInput('tg-ymin', 'number', '-8')),
      makeField('y Max', makeSmallInput('tg-ymax', 'number', '8')),
    ));

    container.appendChild(makeRow(
      makeCheck('tg-grid', 'Show Grid', true),
      makeCheck('tg-labels', 'Show Labels', true),
      makeCheck('tg-image', 'Show Image Shape', true),
    ));

    container.appendChild(makeDivider());

    /* Shape presets */
    const presetOpts = Object.entries(this._shapePresets).map(([k, v]) => [k, v.label]);
    const presetSelect = makeSelect('tg-preset', presetOpts, 'none');
    container.appendChild(makeRow(
      makeField('Shape Preset', presetSelect),
    ));

    const vertInput = makeInput('tg-verts', 'text', '1,1 3,1 3,3 1,3', { placeholder: 'x1,y1 x2,y2 ...' });
    container.appendChild(makeRow(
      makeField('Vertices (x,y pairs)', vertInput),
    ));

    presetSelect.addEventListener('change', () => {
      const preset = this._shapePresets[presetSelect.value];
      if (preset && preset.vertices) vertInput.value = preset.vertices;
    });

    container.appendChild(makeDivider());
    container.appendChild(makeLabel('Transformation'));

    const typeSelect = makeSelect('tg-type', [
      ['reflection', 'Reflection'],
      ['rotation', 'Rotation'],
      ['translation', 'Translation'],
      ['enlargement', 'Enlargement'],
    ], 'reflection');
    container.appendChild(makeRow(makeField('Type', typeSelect)));

    const paramsContainer = document.createElement('div');
    paramsContainer.id = 'tg-params-container';
    container.appendChild(paramsContainer);
    this._buildParamsUI(paramsContainer, 'reflection');

    typeSelect.addEventListener('change', () => {
      this._buildParamsUI(paramsContainer, typeSelect.value);
    });

    container.appendChild(makeDivider());
    container.appendChild(makeRow(
      makeField('Object colour', makeSwatch('tg-col-obj', '#3498db')),
      makeField('Image colour', makeSwatch('tg-col-img', '#e74c3c')),
    ));
  },

  readConfig() {
    const type = getEl('tg-type')?.value || 'reflection';
    let params = '';
    switch (type) {
      case 'reflection': {
        const axis = getEl('tg-ref-axis')?.value || 'y-axis';
        const n = parseFloat(getEl('tg-ref-n')?.value) || 0;
        params = (axis === 'x=N' || axis === 'y=N') ? `${axis.replace('N', String(n))}` : axis;
        break;
      }
      case 'rotation': {
        const angle = parseFloat(getEl('tg-rot-angle')?.value) || 90;
        const cx = parseFloat(getEl('tg-rot-cx')?.value) || 0;
        const cy = parseFloat(getEl('tg-rot-cy')?.value) || 0;
        params = `${angle},${cx},${cy}`;
        break;
      }
      case 'translation': {
        const dx = parseFloat(getEl('tg-trans-dx')?.value) || 0;
        const dy = parseFloat(getEl('tg-trans-dy')?.value) || 0;
        params = `${dx},${dy}`;
        break;
      }
      case 'enlargement': {
        const sf = parseFloat(getEl('tg-enl-sf')?.value) || 2;
        const cx = parseFloat(getEl('tg-enl-cx')?.value) || 0;
        const cy = parseFloat(getEl('tg-enl-cy')?.value) || 0;
        params = `${sf},${cx},${cy}`;
        break;
      }
    }
    const vertsStr = getEl('tg-verts')?.value || '1,1 3,1 3,3 1,3';
    const vertices = vertsStr.trim().split(/\s+/).map(p => {
      const [x, y] = p.split(',').map(Number);
      return { x: x || 0, y: y || 0 };
    });
    return {
      xMin: parseFloat(getEl('tg-xmin')?.value) || -8,
      xMax: parseFloat(getEl('tg-xmax')?.value) || 8,
      yMin: parseFloat(getEl('tg-ymin')?.value) || -8,
      yMax: parseFloat(getEl('tg-ymax')?.value) || 8,
      showGrid: getEl('tg-grid')?.checked ?? true,
      showLabels: getEl('tg-labels')?.checked ?? true,
      showImage: getEl('tg-image')?.checked ?? true,
      type,
      params,
      vertices,
      colObj: getEl('tg-col-obj')?.value || '#3498db',
      colImg: getEl('tg-col-img')?.value || '#e74c3c',
    };
  },

  _applyTransform(vertices, type, params) {
    switch (type) {
      case 'reflection': {
        if (params === 'x-axis') return vertices.map(v => ({ x: v.x, y: -v.y }));
        if (params === 'y-axis') return vertices.map(v => ({ x: -v.x, y: v.y }));
        if (params.startsWith('x=')) {
          const n = parseFloat(params.slice(2)) || 0;
          return vertices.map(v => ({ x: 2 * n - v.x, y: v.y }));
        }
        if (params.startsWith('y=')) {
          const n = parseFloat(params.slice(2)) || 0;
          return vertices.map(v => ({ x: v.x, y: 2 * n - v.y }));
        }
        return vertices;
      }
      case 'rotation': {
        const [angle, cx, cy] = params.split(',').map(Number);
        const rad = (angle * Math.PI) / 180;
        return vertices.map(v => {
          const dx = v.x - cx, dy = v.y - cy;
          return {
            x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
            y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
          };
        });
      }
      case 'translation': {
        const [dx, dy] = params.split(',').map(Number);
        return vertices.map(v => ({ x: v.x + dx, y: v.y + dy }));
      }
      case 'enlargement': {
        const [sf, cx, cy] = params.split(',').map(Number);
        return vertices.map(v => ({
          x: cx + sf * (v.x - cx),
          y: cy + sf * (v.y - cy),
        }));
      }
      default:
        return vertices;
    }
  },

  generateSVG(s) {
    const W = 500, H = 500;
    const padL = 40, padR = 20, padT = 20, padB = 36;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    if (s.xMin >= s.xMax) s.xMax = s.xMin + 1;
    if (s.yMin >= s.yMax) s.yMax = s.yMin + 1;

    const rangeX = s.xMax - s.xMin;
    const rangeY = s.yMax - s.yMin;
    function mapX(v) { return padL + ((v - s.xMin) / rangeX) * plotW; }
    function mapY(v) { return padT + ((s.yMax - v) / rangeY) * plotH; }

    const svg = svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

    /* grid */
    if (s.showGrid) {
      for (let gx = Math.ceil(s.xMin); gx <= s.xMax; gx++) {
        svg.appendChild(svgEl('line', {
          x1: mapX(gx), y1: padT, x2: mapX(gx), y2: padT + plotH,
          stroke: '#e8e8e8', 'stroke-width': '0.8',
        }));
      }
      for (let gy = Math.ceil(s.yMin); gy <= s.yMax; gy++) {
        svg.appendChild(svgEl('line', {
          x1: padL, y1: mapY(gy), x2: padL + plotW, y2: mapY(gy),
          stroke: '#e8e8e8', 'stroke-width': '0.8',
        }));
      }
    }

    /* axes */
    const originX = Math.max(s.xMin, Math.min(s.xMax, 0));
    const originY = Math.max(s.yMin, Math.min(s.yMax, 0));
    svg.appendChild(svgEl('line', { x1: mapX(s.xMin), y1: mapY(originY), x2: mapX(s.xMax), y2: mapY(originY), stroke: '#333', 'stroke-width': '1.5' }));
    svg.appendChild(svgEl('line', { x1: mapX(originX), y1: mapY(s.yMin), x2: mapX(originX), y2: mapY(s.yMax), stroke: '#333', 'stroke-width': '1.5' }));

    /* tick labels */
    if (s.showLabels) {
      for (let tx = Math.ceil(s.xMin); tx <= s.xMax; tx++) {
        if (tx === 0) continue;
        const sx = mapX(tx);
        svg.appendChild(svgEl('line', { x1: sx, y1: mapY(originY) - 3, x2: sx, y2: mapY(originY) + 3, stroke: '#333', 'stroke-width': '1' }));
        svg.appendChild(svgText(String(tx), sx, mapY(originY) + 16, { 'font-size': '10', fill: '#555' }));
      }
      for (let ty = Math.ceil(s.yMin); ty <= s.yMax; ty++) {
        if (ty === 0) continue;
        const sy = mapY(ty);
        svg.appendChild(svgEl('line', { x1: mapX(originX) - 3, y1: sy, x2: mapX(originX) + 3, y2: sy, stroke: '#333', 'stroke-width': '1' }));
        svg.appendChild(svgText(String(ty), mapX(originX) - 8, sy + 4, { 'font-size': '10', fill: '#555', 'text-anchor': 'end' }));
      }
      svg.appendChild(svgText('0', mapX(originX) - 8, mapY(originY) + 14, { 'font-size': '10', fill: '#555', 'text-anchor': 'end' }));
    }

    /* draw shape helper */
    function drawShape(verts, colour, opacity) {
      if (verts.length < 2) return;
      const pts = verts.map(v => `${mapX(v.x)},${mapY(v.y)}`).join(' ');
      svg.appendChild(svgEl('polygon', {
        points: pts, fill: colour, 'fill-opacity': String(opacity),
        stroke: colour, 'stroke-width': '2', 'stroke-linejoin': 'round',
      }));
      /* vertex dots */
      verts.forEach((v, i) => {
        svg.appendChild(svgEl('circle', {
          cx: mapX(v.x), cy: mapY(v.y), r: '3',
          fill: colour, stroke: '#fff', 'stroke-width': '1',
        }));
      });
    }

    /* object shape */
    drawShape(s.vertices, s.colObj, 0.3);

    /* image shape */
    if (s.showImage && s.vertices.length >= 2) {
      const imageVerts = this._applyTransform(s.vertices, s.type, s.params);
      drawShape(imageVerts, s.colImg, 0.3);

      /* draw mirror line for reflection */
      if (s.type === 'reflection') {
        let lx1, ly1, lx2, ly2;
        if (s.params === 'x-axis') {
          lx1 = mapX(s.xMin); ly1 = mapY(0); lx2 = mapX(s.xMax); ly2 = mapY(0);
        } else if (s.params === 'y-axis') {
          lx1 = mapX(0); ly1 = mapY(s.yMin); lx2 = mapX(0); ly2 = mapY(s.yMax);
        } else if (s.params.startsWith('x=')) {
          const n = parseFloat(s.params.slice(2)) || 0;
          lx1 = mapX(n); ly1 = mapY(s.yMin); lx2 = mapX(n); ly2 = mapY(s.yMax);
        } else if (s.params.startsWith('y=')) {
          const n = parseFloat(s.params.slice(2)) || 0;
          lx1 = mapX(s.xMin); ly1 = mapY(n); lx2 = mapX(s.xMax); ly2 = mapY(n);
        }
        if (lx1 !== undefined) {
          svg.appendChild(svgEl('line', {
            x1: lx1, y1: ly1, x2: lx2, y2: ly2,
            stroke: '#9b59b6', 'stroke-width': '1.5', 'stroke-dasharray': '6,4',
          }));
        }
      }
    }

    return svg;
  },
};

/* ================================================================
   Export
   ================================================================ */

export const interactiveTemplates = [
  numberLine,
  redYellowCounters,
  algebraTiles,
  rightAngledTriangle,
  doubleNumberLine,
  placeValueCounters,
  tenFrames,
  partWholeModel,
  ratioBar,
  coordinateGrid,
  areaModelMult,
  fractionNumberLine,
  transformationGrid,
];
