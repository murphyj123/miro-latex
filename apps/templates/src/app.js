/* ── Maths Templates Generator ────────────────────── */
import { extraTemplates } from './templates-extra.js';
import { interactiveTemplates } from './templates-interactive.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function makeSVG(w, h) {
  return svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${w} ${h}`, width: w, height: h });
}

function textEl(txt, x, y, extra = {}) {
  const t = svgEl('text', { x, y, 'font-family': 'Inter, Arial, sans-serif', 'font-size': '12', fill: '#333', 'text-anchor': 'middle', 'dominant-baseline': 'central', ...extra });
  t.textContent = txt;
  return t;
}

// ── DOM refs ────────────────────────────────────────

const galleryScreen = document.getElementById('gallery-screen');
const editorScreen  = document.getElementById('editor-screen');
const galleryGrid   = document.getElementById('gallery-grid');
const galleryCats   = document.getElementById('gallery-categories');
const searchInput   = document.getElementById('tpl-search');
const backBtn       = document.getElementById('back-btn');
const editorTitle   = document.getElementById('editor-title');
const configPanel   = document.getElementById('config-panel');
const previewArea   = document.getElementById('preview-area');
const placeBtn      = document.getElementById('place-btn');
const editBtn       = document.getElementById('edit-selected-btn');
const imgSizeEl     = document.getElementById('img-size');
const sizeValueEl   = document.getElementById('size-value');
const favBtn        = document.getElementById('fav-btn');

let activeTemplate = null;
let debounceTimer  = null;

// ── Category & keyword maps ─────────────────────────

const CATS = {};
['bar-model','fraction-wall','fraction-circles','place-value-chart','hundreds-chart',
 'multiplication-grid','number-line','fraction-number-line','double-number-line',
 'ten-frames','place-value-counters','part-whole-model','ratio-bar','percentage-bar',
 'red-yellow-counters','number-pattern','dice','spinner',
 'factor-tree','column-arithmetic','long-division','bidmas','conversion-chart',
 'si-prefixes','binary-frame'
].forEach(id => CATS[id] = 'number');
['function-machine','algebra-tiles','area-model-multiplication-','coordinate-grid',
 'two-way-table','equation-balance','two-column-proof'
].forEach(id => CATS[id] = 'algebra');
['regular-polygon','compound-shape','circle-sector','right-angled-triangle',
 'trig-triangle','parallel-transversal','circle-theorems','bearings-diagram',
 'unit-circle','protractor','symmetry-grid','iso-dot-grid'
].forEach(id => CATS[id] = 'geometry');
['cube','cuboid','cylinder','cone','sphere','triangular-prism','square-pyramid'
].forEach(id => CATS[id] = '3d-shapes');
['venn-diagram','carroll-diagram','tree-diagram','box-whisker','probability-scale',
 'stem-leaf','normal-distribution','tally-chart','frequency-table',
 'pie-chart-data','scatter-plot','histogram','cumulative-frequency',
 'chi-squared','t-distribution','binomial','contingency-table'
].forEach(id => CATS[id] = 'statistics');
['transformation-grid','argand-diagram'
].forEach(id => CATS[id] = 'advanced');
['ruler','weighing-scale','reading-scale','thermometer','clock-face'
].forEach(id => CATS[id] = 'measurement');

const KEYWORDS = {
  'bar-model': 'bar model, part whole, ratio, comparison, strip, tape diagram, proportion',
  'fraction-wall': 'fraction wall, equivalent fractions, fraction strips, comparing fractions',
  'fraction-circles': 'fraction circles, pie fractions, fraction pizza, shaded fraction, parts of a whole',
  'place-value-chart': 'place value, columns, thousands, hundreds, tens, units, decimal',
  'hundreds-chart': 'hundreds chart, hundred square, number grid, 1 to 100, counting',
  'multiplication-grid': 'multiplication grid, times table, multiplication square, products',
  'number-line': 'number line, integers, decimals, fractions, scale, axis',
  'fraction-number-line': 'fraction number line, fractions on a line, ordering fractions',
  'double-number-line': 'double number line, ratio, proportion, scaling, unitary method',
  'ten-frames': 'ten frame, counting, number bonds, subitising, addition',
  'place-value-counters': 'place value counters, dienes, base ten, exchange, regrouping',
  'part-whole-model': 'part whole, cherry model, number bonds, addition, subtraction',
  'ratio-bar': 'ratio bar, ratio strip, proportion, sharing, parts',
  'percentage-bar': 'percentage bar, stacked bar, composition, proportion, pie alternative',
  'red-yellow-counters': 'counters, two colour, positive negative, integer, directed number',
  'number-pattern': 'number pattern, sequence, term, nth term, arithmetic',
  'clock-face': 'clock, time, analogue, hours, minutes, telling time',
  'thermometer': 'thermometer, temperature, negative numbers, scale, reading',
  'dice': 'dice, die, random, probability, chance',
  'spinner': 'spinner, probability, chance, random, sectors, outcomes',
  'factor-tree': 'factor tree, prime factorisation, HCF, LCM, factors',
  'column-arithmetic': 'column addition, column subtraction, carrying, borrowing, regrouping, written method',
  'long-division': 'long division, bus stop, short division, quotient, remainder',
  'bidmas': 'BIDMAS, BODMAS, PEMDAS, order of operations, brackets',
  'conversion-chart': 'conversion, metric, units, km, m, cm, mm, kg, g, litres',
  'si-prefixes': 'SI prefixes, kilo, mega, giga, milli, micro, nano, pico, femto, tera, bytes, scientific notation, powers of ten',
  'binary-frame': 'binary, place value, bits, byte, nibble, decimal, powers of 2, binary frame, number systems, computing',
  'function-machine': 'function machine, input output, inverse, operations, mapping',
  'algebra-tiles': 'algebra tiles, expanding, factorising, completing the square, area model',
  'area-model-multiplication-': 'area model, grid method, multiplication, partial products, expanded',
  'coordinate-grid': 'coordinate grid, cartesian, plotting points, coordinates, x y axis',
  'two-way-table': 'two way table, contingency, frequency, cross tabulation, categories',
  'equation-balance': 'equation, balance, scales, solving, equal, algebra',
  'two-column-proof': 'proof, geometric proof, statement reason, deductive, justify',
  'regular-polygon': 'polygon, regular, triangle, square, pentagon, hexagon, interior angles',
  'compound-shape': 'compound shape, composite, L shape, area, perimeter',
  'circle-sector': 'sector, arc, angle, pie slice, circle part',
  'right-angled-triangle': 'right angle triangle, pythagoras, trigonometry, hypotenuse',
  'trig-triangle': 'SOH CAH TOA, trigonometry, sine, cosine, tangent, right triangle',
  'parallel-transversal': 'parallel lines, transversal, alternate angles, corresponding, co-interior, allied',
  'circle-theorems': 'circle theorems, inscribed angle, tangent, chord, cyclic quadrilateral',
  'bearings-diagram': 'bearings, compass, navigation, three figure, direction, angle from north',
  'unit-circle': 'unit circle, trigonometry, sine cosine, radians, degrees, coordinates',
  'protractor': 'protractor, measuring angles, degrees, angle measurer',
  'symmetry-grid': 'symmetry, reflection, mirror line, line of symmetry',
  'iso-dot-grid': 'isometric, dot grid, 3D drawing, isometric paper',
  'cube': 'cube, 3D, solid, faces edges vertices, net',
  'cuboid': 'cuboid, rectangular prism, 3D, box, volume',
  'cylinder': 'cylinder, 3D, circular, volume, surface area',
  'cone': 'cone, 3D, volume, slant height, apex',
  'sphere': 'sphere, 3D, ball, volume, surface area, hemisphere',
  'triangular-prism': 'triangular prism, 3D, cross section, volume',
  'square-pyramid': 'pyramid, 3D, square based, apex, slant',
  'venn-diagram': 'venn diagram, sets, intersection, union, probability, sorting',
  'carroll-diagram': 'carroll diagram, sorting, classification, two way, properties',
  'tree-diagram': 'tree diagram, probability, branches, outcomes, independent, dependent',
  'box-whisker': 'box plot, box and whisker, five number summary, quartiles, median, IQR, range',
  'probability-scale': 'probability scale, likelihood, chance, impossible, certain, even',
  'stem-leaf': 'stem and leaf, data display, ordered, back to back, distribution',
  'normal-distribution': 'normal distribution, bell curve, gaussian, standard deviation, z score',
  'tally-chart': 'tally chart, frequency, counting, data collection, survey',
  'frequency-table': 'frequency table, grouped data, class interval, tally, cumulative',
  'pie-chart-data': 'pie chart, sectors, proportions, angles, percentages, circular',
  'scatter-plot': 'scatter plot, scatter graph, correlation, line of best fit, regression, bivariate',
  'histogram': 'histogram, frequency density, continuous data, grouped, class width',
  'cumulative-frequency': 'cumulative frequency, ogive, S curve, quartiles, percentiles, median',
  'chi-squared': 'chi squared, chi-squared distribution, hypothesis test, goodness of fit, independence, critical value',
  't-distribution': 't distribution, t test, student t, hypothesis test, degrees of freedom, critical region',
  'binomial': 'binomial distribution, probability, trials, success, PMF, bar chart, discrete',
  'contingency-table': 'contingency table, two way table, chi test, independence, observed, expected, frequency',
  'transformation-grid': 'transformation, reflection, rotation, translation, enlargement, congruent, similar',
  'argand-diagram': 'argand diagram, complex numbers, imaginary, real, modulus, argument',
  'ruler': 'ruler, length, measurement, cm, mm, centimetres, millimetres, inches, measuring',
  'weighing-scale': 'weighing scale, dial, mass, weight, reading, pointer, grams, kilograms, newtons',
  'reading-scale': 'reading scale, scale, measurement, pointer, linear, graduated, intervals',
};

const DISPLAY_NAMES = {
  'bar-model': 'Bar Model', 'fraction-wall': 'Fraction Wall', 'fraction-circles': 'Fraction Circles',
  'place-value-chart': 'Place Value Chart', 'hundreds-chart': 'Hundreds Chart',
  'multiplication-grid': 'Multiplication Grid', 'number-line': 'Number Line',
  'fraction-number-line': 'Fraction Number Line', 'double-number-line': 'Double Number Line',
  'ten-frames': 'Ten Frames', 'place-value-counters': 'Place Value Counters',
  'part-whole-model': 'Part-Whole Model', 'ratio-bar': 'Ratio Bar',
  'percentage-bar': 'Percentage Bar', 'red-yellow-counters': 'Red-Yellow Counters',
  'number-pattern': 'Number Pattern', 'clock-face': 'Clock Face', 'thermometer': 'Thermometer',
  'dice': 'Dice', 'spinner': 'Spinner', 'factor-tree': 'Factor Tree',
  'column-arithmetic': 'Column Arithmetic',
  'long-division': 'Long Division', 'bidmas': 'BIDMAS', 'conversion-chart': 'Conversion Chart',
  'function-machine': 'Function Machine', 'algebra-tiles': 'Algebra Tiles',
  'area-model-multiplication-': 'Area Model', 'coordinate-grid': 'Coordinate Grid',
  'two-way-table': 'Two-Way Table', 'equation-balance': 'Equation Balance',
  'two-column-proof': 'Two-Column Proof', 'regular-polygon': 'Regular Polygon',
  'compound-shape': 'Compound Shape', 'circle-sector': 'Circle Sector',
  'right-angled-triangle': 'Right-Angled Triangle', 'trig-triangle': 'Trig Triangle',
  'parallel-transversal': 'Parallel Lines', 'circle-theorems': 'Circle Theorems',
  'bearings-diagram': 'Bearings', 'unit-circle': 'Unit Circle', 'protractor': 'Protractor',
  'symmetry-grid': 'Symmetry Grid', 'iso-dot-grid': 'Isometric Dot Grid',
  'cube': 'Cube', 'cuboid': 'Cuboid', 'cylinder': 'Cylinder', 'cone': 'Cone',
  'sphere': 'Sphere', 'triangular-prism': 'Triangular Prism', 'square-pyramid': 'Square Pyramid',
  'venn-diagram': 'Venn Diagram', 'carroll-diagram': 'Carroll Diagram',
  'tree-diagram': 'Tree Diagram', 'box-whisker': 'Box & Whisker',
  'probability-scale': 'Probability Scale', 'stem-leaf': 'Stem & Leaf',
  'normal-distribution': 'Normal Distribution', 'tally-chart': 'Tally Chart',
  'frequency-table': 'Frequency Table', 'pie-chart-data': 'Pie Chart',
  'scatter-plot': 'Scatter Plot', 'histogram': 'Histogram',
  'cumulative-frequency': 'Cumulative Frequency',
  'chi-squared': 'Chi-Squared Dist.', 't-distribution': 't-Distribution',
  'binomial': 'Binomial Dist.', 'contingency-table': 'Contingency Table',
  'transformation-grid': 'Transformation Grid',
  'argand-diagram': 'Argand Diagram',
  'ruler': 'Ruler', 'weighing-scale': 'Weighing Scale', 'reading-scale': 'Reading Scale',
};

const CAT_ICONS = {
  'number': '#',
  'algebra': 'x',
  'geometry': '\u25B3',
  '3d-shapes': '\u2B22',
  'statistics': '\u03C3',
  'advanced': '\u221E',
  'measurement': '\u21C4',
};

const CAT_COLORS = {
  'number': '#eef2ff',
  'algebra': '#fef3c7',
  'geometry': '#d1fae5',
  '3d-shapes': '#fce7f3',
  'statistics': '#e0e7ff',
  'advanced': '#f3e8ff',
  'measurement': '#e0f2fe',
};

// Ordered list of template IDs to control gallery order
const TEMPLATE_ORDER = [
  // number
  'bar-model','fraction-wall','fraction-circles','place-value-chart','hundreds-chart',
  'multiplication-grid','number-line','fraction-number-line','double-number-line',
  'ten-frames','place-value-counters','part-whole-model','ratio-bar','percentage-bar',
  'red-yellow-counters','number-pattern','dice','spinner',
  'factor-tree','column-arithmetic','long-division','bidmas','conversion-chart',
  'si-prefixes','binary-frame',
  // algebra
  'function-machine','algebra-tiles','area-model-multiplication-','coordinate-grid',
  'two-way-table','equation-balance','two-column-proof',
  // geometry
  'regular-polygon','compound-shape','circle-sector','right-angled-triangle',
  'trig-triangle','parallel-transversal','circle-theorems','bearings-diagram',
  'unit-circle','protractor','symmetry-grid','iso-dot-grid',
  // 3d
  'cube','cuboid','cylinder','cone','sphere','triangular-prism','square-pyramid',
  // statistics
  'venn-diagram','carroll-diagram','tree-diagram','box-whisker','probability-scale',
  'stem-leaf','normal-distribution','tally-chart','frequency-table',
  'pie-chart-data','scatter-plot','histogram','cumulative-frequency',
  'chi-squared','t-distribution','binomial','contingency-table',
  // advanced
  'transformation-grid','argand-diagram',
  // measurement
  'thermometer','clock-face','ruler','weighing-scale','reading-scale',
];

// ── Colour palettes ─────────────────────────────────

const ROW_COLOURS = [
  '#fce4ec','#e3f2fd','#e8f5e9','#fff9c4','#f3e5f5',
  '#e0f7fa','#fff3e0','#ede7f6','#fbe9e7','#e8eaf6','#f1f8e9',
];

const SEG_COLOURS = [
  '#90caf9','#ef9a9a','#a5d6a7','#fff59d','#ce93d8',
  '#80cbc4','#ffab91','#b0bec5',
];

// ══════════════════════════════════════════════════════
// TEMPLATE REGISTRY
// ══════════════════════════════════════════════════════

const TEMPLATES = {};

// ── Helper: build config HTML from a descriptor ─────

function buildConfig(title, fields) {
  let html = `<div class="cfg-title">${title}</div>`;
  for (const f of fields) {
    if (f.type === 'divider') { html += '<hr class="cfg-divider"/>'; continue; }
    if (f.type === 'heading') { html += `<div class="cfg-label">${f.label}</div>`; continue; }
    if (f.type === 'row-start') { html += '<div class="cfg-row">'; continue; }
    if (f.type === 'row-end')   { html += '</div>'; continue; }
    if (f.type === 'container') { html += `<div id="${f.id}"></div>`; continue; }

    const wrap = f.noWrap ? '' : '<div class="cfg-field">';
    const wrapEnd = f.noWrap ? '' : '</div>';

    if (f.type === 'number') {
      html += `${wrap}<label class="cfg-field-label">${f.label}</label>
        <input type="number" id="${f.id}" class="cfg-input cfg-input-sm" value="${f.value}" min="${f.min ?? ''}" max="${f.max ?? ''}" step="${f.step ?? 1}" />${wrapEnd}`;
    } else if (f.type === 'range') {
      html += `${wrap}<label class="cfg-field-label">${f.label}</label>
        <div class="cfg-row"><input type="range" id="${f.id}" class="cfg-range" value="${f.value}" min="${f.min}" max="${f.max}" step="${f.step ?? 1}" />
        <span class="cfg-range-value" id="${f.id}-val">${f.value}</span></div>${wrapEnd}`;
    } else if (f.type === 'checkbox') {
      html += `<label class="cfg-check"><input type="checkbox" id="${f.id}" ${f.checked ? 'checked' : ''} /><span>${f.label}</span></label>`;
    } else if (f.type === 'text') {
      html += `${wrap}<label class="cfg-field-label">${f.label}</label>
        <input type="text" id="${f.id}" class="cfg-input" value="${f.value ?? ''}" placeholder="${f.placeholder ?? ''}" />${wrapEnd}`;
    } else if (f.type === 'select') {
      const opts = f.options.map(o => `<option value="${o.v}" ${o.v === f.value ? 'selected' : ''}>${o.l}</option>`).join('');
      html += `${wrap}<label class="cfg-field-label">${f.label}</label>
        <select id="${f.id}" class="cfg-select">${opts}</select>${wrapEnd}`;
    } else if (f.type === 'colour') {
      html += `<label class="cfg-swatch"><input type="color" id="${f.id}" value="${f.value}" /><span class="cfg-swatch-dot" style="background:${f.value}"></span></label>`;
    } else if (f.type === 'checkboxes') {
      html += `<div class="cfg-field"><label class="cfg-field-label">${f.label}</label><div class="cfg-row" style="flex-wrap:wrap;gap:6px;">`;
      for (const o of f.options) {
        html += `<label class="cfg-check" style="min-width:50px"><input type="checkbox" data-group="${f.id}" value="${o.v}" ${o.checked ? 'checked' : ''} /><span>${o.l}</span></label>`;
      }
      html += '</div></div>';
    }
  }
  return html;
}

function $(id) { return document.getElementById(id); }
function val(id) { const e = $(id); if (!e) return ''; return e.value; }
function num(id, fallback = 0) { return parseFloat(val(id)) || fallback; }
function checked(id) { const e = $(id); return e ? e.checked : false; }
function checkedValues(group) {
  return [...document.querySelectorAll(`[data-group="${group}"]:checked`)].map(e => e.value);
}
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ══════════════════════════════════════════════════════
// 1. BAR MODEL
// ══════════════════════════════════════════════════════

TEMPLATES['bar-model'] = {
  renderConfig(ct) {
    ct.innerHTML = `
      <div class="cfg-title">Bar Model</div>
      <div class="cfg-row" style="gap:14px;">
        <label class="cfg-check"><input type="checkbox" id="bm-equal" checked/><span>Equal width</span></label>
        <label class="cfg-check"><input type="checkbox" id="bm-brace"/><span>Show total</span></label>
      </div>
      <div class="cfg-field" id="bm-total-field" style="display:none;margin-bottom:8px;">
        <label class="cfg-field-label">Total label</label>
        <input type="text" id="bm-total" class="cfg-input" placeholder="e.g. 24 or 3x+5" />
      </div>
      <hr class="cfg-divider"/>
      <div id="bm-bars-container"></div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px;">
        <button type="button" class="cfg-add-btn" id="bm-add-bar" style="flex:1;">+ Add Bar</button>
        <button type="button" class="cfg-add-btn" id="bm-clear-colours" style="flex:1;" title="Set all segments to white (no colour)">Clear colours</button>
      </div>
    `;

    const braceChk = $('bm-brace');
    const totalField = $('bm-total-field');
    braceChk.addEventListener('change', () => {
      totalField.style.display = braceChk.checked ? '' : 'none';
      window._tplSchedulePreview?.();
    });
    $('bm-equal').addEventListener('change', () => window._tplSchedulePreview?.());
    $('bm-total').addEventListener('input', () => window._tplSchedulePreview?.());

    function makeSegRow(label = '', colour) {
      const col = colour || '#ffffff';
      const row = document.createElement('div');
      row.className = 'bm-seg-row';
      const safeLabel = escHtml(label);
      row.innerHTML = `
        <input type="text" class="cfg-input bm-seg-label" placeholder="Label (e.g. x, 2x)" value="${safeLabel}" />
        <label class="cfg-swatch">
          <input type="color" class="bm-seg-colour" value="${col}" />
          <span class="cfg-swatch-dot" style="background:${col}"></span>
        </label>
        <button type="button" class="bm-del-seg" title="Remove segment">×</button>
      `;
      const colInput = row.querySelector('.bm-seg-colour');
      const dot = row.querySelector('.cfg-swatch-dot');
      colInput.addEventListener('input', () => { dot.style.background = colInput.value; window._tplSchedulePreview?.(); });
      row.querySelector('.bm-seg-label').addEventListener('input', () => window._tplSchedulePreview?.());
      row.querySelector('.bm-del-seg').addEventListener('click', () => {
        const list = row.closest('.bm-segs-list');
        if (list.querySelectorAll('.bm-seg-row').length > 1) { row.remove(); window._tplSchedulePreview?.(); }
      });
      return row;
    }

    function renumberBars() {
      $('bm-bars-container').querySelectorAll('.bm-bar-title').forEach((t, i) => { t.textContent = `Bar ${i + 1}`; });
    }

    function addBar(initialSegs) {
      const container = $('bm-bars-container');
      const block = document.createElement('div');
      block.className = 'bm-bar-block';

      const header = document.createElement('div');
      header.className = 'bm-bar-header';
      header.innerHTML = `<span class="bm-bar-title">Bar ${container.querySelectorAll('.bm-bar-block').length + 1}</span><button type="button" class="bm-del-bar" title="Remove bar">×</button>`;

      const segsList = document.createElement('div');
      segsList.className = 'bm-segs-list';

      const addSegBtn = document.createElement('button');
      addSegBtn.type = 'button';
      addSegBtn.className = 'cfg-add-btn bm-add-seg-btn';
      addSegBtn.textContent = '+ Add Segment';
      addSegBtn.addEventListener('click', () => {
        segsList.appendChild(makeSegRow());
        window._tplSchedulePreview?.();
      });

      header.querySelector('.bm-del-bar').addEventListener('click', () => {
        if (container.querySelectorAll('.bm-bar-block').length > 1) {
          block.remove();
          renumberBars();
          window._tplSchedulePreview?.();
        }
      });

      const segs = initialSegs || [
        { label: '', colour: '#ffffff' },
        { label: '', colour: '#ffffff' },
        { label: '', colour: '#ffffff' },
      ];
      segs.forEach(s => segsList.appendChild(makeSegRow(s.label, s.colour)));

      block.appendChild(header);
      block.appendChild(segsList);
      block.appendChild(addSegBtn);
      container.appendChild(block);
    }

    addBar();
    $('bm-add-bar').addEventListener('click', () => {
      addBar();
      renumberBars();
      window._tplSchedulePreview?.();
    });
    $('bm-clear-colours').addEventListener('click', () => {
      document.querySelectorAll('.bm-seg-colour').forEach(inp => {
        inp.value = '#ffffff';
        const dot = inp.closest('.cfg-swatch')?.querySelector('.cfg-swatch-dot');
        if (dot) dot.style.background = '#ffffff';
      });
      window._tplSchedulePreview?.();
    });
  },

  generateSVG() {
    const equalW = checked('bm-equal');
    const showBrace = checked('bm-brace');
    const totalLabel = val('bm-total');

    // Read bars from DOM
    const bars = [];
    document.querySelectorAll('.bm-bar-block').forEach(block => {
      const segs = [];
      block.querySelectorAll('.bm-seg-row').forEach(row => {
        segs.push({
          label:  row.querySelector('.bm-seg-label')?.value || '',
          colour: row.querySelector('.bm-seg-colour')?.value || '#90caf9',
        });
      });
      if (segs.length) bars.push(segs);
    });

    if (!bars.length) return makeSVG(100, 50);

    const nBars = bars.length;
    const maxSegs = Math.max(...bars.map(b => b.length));
    const barW = 500, barH = 44, gap = 14;
    const padL = 30, padR = 30;
    const padT = showBrace ? 54 : 22;
    const padB = 22;
    const totalH = padT + nBars * barH + (nBars - 1) * gap + padB;
    const totalW = padL + barW + padR;
    const svg = makeSVG(totalW, totalH);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: totalW, height: totalH, fill: '#fff' }));

    for (let b = 0; b < nBars; b++) {
      const segs = bars[b];
      const nSegs = segs.length;
      const y = padT + b * (barH + gap);
      const denominator = equalW ? maxSegs : nSegs;
      for (let s = 0; s < nSegs; s++) {
        const segW = barW / denominator;
        const x = padL + s * segW;
        const col = segs[s].colour || SEG_COLOURS[s % SEG_COLOURS.length];
        svg.appendChild(svgEl('rect', { x, y, width: segW, height: barH, fill: col, stroke: '#555', 'stroke-width': 1.5 }));
        const lbl = segs[s].label;
        if (lbl) svg.appendChild(textEl(lbl, x + segW / 2, y + barH / 2, { 'font-size': '13', fill: '#333', 'font-weight': '500' }));
      }
    }

    if (showBrace && totalLabel) {
      const braceY = padT - 8;
      const x1 = padL, x2 = padL + barW, mid = padL + barW / 2;
      const d = `M ${x1},${braceY} Q ${x1},${braceY-15} ${mid-5},${braceY-15} L ${mid},${braceY-22} L ${mid+5},${braceY-15} Q ${x2},${braceY-15} ${x2},${braceY}`;
      svg.appendChild(svgEl('path', { d, fill: 'none', stroke: '#555', 'stroke-width': 1.5 }));
      svg.appendChild(textEl(totalLabel, mid, braceY - 32, { 'font-size': '13', 'font-weight': '600' }));
    }

    return svg;
  },
};

// ══════════════════════════════════════════════════════
// 2. FRACTION WALL
// ══════════════════════════════════════════════════════

TEMPLATES['fraction-wall'] = {
  renderConfig(ct) {
    ct.innerHTML = buildConfig('Fraction Wall', [
      { type: 'row-start' },
      { type: 'range', id: 'fw-max', label: 'Max denominator', value: 6, min: 2, max: 12 },
      { type: 'row-end' },
      { type: 'checkbox', id: 'fw-labels', label: 'Show fraction labels', checked: true },
      { type: 'row-start' },
      { type: 'number', id: 'fw-width', label: 'Width', value: 560, min: 200, max: 800 },
      { type: 'row-end' },
    ]);
    $('fw-max').addEventListener('input', () => { $('fw-max-val').textContent = $('fw-max').value; });
  },

  generateSVG() {
    const maxD = parseInt(val('fw-max'), 10) || 6;
    const showLabels = checked('fw-labels');
    const W = num('fw-width', 560);
    const rowH = 32;
    const pad = 16;
    const rows = maxD; // row 1 = 1 whole, row 2 = halves, ... row maxD = maxD-ths
    const totalH = pad * 2 + rows * rowH;
    const svg = makeSVG(W + pad * 2, totalH);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W + pad * 2, height: totalH, fill: '#fff' }));

    for (let d = 1; d <= maxD; d++) {
      const y = pad + (d - 1) * rowH;
      const col = ROW_COLOURS[(d - 1) % ROW_COLOURS.length];
      const segW = W / d;
      for (let n = 0; n < d; n++) {
        const x = pad + n * segW;
        svg.appendChild(svgEl('rect', { x, y, width: segW, height: rowH, fill: col, stroke: '#888', 'stroke-width': 1 }));
        if (showLabels) {
          const lbl = d === 1 ? '1' : `${1}/${d}`;
          if (segW > 24) {
            svg.appendChild(textEl(lbl, x + segW / 2, y + rowH / 2, { 'font-size': segW < 40 ? '9' : '11', fill: '#444' }));
          }
        }
      }
    }
    return svg;
  },
};

// ══════════════════════════════════════════════════════
// 3. FRACTION CIRCLES
// ══════════════════════════════════════════════════════

TEMPLATES['fraction-circles'] = {
  renderConfig(ct) {
    ct.innerHTML = buildConfig('Fraction Circles', [
      { type: 'row-start' },
      { type: 'number', id: 'fc-denom', label: 'Denominator', value: 4, min: 2, max: 12 },
      { type: 'number', id: 'fc-numer', label: 'Numerator', value: 3, min: 0, max: 12 },
      { type: 'row-end' },
      { type: 'row-start' },
      { type: 'number', id: 'fc-circles', label: 'Circles', value: 1, min: 1, max: 4 },
      { type: 'row-end' },
      { type: 'checkbox', id: 'fc-label', label: 'Show label', checked: true },
      { type: 'row-start' },
      { type: 'colour', id: 'fc-fill', value: '#4262ff' },
      { type: 'row-end' },
    ]);
  },

  generateSVG() {
    const denom = parseInt(val('fc-denom'), 10) || 4;
    const numer = Math.min(parseInt(val('fc-numer'), 10) || 0, denom);
    const nCircles = parseInt(val('fc-circles'), 10) || 1;
    const showLabel = checked('fc-label');
    const fillCol = val('fc-fill') || '#4262ff';
    const r = 60, pad = 20, gap = 20;
    const totalW = pad * 2 + nCircles * (r * 2) + (nCircles - 1) * gap;
    const totalH = pad * 2 + r * 2 + (showLabel ? 24 : 0);
    const svg = makeSVG(totalW, totalH);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: totalW, height: totalH, fill: '#fff' }));

    for (let c = 0; c < nCircles; c++) {
      const cx = pad + r + c * (r * 2 + gap);
      const cy = pad + r;
      // draw sectors
      for (let i = 0; i < denom; i++) {
        const a1 = (i / denom) * Math.PI * 2 - Math.PI / 2;
        const a2 = ((i + 1) / denom) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
        const large = (a2 - a1 > Math.PI) ? 1 : 0;
        const d = `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
        const filled = i < numer;
        svg.appendChild(svgEl('path', { d, fill: filled ? fillCol : '#f0f0f0', stroke: '#555', 'stroke-width': 1.5 }));
      }
      if (showLabel) {
        svg.appendChild(textEl(`${numer}/${denom}`, cx, cy + r + 16, { 'font-size': '13', 'font-weight': '600' }));
      }
    }
    return svg;
  },
};

// ══════════════════════════════════════════════════════
// 4. PLACE VALUE CHART
// ══════════════════════════════════════════════════════

TEMPLATES['place-value-chart'] = {
  renderConfig(ct) {
    ct.innerHTML = buildConfig('Place Value Chart', [
      { type: 'checkboxes', id: 'pv-cols', label: 'Columns', options: [
        { v: 'M', l: 'M', checked: false },
        { v: 'HTh', l: 'HTh', checked: false },
        { v: 'TTh', l: 'TTh', checked: false },
        { v: 'Th', l: 'Th', checked: true },
        { v: 'H', l: 'H', checked: true },
        { v: 'T', l: 'T', checked: true },
        { v: 'U', l: 'U', checked: true },
        { v: 't', l: 'tenth', checked: false },
        { v: 'h', l: 'hund', checked: false },
        { v: 'th', l: 'thous', checked: false },
      ]},
      { type: 'row-start' },
      { type: 'number', id: 'pv-rows', label: 'Rows', value: 3, min: 1, max: 5 },
      { type: 'row-end' },
      { type: 'checkbox', id: 'pv-headers', label: 'Show headers', checked: true },
    ]);
  },

  generateSVG() {
    const cols = checkedValues('pv-cols');
    if (cols.length === 0) cols.push('H', 'T', 'U');
    const nRows = parseInt(val('pv-rows'), 10) || 3;
    const showHeaders = checked('pv-headers');
    const colW = 60, rowH = 34, pad = 16;
    const headerH = showHeaders ? 30 : 0;
    const totalW = pad * 2 + cols.length * colW;
    const totalH = pad * 2 + headerH + nRows * rowH;
    const svg = makeSVG(totalW, totalH);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: totalW, height: totalH, fill: '#fff' }));

    const colNames = { M: 'M', HTh: 'HTh', TTh: 'TTh', Th: 'Th', H: 'H', T: 'T', U: 'U', t: 't', h: 'h', th: 'th' };
    const decimalCols = ['t', 'h', 'th'];

    // Find if there is a decimal boundary (U then t)
    const uIdx = cols.indexOf('U');
    const tIdx = cols.indexOf('t');
    const hasDecimal = uIdx >= 0 && tIdx >= 0 && tIdx === uIdx + 1;

    // Headers
    if (showHeaders) {
      for (let c = 0; c < cols.length; c++) {
        const x = pad + c * colW;
        const bgCol = decimalCols.includes(cols[c]) ? '#fff3e0' : '#e3f2fd';
        svg.appendChild(svgEl('rect', { x, y: pad, width: colW, height: headerH, fill: bgCol, stroke: '#aaa', 'stroke-width': 1 }));
        svg.appendChild(textEl(colNames[cols[c]] || cols[c], x + colW / 2, pad + headerH / 2, { 'font-size': '11', 'font-weight': '700', fill: '#444' }));
      }
    }

    // Grid cells
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < cols.length; c++) {
        const x = pad + c * colW;
        const y = pad + headerH + r * rowH;
        svg.appendChild(svgEl('rect', { x, y, width: colW, height: rowH, fill: '#fff', stroke: '#bbb', 'stroke-width': 1 }));
      }
    }

    // Decimal point line
    if (hasDecimal) {
      const dx = pad + (uIdx + 1) * colW;
      const y1 = pad;
      const y2 = pad + headerH + nRows * rowH;
      svg.appendChild(svgEl('line', { x1: dx, y1, x2: dx, y2, stroke: '#e53935', 'stroke-width': 2.5, 'stroke-dasharray': '4,3' }));
    }

    return svg;
  },
};

// ══════════════════════════════════════════════════════
// 5. HUNDREDS CHART
// ══════════════════════════════════════════════════════

TEMPLATES['hundreds-chart'] = {
  renderConfig(ct) {
    ct.innerHTML = buildConfig('Hundreds Chart', [
      { type: 'row-start' },
      { type: 'select', id: 'hc-start', label: 'Start from', value: '1', options: [{ v: '0', l: '0' }, { v: '1', l: '1' }] },
      { type: 'row-end' },
      { type: 'checkbox', id: 'hc-numbers', label: 'Show numbers', checked: true },
      { type: 'row-start' },
      { type: 'number', id: 'hc-rows', label: 'Rows', value: 10, min: 1, max: 15 },
      { type: 'number', id: 'hc-cols', label: 'Cols', value: 10, min: 1, max: 15 },
      { type: 'row-end' },
      { type: 'divider' },
      { type: 'text', id: 'hc-highlight', label: 'Highlight numbers (comma sep)', value: '', placeholder: 'e.g. 2,3,5,7,11,13' },
      { type: 'colour', id: 'hc-hl-colour', value: '#fff59d' },
    ]);
  },

  generateSVG() {
    const start = parseInt(val('hc-start'), 10);
    const showNum = checked('hc-numbers');
    const rows = parseInt(val('hc-rows'), 10) || 10;
    const cols = parseInt(val('hc-cols'), 10) || 10;
    const hlRaw = val('hc-highlight') || '';
    const hlSet = new Set(hlRaw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)));
    const hlColour = val('hc-hl-colour') || '#fff59d';
    const cellSize = 38, pad = 12;
    const totalW = pad * 2 + cols * cellSize;
    const totalH = pad * 2 + rows * cellSize;
    const svg = makeSVG(totalW, totalH);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: totalW, height: totalH, fill: '#fff' }));

    let n = start;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = pad + c * cellSize;
        const y = pad + r * cellSize;
        const isHighlighted = hlSet.has(n);
        const bg = isHighlighted ? hlColour : ((r + c) % 2 === 0 ? '#f8f9ff' : '#fff');
        svg.appendChild(svgEl('rect', { x, y, width: cellSize, height: cellSize, fill: bg, stroke: '#bbb', 'stroke-width': 1 }));
        if (showNum) {
          svg.appendChild(textEl(String(n), x + cellSize / 2, y + cellSize / 2, { 'font-size': '12', fill: '#333', 'font-weight': isHighlighted ? '700' : '400' }));
        }
        n++;
      }
    }
    return svg;
  },
};

// ══════════════════════════════════════════════════════
// 6. MULTIPLICATION GRID
// ══════════════════════════════════════════════════════

TEMPLATES['multiplication-grid'] = {
  renderConfig(ct) {
    ct.innerHTML = buildConfig('Multiplication Grid', [
      { type: 'row-start' },
      { type: 'range', id: 'mg-size', label: 'Size', value: 12, min: 5, max: 15 },
      { type: 'row-end' },
      { type: 'checkbox', id: 'mg-products', label: 'Show products', checked: true },
      { type: 'row-start' },
      { type: 'select', id: 'mg-start', label: 'Start value', value: '1', options: [{ v: '0', l: '0' }, { v: '1', l: '1' }] },
      { type: 'row-end' },
    ]);
    $('mg-size').addEventListener('input', () => { $('mg-size-val').textContent = $('mg-size').value; });
  },

  generateSVG() {
    const size = parseInt(val('mg-size'), 10) || 12;
    const showProd = checked('mg-products');
    const startVal = parseInt(val('mg-start'), 10);
    const cellSize = Math.max(24, Math.min(36, 420 / size));
    const pad = 12;
    const gridN = size; // number of values beyond header
    const totalW = pad * 2 + (gridN + 1) * cellSize;
    const totalH = pad * 2 + (gridN + 1) * cellSize;
    const svg = makeSVG(totalW, totalH);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: totalW, height: totalH, fill: '#fff' }));

    const fs = cellSize < 28 ? '9' : '11';

    // top-left corner: multiply symbol
    svg.appendChild(svgEl('rect', { x: pad, y: pad, width: cellSize, height: cellSize, fill: '#e8eaf6', stroke: '#aaa', 'stroke-width': 1 }));
    svg.appendChild(textEl('\u00D7', pad + cellSize / 2, pad + cellSize / 2, { 'font-size': '13', 'font-weight': '700', fill: '#555' }));

    // Column headers
    for (let c = 0; c < gridN; c++) {
      const x = pad + (c + 1) * cellSize;
      svg.appendChild(svgEl('rect', { x, y: pad, width: cellSize, height: cellSize, fill: '#e3f2fd', stroke: '#aaa', 'stroke-width': 1 }));
      svg.appendChild(textEl(String(startVal + c), x + cellSize / 2, pad + cellSize / 2, { 'font-size': fs, 'font-weight': '700', fill: '#333' }));
    }

    // Row headers + cells
    for (let r = 0; r < gridN; r++) {
      const y = pad + (r + 1) * cellSize;
      // row header
      svg.appendChild(svgEl('rect', { x: pad, y, width: cellSize, height: cellSize, fill: '#e3f2fd', stroke: '#aaa', 'stroke-width': 1 }));
      svg.appendChild(textEl(String(startVal + r), pad + cellSize / 2, y + cellSize / 2, { 'font-size': fs, 'font-weight': '700', fill: '#333' }));

      for (let c = 0; c < gridN; c++) {
        const x = pad + (c + 1) * cellSize;
        const bg = (r + c) % 2 === 0 ? '#fafafa' : '#fff';
        svg.appendChild(svgEl('rect', { x, y, width: cellSize, height: cellSize, fill: bg, stroke: '#ccc', 'stroke-width': 0.8 }));
        if (showProd) {
          const prod = (startVal + r) * (startVal + c);
          svg.appendChild(textEl(String(prod), x + cellSize / 2, y + cellSize / 2, { 'font-size': fs, fill: '#555' }));
        }
      }
    }
    return svg;
  },
};

// ══════════════════════════════════════════════════════
// 7. FUNCTION MACHINE
// ══════════════════════════════════════════════════════

TEMPLATES['function-machine'] = {
  renderConfig(ct) {
    ct.innerHTML = buildConfig('Function Machine', [
      { type: 'row-start' },
      { type: 'range', id: 'fm-stages', label: 'Stages', value: 2, min: 1, max: 3 },
      { type: 'row-end' },
      { type: 'text', id: 'fm-input', label: 'Input value', value: 'x', placeholder: 'x' },
      { type: 'text', id: 'fm-output', label: 'Output value', value: '?', placeholder: '?' },
      { type: 'divider' },
      { type: 'heading', label: 'Operations' },
      { type: 'container', id: 'fm-ops' },
      { type: 'checkbox', id: 'fm-inverse', label: 'Show inverse below', checked: false },
    ]);
    const updateOps = () => {
      const n = parseInt($('fm-stages').value, 10) || 2;
      const ct2 = $('fm-ops');
      const existingOps = ct2.querySelectorAll('[data-fm-op-type]');
      const existingVals = ct2.querySelectorAll('[data-fm-op-val]');
      const oldOps = []; existingOps.forEach(e => oldOps.push(e.value));
      const oldVals = []; existingVals.forEach(e => oldVals.push(e.value));
      const defaultOps = ['+', '\u00D7'];
      const defaultVals = ['3', '2'];
      let html = '';
      for (let i = 0; i < n; i++) {
        const opVal = oldOps[i] ?? defaultOps[i] ?? '+';
        const numVal = oldVals[i] ?? defaultVals[i] ?? '1';
        html += `<div class="cfg-row"><div class="cfg-field"><label class="cfg-field-label">Stage ${i + 1}</label><select class="cfg-select" data-fm-op-type="${i}"><option value="+"${opVal === '+' ? ' selected' : ''}>+</option><option value="-"${opVal === '-' ? ' selected' : ''}>\u2212</option><option value="\u00D7"${opVal === '\u00D7' ? ' selected' : ''}>\u00D7</option><option value="\u00F7"${opVal === '\u00F7' ? ' selected' : ''}>\u00F7</option></select></div><div class="cfg-field"><label class="cfg-field-label">Value</label><input type="number" class="cfg-input cfg-input-sm" value="${numVal}" data-fm-op-val="${i}" step="any" /></div></div>`;
      }
      ct2.innerHTML = html;
    };
    $('fm-stages').addEventListener('input', () => { $('fm-stages-val').textContent = $('fm-stages').value; updateOps(); });
    updateOps();
  },

  generateSVG() {
    const nStages = parseInt(val('fm-stages'), 10) || 2;
    const inputVal = val('fm-input') || 'x';
    const outputVal = val('fm-output') || '?';
    const showInverse = checked('fm-inverse');
    const ops = [];
    document.querySelectorAll('[data-fm-op-type]').forEach((el, i) => {
      const opSymbol = el.value || '+';
      const valEl = document.querySelector(`[data-fm-op-val="${i}"]`);
      const opValue = valEl ? valEl.value : '?';
      ops[i] = opSymbol + ' ' + opValue;
    });

    const boxW = 110, boxH = 56, arrowLen = 48, pad = 36;
    const totalW = pad * 2 + arrowLen + nStages * boxW + (nStages - 1) * arrowLen + arrowLen;
    const totalH = pad * 2 + boxH + (showInverse ? boxH + 48 : 0);
    const svg = makeSVG(totalW, totalH);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: totalW, height: totalH, fill: '#fff' }));

    // Defs for arrowhead
    const defs = svgEl('defs', {});
    const marker = svgEl('marker', { id: 'fmarr', markerWidth: '10', markerHeight: '8', refX: '10', refY: '4', orient: 'auto' });
    marker.appendChild(svgEl('polygon', { points: '0 0, 10 4, 0 8', fill: '#555' }));
    defs.appendChild(marker);
    if (showInverse) {
      const marker2 = svgEl('marker', { id: 'fmarr-inv', markerWidth: '10', markerHeight: '8', refX: '0', refY: '4', orient: 'auto' });
      marker2.appendChild(svgEl('polygon', { points: '10 0, 0 4, 10 8', fill: '#b71c1c' }));
      defs.appendChild(marker2);
    }
    svg.appendChild(defs);

    const cy = pad + boxH / 2;

    // Input label + arrow
    svg.appendChild(textEl(inputVal, pad + 6, cy, { 'text-anchor': 'start', 'font-size': '20', 'font-weight': '700', fill: '#4262ff' }));
    let x = pad + arrowLen - 12;
    svg.appendChild(svgEl('line', { x1: x - 16, y1: cy, x2: x, y2: cy, stroke: '#555', 'stroke-width': 2.5, 'marker-end': 'url(#fmarr)' }));
    x += 4;

    // Operation boxes
    for (let i = 0; i < nStages; i++) {
      svg.appendChild(svgEl('rect', { x, y: pad, width: boxW, height: boxH, rx: 10, ry: 10, fill: '#e8eaf6', stroke: '#5c6bc0', 'stroke-width': 2.5 }));
      svg.appendChild(textEl(ops[i] || '?', x + boxW / 2, cy, { 'font-size': '18', 'font-weight': '700', fill: '#333' }));
      x += boxW;
      // arrow to next
      if (i < nStages - 1) {
        svg.appendChild(svgEl('line', { x1: x, y1: cy, x2: x + arrowLen - 4, y2: cy, stroke: '#555', 'stroke-width': 2.5, 'marker-end': 'url(#fmarr)' }));
        x += arrowLen;
      }
    }

    // Output arrow + label
    svg.appendChild(svgEl('line', { x1: x, y1: cy, x2: x + arrowLen - 12, y2: cy, stroke: '#555', 'stroke-width': 2.5, 'marker-end': 'url(#fmarr)' }));
    svg.appendChild(textEl(outputVal, x + arrowLen - 4, cy, { 'text-anchor': 'start', 'font-size': '20', 'font-weight': '700', fill: '#4262ff' }));

    // Inverse
    if (showInverse) {
      const iy = pad + boxH + 38 + boxH / 2;
      // reverse: output on left, input on right
      let ix = pad + arrowLen - 12 + 4;
      svg.appendChild(textEl(outputVal, ix - 22, iy, { 'text-anchor': 'end', 'font-size': '17', 'font-weight': '700', fill: '#b71c1c' }));
      for (let i = nStages - 1; i >= 0; i--) {
        svg.appendChild(svgEl('rect', { x: ix, y: iy - boxH / 2, width: boxW, height: boxH, rx: 10, ry: 10, fill: '#fce4ec', stroke: '#e57373', 'stroke-width': 2 }));
        // inverse op
        const invOp = invertOp(ops[i] || '');
        svg.appendChild(textEl(invOp, ix + boxW / 2, iy, { 'font-size': '17', 'font-weight': '700', fill: '#b71c1c' }));
        ix += boxW;
        if (i > 0) {
          svg.appendChild(svgEl('line', { x1: ix, y1: iy, x2: ix + arrowLen - 4, y2: iy, stroke: '#b71c1c', 'stroke-width': 2, 'marker-end': 'url(#fmarr)' }));
          ix += arrowLen;
        }
      }
      svg.appendChild(svgEl('line', { x1: ix, y1: iy, x2: ix + arrowLen - 12, y2: iy, stroke: '#b71c1c', 'stroke-width': 2, 'marker-end': 'url(#fmarr)' }));
      svg.appendChild(textEl(inputVal, ix + arrowLen - 4, iy, { 'text-anchor': 'start', 'font-size': '17', 'font-weight': '700', fill: '#b71c1c' }));
    }

    return svg;
  },
};

function invertOp(op) {
  const s = op.trim();
  if (s.startsWith('+')) return '\u2212 ' + s.slice(1).trim();
  if (s.startsWith('-') || s.startsWith('\u2212')) return '+ ' + s.slice(1).trim();
  if (s.startsWith('\u00D7') || s.startsWith('*')) return '\u00F7 ' + s.slice(1).trim();
  if (s.startsWith('\u00F7') || s.startsWith('/')) return '\u00D7 ' + s.slice(1).trim();
  if (s.startsWith('x') || s.startsWith('X')) return '\u00F7 ' + s.slice(1).trim();
  return 'inv(' + s + ')';
}

// ══════════════════════════════════════════════════════
// 8. TWO-WAY TABLE
// ══════════════════════════════════════════════════════

TEMPLATES['two-way-table'] = {
  renderConfig(ct) {
    ct.innerHTML = buildConfig('Two-Way Table', [
      { type: 'text', id: 'tw-title', label: 'Title', value: '', placeholder: 'Optional title' },
      { type: 'divider' },
      { type: 'heading', label: 'Row labels' },
      { type: 'container', id: 'tw-rows-ct' },
      { type: 'heading', label: 'Column labels' },
      { type: 'container', id: 'tw-cols-ct' },
      { type: 'row-start' },
      { type: 'number', id: 'tw-nrows', label: 'Row count', value: 2, min: 2, max: 4 },
      { type: 'number', id: 'tw-ncols', label: 'Col count', value: 2, min: 2, max: 4 },
      { type: 'row-end' },
      { type: 'checkbox', id: 'tw-totals', label: 'Show totals row/column', checked: true },
    ]);
    const updateFields = () => {
      const nr = parseInt($('tw-nrows').value, 10) || 2;
      const nc = parseInt($('tw-ncols').value, 10) || 2;
      const rCt = $('tw-rows-ct');
      const cCt = $('tw-cols-ct');
      const rVals = [...rCt.querySelectorAll('input')].map(e => e.value);
      const cVals = [...cCt.querySelectorAll('input')].map(e => e.value);
      let rh = '';
      for (let i = 0; i < nr; i++) rh += `<div class="cfg-row"><input type="text" class="cfg-input" value="${rVals[i] ?? 'Row ' + (i + 1)}" data-tw-row="${i}" /></div>`;
      rCt.innerHTML = rh;
      let ch = '';
      for (let i = 0; i < nc; i++) ch += `<div class="cfg-row"><input type="text" class="cfg-input" value="${cVals[i] ?? 'Col ' + (i + 1)}" data-tw-col="${i}" /></div>`;
      cCt.innerHTML = ch;
      rCt.querySelectorAll('input').forEach(el => el.addEventListener('input', schedulePreview));
      cCt.querySelectorAll('input').forEach(el => el.addEventListener('input', schedulePreview));
    };
    $('tw-nrows').addEventListener('change', updateFields);
    $('tw-ncols').addEventListener('change', updateFields);
    updateFields();
  },

  generateSVG() {
    const title = val('tw-title');
    const nr = parseInt(val('tw-nrows'), 10) || 2;
    const nc = parseInt(val('tw-ncols'), 10) || 2;
    const showTotals = checked('tw-totals');
    const rowLabels = []; document.querySelectorAll('[data-tw-row]').forEach((e, i) => { rowLabels[i] = e.value; });
    const colLabels = []; document.querySelectorAll('[data-tw-col]').forEach((e, i) => { colLabels[i] = e.value; });

    const cellW = 80, cellH = 32, headerW = 90, headerH = 30, pad = 16;
    const totalCols = nc + (showTotals ? 1 : 0);
    const totalRows = nr + (showTotals ? 1 : 0);
    const titleH = title ? 28 : 0;
    const totalW = pad * 2 + headerW + totalCols * cellW;
    const totalH = pad * 2 + titleH + headerH + totalRows * cellH;
    const svg = makeSVG(totalW, totalH);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: totalW, height: totalH, fill: '#fff' }));

    if (title) {
      svg.appendChild(textEl(title, totalW / 2, pad + 12, { 'font-size': '14', 'font-weight': '700', fill: '#333' }));
    }

    const baseY = pad + titleH;

    // Top-left blank
    svg.appendChild(svgEl('rect', { x: pad, y: baseY, width: headerW, height: headerH, fill: '#e8eaf6', stroke: '#aaa', 'stroke-width': 1 }));

    // Column headers
    for (let c = 0; c < nc; c++) {
      const x = pad + headerW + c * cellW;
      svg.appendChild(svgEl('rect', { x, y: baseY, width: cellW, height: headerH, fill: '#e3f2fd', stroke: '#aaa', 'stroke-width': 1 }));
      svg.appendChild(textEl(colLabels[c] || '', x + cellW / 2, baseY + headerH / 2, { 'font-size': '11', 'font-weight': '700', fill: '#333' }));
    }
    if (showTotals) {
      const x = pad + headerW + nc * cellW;
      svg.appendChild(svgEl('rect', { x, y: baseY, width: cellW, height: headerH, fill: '#fff9c4', stroke: '#aaa', 'stroke-width': 1 }));
      svg.appendChild(textEl('Total', x + cellW / 2, baseY + headerH / 2, { 'font-size': '11', 'font-weight': '700', fill: '#555' }));
    }

    // Rows
    for (let r = 0; r < nr; r++) {
      const y = baseY + headerH + r * cellH;
      svg.appendChild(svgEl('rect', { x: pad, y, width: headerW, height: cellH, fill: '#e3f2fd', stroke: '#aaa', 'stroke-width': 1 }));
      svg.appendChild(textEl(rowLabels[r] || '', pad + headerW / 2, y + cellH / 2, { 'font-size': '11', 'font-weight': '700', fill: '#333' }));
      for (let c = 0; c < totalCols; c++) {
        const x = pad + headerW + c * cellW;
        const bg = (c === nc && showTotals) ? '#fffde7' : '#fff';
        svg.appendChild(svgEl('rect', { x, y, width: cellW, height: cellH, fill: bg, stroke: '#bbb', 'stroke-width': 1 }));
      }
    }

    // Totals row
    if (showTotals) {
      const y = baseY + headerH + nr * cellH;
      svg.appendChild(svgEl('rect', { x: pad, y, width: headerW, height: cellH, fill: '#fff9c4', stroke: '#aaa', 'stroke-width': 1 }));
      svg.appendChild(textEl('Total', pad + headerW / 2, y + cellH / 2, { 'font-size': '11', 'font-weight': '700', fill: '#555' }));
      for (let c = 0; c < totalCols; c++) {
        const x = pad + headerW + c * cellW;
        svg.appendChild(svgEl('rect', { x, y, width: cellW, height: cellH, fill: '#fffde7', stroke: '#bbb', 'stroke-width': 1 }));
      }
    }

    return svg;
  },
};

// ══════════════════════════════════════════════════════
// 9. VENN DIAGRAM
// ══════════════════════════════════════════════════════

TEMPLATES['venn-diagram'] = {
  renderConfig(ct) {
    ct.innerHTML = buildConfig('Venn Diagram', [
      { type: 'row-start' },
      { type: 'select', id: 'vn-circles', label: 'Circles', value: '2', options: [{ v: '2', l: '2' }, { v: '3', l: '3' }] },
      { type: 'row-end' },
      { type: 'text', id: 'vn-label-a', label: 'Set A', value: 'A', placeholder: 'A' },
      { type: 'text', id: 'vn-label-b', label: 'Set B', value: 'B', placeholder: 'B' },
      { type: 'text', id: 'vn-label-c', label: 'Set C (if 3)', value: 'C', placeholder: 'C' },
      { type: 'text', id: 'vn-universal', label: 'Universal set label', value: '\u03BE', placeholder: '\u03BE' },
      { type: 'checkbox', id: 'vn-rect', label: 'Show universal set rectangle', checked: true },
      { type: 'divider' },
      { type: 'heading', label: 'Circle colours' },
      { type: 'row-start' },
      { type: 'colour', id: 'vn-col-a', value: '#4262ff' },
      { type: 'colour', id: 'vn-col-b', value: '#ff6b6b' },
      { type: 'colour', id: 'vn-col-c', value: '#43a047' },
      { type: 'row-end' },
      { type: 'range', id: 'vn-opacity', label: 'Circle opacity %', value: 20, min: 0, max: 100, step: 5 },
      { type: 'divider' },
      { type: 'heading', label: 'Region contents' },
      { type: 'container', id: 'vn-regions' },
    ]);

    const buildRegionInputs = () => {
      const n = parseInt(val('vn-circles'), 10) || 2;
      const ct2 = $('vn-regions');
      let html = '';
      if (n === 2) {
        html += '<div class="cfg-row"><div class="cfg-field"><label class="cfg-field-label">A only</label><input type="text" id="vn-r-aonly" class="cfg-input cfg-input-sm" value="" placeholder="" /></div><div class="cfg-field"><label class="cfg-field-label">A\u2229B</label><input type="text" id="vn-r-ab" class="cfg-input cfg-input-sm" value="" placeholder="" /></div><div class="cfg-field"><label class="cfg-field-label">B only</label><input type="text" id="vn-r-bonly" class="cfg-input cfg-input-sm" value="" placeholder="" /></div></div>';
        html += '<div class="cfg-row"><div class="cfg-field"><label class="cfg-field-label">Outside</label><input type="text" id="vn-r-outside" class="cfg-input cfg-input-sm" value="" placeholder="" /></div></div>';
      } else {
        html += '<div class="cfg-row"><div class="cfg-field"><label class="cfg-field-label">A only</label><input type="text" id="vn-r-aonly" class="cfg-input cfg-input-sm" value="" placeholder="" /></div><div class="cfg-field"><label class="cfg-field-label">B only</label><input type="text" id="vn-r-bonly" class="cfg-input cfg-input-sm" value="" placeholder="" /></div><div class="cfg-field"><label class="cfg-field-label">C only</label><input type="text" id="vn-r-conly" class="cfg-input cfg-input-sm" value="" placeholder="" /></div></div>';
        html += '<div class="cfg-row"><div class="cfg-field"><label class="cfg-field-label">A\u2229B</label><input type="text" id="vn-r-ab" class="cfg-input cfg-input-sm" value="" placeholder="" /></div><div class="cfg-field"><label class="cfg-field-label">A\u2229C</label><input type="text" id="vn-r-ac" class="cfg-input cfg-input-sm" value="" placeholder="" /></div><div class="cfg-field"><label class="cfg-field-label">B\u2229C</label><input type="text" id="vn-r-bc" class="cfg-input cfg-input-sm" value="" placeholder="" /></div></div>';
        html += '<div class="cfg-row"><div class="cfg-field"><label class="cfg-field-label">A\u2229B\u2229C</label><input type="text" id="vn-r-abc" class="cfg-input cfg-input-sm" value="" placeholder="" /></div><div class="cfg-field"><label class="cfg-field-label">Outside</label><input type="text" id="vn-r-outside" class="cfg-input cfg-input-sm" value="" placeholder="" /></div></div>';
      }
      ct2.innerHTML = html;
      ct2.querySelectorAll('input').forEach(el => { el.addEventListener('input', schedulePreview); el.addEventListener('change', schedulePreview); });
    };
    $('vn-circles').addEventListener('change', () => { buildRegionInputs(); schedulePreview(); });
    buildRegionInputs();
  },

  generateSVG() {
    const nCircles = parseInt(val('vn-circles'), 10) || 2;
    const labels = [val('vn-label-a') || 'A', val('vn-label-b') || 'B', val('vn-label-c') || 'C'];
    const uniLabel = val('vn-universal') || '\u03BE';
    const showRect = checked('vn-rect');
    const colours = [val('vn-col-a') || '#4262ff', val('vn-col-b') || '#ff6b6b', val('vn-col-c') || '#43a047'];
    const opacity = (num('vn-opacity', 20) / 100).toFixed(2);

    const W = nCircles === 3 ? 650 : 500, H = nCircles === 3 ? 450 : 350, pad = 20;
    const svg = makeSVG(W, H);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }));

    if (showRect) {
      svg.appendChild(svgEl('rect', { x: pad, y: pad, width: W - pad * 2, height: H - pad * 2, fill: 'none', stroke: '#555', 'stroke-width': 1.5, rx: 4 }));
      svg.appendChild(textEl(uniLabel, pad + 14, pad + 14, { 'font-size': '16', 'font-weight': '700', fill: '#555', 'text-anchor': 'start' }));
    }

    const r = nCircles === 3 ? 120 : 95;
    const cx = W / 2, cy = nCircles === 3 ? H / 2 + 5 : H / 2;
    const offset = nCircles === 3 ? 65 : 55;

    const positions = nCircles === 2
      ? [{ x: cx - offset, y: cy }, { x: cx + offset, y: cy }]
      : [{ x: cx - offset, y: cy + 25 }, { x: cx + offset, y: cy + 25 }, { x: cx, y: cy - offset + 10 }];

    for (let i = 0; i < nCircles; i++) {
      const col = colours[i];
      const rr = parseInt(col.slice(1, 3), 16);
      const gg = parseInt(col.slice(3, 5), 16);
      const bb = parseInt(col.slice(5, 7), 16);
      svg.appendChild(svgEl('circle', {
        cx: positions[i].x, cy: positions[i].y, r,
        fill: `rgba(${rr},${gg},${bb},${opacity})`,
        stroke: col, 'stroke-width': 2,
      }));
    }

    // Labels
    const labelPositions = nCircles === 2
      ? [{ x: cx - offset - r + 20, y: cy - r + 10 }, { x: cx + offset + r - 20, y: cy - r + 10 }]
      : [{ x: cx - offset - r + 15, y: cy + 25 + r - 10 }, { x: cx + offset + r - 15, y: cy + 25 + r - 10 }, { x: cx, y: cy - offset + 10 - r + 5 }];

    for (let i = 0; i < nCircles; i++) {
      svg.appendChild(textEl(labels[i], labelPositions[i].x, labelPositions[i].y, { 'font-size': '15', 'font-weight': '700', fill: colours[i] }));
    }

    // Region contents
    const regionStyle = { 'font-size': '13', 'font-weight': '600', fill: '#222' };
    if (nCircles === 2) {
      const aOnly = val('vn-r-aonly'), ab = val('vn-r-ab'), bOnly = val('vn-r-bonly'), outside = val('vn-r-outside');
      if (aOnly) svg.appendChild(textEl(aOnly, positions[0].x - offset / 2, cy, regionStyle));
      if (ab) svg.appendChild(textEl(ab, cx, cy, regionStyle));
      if (bOnly) svg.appendChild(textEl(bOnly, positions[1].x + offset / 2, cy, regionStyle));
      if (outside) svg.appendChild(textEl(outside, pad + 30, H - pad - 10, { ...regionStyle, 'font-size': '11', fill: '#666' }));
    } else {
      const aOnly = val('vn-r-aonly'), bOnly = val('vn-r-bonly'), cOnly = val('vn-r-conly');
      const ab = val('vn-r-ab'), ac = val('vn-r-ac'), bc = val('vn-r-bc');
      const abc = val('vn-r-abc'), outside = val('vn-r-outside');
      const ctrX = cx, ctrY = cy + 5;
      if (aOnly) svg.appendChild(textEl(aOnly, positions[0].x - 45, positions[0].y, regionStyle));
      if (bOnly) svg.appendChild(textEl(bOnly, positions[1].x + 45, positions[1].y, regionStyle));
      if (cOnly) svg.appendChild(textEl(cOnly, positions[2].x, positions[2].y - 55, regionStyle));
      if (ab) svg.appendChild(textEl(ab, ctrX, positions[0].y + 38, regionStyle));
      if (ac) svg.appendChild(textEl(ac, ctrX - 50, ctrY - 25, regionStyle));
      if (bc) svg.appendChild(textEl(bc, ctrX + 50, ctrY - 25, regionStyle));
      if (abc) svg.appendChild(textEl(abc, ctrX, ctrY, regionStyle));
      if (outside) svg.appendChild(textEl(outside, pad + 30, H - pad - 10, { ...regionStyle, 'font-size': '11', fill: '#666' }));
    }

    return svg;
  },
};

// ══════════════════════════════════════════════════════
// 10. CARROLL DIAGRAM
// ══════════════════════════════════════════════════════

TEMPLATES['carroll-diagram'] = {
  renderConfig(ct) {
    ct.innerHTML = buildConfig('Carroll Diagram', [
      { type: 'text', id: 'cd-title', label: 'Title', value: '', placeholder: 'Optional title' },
      { type: 'divider' },
      { type: 'text', id: 'cd-row-crit', label: 'Row criteria', value: 'Even', placeholder: 'e.g. Even' },
      { type: 'text', id: 'cd-row-neg', label: 'Row negation', value: 'Not even', placeholder: 'e.g. Not even' },
      { type: 'text', id: 'cd-col-crit', label: 'Column criteria', value: 'Prime', placeholder: 'e.g. Prime' },
      { type: 'text', id: 'cd-col-neg', label: 'Column negation', value: 'Not prime', placeholder: 'e.g. Not prime' },
      { type: 'divider' },
      { type: 'heading', label: 'Cell contents' },
      { type: 'row-start' },
      { type: 'text', id: 'cd-cell-tl', label: 'Top-left', value: '', placeholder: 'e.g. 2' },
      { type: 'text', id: 'cd-cell-tr', label: 'Top-right', value: '', placeholder: 'e.g. 4, 6, 8' },
      { type: 'row-end' },
      { type: 'row-start' },
      { type: 'text', id: 'cd-cell-bl', label: 'Bottom-left', value: '', placeholder: 'e.g. 3, 5, 7' },
      { type: 'text', id: 'cd-cell-br', label: 'Bottom-right', value: '', placeholder: 'e.g. 1, 9' },
      { type: 'row-end' },
    ]);
  },

  generateSVG() {
    const title = val('cd-title');
    const rowCrit = val('cd-row-crit') || 'Yes';
    const rowNeg  = val('cd-row-neg') || 'No';
    const colCrit = val('cd-col-crit') || 'Yes';
    const colNeg  = val('cd-col-neg') || 'No';
    const cellTexts = [val('cd-cell-tl'), val('cd-cell-tr'), val('cd-cell-bl'), val('cd-cell-br')];

    const cellW = 130, cellH = 80, headerW = 80, headerH = 30, pad = 20;
    const titleH = title ? 28 : 0;
    const W = pad * 2 + headerW + cellW * 2;
    const H = pad * 2 + titleH + headerH + cellH * 2;
    const svg = makeSVG(W, H);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }));

    if (title) svg.appendChild(textEl(title, W / 2, pad + 12, { 'font-size': '14', 'font-weight': '700' }));

    const baseX = pad, baseY = pad + titleH;

    // Top-left corner blank
    svg.appendChild(svgEl('rect', { x: baseX, y: baseY, width: headerW, height: headerH, fill: '#e8eaf6', stroke: '#aaa', 'stroke-width': 1 }));

    // Col headers
    svg.appendChild(svgEl('rect', { x: baseX + headerW, y: baseY, width: cellW, height: headerH, fill: '#e3f2fd', stroke: '#aaa', 'stroke-width': 1 }));
    svg.appendChild(textEl(colCrit, baseX + headerW + cellW / 2, baseY + headerH / 2, { 'font-size': '12', 'font-weight': '700', fill: '#333' }));

    svg.appendChild(svgEl('rect', { x: baseX + headerW + cellW, y: baseY, width: cellW, height: headerH, fill: '#fce4ec', stroke: '#aaa', 'stroke-width': 1 }));
    svg.appendChild(textEl(colNeg, baseX + headerW + cellW + cellW / 2, baseY + headerH / 2, { 'font-size': '12', 'font-weight': '700', fill: '#333' }));

    // Row headers
    const rowY1 = baseY + headerH;
    const rowY2 = baseY + headerH + cellH;

    svg.appendChild(svgEl('rect', { x: baseX, y: rowY1, width: headerW, height: cellH, fill: '#e3f2fd', stroke: '#aaa', 'stroke-width': 1 }));
    svg.appendChild(textEl(rowCrit, baseX + headerW / 2, rowY1 + cellH / 2, { 'font-size': '12', 'font-weight': '700', fill: '#333' }));

    svg.appendChild(svgEl('rect', { x: baseX, y: rowY2, width: headerW, height: cellH, fill: '#fce4ec', stroke: '#aaa', 'stroke-width': 1 }));
    svg.appendChild(textEl(rowNeg, baseX + headerW / 2, rowY2 + cellH / 2, { 'font-size': '12', 'font-weight': '700', fill: '#333' }));

    // 4 data cells with content
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const x = baseX + headerW + c * cellW;
        const y = baseY + headerH + r * cellH;
        svg.appendChild(svgEl('rect', { x, y, width: cellW, height: cellH, fill: '#fff', stroke: '#bbb', 'stroke-width': 1 }));
        const txt = cellTexts[r * 2 + c];
        if (txt) {
          svg.appendChild(textEl(txt, x + cellW / 2, y + cellH / 2, { 'font-size': '12', fill: '#333' }));
        }
      }
    }

    return svg;
  },
};

// ══════════════════════════════════════════════════════
// 11. TREE DIAGRAM
// ══════════════════════════════════════════════════════

TEMPLATES['tree-diagram'] = {
  renderConfig(ct) {
    ct.innerHTML = buildConfig('Tree Diagram', [
      { type: 'select', id: 'td-preset', label: 'Preset', value: 'custom', options: [
        { v: 'custom', l: 'Custom' }, { v: 'coin', l: 'Coin flip' }, { v: 'dice', l: 'Dice' },
        { v: 'spinner', l: 'Spinner (R/G/B)' }, { v: 'biased', l: 'Biased coin' },
      ]},
      { type: 'row-start' },
      { type: 'select', id: 'td-stages', label: 'Stages', value: '2', options: [{ v: '1', l: '1' }, { v: '2', l: '2' }, { v: '3', l: '3' }] },
      { type: 'select', id: 'td-branches', label: 'Branches per node', value: '2', options: [{ v: '2', l: '2' }, { v: '3', l: '3' }, { v: '6', l: '6' }] },
      { type: 'row-end' },
      { type: 'checkbox', id: 'td-combined', label: 'Show combined outcomes', checked: true },
      { type: 'divider' },
      { type: 'heading', label: 'Branch labels & probabilities' },
      { type: 'container', id: 'td-fields' },
    ]);
    const updateFields = (presetLabels, presetProbs) => {
      const stages = parseInt($('td-stages').value, 10) || 2;
      const bpn = parseInt($('td-branches').value, 10) || 2;
      const ct2 = $('td-fields');
      let html = '';
      for (let s = 0; s < stages; s++) {
        html += `<div class="cfg-label" style="margin-top:6px">Stage ${s + 1}</div>`;
        for (let b = 0; b < bpn; b++) {
          const lbl = presetLabels ? (presetLabels[s] && presetLabels[s][b]) || '' : (b === 0 ? 'H' : 'T');
          const prob = presetProbs ? (presetProbs[s] && presetProbs[s][b]) || '' : `1/${bpn}`;
          html += `<div class="cfg-row"><div class="cfg-field"><label class="cfg-field-label">Label</label><input type="text" class="cfg-input" value="${lbl}" data-td-label="${s}-${b}" /></div><div class="cfg-field"><label class="cfg-field-label">P</label><input type="text" class="cfg-input" value="${prob}" data-td-prob="${s}-${b}" /></div></div>`;
        }
      }
      ct2.innerHTML = html;
      ct2.querySelectorAll('input').forEach(el => el.addEventListener('input', schedulePreview));
    };
    const TD_PRESETS = {
      coin:    { stages: 2, bpn: 2, labels: [['H','T'],['H','T']], probs: [['1/2','1/2'],['1/2','1/2']] },
      dice:    { stages: 1, bpn: 6, labels: [['1','2','3','4','5','6']], probs: [['1/6','1/6','1/6','1/6','1/6','1/6']] },
      spinner: { stages: 1, bpn: 3, labels: [['R','G','B']], probs: [['1/3','1/3','1/3']] },
      biased:  { stages: 2, bpn: 2, labels: [['H','T'],['H','T']], probs: [['3/4','1/4'],['3/4','1/4']] },
    };
    $('td-stages').addEventListener('change', () => updateFields());
    $('td-branches').addEventListener('change', () => updateFields());
    $('td-preset').addEventListener('change', () => {
      const key = $('td-preset').value;
      if (key !== 'custom') {
        const p = TD_PRESETS[key];
        if (p) {
          $('td-stages').value = String(p.stages);
          $('td-branches').value = String(p.bpn);
          updateFields(p.labels, p.probs);
          schedulePreview();
        }
      }
    });
    updateFields();
  },

  generateSVG() {
    const stages = parseInt(val('td-stages'), 10) || 2;
    const bpn = parseInt(val('td-branches'), 10) || 2;
    const showCombined = checked('td-combined');

    // Gather labels/probs per stage
    const branchLabels = [];
    const branchProbs = [];
    for (let s = 0; s < stages; s++) {
      branchLabels[s] = [];
      branchProbs[s] = [];
      for (let b = 0; b < bpn; b++) {
        const lEl = document.querySelector(`[data-td-label="${s}-${b}"]`);
        const pEl = document.querySelector(`[data-td-prob="${s}-${b}"]`);
        branchLabels[s][b] = lEl ? lEl.value : '';
        branchProbs[s][b] = pEl ? pEl.value : '';
      }
    }

    const totalLeaves = Math.pow(bpn, stages);
    const leafH = 28;
    const stageW = 140;
    const combW = showCombined ? 100 : 0;
    const pad = 30;
    const W = pad * 2 + stages * stageW + combW;
    const H = pad * 2 + totalLeaves * leafH;
    const svg = makeSVG(W, H);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }));

    // Recursively draw tree
    function drawNode(stage, x, yMin, yMax, pathLabels) {
      if (stage >= stages) {
        // terminal node
        const y = (yMin + yMax) / 2;
        svg.appendChild(svgEl('circle', { cx: x, cy: y, r: 3, fill: '#555' }));
        if (showCombined) {
          const combined = pathLabels.join(', ');
          svg.appendChild(textEl(combined, x + 12, y, { 'text-anchor': 'start', 'font-size': '10', fill: '#333' }));
        }
        return;
      }

      const nodeY = (yMin + yMax) / 2;
      svg.appendChild(svgEl('circle', { cx: x, cy: nodeY, r: 3, fill: '#555' }));

      const segH = (yMax - yMin) / bpn;
      for (let b = 0; b < bpn; b++) {
        const childYMin = yMin + b * segH;
        const childYMax = yMin + (b + 1) * segH;
        const childY = (childYMin + childYMax) / 2;
        const nextX = x + stageW;

        // branch line
        svg.appendChild(svgEl('line', { x1: x, y1: nodeY, x2: nextX, y2: childY, stroke: '#555', 'stroke-width': 1.5 }));

        // label on branch
        const midX = (x + nextX) / 2;
        const midY = (nodeY + childY) / 2;
        const lbl = branchLabels[stage][b] || '';
        const prob = branchProbs[stage][b] || '';

        if (lbl) {
          const offsetY = childY < nodeY ? -8 : (childY > nodeY ? 14 : -8);
          svg.appendChild(textEl(lbl, midX - 10, midY + offsetY, { 'font-size': '11', 'font-weight': '600', fill: '#4262ff', 'text-anchor': 'end' }));
        }
        if (prob) {
          const offsetY = childY < nodeY ? -8 : (childY > nodeY ? 14 : -8);
          svg.appendChild(textEl(prob, midX + 10, midY + offsetY, { 'font-size': '10', fill: '#888', 'text-anchor': 'start' }));
        }

        drawNode(stage + 1, nextX, childYMin, childYMax, [...pathLabels, lbl]);
      }
    }

    drawNode(0, pad + 10, pad, H - pad, []);
    return svg;
  },
};

// ══════════════════════════════════════════════════════
// 12. BOX & WHISKER
// ══════════════════════════════════════════════════════

TEMPLATES['box-whisker'] = {
  renderConfig(ct) {
    ct.innerHTML = buildConfig('Box & Whisker', [
      { type: 'heading', label: 'Input mode' },
      { type: 'row-start' },
      { type: 'select', id: 'bw-mode', label: 'Input mode', value: 'summary', options: [
        { v: 'summary', l: 'Summary values' }, { v: 'paste', l: 'Paste data' },
      ]},
      { type: 'row-end' },
      { type: 'range', id: 'bw-count', label: 'Number of plots', value: 1, min: 1, max: 3, step: 1 },
      { type: 'container', id: 'bw-summary-panel' },
      { type: 'container', id: 'bw-paste-panel' },
      { type: 'divider' },
      { type: 'row-start' },
      { type: 'number', id: 'bw-amin', label: 'Axis min', value: 0, step: 5 },
      { type: 'number', id: 'bw-amax', label: 'Axis max', value: 70, step: 5 },
      { type: 'number', id: 'bw-step', label: 'Axis step', value: 10, step: 1 },
      { type: 'row-end' },
      { type: 'checkbox', id: 'bw-labels', label: 'Show value labels', checked: true },
      { type: 'checkbox', id: 'bw-blank', label: 'Blank (no values)', checked: false },
      { type: 'text', id: 'bw-title', label: 'Title', value: '', placeholder: 'Optional title' },
    ]);

    const bwPlotColours = ['#4262ff', '#e63946', '#2a9d8f'];
    const bwDefaults = [
      { min: 12, q1: 25, med: 35, q3: 48, max: 62, label: '' },
      { min: 18, q1: 30, med: 40, q3: 52, max: 65, label: '' },
      { min: 8, q1: 20, med: 32, q3: 45, max: 58, label: '' },
    ];

    // Build summary panels for all plots
    const buildSummaryPanels = () => {
      const count = parseInt(val('bw-count'), 10) || 1;
      const sp = $('bw-summary-panel');
      let html = '';
      for (let i = 0; i < count; i++) {
        const suffix = i === 0 ? '' : String(i + 1);
        const d = bwDefaults[i];
        const colDot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${bwPlotColours[i]};margin-right:4px;vertical-align:middle;"></span>`;
        if (count > 1) html += `<div class="cfg-label" style="margin-top:6px;">${colDot}Plot ${i + 1}</div>`;
        html += `<div class="cfg-row"><div class="cfg-field"><label class="cfg-field-label">Label${suffix ? ' ' + (i+1) : ''}</label><input type="text" id="bw-plabel${suffix}" class="cfg-input cfg-input-sm" value="${d.label}" placeholder="${count > 1 ? 'e.g. Boys' : 'Optional'}" /></div></div>`;
        html += `<div class="cfg-row"><div class="cfg-field"><label class="cfg-field-label">Min</label><input type="number" id="bw-min${suffix}" class="cfg-input cfg-input-sm" value="${d.min}" step="1" /></div><div class="cfg-field"><label class="cfg-field-label">Q1</label><input type="number" id="bw-q1${suffix}" class="cfg-input cfg-input-sm" value="${d.q1}" step="1" /></div><div class="cfg-field"><label class="cfg-field-label">Median</label><input type="number" id="bw-median${suffix}" class="cfg-input cfg-input-sm" value="${d.med}" step="1" /></div></div>`;
        html += `<div class="cfg-row"><div class="cfg-field"><label class="cfg-field-label">Q3</label><input type="number" id="bw-q3${suffix}" class="cfg-input cfg-input-sm" value="${d.q3}" step="1" /></div><div class="cfg-field"><label class="cfg-field-label">Max</label><input type="number" id="bw-max${suffix}" class="cfg-input cfg-input-sm" value="${d.max}" step="1" /></div></div>`;
      }
      sp.innerHTML = html;
      sp.querySelectorAll('input').forEach(el => { el.addEventListener('input', schedulePreview); el.addEventListener('change', schedulePreview); });
    };

    buildSummaryPanels();

    // Build paste panel (hidden by default)
    const pp = $('bw-paste-panel');
    pp.innerHTML = '<div class="cfg-field"><label class="cfg-field-label">Paste comma-separated numbers</label><textarea id="bw-rawdata" class="cfg-input" rows="3" placeholder="e.g. 12, 25, 30, 35, 48, 50, 62" style="width:100%;resize:vertical;font-family:monospace;font-size:12px;"></textarea></div><div id="bw-computed-stats" style="font-size:11px;color:#666;padding:4px 0;"></div>';
    pp.style.display = 'none';

    // Wire mode toggle
    const modeSelect = $('bw-mode');
    const toggleMode = () => {
      const isPaste = modeSelect.value === 'paste';
      $('bw-summary-panel').style.display = isPaste ? 'none' : '';
      pp.style.display = isPaste ? '' : 'none';
      if (isPaste) bwComputeFromRaw();
      schedulePreview();
    };
    modeSelect.addEventListener('change', toggleMode);

    // Wire count slider
    $('bw-count').addEventListener('input', () => {
      $('bw-count-val').textContent = val('bw-count');
      buildSummaryPanels();
      schedulePreview();
    });

    // Wire raw data textarea
    const rawArea = $('bw-rawdata');
    rawArea.addEventListener('input', () => { bwComputeFromRaw(); schedulePreview(); });

    function bwComputeFromRaw() {
      const raw = ($('bw-rawdata') || {}).value || '';
      const nums = raw.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      if (nums.length < 2) { $('bw-computed-stats').textContent = 'Enter at least 2 numbers.'; return; }
      nums.sort((a, b) => a - b);
      const median = arr => {
        const n = arr.length;
        if (n === 0) return 0;
        if (n % 2 === 1) return arr[Math.floor(n / 2)];
        return (arr[n / 2 - 1] + arr[n / 2]) / 2;
      };
      const dMin = nums[0], dMax = nums[nums.length - 1];
      const med = median(nums);
      const mid = Math.floor(nums.length / 2);
      const lower = nums.length % 2 === 0 ? nums.slice(0, mid) : nums.slice(0, mid);
      const upper = nums.length % 2 === 0 ? nums.slice(mid) : nums.slice(mid + 1);
      const q1 = median(lower), q3 = median(upper);
      // Set summary fields so generateSVG works
      $('bw-min').value = dMin; $('bw-q1').value = q1; $('bw-median').value = med;
      $('bw-q3').value = q3; $('bw-max').value = dMax;
      // Auto-set axis
      const range = dMax - dMin;
      const step = Math.max(1, Math.round(range / 7));
      $('bw-amin').value = Math.floor(dMin / step) * step;
      $('bw-amax').value = Math.ceil(dMax / step) * step + step;
      $('bw-step').value = step;
      $('bw-computed-stats').textContent = `n=${nums.length}  Min=${dMin}  Q1=${q1}  Med=${med}  Q3=${q3}  Max=${dMax}`;
    }
  },

  generateSVG() {
    const plotCount = parseInt(val('bw-count'), 10) || 1;
    const aMin = num('bw-amin', 0), aMax = num('bw-amax', 70), aStep = num('bw-step', 10);
    const showLabels = checked('bw-labels') && !checked('bw-blank');
    const isBlank = checked('bw-blank');
    const title = val('bw-title');
    const plotColours = ['#4262ff', '#e63946', '#2a9d8f'];
    const fillColours = ['rgba(66,98,255,0.15)', 'rgba(230,57,70,0.15)', 'rgba(42,157,143,0.15)'];

    // Gather data for each plot
    const plots = [];
    for (let i = 0; i < plotCount; i++) {
      const suffix = i === 0 ? '' : String(i + 1);
      plots.push({
        dMin: num('bw-min' + suffix, 12), q1: num('bw-q1' + suffix, 25), med: num('bw-median' + suffix, 35),
        q3: num('bw-q3' + suffix, 48), dMax: num('bw-max' + suffix, 62),
        label: val('bw-plabel' + suffix) || '',
      });
    }

    const hasPlotLabels = plots.some(p => p.label);
    const padL = hasPlotLabels ? 90 : 30;
    const padR = 30, padT = title ? 40 : 20, padB = 40;
    const plotW = 460;
    const W = padL + plotW + padR;
    const boxH = 36, boxGap = 14;
    const totalPlotH = plotCount * boxH + (plotCount - 1) * boxGap;
    const plotStartY = padT + 10;
    const axisY = plotStartY + totalPlotH + 20;
    const H = axisY + padB;
    const svg = makeSVG(W, H);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }));

    if (title && !isBlank) svg.appendChild(textEl(title, W / 2, 18, { 'font-size': '14', 'font-weight': '700' }));

    function mapX(v) { return padL + ((v - aMin) / (aMax - aMin)) * plotW; }

    // Axis line
    svg.appendChild(svgEl('line', { x1: padL, y1: axisY, x2: padL + plotW, y2: axisY, stroke: '#555', 'stroke-width': 1.5 }));

    // Ticks
    for (let v = aMin; v <= aMax + aStep * 0.01; v += aStep) {
      const x = mapX(v);
      svg.appendChild(svgEl('line', { x1: x, y1: axisY - 4, x2: x, y2: axisY + 4, stroke: '#555', 'stroke-width': 1 }));
      if (!isBlank) {
        svg.appendChild(textEl(String(Math.round(v)), x, axisY + 16, { 'font-size': '11', fill: '#555' }));
      }
    }

    // Draw each plot
    for (let i = 0; i < plotCount; i++) {
      const p = plots[i];
      const colour = plotColours[i % plotColours.length];
      const fill = fillColours[i % fillColours.length];
      const boxY = plotStartY + i * (boxH + boxGap);
      const wY = boxY + boxH / 2;

      // Plot label (left side)
      if (p.label && !isBlank) {
        svg.appendChild(textEl(p.label, padL - 8, wY, { 'font-size': '12', 'font-weight': '600', fill: colour, 'text-anchor': 'end' }));
      }

      // Whiskers
      svg.appendChild(svgEl('line', { x1: mapX(p.dMin), y1: wY, x2: mapX(p.q1), y2: wY, stroke: colour, 'stroke-width': 2 }));
      svg.appendChild(svgEl('line', { x1: mapX(p.q3), y1: wY, x2: mapX(p.dMax), y2: wY, stroke: colour, 'stroke-width': 2 }));
      // Whisker end caps
      svg.appendChild(svgEl('line', { x1: mapX(p.dMin), y1: boxY + 6, x2: mapX(p.dMin), y2: boxY + boxH - 6, stroke: colour, 'stroke-width': 2 }));
      svg.appendChild(svgEl('line', { x1: mapX(p.dMax), y1: boxY + 6, x2: mapX(p.dMax), y2: boxY + boxH - 6, stroke: colour, 'stroke-width': 2 }));

      // Box
      svg.appendChild(svgEl('rect', { x: mapX(p.q1), y: boxY, width: mapX(p.q3) - mapX(p.q1), height: boxH, fill, stroke: colour, 'stroke-width': 2 }));

      // Median line
      svg.appendChild(svgEl('line', { x1: mapX(p.med), y1: boxY, x2: mapX(p.med), y2: boxY + boxH, stroke: colour, 'stroke-width': 2.5 }));

      // Value labels
      if (showLabels) {
        const lY = boxY - 6;
        [p.dMin, p.q1, p.med, p.q3, p.dMax].forEach(v => {
          svg.appendChild(textEl(String(v), mapX(v), lY, { 'font-size': '10', 'font-weight': '600', fill: colour }));
        });
      }
    }

    return svg;
  },
};

// ══════════════════════════════════════════════════════
// 13. PROBABILITY SCALE
// ══════════════════════════════════════════════════════

TEMPLATES['probability-scale'] = {
  renderConfig(ct) {
    ct.innerHTML = buildConfig('Probability Scale', [
      { type: 'select', id: 'ps-format', label: 'Scale format', value: 'fraction', options: [
        { v: 'fraction', l: 'Fractions' }, { v: 'percentage', l: 'Percentages' }, { v: 'both', l: 'Both' },
      ]},
      { type: 'checkbox', id: 'ps-words', label: 'Show word labels', checked: true },
      { type: 'text', id: 'ps-title', label: 'Title', value: '', placeholder: 'Optional title' },
      { type: 'divider' },
      { type: 'heading', label: 'Marked events (up to 5)' },
      { type: 'container', id: 'ps-events' },
    ]);
    // Build 5 event rows
    const ct2 = $('ps-events');
    let html = '';
    for (let i = 0; i < 5; i++) {
      html += `<div class="cfg-row"><div class="cfg-field"><label class="cfg-field-label">Label</label><input type="text" class="cfg-input" value="" placeholder="Event ${i + 1}" data-ps-label="${i}" /></div><div class="cfg-field"><label class="cfg-field-label">Position (0-1)</label><input type="number" class="cfg-input cfg-input-sm" value="" step="0.05" min="0" max="1" data-ps-pos="${i}" /></div></div>`;
    }
    ct2.innerHTML = html;
    ct2.querySelectorAll('input').forEach(el => el.addEventListener('input', schedulePreview));
  },

  generateSVG() {
    const format = val('ps-format') || 'fraction';
    const showWords = checked('ps-words');
    const title = val('ps-title');

    const padL = 40, padR = 40, padT = title ? 40 : 20, padB = showWords ? 50 : 30;
    const lineW = 460;
    const W = padL + lineW + padR;
    const eventsH = 60;
    const H = padT + eventsH + 40 + padB;
    const svg = makeSVG(W, H);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }));

    if (title) svg.appendChild(textEl(title, W / 2, 18, { 'font-size': '14', 'font-weight': '700' }));

    function mapX(p) { return padL + p * lineW; }
    const lineY = padT + eventsH + 10;

    // Main line
    svg.appendChild(svgEl('line', { x1: padL, y1: lineY, x2: padL + lineW, y2: lineY, stroke: '#333', 'stroke-width': 2 }));

    // Scale marks
    const marks = [0, 0.25, 0.5, 0.75, 1];
    const fracLabels = ['0', '1/4', '1/2', '3/4', '1'];
    const pctLabels = ['0%', '25%', '50%', '75%', '100%'];

    for (let i = 0; i < marks.length; i++) {
      const x = mapX(marks[i]);
      svg.appendChild(svgEl('line', { x1: x, y1: lineY - 6, x2: x, y2: lineY + 6, stroke: '#333', 'stroke-width': 1.5 }));
      let label = '';
      if (format === 'fraction') label = fracLabels[i];
      else if (format === 'percentage') label = pctLabels[i];
      else label = fracLabels[i] + '\n' + pctLabels[i];
      svg.appendChild(textEl(format === 'both' ? fracLabels[i] : label, x, lineY + 18, { 'font-size': '10', fill: '#555' }));
      if (format === 'both') {
        svg.appendChild(textEl(pctLabels[i], x, lineY + 30, { 'font-size': '10', fill: '#888' }));
      }
    }

    // Word labels
    if (showWords) {
      const words = [
        { p: 0, w: 'Impossible' },
        { p: 0.25, w: 'Unlikely' },
        { p: 0.5, w: 'Even chance' },
        { p: 0.75, w: 'Likely' },
        { p: 1, w: 'Certain' },
      ];
      for (const { p, w } of words) {
        const x = mapX(p);
        const yOff = format === 'both' ? 44 : 34;
        svg.appendChild(textEl(w, x, lineY + yOff, { 'font-size': '9', fill: '#4262ff', 'font-style': 'italic' }));
      }
    }

    // Marked events
    const eventColours = ['#e53935', '#43a047', '#ff9800', '#7b1fa2', '#00838f'];
    for (let i = 0; i < 5; i++) {
      const lEl = document.querySelector(`[data-ps-label="${i}"]`);
      const pEl = document.querySelector(`[data-ps-pos="${i}"]`);
      const lbl = lEl ? lEl.value : '';
      const pos = pEl ? parseFloat(pEl.value) : NaN;
      if (!lbl || isNaN(pos)) continue;
      const x = mapX(Math.max(0, Math.min(1, pos)));
      const col = eventColours[i % eventColours.length];
      // Arrow down to line
      svg.appendChild(svgEl('line', { x1: x, y1: padT + 10, x2: x, y2: lineY - 2, stroke: col, 'stroke-width': 1.5, 'stroke-dasharray': '3,2' }));
      svg.appendChild(svgEl('circle', { cx: x, cy: lineY, r: 5, fill: col, stroke: '#fff', 'stroke-width': 1.5 }));
      svg.appendChild(textEl(lbl, x, padT + 4, { 'font-size': '10', 'font-weight': '600', fill: col }));
    }

    return svg;
  },
};

// ── Merge extra templates ──────────────────────────────
Object.assign(TEMPLATES, extraTemplates);
for (const tpl of interactiveTemplates) {
  const id = tpl.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  TEMPLATES[id] = tpl;
}

// ══════════════════════════════════════════════════════
// CORE APP LOGIC
// ══════════════════════════════════════════════════════

function schedulePreview() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updatePreview, 200);
}

function updatePreview() {
  if (!activeTemplate || !TEMPLATES[activeTemplate]) return;
  previewArea.innerHTML = '';
  try {
    const tpl = TEMPLATES[activeTemplate];
    // Extra/interactive templates use readConfig() + generateSVG(settings)
    // Phase 1 templates use generateSVG() with no args (reads DOM directly)
    const settings = tpl.readConfig ? tpl.readConfig() : undefined;
    previewArea.appendChild(tpl.generateSVG(settings));
  } catch (e) {
    const errSpan = document.createElement('span');
    errSpan.style.cssText = 'color:#c00;font-size:12px;';
    errSpan.textContent = 'Error: ' + e.message;
    previewArea.appendChild(errSpan);
  }
}

function selectTemplate(name) {
  activeTemplate = name;

  // Update editor title
  const displayName = DISPLAY_NAMES[name] || (TEMPLATES[name] && TEMPLATES[name].name) || name;
  editorTitle.textContent = displayName;

  // Render config
  const tpl = TEMPLATES[name];
  if (!tpl) return;
  configPanel.innerHTML = '';
  tpl.renderConfig(configPanel);

  // Live preview, colour swatches and range displays are all handled by
  // delegated listeners on configPanel registered once in init().
  updatePreview();

  // Update favourite button state
  if (favBtn) {
    const favs = JSON.parse(localStorage.getItem('tpl-favourites') || '[]');
    if (favs.includes(name)) {
      favBtn.textContent = '\u2605';
      favBtn.classList.add('active');
    } else {
      favBtn.textContent = '\u2606';
      favBtn.classList.remove('active');
    }
  }
}

// ── SVG → data URL helpers ──────────────────────────

function svgToSvgDataUrl(svg) {
  const svgStr = new XMLSerializer().serializeToString(svg);
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
}

// Renders SVG to a PNG data URL with a genuine alpha channel.
// Uses a Blob URL → canvas → PNG pipeline. Blob URLs preserve SVG transparency
// more reliably than base64 data URLs, which some browsers rasterise with
// a white background. Canvas starts fully transparent; only SVG content is drawn.
function svgToPngDataUrl(svg) {
  const svgStr = new XMLSerializer().serializeToString(svg);
  const w = Math.round(parseFloat(svg.getAttribute('width')) || 600);
  const h = Math.round(parseFloat(svg.getAttribute('height')) || 600);
  const scale = 2; // retina-quality export

  const fallbackSvgUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    // Canvas pixels start at rgba(0,0,0,0) — do NOT fill white

    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(blobUrl);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(fallbackSvgUrl);
    };
    img.src = blobUrl;
  });
}

// ── Place on Board ──────────────────────────────────

async function placeOnBoard() {
  if (!activeTemplate || !TEMPLATES[activeTemplate]) {
    await miro.board.notifications.showInfo('Select a template first.');
    return;
  }

  const tpl = TEMPLATES[activeTemplate];
  const cfg = tpl.readConfig ? tpl.readConfig() : undefined;
  const svg = tpl.generateSVG(cfg);

  // Use PNG (with alpha) when the template requests a transparent background,
  // otherwise use the lighter SVG data URL.
  const needsPng = cfg && cfg.transparent;
  const dataUrl = needsPng ? await svgToPngDataUrl(svg) : svgToSvgDataUrl(svg);

  const size = parseInt(imgSizeEl.value, 10) || 600;

  // Store template name + all config input values for edit
  const settings = { _tplGen: true, template: activeTemplate, inputs: {} };
  configPanel.querySelectorAll('input, select, textarea').forEach(el => {
    const key = el.id || el.getAttribute('data-seg-label') || el.getAttribute('data-seg-colour')
      || el.getAttribute('data-fm-op') || el.getAttribute('data-tw-row') || el.getAttribute('data-tw-col')
      || el.getAttribute('data-td-label') || el.getAttribute('data-td-prob')
      || el.getAttribute('data-ps-label') || el.getAttribute('data-ps-pos')
      || el.getAttribute('data-tc-label') || el.getAttribute('data-tc-tally')
      || el.getAttribute('data-ft-interval') || el.getAttribute('data-di-val')
      || el.getAttribute('data-group');
    if (!key) return;
    if (el.type === 'checkbox') {
      // For data-group checkboxes, store as array
      if (el.getAttribute('data-group')) {
        if (!settings.inputs['_grp_' + key]) settings.inputs['_grp_' + key] = [];
        if (el.checked) settings.inputs['_grp_' + key].push(el.value);
      } else {
        settings.inputs[key] = el.checked;
      }
    } else {
      settings.inputs[key] = el.value;
    }
  });

  const titleJson = JSON.stringify(settings);

  const vp = await miro.board.viewport.get();
  await miro.board.createImage({
    url: dataUrl,
    x: vp.x + vp.width / 2,
    y: vp.y + vp.height / 2,
    width: size,
    title: titleJson,
  });

  // Save to recents
  const recents = JSON.parse(localStorage.getItem('tpl-recents') || '[]');
  const recentEntry = { id: activeTemplate, name: DISPLAY_NAMES[activeTemplate] || activeTemplate, time: Date.now() };
  const recentInputs = {};
  configPanel.querySelectorAll('input, select, textarea').forEach(el => {
    const key = el.id || el.name;
    if (!key) return;
    recentInputs[key] = el.type === 'checkbox' ? el.checked : el.value;
  });
  recentEntry.settings = recentInputs;
  const filteredRecents = recents.filter(r => r.id !== recentEntry.id);
  filteredRecents.unshift(recentEntry);
  localStorage.setItem('tpl-recents', JSON.stringify(filteredRecents.slice(0, 8)));

  miro.board.ui.closeModal();
}

// ── Edit Selected ───────────────────────────────────

async function editSelected() {
  const selection = await miro.board.getSelection();
  const images = selection.filter(item => item.type === 'image');
  if (images.length === 0) {
    await miro.board.notifications.showInfo('Select a template image first.');
    return;
  }

  const img = images[0];
  let settings;
  try {
    settings = JSON.parse(img.title);
    if (!settings._tplGen) throw new Error('Not a template image');
  } catch {
    await miro.board.notifications.showInfo('Selected image was not created by Maths Templates.');
    return;
  }

  // Load the template and show editor
  showEditor(settings.template);

  // Wait a tick for DOM to update, then apply saved values
  await new Promise(r => setTimeout(r, 50));

  for (const [key, value] of Object.entries(settings.inputs)) {
    if (key.startsWith('_grp_')) {
      // checkbox group
      const group = key.slice(5);
      document.querySelectorAll(`[data-group="${group}"]`).forEach(el => {
        el.checked = value.includes(el.value);
      });
      continue;
    }
    const el = document.getElementById(key)
      || document.querySelector(`[data-seg-label="${key}"]`)
      || document.querySelector(`[data-seg-colour="${key}"]`)
      || document.querySelector(`[data-fm-op="${key}"]`)
      || document.querySelector(`[data-tw-row="${key}"]`)
      || document.querySelector(`[data-tw-col="${key}"]`)
      || document.querySelector(`[data-td-label="${key}"]`)
      || document.querySelector(`[data-td-prob="${key}"]`)
      || document.querySelector(`[data-ps-label="${key}"]`)
      || document.querySelector(`[data-ps-pos="${key}"]`)
      || document.querySelector(`[data-tc-label="${key}"]`)
      || document.querySelector(`[data-tc-tally="${key}"]`)
      || document.querySelector(`[data-ft-interval="${key}"]`)
      || document.querySelector(`[data-di-val="${key}"]`);
    if (!el) continue;
    if (el.type === 'checkbox') {
      el.checked = !!value;
    } else {
      el.value = value;
    }
    // Update swatch dots
    if (el.type === 'color' && el.nextElementSibling) {
      el.nextElementSibling.style.background = el.value;
    }
    // Update range value displays
    if (el.type === 'range') {
      const vEl = document.getElementById(el.id + '-val');
      if (vEl) vEl.textContent = el.value;
    }
  }

  updatePreview();
}

// ── Navigation helpers ──────────────────────────────

function showGallery() {
  editorScreen.classList.remove('active');
  galleryScreen.classList.add('active');
}

function showEditor(templateId) {
  galleryScreen.classList.remove('active');
  editorScreen.classList.add('active');
  selectTemplate(templateId);
}

// ── Gallery filtering ───────────────────────────────

let activeCat = 'all';

const CAT_ORDER = ['number','algebra','geometry','3d-shapes','statistics','measurement','advanced'];
const CAT_LABELS = {
  'number': 'Number', 'algebra': 'Algebra', 'geometry': 'Geometry',
  '3d-shapes': '3D Shapes', 'statistics': 'Statistics',
  'measurement': 'Measurement', 'advanced': 'Advanced',
};

function filterGallery() {
  const q = searchInput.value.toLowerCase();
  galleryGrid.querySelectorAll('.gallery-section').forEach(section => {
    const cat = section.dataset.cat;
    const catMatch = activeCat === 'all' || cat === activeCat;
    let anyVisible = false;
    section.querySelectorAll('.template-pill').forEach(pill => {
      const id = pill.dataset.template;
      const name = (DISPLAY_NAMES[id] || '').toLowerCase();
      const kw = (KEYWORDS[id] || '').toLowerCase();
      const visible = catMatch && (!q || name.includes(q) || id.includes(q) || kw.includes(q));
      pill.style.display = visible ? '' : 'none';
      if (visible) anyVisible = true;
    });
    section.style.display = anyVisible ? '' : 'none';
  });
}

// ── Build gallery as categorised pill list ──────────

function buildGallery() {
  galleryGrid.innerHTML = '';

  const byCategory = {};
  CAT_ORDER.forEach(c => { byCategory[c] = []; });

  const seen = new Set();
  const orderedIds = [...TEMPLATE_ORDER];
  for (const id of Object.keys(TEMPLATES)) {
    if (!orderedIds.includes(id)) orderedIds.push(id);
  }

  for (const id of orderedIds) {
    if (!TEMPLATES[id] || seen.has(id)) continue;
    seen.add(id);
    const cat = CATS[id] || 'advanced';
    (byCategory[cat] || (byCategory[cat] = [])).push(id);
  }

  for (const cat of CAT_ORDER) {
    const ids = byCategory[cat];
    if (!ids?.length) continue;

    const section = document.createElement('div');
    section.className = 'gallery-section';
    section.dataset.cat = cat;

    const title = document.createElement('div');
    title.className = 'gallery-section-title';
    title.textContent = CAT_LABELS[cat] || cat;
    section.appendChild(title);

    const pillRow = document.createElement('div');
    pillRow.className = 'gallery-pills';

    for (const id of ids) {
      const name = DISPLAY_NAMES[id] || (TEMPLATES[id].name) || id;
      const pill = document.createElement('button');
      pill.className = 'template-pill';
      pill.dataset.template = id;
      const PILL_BADGES = {
        'normal-distribution': 'μσ',
        'chi-squared': 'χ²',
        't-distribution': 't',
        'binomial': 'B(n,p)',
      };
      if (PILL_BADGES[id]) {
        const badge = document.createElement('span');
        badge.className = 'pill-badge';
        badge.textContent = PILL_BADGES[id];
        pill.appendChild(badge);
        pill.appendChild(document.createTextNode(' ' + name));
      } else {
        pill.textContent = name;
      }
      pill.addEventListener('click', () => showEditor(id));
      pillRow.appendChild(pill);
    }

    section.appendChild(pillRow);
    galleryGrid.appendChild(section);
  }
}

// ── Init ────────────────────────────────────────────

function init() {
  // Build gallery cards from TEMPLATES registry
  buildGallery();

  // Category pill filtering
  galleryCats.addEventListener('click', (e) => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;
    galleryCats.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeCat = pill.dataset.cat;
    filterGallery();
  });

  // Search filtering
  searchInput.addEventListener('input', filterGallery);

  // Back button
  backBtn.addEventListener('click', showGallery);

  // Single delegated listener covers all inputs — including ones added dynamically
  // by extra templates. Replaces per-input listeners that were re-added on every
  // template selection (causing duplicate firings and accumulating memory).
  configPanel.addEventListener('input', (e) => {
    // Colour swatch dot sync
    if (e.target.type === 'color') {
      const dot = e.target.nextElementSibling;
      if (dot) dot.style.background = e.target.value;
    }
    // Range value display sync
    if (e.target.classList.contains('cfg-range')) {
      const vEl = document.getElementById(e.target.id + '-val');
      if (vEl) vEl.textContent = e.target.value;
    }
    schedulePreview();
  });
  configPanel.addEventListener('change', schedulePreview);

  // Expose schedulePreview for dynamic inputs in extra templates
  window._tplSchedulePreview = schedulePreview;

  // Editor bar buttons
  placeBtn.addEventListener('click', placeOnBoard);
  editBtn.addEventListener('click', editSelected);
  imgSizeEl.addEventListener('input', () => { sizeValueEl.textContent = imgSizeEl.value; });

  // Favourite toggle button
  if (favBtn) {
    favBtn.addEventListener('click', () => {
      if (!activeTemplate) return;
      const favs = JSON.parse(localStorage.getItem('tpl-favourites') || '[]');
      const idx = favs.indexOf(activeTemplate);
      if (idx >= 0) {
        favs.splice(idx, 1);
        favBtn.textContent = '\u2606'; // empty star
        favBtn.classList.remove('active');
      } else {
        favs.unshift(activeTemplate);
        if (favs.length > 10) favs.length = 10;
        favBtn.textContent = '\u2605'; // filled star
        favBtn.classList.add('active');
      }
      localStorage.setItem('tpl-favourites', JSON.stringify(favs));
    });
  }

  // Check for panel pre-selection (favourite clicked in panel)
  const panelSelect = localStorage.getItem('tpl-panel-select');
  if (panelSelect) {
    localStorage.removeItem('tpl-panel-select');
    if (TEMPLATES[panelSelect]) {
      showEditor(panelSelect);
    }
  }

  // Check for edit settings from panel (edit selected or recent)
  const editSettingsJson = localStorage.getItem('tpl-edit-settings');
  if (editSettingsJson) {
    localStorage.removeItem('tpl-edit-settings');
    try {
      const editSettings = JSON.parse(editSettingsJson);
      if (editSettings._tplGen && editSettings.template && TEMPLATES[editSettings.template]) {
        showEditor(editSettings.template);
        // Wait a tick for DOM to populate, then apply saved input values
        setTimeout(() => {
          for (const [key, value] of Object.entries(editSettings.inputs || {})) {
            if (key.startsWith('_grp_')) {
              const group = key.slice(5);
              document.querySelectorAll(`[data-group="${group}"]`).forEach(el => {
                el.checked = value.includes(el.value);
              });
              continue;
            }
            const el = document.getElementById(key)
              || document.querySelector(`[data-seg-label="${key}"]`)
              || document.querySelector(`[data-seg-colour="${key}"]`)
              || document.querySelector(`[data-fm-op="${key}"]`)
              || document.querySelector(`[data-tw-row="${key}"]`)
              || document.querySelector(`[data-tw-col="${key}"]`)
              || document.querySelector(`[data-td-label="${key}"]`)
              || document.querySelector(`[data-td-prob="${key}"]`)
              || document.querySelector(`[data-ps-label="${key}"]`)
              || document.querySelector(`[data-ps-pos="${key}"]`)
              || document.querySelector(`[data-tc-label="${key}"]`)
              || document.querySelector(`[data-tc-tally="${key}"]`)
              || document.querySelector(`[data-ft-interval="${key}"]`)
              || document.querySelector(`[data-di-val="${key}"]`);
            if (!el) continue;
            if (el.type === 'checkbox') {
              el.checked = !!value;
            } else {
              el.value = value;
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
          schedulePreview();
        }, 80);
      }
    } catch { /* ignore invalid JSON */ }
  }
}

init();
