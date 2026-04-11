/* ── Bansho Board Generator ────────────────────────── */

import { svgToDataUrl, svgToPngDataUrl } from '../../shared/svg-utils.js';
import { getSafeJSON, setSafeJSON } from '../../shared/storage-utils.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function makeSVG(w, h) {
  return svgEl('svg', { xmlns: SVG_NS, viewBox: `0 0 ${w} ${h}`, width: w, height: h });
}

function svgText(x, y, text, size, anchor, extra = {}) {
  const el = svgEl('text', {
    x, y, 'font-size': size, 'text-anchor': anchor,
    'dominant-baseline': 'central',
    'font-family': extra['font-family'] || 'Inter, Arial, sans-serif',
    ...extra,
  });
  el.textContent = text;
  return el;
}

function svgTspanBlock(x, y, lines, size, anchor, extra = {}) {
  const t = svgEl('text', {
    x, y, 'font-size': size, 'text-anchor': anchor,
    'font-family': extra['font-family'] || 'Inter, Arial, sans-serif',
    ...extra,
  });
  lines.forEach((line, i) => {
    const ts = svgEl('tspan', { x, dy: i === 0 ? '0' : `${size * 1.45}` });
    ts.textContent = line;
    t.appendChild(ts);
  });
  return t;
}

/* ════════════════════════════════════════════════════
   THEMES
   ════════════════════════════════════════════════════ */

const THEMES = {
  light: {
    boardBg:   '#f8fafc',
    border:    '#cbd5e1',
    zones: {
      problem:   '#eff6ff',
      neriage:   '#f0fdf4',
      hatsumon:  '#fefce8',
      matome:    '#fdf4ff',
      prior:     '#fff7ed',
      extension: '#f0f9ff',
    },
    labelBg:   'rgba(255,255,255,0.7)',
    labelCol:  '#475569',
    headCol:   '#1e293b',
    textCol:   '#334155',
    divider:   '#e2e8f0',
    slotNum:   '#94a3b8',
    chalk:     false,
  },
  dark: {
    boardBg:   '#0f172a',
    border:    '#334155',
    zones: {
      problem:   '#1e293b',
      neriage:   '#162032',
      hatsumon:  '#1c1a10',
      matome:    '#1a1228',
      prior:     '#1c1510',
      extension: '#101c28',
    },
    labelBg:   'rgba(15,23,42,0.7)',
    labelCol:  '#94a3b8',
    headCol:   '#e2e8f0',
    textCol:   '#cbd5e1',
    divider:   '#334155',
    slotNum:   '#475569',
    chalk:     false,
  },
  chalk: {
    boardBg:   '#2a3b2c',
    border:    '#d4d4a8',
    zones: {
      problem:   'rgba(255,255,255,0.04)',
      neriage:   'rgba(255,255,255,0.04)',
      hatsumon:  'rgba(255,255,255,0.04)',
      matome:    'rgba(255,255,255,0.04)',
      prior:     'rgba(255,255,255,0.04)',
      extension: 'rgba(255,255,255,0.04)',
    },
    labelBg:   'none',
    labelCol:  '#d4d4a8',
    headCol:   '#fffce8',
    textCol:   '#fffce8',
    divider:   '#5a6b5a',
    slotNum:   '#8a9a8a',
    chalk:     true,
  },
};

/* ════════════════════════════════════════════════════
   LAYOUT
   ════════════════════════════════════════════════════ */

const W = 1600, H = 960;
const H_PRIOR   = 90;
const H_MATOME  = 210;
const W_PROBLEM = 460;

function computeLayout(cfg) {
  const { showPrior, showHatsumon, showMatome, showExtension } = cfg;
  let y = 0;
  const layout = {};

  if (showPrior) {
    layout.prior = { x: 0, y: 0, w: W, h: H_PRIOR };
    y = H_PRIOR;
  }

  const bottomH = showMatome ? H_MATOME : 0;
  const midH    = H - y - bottomH;
  const wRight  = W - W_PROBLEM;

  layout.problem = { x: 0, y, w: W_PROBLEM, h: midH };

  if (showHatsumon) {
    const nerH = Math.round(midH * 0.60);
    layout.neriage  = { x: W_PROBLEM, y, w: wRight, h: nerH };
    layout.hatsumon = { x: W_PROBLEM, y: y + nerH, w: wRight, h: midH - nerH };
  } else {
    layout.neriage = { x: W_PROBLEM, y, w: wRight, h: midH };
  }

  if (showMatome) {
    const matY = y + midH;
    if (showExtension) {
      layout.matome    = { x: 0,           y: matY, w: Math.round(W * 0.55), h: H_MATOME };
      layout.extension = { x: Math.round(W * 0.55), y: matY, w: W - Math.round(W * 0.55), h: H_MATOME };
    } else {
      layout.matome = { x: 0, y: matY, w: W, h: H_MATOME };
    }
  }

  return layout;
}

/* ════════════════════════════════════════════════════
   DEMO CONTENT
   ════════════════════════════════════════════════════ */

const DEMO = {
  problem: [
    'Farmer Jo has 24 eggs.',
    'She packs them in boxes of 6.',
    '',
    'How many boxes does she need?',
    '',
    'Show your thinking in at least',
    'two different ways.',
  ],
  hatsumon: [
    '● What did you notice about',
    '   these strategies?',
    '',
    '● Can you explain another',
    '   student\'s method?',
    '',
    '● Which method is most efficient?',
    '   Why?',
  ],
  matome: [
    'Key Idea:',
    'Division means splitting into',
    'equal groups — 24 ÷ 6 = 4',
    'because 4 × 6 = 24.',
  ],
  prior: [
    'Prior Knowledge:  What do you know about groups and sharing?',
  ],
  extension: [
    'Extension:  Jo also has 36 eggs.',
    'How many boxes does she need if',
    'boxes hold 4 eggs? 8 eggs? 9 eggs?',
  ],
  strategies: [
    ['Repeated Subtraction', '24 – 6 = 18', '18 – 6 = 12', '12 – 6 = 6', '6 – 6 = 0', '→ 4 subtractions = 4 boxes'],
    ['Skip Counting', '6, 12, 18, 24', '(count: 1, 2, 3, 4)', '→ 4 boxes'],
    ['Arrays / Groups', 'Draw 4 groups of 6', '● ● ● ● ● ●  (×4)', '→ 4 boxes'],
    ['Number Line', '0 → 6 → 12 → 18 → 24', '4 jumps of 6', '→ 4 boxes'],
    ['Multiplication', '? × 6 = 24', '4 × 6 = 24', '→ 4 boxes'],
    ['Division sentence', '24 ÷ 6 = □', '□ = 4', '→ 4 boxes'],
  ],
};

/* ════════════════════════════════════════════════════
   ZONE DRAWING
   ════════════════════════════════════════════════════ */

const PAD = 14;
const R   = 6;   /* zone border-radius */

function drawZone(svg, rect, zoneKey, label, cfg, T) {
  const { x, y, w, h } = rect;
  const isChalk = T.chalk;

  /* background */
  svg.appendChild(svgEl('rect', {
    x, y, width: w, height: h, rx: R,
    fill:         T.zones[zoneKey] || T.zones.problem,
    stroke:       T.border,
    'stroke-width': '1.5',
    ...(isChalk ? { 'stroke-dasharray': '8 3', 'stroke-linecap': 'round' } : {}),
  }));

  /* label strip */
  const lblH = 28;
  if (!isChalk) {
    svg.appendChild(svgEl('rect', {
      x: x + 1, y: y + 1, width: w - 2, height: lblH, rx: R,
      fill: T.labelBg,
    }));
  }

  /* zone label text */
  const fontFamily = isChalk
    ? '"Chalkboard SE", "Patrick Hand", cursive, sans-serif'
    : 'Inter, Arial, sans-serif';

  svg.appendChild(svgText(x + PAD, y + lblH / 2 + 1, label.toUpperCase(), isChalk ? 11 : 10, 'start', {
    fill: T.labelCol, 'font-weight': '700', 'letter-spacing': '0.8',
    'font-family': fontFamily,
  }));

  /* rule under label */
  svg.appendChild(svgEl('line', {
    x1: x + 1, y1: y + lblH, x2: x + w - 1, y2: y + lblH,
    stroke: T.divider, 'stroke-width': '1',
    ...(isChalk ? { 'stroke-dasharray': '6 3' } : {}),
  }));

  return { contentX: x + PAD, contentY: y + lblH + PAD, contentW: w - PAD * 2, contentH: h - lblH - PAD * 2 };
}

function drawDemoText(svg, lines, x, y, size, T) {
  const isChalk = T.chalk;
  const fontFamily = isChalk
    ? '"Chalkboard SE", "Patrick Hand", cursive, sans-serif'
    : 'Inter, Arial, sans-serif';
  const t = svgTspanBlock(x, y, lines, size, 'start', {
    fill: T.textCol, 'font-family': fontFamily, 'font-weight': isChalk ? '600' : '400',
  });
  svg.appendChild(t);
}

/* ════════════════════════════════════════════════════
   MAIN SVG GENERATOR
   ════════════════════════════════════════════════════ */

function generateBanshoSVG(cfg) {
  const T      = THEMES[cfg.theme] || THEMES.light;
  const layout = computeLayout(cfg);
  const svg    = makeSVG(W, H);

  /* board background */
  svg.appendChild(svgEl('rect', {
    x: 0, y: 0, width: W, height: H,
    fill: T.boardBg,
  }));

  /* chalk board texture: subtle grid of specks */
  if (T.chalk) {
    const defs = svgEl('defs', {});
    const pat  = svgEl('pattern', { id: 'chalk-bg', x: 0, y: 0, width: 40, height: 40, patternUnits: 'userSpaceOnUse' });
    pat.appendChild(svgEl('circle', { cx: 20, cy: 20, r: '0.6', fill: 'rgba(255,255,220,0.06)' }));
    pat.appendChild(svgEl('circle', { cx: 5,  cy: 35, r: '0.4', fill: 'rgba(255,255,220,0.04)' }));
    defs.appendChild(pat);
    svg.appendChild(defs);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#chalk-bg)' }));
  }

  const isChalk  = T.chalk;
  const fontFam  = isChalk
    ? '"Chalkboard SE", "Patrick Hand", cursive, sans-serif'
    : 'Inter, Arial, sans-serif';
  const demoMode = cfg.mode === 'demo';

  /* ── Problem ─────────────────────────────────── */
  if (layout.problem) {
    const c = drawZone(svg, layout.problem, 'problem', cfg.labels.problem, cfg, T);
    if (demoMode) {
      drawDemoText(svg, DEMO.problem, c.contentX, c.contentY, isChalk ? 18 : 17, T);
    }
  }

  /* ── Student Thinking (neriage) ─────────────── */
  if (layout.neriage) {
    const { x, y, w, h } = layout.neriage;
    const n = cfg.slots;
    const slotW = Math.floor(w / n);

    /* Draw each slot */
    for (let i = 0; i < n; i++) {
      const sx = x + i * slotW;
      const sw = (i === n - 1) ? w - i * slotW : slotW; /* last slot takes remainder */

      /* zone bg — only first slot gets the zone label */
      if (i === 0) {
        drawZone(svg, { x, y, w, h }, 'neriage', cfg.labels.neriage, cfg, T);
      }

      /* slot dividers */
      if (i > 0) {
        svg.appendChild(svgEl('line', {
          x1: sx, y1: y + 1, x2: sx, y2: y + h - 1,
          stroke: T.divider, 'stroke-width': '1',
          ...(isChalk ? { 'stroke-dasharray': '6 4' } : {}),
        }));
      }

      /* slot number */
      const lblH = 28, numY = y + lblH + 18;
      svg.appendChild(svgText(sx + sw / 2, numY, String(i + 1), 22, 'middle', {
        fill: T.slotNum, 'font-weight': '700', 'font-family': fontFam,
        opacity: '0.4',
      }));

      /* demo strategy content */
      if (demoMode && DEMO.strategies[i]) {
        const strat = DEMO.strategies[i];
        const textX = sx + 12, textY = numY + 30;
        drawDemoText(svg, strat, textX, textY, isChalk ? 14 : 13, T);
      }
    }
  }

  /* ── Hatsumon ────────────────────────────────── */
  if (layout.hatsumon) {
    const c = drawZone(svg, layout.hatsumon, 'hatsumon', cfg.labels.hatsumon, cfg, T);
    if (demoMode) {
      drawDemoText(svg, DEMO.hatsumon, c.contentX, c.contentY, isChalk ? 15 : 14, T);
    }
  }

  /* ── Matome ──────────────────────────────────── */
  if (layout.matome) {
    const c = drawZone(svg, layout.matome, 'matome', cfg.labels.matome, cfg, T);
    if (demoMode) {
      /* Matome gets a highlight box around the key idea */
      const bx = c.contentX, by = c.contentY, bw = c.contentW;
      svg.appendChild(svgEl('rect', {
        x: bx - 6, y: by - 6, width: bw + 12, height: c.contentH + 6,
        rx: 6, fill: isChalk ? 'rgba(255,255,200,0.08)' : 'rgba(99,102,241,0.06)',
        stroke: isChalk ? '#d4d4a8' : '#818cf8', 'stroke-width': '1',
        ...(isChalk ? { 'stroke-dasharray': '6 3' } : {}),
      }));
      drawDemoText(svg, DEMO.matome, bx, by, isChalk ? 16 : 15, T);
    }
  }

  /* ── Prior Knowledge ─────────────────────────── */
  if (layout.prior) {
    const c = drawZone(svg, layout.prior, 'prior', cfg.labels.prior, cfg, T);
    if (demoMode) {
      drawDemoText(svg, DEMO.prior, c.contentX, c.contentY, isChalk ? 14 : 13, T);
    }
  }

  /* ── Extension ───────────────────────────────── */
  if (layout.extension) {
    const c = drawZone(svg, layout.extension, 'extension', cfg.labels.extension, cfg, T);
    if (demoMode) {
      drawDemoText(svg, DEMO.extension, c.contentX, c.contentY, isChalk ? 14 : 13, T);
    }
  }

  return svg;
}

/* svgToDataUrl and svgToPngDataUrl imported from ../../shared/svg-utils.js */

/* ════════════════════════════════════════════════════
   CONFIG READ
   ════════════════════════════════════════════════════ */

function $(id) { return document.getElementById(id); }
function val(id) { const e = $(id); return e ? e.value : ''; }
function chk(id) { const e = $(id); return e ? e.checked : false; }

function readConfig() {
  return {
    slots:         Math.max(1, parseInt(val('bs-slots')) || 3),
    theme:         val('bs-theme')           || 'light',
    mode:          val('bs-mode')            || 'blank',
    showPrior:     chk('bs-prior'),
    showHatsumon:  chk('bs-hatsumon'),
    showMatome:    chk('bs-matome'),
    showExtension: chk('bs-extension'),
    boardWidth:    parseInt(val('bs-size'))  || 1200,
    labels: {
      problem:   val('bs-lbl-problem')   || 'Problem / Task',
      neriage:   val('bs-lbl-neriage')   || 'Student Thinking',
      hatsumon:  val('bs-lbl-hatsumon')  || 'Discussion Prompts',
      matome:    val('bs-lbl-matome')    || 'Consolidation',
      prior:     val('bs-lbl-prior')     || 'Prior Knowledge',
      extension: val('bs-lbl-extension') || 'Extension',
    },
  };
}

function applyConfig(cfg) {
  const set = (id, v) => { const e = $(id); if (e) e.value = v; };
  const setChk = (id, v) => { const e = $(id); if (e) e.checked = v; };
  set('bs-slots',         cfg.slots);
  set('bs-theme',         cfg.theme);
  set('bs-mode',          cfg.mode);
  setChk('bs-prior',      cfg.showPrior);
  setChk('bs-hatsumon',   cfg.showHatsumon);
  setChk('bs-matome',     cfg.showMatome);
  setChk('bs-extension',  cfg.showExtension);
  set('bs-size',          cfg.boardWidth);
  $('bs-size-val').textContent = cfg.boardWidth;
  if (cfg.labels) {
    set('bs-lbl-problem',   cfg.labels.problem);
    set('bs-lbl-neriage',   cfg.labels.neriage);
    set('bs-lbl-hatsumon',  cfg.labels.hatsumon);
    set('bs-lbl-matome',    cfg.labels.matome);
    set('bs-lbl-prior',     cfg.labels.prior);
    set('bs-lbl-extension', cfg.labels.extension);
  }
  syncOptionalRows(cfg);
}

function syncOptionalRows(cfg) {
  $('prior-lbl-row').style.display = (cfg ? cfg.showPrior  : chk('bs-prior'))     ? '' : 'none';
  $('ext-lbl-row').style.display   = (cfg ? cfg.showExtension : chk('bs-extension')) ? '' : 'none';
}

/* ════════════════════════════════════════════════════
   PREVIEW
   ════════════════════════════════════════════════════ */

let _previewTimer = null;

function schedulePreview() {
  clearTimeout(_previewTimer);
  _previewTimer = setTimeout(updatePreview, 150);
}

function updatePreview() {
  const cfg = readConfig();
  const svg = generateBanshoSVG(cfg);
  const area = $('preview-area');
  area.innerHTML = '';
  area.appendChild(svg);
}

/* ════════════════════════════════════════════════════
   PLACE ON BOARD
   ════════════════════════════════════════════════════ */

async function placeOnBoard() {
  const btn = $('place-btn');
  const status = $('status-msg');
  btn.disabled = true;
  btn.textContent = 'Placing…';
  status.textContent = '';

  try {
    const cfg  = readConfig();
    const svg  = generateBanshoSVG(cfg);
    const T    = THEMES[cfg.theme];
    let dataUrl;
    if (T.chalk) {
      status.textContent = 'Rendering chalk…';
      dataUrl = await svgToPngDataUrl(svg);
    } else {
      dataUrl = svgToDataUrl(svg);
    }

    const vp = await miro.board.viewport.get();
    await miro.board.createImage({
      url:   dataUrl,
      x:     vp.x + vp.width  / 2,
      y:     vp.y + vp.height / 2,
      width: cfg.boardWidth,
      title: JSON.stringify({ _banshoGen: true, ...cfg }),
    });

    saveRecent(cfg);
    await miro.board.ui.closeModal();
  } catch (err) {
    console.error(err);
    status.textContent = 'Error — see console';
    btn.disabled = false;
    btn.textContent = 'Place on Board';
  }
}

/* ════════════════════════════════════════════════════
   EDIT SELECTED
   ════════════════════════════════════════════════════ */

async function editSelected() {
  const sel = await miro.board.getSelection();
  const img = sel.find(i => i.type === 'image');
  if (!img) {
    await miro.board.notifications.showError('Select a Bansho board image first');
    return;
  }
  try {
    const cfg = JSON.parse(img.title);
    if (!cfg._banshoGen) throw new Error('Not a Bansho image');
    applyConfig(cfg);
    updatePreview();
  } catch (err) {
    console.warn('[bansho] editSelected: could not parse image config', err);
    await miro.board.notifications.showError('Selected image is not a Bansho board');
  }
}

/* ════════════════════════════════════════════════════
   RECENTS
   ════════════════════════════════════════════════════ */

function saveRecent(cfg) {
  const recents = getSafeJSON('bansho-recents', []);
  recents.unshift({ ts: Date.now(), cfg });
  recents.length = Math.min(recents.length, 5);
  setSafeJSON('bansho-recents', recents);
}

/* ════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════ */

function init() {
  /* live preview on any input change */
  $('config-panel').addEventListener('input', schedulePreview);
  $('config-panel').addEventListener('change', schedulePreview);

  /* size slider label */
  $('bs-size').addEventListener('input', () => {
    $('bs-size-val').textContent = $('bs-size').value;
  });

  /* show/hide optional label rows when checkboxes change */
  $('bs-prior').addEventListener('change', () => syncOptionalRows(null));
  $('bs-extension').addEventListener('change', () => syncOptionalRows(null));

  /* bottom bar */
  $('place-btn').addEventListener('click', placeOnBoard);
  $('edit-selected-btn').addEventListener('click', editSelected);

  /* restore settings if opened from "edit selected" panel flow */
  const saved = getSafeJSON('bansho-settings', null);
  localStorage.removeItem('bansho-settings');
  if (saved) {
    try { applyConfig(saved); } catch (err) { console.warn('[bansho] init: bad saved config', err); }
  } else {
    syncOptionalRows(null);
  }

  updatePreview();
}

init();
