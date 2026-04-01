/*  templates-extra.js  ──  30 additional Maths Templates
 *  ─────────────────────────────────────────────────────
 *  Each entry: { name, category, renderConfig(c), readConfig(), generateSVG(s) }
 *  Meant to be merged into the main template registry.
 */

/* ── Helpers ───────────────────────────────────────────── */

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function makeSVG(w, h) {
  const svg = svgEl('svg', {
    xmlns: SVG_NS,
    width: String(w),
    height: String(h),
    viewBox: `0 0 ${w} ${h}`,
  });
  svg.appendChild(svgEl('rect', { x: '0', y: '0', width: String(w), height: String(h), fill: '#fff' }));
  return svg;
}

function svgText(x, y, txt, size = 12, anchor = 'middle', opts = {}) {
  const el = svgEl('text', {
    x: String(x), y: String(y),
    'font-size': String(size),
    'font-family': 'Inter, sans-serif',
    'text-anchor': anchor,
    fill: opts.fill || '#333',
    ...opts,
  });
  el.textContent = txt;
  return el;
}

function degToRad(d) { return d * Math.PI / 180; }
function radToDeg(r) { return r * 180 / Math.PI; }

/* isometric helpers */
const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);
function isoProject(x, y, z) {
  return {
    x: (x - y) * COS30,
    y: -(x + y) * SIN30 - z,
  };
}

/* ── Config-UI building helpers ────────────────────────── */

function row(...children) {
  const d = document.createElement('div');
  d.className = 'cfg-row';
  children.forEach(c => d.appendChild(c));
  return d;
}

function field(label, input) {
  const d = document.createElement('div');
  d.className = 'cfg-field';
  const lbl = document.createElement('div');
  lbl.className = 'cfg-field-label';
  lbl.textContent = label;
  d.appendChild(lbl);
  d.appendChild(input);
  return d;
}

function numberInput(id, val, min, max, step) {
  const inp = document.createElement('input');
  inp.type = 'number';
  inp.className = 'cfg-input cfg-input-sm';
  inp.id = id;
  inp.value = val;
  if (min !== undefined) inp.min = min;
  if (max !== undefined) inp.max = max;
  if (step !== undefined) inp.step = step;
  return inp;
}

function textInput(id, val, placeholder) {
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'cfg-input';
  inp.id = id;
  inp.value = val || '';
  if (placeholder) inp.placeholder = placeholder;
  return inp;
}

function checkbox(id, label, checked) {
  const lbl = document.createElement('label');
  lbl.className = 'cfg-check';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.id = id;
  cb.checked = !!checked;
  const sp = document.createElement('span');
  sp.textContent = label;
  lbl.appendChild(cb);
  lbl.appendChild(sp);
  return lbl;
}

function select(id, options) {
  const sel = document.createElement('select');
  sel.className = 'cfg-select';
  sel.id = id;
  options.forEach(([val, text]) => {
    const o = document.createElement('option');
    o.value = val;
    o.textContent = text;
    sel.appendChild(o);
  });
  return sel;
}

function colourSwatch(id, val) {
  const wrap = document.createElement('label');
  wrap.className = 'cfg-swatch';
  const inp = document.createElement('input');
  inp.type = 'color';
  inp.id = id;
  inp.value = val || '#4262ff';
  const dot = document.createElement('span');
  dot.className = 'cfg-swatch-dot';
  dot.style.background = inp.value;
  inp.addEventListener('input', () => { dot.style.background = inp.value; });
  wrap.appendChild(inp);
  wrap.appendChild(dot);
  return wrap;
}

function divider() {
  const hr = document.createElement('hr');
  hr.className = 'cfg-divider';
  return hr;
}

function sectionLabel(txt) {
  const lbl = document.createElement('div');
  lbl.className = 'cfg-label';
  lbl.textContent = txt;
  return lbl;
}

function val(id) {
  const el = document.getElementById(id);
  if (!el) return '';
  if (el.type === 'checkbox') return el.checked;
  if (el.type === 'number') return parseFloat(el.value) || 0;
  return el.value;
}

/* ── Helpers for drawing arcs, arrows etc. ─────────────── */

function describeArc(cx, cy, r, startDeg, endDeg) {
  const s = degToRad(startDeg);
  const e = degToRad(endDeg);
  const sx = cx + r * Math.cos(s);
  const sy = cy + r * Math.sin(s);
  const ex = cx + r * Math.cos(e);
  const ey = cy + r * Math.sin(e);
  const largeArc = (endDeg - startDeg <= 180) ? 0 : 1;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`;
}

function arrowHead(svg, x, y, angle, size = 8, colour = '#333') {
  const a1 = angle + Math.PI * 0.85;
  const a2 = angle - Math.PI * 0.85;
  const d = `M ${x} ${y} L ${x + size * Math.cos(a1)} ${y + size * Math.sin(a1)} L ${x + size * Math.cos(a2)} ${y + size * Math.sin(a2)} Z`;
  svg.appendChild(svgEl('path', { d, fill: colour, stroke: 'none' }));
}

function drawAngleArc(svg, cx, cy, startDeg, endDeg, r, label, labelSize) {
  const path = svgEl('path', {
    d: describeArc(cx, cy, r, startDeg, endDeg),
    fill: 'none', stroke: '#e63946', 'stroke-width': '1.5',
  });
  svg.appendChild(path);
  if (label) {
    const midDeg = (startDeg + endDeg) / 2;
    const lr = r + (labelSize || 12);
    const lx = cx + lr * Math.cos(degToRad(midDeg));
    const ly = cy + lr * Math.sin(degToRad(midDeg));
    svg.appendChild(svgText(lx, ly, label, labelSize || 11, 'middle', { fill: '#e63946' }));
  }
}

/* ───────────────────────────────────────────────────────
   TEMPLATES
   ─────────────────────────────────────────────────────── */

const extraTemplates = {};

/* ================================================================
   1. REGULAR POLYGON
   ================================================================ */
extraTemplates['regular-polygon'] = {
  name: 'Regular Polygon',
  category: '2D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Polygon'));
    c.appendChild(row(
      field('Sides', numberInput('rp-sides', 6, 3, 12, 1)),
      field('Side length', numberInput('rp-side', 100, 20, 300, 5)),
    ));
    c.appendChild(row(
      checkbox('rp-angles', 'Show angles', false),
      checkbox('rp-diags', 'Show diagonals', false),
    ));
    c.appendChild(row(
      checkbox('rp-labels', 'Side labels', true),
    ));
    c.appendChild(sectionLabel('Colours'));
    c.appendChild(row(
      field('Fill', colourSwatch('rp-fill', '#dbe9ff')),
      field('Stroke', colourSwatch('rp-stroke', '#2b2d42')),
    ));
  },
  readConfig() {
    return {
      sides: val('rp-sides') || 6,
      sideLen: val('rp-side') || 100,
      showAngles: val('rp-angles'),
      showDiags: val('rp-diags'),
      showLabels: val('rp-labels'),
      fill: val('rp-fill') || '#dbe9ff',
      stroke: val('rp-stroke') || '#2b2d42',
    };
  },
  generateSVG(s) {
    const n = Math.max(3, Math.min(12, Math.round(s.sides)));
    const R = s.sideLen / (2 * Math.sin(Math.PI / n));
    const pad = 60;
    const W = 2 * R + pad * 2;
    const H = 2 * R + pad * 2;
    const svg = makeSVG(W, H);
    const cx = W / 2, cy = H / 2;

    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
      pts.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    }

    /* diagonals */
    if (s.showDiags) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 2; j < n; j++) {
          if (j === i + n - 1 && i === 0) continue; // skip adjacent
          svg.appendChild(svgEl('line', {
            x1: pts[i].x, y1: pts[i].y, x2: pts[j].x, y2: pts[j].y,
            stroke: '#adb5bd', 'stroke-width': '0.8', 'stroke-dasharray': '4,3',
          }));
        }
      }
    }

    /* polygon fill + stroke */
    const polyStr = pts.map(p => `${p.x},${p.y}`).join(' ');
    svg.appendChild(svgEl('polygon', {
      points: polyStr, fill: s.fill, stroke: s.stroke, 'stroke-width': '2',
    }));

    /* vertices */
    pts.forEach(p => {
      svg.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: '3', fill: s.stroke }));
    });

    /* side labels */
    if (s.showLabels) {
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const mx = (pts[i].x + pts[j].x) / 2;
        const my = (pts[i].y + pts[j].y) / 2;
        const dx = pts[j].x - pts[i].x;
        const dy = pts[j].y - pts[i].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len * 14;
        const ny = dx / len * 14;
        svg.appendChild(svgText(mx + nx, my + ny, String(Math.round(s.sideLen)), 11, 'middle', { fill: '#555' }));
      }
    }

    /* interior angle labels */
    if (s.showAngles) {
      const intAngle = ((n - 2) * 180) / n;
      for (let i = 0; i < n; i++) {
        const prev = (i - 1 + n) % n;
        const next = (i + 1) % n;
        const a1 = Math.atan2(pts[prev].y - pts[i].y, pts[prev].x - pts[i].x);
        const a2 = Math.atan2(pts[next].y - pts[i].y, pts[next].x - pts[i].x);
        let mid = (a1 + a2) / 2;
        /* ensure mid points inward */
        const testX = pts[i].x + 10 * Math.cos(mid);
        const testY = pts[i].y + 10 * Math.sin(mid);
        const toCx = Math.sqrt((testX - cx) ** 2 + (testY - cy) ** 2);
        const fromCx = Math.sqrt((pts[i].x - cx) ** 2 + (pts[i].y - cy) ** 2);
        if (toCx > fromCx) mid += Math.PI;
        const lr = 24;
        const lx = pts[i].x + lr * Math.cos(mid);
        const ly = pts[i].y + lr * Math.sin(mid);
        svg.appendChild(svgText(lx, ly, `${Math.round(intAngle)}°`, 9, 'middle', { fill: '#e63946' }));
      }
    }

    return svg;
  },
};

/* ================================================================
   2. COMPOUND SHAPE (L-shape)
   ================================================================ */
extraTemplates['compound-shape'] = {
  name: 'Compound Shape (L)',
  category: '2D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Dimensions'));
    c.appendChild(row(
      field('Width 1', numberInput('cs-w1', 120, 30, 400, 5)),
      field('Height 1', numberInput('cs-h1', 180, 30, 400, 5)),
    ));
    c.appendChild(row(
      field('Width 2', numberInput('cs-w2', 200, 30, 400, 5)),
      field('Height 2', numberInput('cs-h2', 80, 30, 400, 5)),
    ));
    c.appendChild(row(
      checkbox('cs-dims', 'Show dimensions', true),
    ));
    c.appendChild(row(field('Fill', colourSwatch('cs-fill', '#d4edda'))));
  },
  readConfig() {
    return {
      w1: val('cs-w1') || 120, h1: val('cs-h1') || 180,
      w2: val('cs-w2') || 200, h2: val('cs-h2') || 80,
      showDims: val('cs-dims'), fill: val('cs-fill') || '#d4edda',
    };
  },
  generateSVG(s) {
    const pad = 50;
    const W = Math.max(s.w1, s.w2) + pad * 2 + 60;
    const H = s.h1 + pad * 2 + 40;
    const svg = makeSVG(W, H);
    const ox = pad + 30, oy = pad;

    /* L-shape: tall left column + bottom extension right */
    const path = `M ${ox} ${oy}
      L ${ox + s.w1} ${oy}
      L ${ox + s.w1} ${oy + s.h1 - s.h2}
      L ${ox + s.w2} ${oy + s.h1 - s.h2}
      L ${ox + s.w2} ${oy + s.h1}
      L ${ox} ${oy + s.h1} Z`;

    svg.appendChild(svgEl('path', {
      d: path, fill: s.fill, stroke: '#2b2d42', 'stroke-width': '2',
    }));

    if (s.showDims) {
      const arr = [
        /* left side full height */
        { x1: ox - 20, y1: oy, x2: ox - 20, y2: oy + s.h1, label: String(s.h1) },
        /* top width */
        { x1: ox, y1: oy - 16, x2: ox + s.w1, y2: oy - 16, label: String(s.w1) },
        /* bottom full width */
        { x1: ox, y1: oy + s.h1 + 16, x2: ox + s.w2, y2: oy + s.h1 + 16, label: String(s.w2) },
        /* right side h2 */
        { x1: ox + s.w2 + 20, y1: oy + s.h1 - s.h2, x2: ox + s.w2 + 20, y2: oy + s.h1, label: String(s.h2) },
      ];
      arr.forEach(d => {
        svg.appendChild(svgEl('line', {
          x1: d.x1, y1: d.y1, x2: d.x2, y2: d.y2,
          stroke: '#e63946', 'stroke-width': '1', 'marker-start': 'url(#cs-arr)', 'marker-end': 'url(#cs-arr)',
        }));
        const mx = (d.x1 + d.x2) / 2;
        const my = (d.y1 + d.y2) / 2;
        const isVert = Math.abs(d.x1 - d.x2) < 1;
        svg.appendChild(svgText(mx + (isVert ? -12 : 0), my + (isVert ? 0 : -6), d.label, 11, 'middle', { fill: '#e63946', 'font-weight': '600' }));
      });

      /* arrowhead marker */
      const defs = svgEl('defs', {});
      const marker = svgEl('marker', {
        id: 'cs-arr', markerWidth: '6', markerHeight: '6', refX: '3', refY: '3', orient: 'auto',
      });
      marker.appendChild(svgEl('path', { d: 'M0,0 L6,3 L0,6 Z', fill: '#e63946' }));
      defs.appendChild(marker);
      svg.insertBefore(defs, svg.firstChild.nextSibling);
    }

    return svg;
  },
};

/* ================================================================
   3. CIRCLE SECTOR
   ================================================================ */
extraTemplates['circle-sector'] = {
  name: 'Circle Sector',
  category: '2D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Sector'));
    c.appendChild(row(
      field('Angle (°)', numberInput('sec-angle', 90, 1, 360, 1)),
      field('Radius', numberInput('sec-r', 120, 30, 250, 5)),
    ));
    c.appendChild(row(
      checkbox('sec-lbl', 'Show angle label', true),
      checkbox('sec-arc', 'Show arc length', false),
    ));
    c.appendChild(row(field('Fill', colourSwatch('sec-fill', '#cce5ff'))));
  },
  readConfig() {
    return {
      angle: val('sec-angle') || 90,
      radius: val('sec-r') || 120,
      showLabel: val('sec-lbl'),
      showArc: val('sec-arc'),
      fill: val('sec-fill') || '#cce5ff',
    };
  },
  generateSVG(s) {
    const pad = 60;
    const W = 2 * s.radius + pad * 2;
    const H = 2 * s.radius + pad * 2;
    const svg = makeSVG(W, H);
    const cx = W / 2, cy = H / 2;

    const startAngle = -s.angle / 2;
    const endAngle = s.angle / 2;
    const sa = degToRad(startAngle - 90);
    const ea = degToRad(endAngle - 90);
    const sx = cx + s.radius * Math.cos(sa);
    const sy = cy + s.radius * Math.sin(sa);
    const ex = cx + s.radius * Math.cos(ea);
    const ey = cy + s.radius * Math.sin(ea);
    const large = s.angle > 180 ? 1 : 0;

    const d = `M ${cx} ${cy} L ${sx} ${sy} A ${s.radius} ${s.radius} 0 ${large} 1 ${ex} ${ey} Z`;
    svg.appendChild(svgEl('path', { d, fill: s.fill, stroke: '#2b2d42', 'stroke-width': '2' }));

    /* angle arc */
    const arcR = Math.min(30, s.radius * 0.25);
    const arcPath = describeArc(cx, cy, arcR, startAngle - 90, endAngle - 90);
    svg.appendChild(svgEl('path', { d: arcPath, fill: 'none', stroke: '#e63946', 'stroke-width': '1.5' }));

    if (s.showLabel) {
      const midA = degToRad(-90);
      const lr = arcR + 14;
      svg.appendChild(svgText(cx + lr * Math.cos(midA), cy + lr * Math.sin(midA), `${Math.round(s.angle)}°`, 12, 'middle', { fill: '#e63946', 'font-weight': '600' }));
    }

    if (s.showArc) {
      const arcLen = (s.angle / 360) * 2 * Math.PI * s.radius;
      const midA = degToRad(-90);
      const lr = s.radius + 18;
      svg.appendChild(svgText(cx + lr * Math.cos(midA), cy + lr * Math.sin(midA), `arc = ${arcLen.toFixed(1)}`, 10, 'middle', { fill: '#555' }));
    }

    /* radii labels */
    const midSa = (sa + degToRad(-90)) / 2 || sa;
    svg.appendChild(svgText((cx + sx) / 2 - 14, (cy + sy) / 2, `r=${s.radius}`, 10, 'middle', { fill: '#555' }));

    return svg;
  },
};

/* ================================================================
   4. PARALLEL LINES + TRANSVERSAL
   ================================================================ */
extraTemplates['parallel-transversal'] = {
  name: 'Parallel Lines + Transversal',
  category: '2D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Options'));
    c.appendChild(row(
      checkbox('pt-labels', 'Show angle labels', true),
    ));
    c.appendChild(row(
      field('Label style', select('pt-style', [['letters', 'Letters (a, b, c...)'], ['values', 'Angle values']])),
    ));
    c.appendChild(row(
      field('Transversal angle', numberInput('pt-angle', 65, 20, 160, 1)),
    ));
  },
  readConfig() {
    return {
      showLabels: val('pt-labels'),
      style: val('pt-style') || 'letters',
      angle: val('pt-angle') || 65,
    };
  },
  generateSVG(s) {
    const W = 480, H = 360;
    const svg = makeSVG(W, H);

    const y1 = 110, y2 = 250;
    const lineLen = 400;
    const ox = 40;

    /* parallel lines */
    svg.appendChild(svgEl('line', { x1: ox, y1, x2: ox + lineLen, y2: y1, stroke: '#2b2d42', 'stroke-width': '2' }));
    svg.appendChild(svgEl('line', { x1: ox, y1: y2, x2: ox + lineLen, y2: y2, stroke: '#2b2d42', 'stroke-width': '2' }));

    /* parallel arrows */
    [y1, y2].forEach(y => {
      svg.appendChild(svgEl('polygon', {
        points: `${ox + lineLen / 2 - 6},${y - 5} ${ox + lineLen / 2 + 6},${y} ${ox + lineLen / 2 - 6},${y + 5}`,
        fill: '#2b2d42',
      }));
    });

    /* transversal */
    const a = degToRad(s.angle);
    const tLen = 300;
    const tCx = W / 2;
    const dx = tLen / 2 * Math.cos(a);
    const dy = -tLen / 2 * Math.sin(a);
    /* find intersections */
    const slope = -Math.tan(a);
    /* line through centre: y - H/2 = slope*(x - tCx) */
    /* at y1: x = tCx + (y1 - H/2)/slope */
    const ix1 = tCx + (y1 - H / 2) / slope;
    const ix2 = tCx + (y2 - H / 2) / slope;

    const tExtend = 40;
    const tx1 = ix1 - tExtend * Math.cos(a);
    const ty1 = y1 + tExtend * Math.sin(a);
    const tx2 = ix2 + tExtend * Math.cos(a);
    const ty2 = y2 - tExtend * Math.sin(a);

    svg.appendChild(svgEl('line', { x1: tx1, y1: ty1, x2: tx2, y2: ty2, stroke: '#4262ff', 'stroke-width': '2' }));

    /* dots at intersections */
    svg.appendChild(svgEl('circle', { cx: ix1, cy: y1, r: '4', fill: '#4262ff' }));
    svg.appendChild(svgEl('circle', { cx: ix2, cy: y2, r: '4', fill: '#4262ff' }));

    if (s.showLabels) {
      const ang = Math.round(s.angle);
      const co = 180 - ang;
      const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const vals = [ang, co, co, ang, ang, co, co, ang];

      /* top intersection: angles a,b,c,d */
      const positions = [
        { x: ix1 - 20, y: y1 - 10 }, /* a - top-left */
        { x: ix1 + 20, y: y1 - 10 }, /* b - top-right */
        { x: ix1 + 20, y: y1 + 16 }, /* c - bottom-right */
        { x: ix1 - 20, y: y1 + 16 }, /* d - bottom-left */
        { x: ix2 - 20, y: y2 - 10 }, /* e - top-left */
        { x: ix2 + 20, y: y2 - 10 }, /* f - top-right */
        { x: ix2 + 20, y: y2 + 16 }, /* g - bottom-right */
        { x: ix2 - 20, y: y2 + 16 }, /* h - bottom-left */
      ];

      positions.forEach((p, i) => {
        const txt = s.style === 'letters' ? letters[i] : `${vals[i]}°`;
        svg.appendChild(svgText(p.x, p.y, txt, 11, 'middle', { fill: '#e63946', 'font-weight': '600' }));
      });

      /* annotations */
      const annotations = [
        { txt: `Alternate: ${s.style === 'letters' ? 'a = e' : `${ang}°`}`, y: H - 50 },
        { txt: `Corresponding: ${s.style === 'letters' ? 'a = e, b = f' : `${ang}°, ${co}°`}`, y: H - 34 },
        { txt: `Co-interior: ${s.style === 'letters' ? 'c + e = 180°' : `${co}° + ${ang}° = 180°`}`, y: H - 18 },
      ];
      annotations.forEach(a => {
        svg.appendChild(svgText(W / 2, a.y, a.txt, 10, 'middle', { fill: '#555' }));
      });
    }

    return svg;
  },
};

/* ================================================================
   5. CIRCLE THEOREMS
   ================================================================ */
extraTemplates['circle-theorems'] = {
  name: 'Circle Theorems',
  category: '2D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Theorem'));
    c.appendChild(row(
      field('Type', select('ct-type', [
        ['inscribed_angle', 'Inscribed Angle (2x)'],
        ['tangent_radius', 'Tangent-Radius (90°)'],
        ['angle_in_semicircle', 'Angle in Semicircle (90°)'],
        ['cyclic_quadrilateral', 'Cyclic Quadrilateral (180°)'],
        ['tangent_chord', 'Tangent-Chord (Alt. Segment)'],
        ['alternate_segment', 'Alternate Segment'],
      ])),
    ));
  },
  readConfig() {
    return { type: val('ct-type') || 'inscribed_angle' };
  },
  generateSVG(s) {
    const W = 460, H = 420;
    const svg = makeSVG(W, H);
    const cx = W / 2, cy = 200, R = 140;

    /* circle */
    svg.appendChild(svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: '#2b2d42', 'stroke-width': '2' }));
    svg.appendChild(svgEl('circle', { cx, cy, r: '3', fill: '#2b2d42' }));

    const pt = (deg) => ({
      x: cx + R * Math.cos(degToRad(deg)),
      y: cy + R * Math.sin(degToRad(deg)),
    });

    const line = (p1, p2, color, width) => svgEl('line', {
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
      stroke: color || '#4262ff', 'stroke-width': width || '2',
    });

    const dot = (p, label, offX, offY) => {
      svg.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: '4', fill: '#4262ff' }));
      if (label) svg.appendChild(svgText(p.x + (offX || 0), p.y + (offY || 0), label, 13, 'middle', { fill: '#333', 'font-weight': '700' }));
    };

    let title = '';

    if (s.type === 'inscribed_angle') {
      const A = pt(-140), B = pt(-40), C = pt(90);
      const O = { x: cx, y: cy };
      svg.appendChild(line(A, C, '#4262ff'));
      svg.appendChild(line(B, C, '#4262ff'));
      svg.appendChild(line(A, O, '#e63946'));
      svg.appendChild(line(B, O, '#e63946'));
      dot(A, 'A', -14, 0);
      dot(B, 'B', 14, 0);
      dot(C, 'C', 0, 18);
      svg.appendChild(svgText(cx, cy + 20, '2x', 14, 'middle', { fill: '#e63946', 'font-weight': '700' }));
      svg.appendChild(svgText(C.x + 6, C.y - 10, 'x', 14, 'start', { fill: '#4262ff', 'font-weight': '700' }));
      title = 'Angle at centre = 2 x angle at circumference';
    }

    if (s.type === 'tangent_radius') {
      const P = pt(0);
      svg.appendChild(line({ x: cx, y: cy }, P, '#e63946'));
      /* tangent line at P (perpendicular to radius) */
      const tangLen = 140;
      const t1 = { x: P.x, y: P.y - tangLen };
      const t2 = { x: P.x, y: P.y + tangLen };
      svg.appendChild(line(t1, t2, '#4262ff'));
      dot(P, 'P', 14, 0);
      /* right angle square */
      const sq = 12;
      svg.appendChild(svgEl('path', {
        d: `M ${P.x - sq} ${P.y - sq} L ${P.x - sq} ${P.y} L ${P.x} ${P.y}`,
        fill: 'none', stroke: '#e63946', 'stroke-width': '1.5',
      }));
      svg.appendChild(svgText(cx - 10, cy + 5, 'O', 13, 'middle', { fill: '#333', 'font-weight': '700' }));
      title = 'Tangent is perpendicular to radius at point of contact';
    }

    if (s.type === 'angle_in_semicircle') {
      const A = pt(180), B = pt(0), C = pt(-70);
      /* diameter */
      svg.appendChild(line(A, B, '#adb5bd', '1.5'));
      svg.appendChild(line(A, C, '#4262ff'));
      svg.appendChild(line(B, C, '#4262ff'));
      dot(A, 'A', -14, 0);
      dot(B, 'B', 14, 0);
      dot(C, 'C', 0, -14);
      /* right angle at C */
      const sq = 10;
      const dx1 = (A.x - C.x), dy1 = (A.y - C.y);
      const dx2 = (B.x - C.x), dy2 = (B.y - C.y);
      const l1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const l2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      const u1 = { x: dx1 / l1 * sq, y: dy1 / l1 * sq };
      const u2 = { x: dx2 / l2 * sq, y: dy2 / l2 * sq };
      svg.appendChild(svgEl('path', {
        d: `M ${C.x + u1.x} ${C.y + u1.y} L ${C.x + u1.x + u2.x} ${C.y + u1.y + u2.y} L ${C.x + u2.x} ${C.y + u2.y}`,
        fill: 'none', stroke: '#e63946', 'stroke-width': '1.5',
      }));
      title = 'Angle in a semicircle = 90°';
    }

    if (s.type === 'cyclic_quadrilateral') {
      const A = pt(-120), B = pt(-30), C = pt(60), D = pt(160);
      svg.appendChild(line(A, B, '#4262ff'));
      svg.appendChild(line(B, C, '#4262ff'));
      svg.appendChild(line(C, D, '#4262ff'));
      svg.appendChild(line(D, A, '#4262ff'));
      dot(A, 'A', -14, -6);
      dot(B, 'B', 14, -6);
      dot(C, 'C', 14, 12);
      dot(D, 'D', -14, 12);
      svg.appendChild(svgText(A.x + 18, A.y + 16, 'x', 13, 'middle', { fill: '#e63946', 'font-weight': '700' }));
      svg.appendChild(svgText(C.x - 18, C.y - 10, '180-x', 11, 'middle', { fill: '#e63946', 'font-weight': '700' }));
      title = 'Opposite angles in a cyclic quadrilateral sum to 180°';
    }

    if (s.type === 'tangent_chord') {
      const P = pt(-30);
      const Q = pt(160);
      svg.appendChild(line(P, Q, '#4262ff'));
      dot(P, 'P', 14, -8);
      dot(Q, 'Q', -14, 10);
      /* tangent at P */
      const tAngle = degToRad(-30 + 90);
      const tLen = 120;
      const t1 = { x: P.x + tLen * Math.cos(tAngle), y: P.y + tLen * Math.sin(tAngle) };
      const t2 = { x: P.x - tLen * Math.cos(tAngle), y: P.y - tLen * Math.sin(tAngle) };
      svg.appendChild(line(t1, t2, '#e63946', '1.5'));
      svg.appendChild(svgText(t2.x + 4, t2.y + 14, 'tangent', 10, 'start', { fill: '#e63946' }));
      /* angle arc */
      drawAngleArc(svg, P.x, P.y, radToDeg(Math.atan2(Q.y - P.y, Q.x - P.x)), radToDeg(tAngle), 25, 'x', 10);
      title = 'Angle between tangent and chord = inscribed angle in alternate segment';
    }

    if (s.type === 'alternate_segment') {
      const P = pt(0);
      const A = pt(-100);
      const B = pt(200);
      svg.appendChild(line(P, A, '#4262ff'));
      svg.appendChild(line(P, B, '#4262ff'));
      svg.appendChild(line(A, B, '#4262ff', '1'));
      dot(P, 'P', 14, 0);
      dot(A, 'A', -10, -12);
      dot(B, 'B', -10, 14);
      /* tangent at P */
      const tAngle = degToRad(90);
      const tLen = 140;
      const t1 = { x: P.x, y: P.y - tLen };
      const t2 = { x: P.x, y: P.y + tLen };
      svg.appendChild(line(t1, t2, '#e63946', '1.5'));
      svg.appendChild(svgText(P.x + 14, P.y - 40, 'x', 13, 'start', { fill: '#e63946', 'font-weight': '700' }));
      svg.appendChild(svgText(A.x + 20, A.y + 20, 'x', 13, 'middle', { fill: '#e63946', 'font-weight': '700' }));
      title = 'Alternate segment theorem: angle between tangent and chord = angle in alternate segment';
    }

    /* title */
    svg.appendChild(svgText(W / 2, H - 16, title, 11, 'middle', { fill: '#555', 'font-style': 'italic' }));

    return svg;
  },
};

/* ================================================================
   6. TRIGONOMETRY TRIANGLE
   ================================================================ */
extraTemplates['trig-triangle'] = {
  name: 'Trigonometry Triangle',
  category: '2D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Triangle'));
    c.appendChild(row(
      field('Label style', select('tt-labels', [['oah', 'O / A / H'], ['values', 'Side values']])),
      field('Angle label', textInput('tt-angle', 'θ')),
    ));
    c.appendChild(row(
      checkbox('tt-soh', 'Show SOH CAH TOA', true),
    ));
  },
  readConfig() {
    return {
      labels: val('tt-labels') || 'oah',
      angle: val('tt-angle') || 'θ',
      showSOH: val('tt-soh'),
    };
  },
  generateSVG(s) {
    const W = 460, H = 380;
    const svg = makeSVG(W, H);

    const ax = 80, ay = 280;
    const bx = 340, by = 280;
    const cx2 = 340, cy2 = 80;

    /* triangle */
    svg.appendChild(svgEl('polygon', {
      points: `${ax},${ay} ${bx},${by} ${cx2},${cy2}`,
      fill: '#eef2ff', stroke: '#2b2d42', 'stroke-width': '2',
    }));

    /* right angle square at B */
    const sq = 14;
    svg.appendChild(svgEl('path', {
      d: `M ${bx - sq} ${by} L ${bx - sq} ${by - sq} L ${bx} ${by - sq}`,
      fill: 'none', stroke: '#e63946', 'stroke-width': '1.5',
    }));

    /* angle arc at A */
    drawAngleArc(svg, ax, ay, -42, 0, 35, s.angle, 13);

    /* labels */
    if (s.labels === 'oah') {
      svg.appendChild(svgText((bx + cx2) / 2 + 20, (by + cy2) / 2, 'Opposite (O)', 12, 'start', { fill: '#e63946', 'font-weight': '600' }));
      svg.appendChild(svgText((ax + bx) / 2, ay + 20, 'Adjacent (A)', 12, 'middle', { fill: '#4262ff', 'font-weight': '600' }));
      svg.appendChild(svgText((ax + cx2) / 2 - 30, (ay + cy2) / 2, 'Hypotenuse (H)', 12, 'end', { fill: '#2b2d42', 'font-weight': '600' }));
    } else {
      const adj = bx - ax;
      const opp = by - cy2;
      const hyp = Math.sqrt(adj * adj + opp * opp);
      svg.appendChild(svgText((bx + cx2) / 2 + 14, (by + cy2) / 2, String(Math.round(opp)), 12, 'start', { fill: '#e63946' }));
      svg.appendChild(svgText((ax + bx) / 2, ay + 18, String(Math.round(adj)), 12, 'middle', { fill: '#4262ff' }));
      svg.appendChild(svgText((ax + cx2) / 2 - 14, (ay + cy2) / 2, String(Math.round(hyp)), 12, 'end', { fill: '#2b2d42' }));
    }

    /* SOH CAH TOA box */
    if (s.showSOH) {
      const bx2 = 20, by2 = 310;
      svg.appendChild(svgEl('rect', {
        x: bx2, y: by2, width: 420, height: 50, rx: '8',
        fill: '#f8f9fa', stroke: '#d0d4dc', 'stroke-width': '1',
      }));
      const items = [
        { label: 'SOH', desc: `sin ${s.angle} = O / H`, x: bx2 + 70, color: '#e63946' },
        { label: 'CAH', desc: `cos ${s.angle} = A / H`, x: bx2 + 210, color: '#4262ff' },
        { label: 'TOA', desc: `tan ${s.angle} = O / A`, x: bx2 + 350, color: '#2b2d42' },
      ];
      items.forEach(it => {
        svg.appendChild(svgText(it.x, by2 + 20, it.label, 14, 'middle', { fill: it.color, 'font-weight': '800' }));
        svg.appendChild(svgText(it.x, by2 + 38, it.desc, 11, 'middle', { fill: '#666' }));
      });
    }

    return svg;
  },
};

/* ================================================================
   7. BEARINGS DIAGRAM
   ================================================================ */
extraTemplates['bearings-diagram'] = {
  name: 'Bearings Diagram',
  category: '2D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Bearing'));
    c.appendChild(row(
      field('Angle (°)', numberInput('bd-angle', 135, 0, 360, 1)),
    ));
    c.appendChild(row(
      checkbox('bd-north', 'Show North', true),
      checkbox('bd-arc', 'Show angle arc', true),
    ));
    c.appendChild(row(
      field('Label', textInput('bd-label', 'B')),
    ));
  },
  readConfig() {
    return {
      angle: val('bd-angle') || 135,
      showNorth: val('bd-north'),
      showArc: val('bd-arc'),
      label: val('bd-label') || 'B',
    };
  },
  generateSVG(s) {
    const W = 400, H = 400;
    const svg = makeSVG(W, H);
    const cx = W / 2, cy = H / 2;
    const R = 140;

    /* North arrow */
    if (s.showNorth) {
      svg.appendChild(svgEl('line', {
        x1: cx, y1: cy, x2: cx, y2: cy - R - 30,
        stroke: '#2b2d42', 'stroke-width': '2', 'stroke-dasharray': '6,3',
      }));
      svg.appendChild(svgText(cx + 8, cy - R - 32, 'N', 16, 'start', { fill: '#2b2d42', 'font-weight': '800' }));
      arrowHead(svg, cx, cy - R - 30, -Math.PI / 2, 10, '#2b2d42');
    }

    /* bearing line */
    const bearingRad = degToRad(s.angle);
    const bx = cx + R * Math.sin(bearingRad);
    const by = cy - R * Math.cos(bearingRad);
    svg.appendChild(svgEl('line', {
      x1: cx, y1: cy, x2: bx, y2: by,
      stroke: '#4262ff', 'stroke-width': '2.5',
    }));
    svg.appendChild(svgEl('circle', { cx, cy, r: '4', fill: '#2b2d42' }));
    svg.appendChild(svgEl('circle', { cx: bx, cy: by, r: '5', fill: '#4262ff' }));
    svg.appendChild(svgText(bx + 12, by + 4, s.label, 15, 'start', { fill: '#4262ff', 'font-weight': '700' }));

    /* angle arc (measured clockwise from North) */
    if (s.showArc) {
      const arcR = 45;
      /* North is -90 in standard, bearing goes clockwise */
      const startDeg = -90; /* North in SVG coords */
      const endDeg = -90 + s.angle;
      const arcPath = describeArc(cx, cy, arcR, startDeg, endDeg);
      svg.appendChild(svgEl('path', { d: arcPath, fill: 'none', stroke: '#e63946', 'stroke-width': '1.5' }));
      /* label */
      const midDeg = startDeg + s.angle / 2;
      const lr = arcR + 16;
      const lx = cx + lr * Math.cos(degToRad(midDeg));
      const ly = cy + lr * Math.sin(degToRad(midDeg));
      const bearStr = String(s.angle).padStart(3, '0') + '°';
      svg.appendChild(svgText(lx, ly, bearStr, 13, 'middle', { fill: '#e63946', 'font-weight': '700' }));
    }

    return svg;
  },
};

/* ================================================================
   8. CUBE (3D isometric)
   ================================================================ */
extraTemplates['cube'] = {
  name: 'Cube',
  category: '3D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Cube'));
    c.appendChild(row(
      field('Side length', numberInput('cu-side', 120, 30, 250, 5)),
    ));
    c.appendChild(row(
      checkbox('cu-labels', 'Show labels', true),
      checkbox('cu-hidden', 'Show hidden edges', true),
    ));
    c.appendChild(row(field('Fill', colourSwatch('cu-fill', '#cce5ff'))));
  },
  readConfig() {
    return {
      side: val('cu-side') || 120,
      showLabels: val('cu-labels'),
      showHidden: val('cu-hidden'),
      fill: val('cu-fill') || '#cce5ff',
    };
  },
  generateSVG(s) {
    const a = s.side;
    return draw3DBox(a, a, a, s.showLabels, s.showHidden, s.fill, [a, a, a]);
  },
};

/* ================================================================
   9. CUBOID (3D isometric)
   ================================================================ */
extraTemplates['cuboid'] = {
  name: 'Cuboid',
  category: '3D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Cuboid'));
    c.appendChild(row(
      field('Length', numberInput('cb-l', 160, 30, 300, 5)),
      field('Width', numberInput('cb-w', 80, 30, 300, 5)),
      field('Height', numberInput('cb-h', 100, 30, 300, 5)),
    ));
    c.appendChild(row(
      checkbox('cb-labels', 'Show labels', true),
      checkbox('cb-hidden', 'Show hidden edges', true),
    ));
    c.appendChild(row(field('Fill', colourSwatch('cb-fill', '#d4edda'))));
  },
  readConfig() {
    return {
      length: val('cb-l') || 160, width: val('cb-w') || 80, height: val('cb-h') || 100,
      showLabels: val('cb-labels'), showHidden: val('cb-hidden'),
      fill: val('cb-fill') || '#d4edda',
    };
  },
  generateSVG(s) {
    return draw3DBox(s.length, s.width, s.height, s.showLabels, s.showHidden, s.fill, [s.length, s.width, s.height]);
  },
};

/* shared box drawer for cube / cuboid */
function draw3DBox(lenX, lenY, height, showLabels, showHidden, fill, dims) {
  const pad = 80;
  /* compute all 8 corners in iso */
  const corners = [
    [0, 0, 0], [lenX, 0, 0], [lenX, lenY, 0], [0, lenY, 0],
    [0, 0, height], [lenX, 0, height], [lenX, lenY, height], [0, lenY, height],
  ].map(([x, y, z]) => isoProject(x, y, z));

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  corners.forEach(p => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  });

  const W = maxX - minX + pad * 2;
  const H = maxY - minY + pad * 2;
  const offX = -minX + pad;
  const offY = -minY + pad;
  const svg = makeSVG(Math.round(W), Math.round(H));

  const p = (i) => ({ x: corners[i].x + offX, y: corners[i].y + offY });

  /* --- faces --- */
  /* parse fill to lighter/darker variants */
  const topFill = fill;
  const rightFill = adjustBrightness(fill, -20);
  const leftFill = adjustBrightness(fill, -40);

  /* top face: 4,5,6,7 */
  svg.appendChild(svgEl('polygon', {
    points: [p(4), p(5), p(6), p(7)].map(pp => `${pp.x},${pp.y}`).join(' '),
    fill: topFill, stroke: '#2b2d42', 'stroke-width': '2',
  }));
  /* right face: 1,2,6,5 */
  svg.appendChild(svgEl('polygon', {
    points: [p(1), p(2), p(6), p(5)].map(pp => `${pp.x},${pp.y}`).join(' '),
    fill: rightFill, stroke: '#2b2d42', 'stroke-width': '2',
  }));
  /* left face: 0,1,5,4 */
  svg.appendChild(svgEl('polygon', {
    points: [p(0), p(1), p(5), p(4)].map(pp => `${pp.x},${pp.y}`).join(' '),
    fill: leftFill, stroke: '#2b2d42', 'stroke-width': '2',
  }));

  /* hidden edges */
  if (showHidden) {
    [[0, 3], [3, 2], [3, 7]].forEach(([a, b]) => {
      svg.appendChild(svgEl('line', {
        x1: p(a).x, y1: p(a).y, x2: p(b).x, y2: p(b).y,
        stroke: '#888', 'stroke-width': '1', 'stroke-dasharray': '5,4',
      }));
    });
  }

  /* labels */
  if (showLabels) {
    /* bottom-front edge: 0-1 length */
    const m01 = mid(p(0), p(1));
    svg.appendChild(svgText(m01.x, m01.y + 18, String(dims[0]), 11, 'middle', { fill: '#e63946', 'font-weight': '600' }));
    /* bottom-right edge: 1-2 width */
    const m12 = mid(p(1), p(2));
    svg.appendChild(svgText(m12.x + 16, m12.y + 8, String(dims[1]), 11, 'middle', { fill: '#e63946', 'font-weight': '600' }));
    /* front-right edge: 1-5 height */
    const m15 = mid(p(1), p(5));
    svg.appendChild(svgText(m15.x + 14, m15.y, String(dims[2]), 11, 'start', { fill: '#e63946', 'font-weight': '600' }));
  }

  return svg;
}

function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

function adjustBrightness(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/* ================================================================
   10. CYLINDER
   ================================================================ */
extraTemplates['cylinder'] = {
  name: 'Cylinder',
  category: '3D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Cylinder'));
    c.appendChild(row(
      field('Radius', numberInput('cy-r', 80, 20, 200, 5)),
      field('Height', numberInput('cy-h', 180, 40, 350, 5)),
    ));
    c.appendChild(row(
      checkbox('cy-labels', 'Show labels', true),
    ));
    c.appendChild(row(field('Fill', colourSwatch('cy-fill', '#fff3cd'))));
  },
  readConfig() {
    return {
      radius: val('cy-r') || 80, height: val('cy-h') || 180,
      showLabels: val('cy-labels'), fill: val('cy-fill') || '#fff3cd',
    };
  },
  generateSVG(s) {
    const pad = 50;
    const ellipseRY = s.radius * 0.35;
    const W = s.radius * 2 + pad * 2;
    const H = s.height + ellipseRY * 2 + pad * 2;
    const svg = makeSVG(W, H);
    const cx = W / 2;
    const topY = pad + ellipseRY;
    const botY = topY + s.height;

    /* body */
    svg.appendChild(svgEl('path', {
      d: `M ${cx - s.radius} ${topY} L ${cx - s.radius} ${botY} A ${s.radius} ${ellipseRY} 0 0 0 ${cx + s.radius} ${botY} L ${cx + s.radius} ${topY}`,
      fill: s.fill, stroke: '#2b2d42', 'stroke-width': '2',
    }));

    /* bottom ellipse (full, behind body) */
    svg.appendChild(svgEl('ellipse', {
      cx, cy: botY, rx: s.radius, ry: ellipseRY,
      fill: adjustBrightness(s.fill, -20), stroke: '#2b2d42', 'stroke-width': '2',
    }));

    /* body again (cover bottom ellipse top half) */
    svg.appendChild(svgEl('rect', {
      x: cx - s.radius, y: topY, width: s.radius * 2, height: s.height,
      fill: s.fill, stroke: 'none',
    }));

    /* side lines */
    svg.appendChild(svgEl('line', { x1: cx - s.radius, y1: topY, x2: cx - s.radius, y2: botY, stroke: '#2b2d42', 'stroke-width': '2' }));
    svg.appendChild(svgEl('line', { x1: cx + s.radius, y1: topY, x2: cx + s.radius, y2: botY, stroke: '#2b2d42', 'stroke-width': '2' }));

    /* top ellipse */
    svg.appendChild(svgEl('ellipse', {
      cx, cy: topY, rx: s.radius, ry: ellipseRY,
      fill: adjustBrightness(s.fill, 15), stroke: '#2b2d42', 'stroke-width': '2',
    }));

    if (s.showLabels) {
      /* height label */
      svg.appendChild(svgEl('line', {
        x1: cx + s.radius + 20, y1: topY, x2: cx + s.radius + 20, y2: botY,
        stroke: '#e63946', 'stroke-width': '1',
      }));
      svg.appendChild(svgText(cx + s.radius + 34, (topY + botY) / 2 + 4, `h=${s.height}`, 11, 'start', { fill: '#e63946' }));

      /* radius label */
      svg.appendChild(svgEl('line', {
        x1: cx, y1: topY, x2: cx + s.radius, y2: topY,
        stroke: '#e63946', 'stroke-width': '1', 'stroke-dasharray': '3,2',
      }));
      svg.appendChild(svgText(cx + s.radius / 2, topY - 8, `r=${s.radius}`, 11, 'middle', { fill: '#e63946' }));
    }

    return svg;
  },
};

/* ================================================================
   11. CONE
   ================================================================ */
extraTemplates['cone'] = {
  name: 'Cone',
  category: '3D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Cone'));
    c.appendChild(row(
      field('Radius', numberInput('co-r', 80, 20, 200, 5)),
      field('Height', numberInput('co-h', 200, 40, 350, 5)),
    ));
    c.appendChild(row(
      checkbox('co-labels', 'Show labels', true),
      checkbox('co-slant', 'Show slant height', true),
    ));
    c.appendChild(row(field('Fill', colourSwatch('co-fill', '#f8d7da'))));
  },
  readConfig() {
    return {
      radius: val('co-r') || 80, height: val('co-h') || 200,
      showLabels: val('co-labels'), showSlant: val('co-slant'),
      fill: val('co-fill') || '#f8d7da',
    };
  },
  generateSVG(s) {
    const pad = 50;
    const ellipseRY = s.radius * 0.3;
    const W = s.radius * 2 + pad * 2;
    const H = s.height + ellipseRY + pad * 2;
    const svg = makeSVG(W, H);
    const cx = W / 2;
    const apex = pad;
    const baseY = pad + s.height;

    /* body triangle + arc */
    svg.appendChild(svgEl('path', {
      d: `M ${cx} ${apex} L ${cx - s.radius} ${baseY} A ${s.radius} ${ellipseRY} 0 0 0 ${cx + s.radius} ${baseY} Z`,
      fill: s.fill, stroke: '#2b2d42', 'stroke-width': '2',
    }));

    /* base back ellipse half (dashed) */
    svg.appendChild(svgEl('path', {
      d: `M ${cx - s.radius} ${baseY} A ${s.radius} ${ellipseRY} 0 0 1 ${cx + s.radius} ${baseY}`,
      fill: 'none', stroke: '#888', 'stroke-width': '1', 'stroke-dasharray': '5,4',
    }));

    /* apex dot */
    svg.appendChild(svgEl('circle', { cx, cy: apex, r: '3', fill: '#2b2d42' }));

    if (s.showLabels) {
      /* height */
      svg.appendChild(svgEl('line', {
        x1: cx, y1: apex, x2: cx, y2: baseY,
        stroke: '#e63946', 'stroke-width': '1', 'stroke-dasharray': '4,3',
      }));
      svg.appendChild(svgText(cx - 16, (apex + baseY) / 2, `h=${s.height}`, 11, 'end', { fill: '#e63946' }));

      /* radius */
      svg.appendChild(svgEl('line', {
        x1: cx, y1: baseY, x2: cx + s.radius, y2: baseY,
        stroke: '#4262ff', 'stroke-width': '1', 'stroke-dasharray': '3,2',
      }));
      svg.appendChild(svgText(cx + s.radius / 2, baseY + 18, `r=${s.radius}`, 11, 'middle', { fill: '#4262ff' }));
    }

    if (s.showSlant) {
      const slant = Math.sqrt(s.height * s.height + s.radius * s.radius);
      svg.appendChild(svgText(cx + s.radius / 2 + 14, (apex + baseY) / 2 - 6, `l=${Math.round(slant)}`, 11, 'start', { fill: '#555' }));
    }

    return svg;
  },
};

/* ================================================================
   12. SPHERE
   ================================================================ */
extraTemplates['sphere'] = {
  name: 'Sphere',
  category: '3D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Sphere'));
    c.appendChild(row(
      field('Radius', numberInput('sp-r', 120, 30, 250, 5)),
    ));
    c.appendChild(row(checkbox('sp-label', 'Show label', true)));
    c.appendChild(row(field('Fill', colourSwatch('sp-fill', '#cce5ff'))));
  },
  readConfig() {
    return {
      radius: val('sp-r') || 120,
      showLabel: val('sp-label'),
      fill: val('sp-fill') || '#cce5ff',
    };
  },
  generateSVG(s) {
    const pad = 50;
    const W = s.radius * 2 + pad * 2;
    const H = s.radius * 2 + pad * 2;
    const svg = makeSVG(W, H);
    const cx = W / 2, cy = H / 2;

    /* gradient for 3D effect */
    const defs = svgEl('defs', {});
    const grad = svgEl('radialGradient', { id: 'sp-grad', cx: '35%', cy: '35%', r: '65%' });
    const s1 = svgEl('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': '0.6' });
    const s2 = svgEl('stop', { offset: '100%', 'stop-color': s.fill, 'stop-opacity': '1' });
    grad.appendChild(s1);
    grad.appendChild(s2);
    defs.appendChild(grad);
    svg.insertBefore(defs, svg.firstChild.nextSibling);

    svg.appendChild(svgEl('circle', {
      cx, cy, r: s.radius, fill: 'url(#sp-grad)', stroke: '#2b2d42', 'stroke-width': '2',
    }));

    /* equatorial ellipse */
    svg.appendChild(svgEl('ellipse', {
      cx, cy, rx: s.radius, ry: s.radius * 0.3,
      fill: 'none', stroke: '#888', 'stroke-width': '1', 'stroke-dasharray': '5,4',
    }));

    if (s.showLabel) {
      svg.appendChild(svgEl('line', {
        x1: cx, y1: cy, x2: cx + s.radius, y2: cy,
        stroke: '#e63946', 'stroke-width': '1', 'stroke-dasharray': '3,2',
      }));
      svg.appendChild(svgText(cx + s.radius / 2, cy - 10, `r=${s.radius}`, 12, 'middle', { fill: '#e63946', 'font-weight': '600' }));
    }

    return svg;
  },
};

/* ================================================================
   13. TRIANGULAR PRISM
   ================================================================ */
extraTemplates['triangular-prism'] = {
  name: 'Triangular Prism',
  category: '3D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Triangular Prism'));
    c.appendChild(row(
      field('Base', numberInput('tp-b', 100, 20, 250, 5)),
      field('Height', numberInput('tp-h', 100, 20, 250, 5)),
      field('Depth', numberInput('tp-d', 140, 20, 300, 5)),
    ));
    c.appendChild(row(
      checkbox('tp-labels', 'Show labels', true),
      checkbox('tp-hidden', 'Show hidden edges', true),
    ));
  },
  readConfig() {
    return {
      base: val('tp-b') || 100, height: val('tp-h') || 100, depth: val('tp-d') || 140,
      showLabels: val('tp-labels'), showHidden: val('tp-hidden'),
    };
  },
  generateSVG(s) {
    const pad = 80;
    /* front triangle: bottom-left(0,0,0), bottom-right(base,0,0), top-center(base/2,0,height) */
    /* back triangle same but y = depth */
    const verts = [
      /* front: 0,1,2 */
      [0, 0, 0], [s.base, 0, 0], [s.base / 2, 0, s.height],
      /* back: 3,4,5 */
      [0, s.depth, 0], [s.base, s.depth, 0], [s.base / 2, s.depth, s.height],
    ].map(([x, y, z]) => isoProject(x, y, z));

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    verts.forEach(p => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });

    const W = maxX - minX + pad * 2;
    const H = maxY - minY + pad * 2;
    const offX = -minX + pad, offY = -minY + pad;
    const svg = makeSVG(Math.round(W), Math.round(H));
    const p = (i) => ({ x: verts[i].x + offX, y: verts[i].y + offY });

    /* hidden edges */
    if (s.showHidden) {
      [[0, 3], [3, 4]].forEach(([a, b]) => {
        svg.appendChild(svgEl('line', {
          x1: p(a).x, y1: p(a).y, x2: p(b).x, y2: p(b).y,
          stroke: '#888', 'stroke-width': '1', 'stroke-dasharray': '5,4',
        }));
      });
    }

    /* visible faces */
    /* top face: 2,5,4,1 -- no, top is a quad: 2,5 and the roof edges */
    /* front face: 0,1,2 */
    svg.appendChild(svgEl('polygon', {
      points: [p(0), p(1), p(2)].map(pp => `${pp.x},${pp.y}`).join(' '),
      fill: '#cce5ff', stroke: '#2b2d42', 'stroke-width': '2',
    }));
    /* right rect face: 1,4,5,2 */
    svg.appendChild(svgEl('polygon', {
      points: [p(1), p(4), p(5), p(2)].map(pp => `${pp.x},${pp.y}`).join(' '),
      fill: '#b8d4f0', stroke: '#2b2d42', 'stroke-width': '2',
    }));
    /* top roof face: 2,5,3? No. top "roof" is actually 2,5 connected to 0,3 through apex */
    /* The top face is: 2,5 (top edges) — it is the slanted rectangle */
    svg.appendChild(svgEl('polygon', {
      points: [p(2), p(5), p(3), p(0)].map(pp => `${pp.x},${pp.y}`).join(' '),
      fill: '#a8c8e8', stroke: '#2b2d42', 'stroke-width': '2',
    }));

    /* bottom face edges (visible ones) */
    svg.appendChild(svgEl('line', {
      x1: p(1).x, y1: p(1).y, x2: p(4).x, y2: p(4).y,
      stroke: '#2b2d42', 'stroke-width': '2',
    }));

    /* hidden bottom-back */
    if (s.showHidden) {
      svg.appendChild(svgEl('line', {
        x1: p(3).x, y1: p(3).y, x2: p(5).x, y2: p(5).y,
        stroke: '#888', 'stroke-width': '1', 'stroke-dasharray': '5,4',
      }));
    }

    if (s.showLabels) {
      const m01 = mid(p(0), p(1));
      svg.appendChild(svgText(m01.x, m01.y + 16, `base=${s.base}`, 10, 'middle', { fill: '#e63946' }));
      const m02 = mid(p(0), p(2));
      svg.appendChild(svgText(m02.x - 16, m02.y, `h=${s.height}`, 10, 'end', { fill: '#e63946' }));
      const m14 = mid(p(1), p(4));
      svg.appendChild(svgText(m14.x + 14, m14.y + 6, `d=${s.depth}`, 10, 'start', { fill: '#e63946' }));
    }

    return svg;
  },
};

/* ================================================================
   14. SQUARE-BASED PYRAMID
   ================================================================ */
extraTemplates['square-pyramid'] = {
  name: 'Square-based Pyramid',
  category: '3D Shapes',
  renderConfig(c) {
    c.appendChild(sectionLabel('Pyramid'));
    c.appendChild(row(
      field('Base', numberInput('py-b', 120, 20, 250, 5)),
      field('Height', numberInput('py-h', 160, 40, 300, 5)),
    ));
    c.appendChild(row(
      checkbox('py-labels', 'Show labels', true),
      checkbox('py-hidden', 'Show hidden edges', true),
    ));
  },
  readConfig() {
    return {
      base: val('py-b') || 120, height: val('py-h') || 160,
      showLabels: val('py-labels'), showHidden: val('py-hidden'),
    };
  },
  generateSVG(s) {
    const b = s.base;
    const pad = 80;
    /* base corners: (0,0,0), (b,0,0), (b,b,0), (0,b,0)  apex: (b/2,b/2,h) */
    const verts = [
      [0, 0, 0], [b, 0, 0], [b, b, 0], [0, b, 0],
      [b / 2, b / 2, s.height],
    ].map(([x, y, z]) => isoProject(x, y, z));

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    verts.forEach(p => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });

    const W = maxX - minX + pad * 2;
    const H = maxY - minY + pad * 2;
    const offX = -minX + pad, offY = -minY + pad;
    const svg = makeSVG(Math.round(W), Math.round(H));
    const p = (i) => ({ x: verts[i].x + offX, y: verts[i].y + offY });

    /* hidden edges */
    if (s.showHidden) {
      [[0, 3], [3, 2], [3, 4]].forEach(([a, b]) => {
        svg.appendChild(svgEl('line', {
          x1: p(a).x, y1: p(a).y, x2: p(b).x, y2: p(b).y,
          stroke: '#888', 'stroke-width': '1', 'stroke-dasharray': '5,4',
        }));
      });
    }

    /* visible faces */
    /* front face: 0,1,4 */
    svg.appendChild(svgEl('polygon', {
      points: [p(0), p(1), p(4)].map(pp => `${pp.x},${pp.y}`).join(' '),
      fill: '#fce4ec', stroke: '#2b2d42', 'stroke-width': '2',
    }));
    /* right face: 1,2,4 */
    svg.appendChild(svgEl('polygon', {
      points: [p(1), p(2), p(4)].map(pp => `${pp.x},${pp.y}`).join(' '),
      fill: '#f8bbd0', stroke: '#2b2d42', 'stroke-width': '2',
    }));
    /* left face: 0,4 visible, top of left */
    svg.appendChild(svgEl('line', { x1: p(0).x, y1: p(0).y, x2: p(4).x, y2: p(4).y, stroke: '#2b2d42', 'stroke-width': '2' }));

    /* base visible edges */
    svg.appendChild(svgEl('line', { x1: p(0).x, y1: p(0).y, x2: p(1).x, y2: p(1).y, stroke: '#2b2d42', 'stroke-width': '2' }));
    svg.appendChild(svgEl('line', { x1: p(1).x, y1: p(1).y, x2: p(2).x, y2: p(2).y, stroke: '#2b2d42', 'stroke-width': '2' }));

    /* apex dot */
    svg.appendChild(svgEl('circle', { cx: p(4).x, cy: p(4).y, r: '3', fill: '#2b2d42' }));

    if (s.showLabels) {
      const m01 = mid(p(0), p(1));
      svg.appendChild(svgText(m01.x, m01.y + 16, `base=${s.base}`, 10, 'middle', { fill: '#e63946' }));
      svg.appendChild(svgText(p(4).x + 12, p(4).y - 8, `h=${s.height}`, 10, 'start', { fill: '#e63946' }));
    }

    return svg;
  },
};

/* ================================================================
   15. UNIT CIRCLE
   ================================================================ */
extraTemplates['unit-circle'] = {
  name: 'Unit Circle',
  category: 'Geometry Tools',
  renderConfig(c) {
    c.appendChild(sectionLabel('Angles'));
    c.appendChild(row(
      field('Show', select('uc-show', [['all_standard', 'All standard angles'], ['custom', 'Custom angle only']])),
      field('Format', select('uc-format', [['degrees', 'Degrees'], ['radians', 'Radians'], ['both', 'Both']])),
    ));
    c.appendChild(row(
      field('Highlighted angle (°)', numberInput('uc-hl', 45, 0, 360, 15)),
    ));
    c.appendChild(row(
      checkbox('uc-coords', 'Show coordinates', true),
      checkbox('uc-tri', 'Show reference triangle', true),
    ));
    c.appendChild(row(
      checkbox('uc-quads', 'Show quadrant labels', true),
    ));
  },
  readConfig() {
    return {
      show: val('uc-show') || 'all_standard',
      format: val('uc-format') || 'degrees',
      highlighted: val('uc-hl') || 45,
      showCoords: val('uc-coords'),
      showTri: val('uc-tri'),
      showQuads: val('uc-quads'),
    };
  },
  generateSVG(s) {
    const W = 560, H = 560;
    const svg = makeSVG(W, H);
    const cx = W / 2, cy = H / 2, R = 200;

    /* axes */
    svg.appendChild(svgEl('line', { x1: 30, y1: cy, x2: W - 30, y2: cy, stroke: '#ccc', 'stroke-width': '1' }));
    svg.appendChild(svgEl('line', { x1: cx, y1: 30, x2: cx, y2: H - 30, stroke: '#ccc', 'stroke-width': '1' }));
    arrowHead(svg, W - 30, cy, 0, 8, '#aaa');
    arrowHead(svg, cx, 30, -Math.PI / 2, 8, '#aaa');
    svg.appendChild(svgText(W - 24, cy - 8, 'x', 12, 'start', { fill: '#888' }));
    svg.appendChild(svgText(cx + 10, 36, 'y', 12, 'start', { fill: '#888' }));

    /* circle */
    svg.appendChild(svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: '#2b2d42', 'stroke-width': '2' }));

    /* standard angles */
    const standardAngles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
    const radianLabels = {
      0: '0', 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2',
      120: '2π/3', 135: '3π/4', 150: '5π/6', 180: 'π',
      210: '7π/6', 225: '5π/4', 240: '4π/3', 270: '3π/2',
      300: '5π/3', 315: '7π/4', 330: '11π/6',
    };
    const cosVals = {
      0: '1', 30: '√3/2', 45: '√2/2', 60: '1/2', 90: '0',
      120: '-1/2', 135: '-√2/2', 150: '-√3/2', 180: '-1',
      210: '-√3/2', 225: '-√2/2', 240: '-1/2', 270: '0',
      300: '1/2', 315: '√2/2', 330: '√3/2',
    };
    const sinVals = {
      0: '0', 30: '1/2', 45: '√2/2', 60: '√3/2', 90: '1',
      120: '√3/2', 135: '√2/2', 150: '1/2', 180: '0',
      210: '-1/2', 225: '-√2/2', 240: '-√3/2', 270: '-1',
      300: '-√3/2', 315: '-√2/2', 330: '-1/2',
    };

    const angles = s.show === 'all_standard' ? standardAngles : [s.highlighted];

    angles.forEach(deg => {
      const rad = degToRad(deg);
      const px = cx + R * Math.cos(rad);
      const py = cy - R * Math.sin(rad);

      /* tick dot */
      svg.appendChild(svgEl('circle', { cx: px, cy: py, r: '3', fill: '#4262ff' }));

      /* angle label */
      const lr = R + 18;
      const lx = cx + lr * Math.cos(rad);
      const ly = cy - lr * Math.sin(rad);
      let label = '';
      if (s.format === 'degrees') label = `${deg}°`;
      else if (s.format === 'radians') label = radianLabels[deg] || `${deg}°`;
      else label = `${deg}° (${radianLabels[deg] || ''})`;

      if (s.show === 'all_standard') {
        svg.appendChild(svgText(lx, ly + 4, label, 8, 'middle', { fill: '#555' }));
      } else {
        svg.appendChild(svgText(lx, ly + 4, label, 11, 'middle', { fill: '#e63946', 'font-weight': '600' }));
      }

      /* coordinates */
      if (s.showCoords && s.show === 'all_standard') {
        const cr = R + 36;
        const clx = cx + cr * Math.cos(rad);
        const cly = cy - cr * Math.sin(rad);
        svg.appendChild(svgText(clx, cly + 4, `(${cosVals[deg]}, ${sinVals[deg]})`, 7, 'middle', { fill: '#888' }));
      }
    });

    /* highlighted angle: reference triangle */
    if (s.showTri) {
      const hRad = degToRad(s.highlighted);
      const hx = cx + R * Math.cos(hRad);
      const hy = cy - R * Math.sin(hRad);
      const fx = cx + R * Math.cos(hRad); /* foot on x-axis */

      svg.appendChild(svgEl('polygon', {
        points: `${cx},${cy} ${hx},${cy} ${hx},${hy}`,
        fill: 'rgba(66,98,255,0.1)', stroke: '#4262ff', 'stroke-width': '1.5',
      }));

      /* angle arc */
      drawAngleArc(svg, cx, cy, -s.highlighted, 0, 25);
    }

    /* quadrant labels */
    if (s.showQuads) {
      const qd = R / 2;
      [['I', 1, -1], ['II', -1, -1], ['III', -1, 1], ['IV', 1, 1]].forEach(([q, sx, sy]) => {
        svg.appendChild(svgText(cx + sx * qd, cy + sy * qd, q, 16, 'middle', { fill: 'rgba(0,0,0,0.08)', 'font-weight': '800' }));
      });
    }

    /* axis labels */
    svg.appendChild(svgText(cx + R + 4, cy + 16, '1', 10, 'start', { fill: '#555' }));
    svg.appendChild(svgText(cx - R - 4, cy + 16, '-1', 10, 'end', { fill: '#555' }));
    svg.appendChild(svgText(cx + 10, cy - R - 4, '1', 10, 'start', { fill: '#555' }));
    svg.appendChild(svgText(cx + 10, cy + R + 14, '-1', 10, 'start', { fill: '#555' }));

    return svg;
  },
};

/* ================================================================
   16. PROTRACTOR
   ================================================================ */
extraTemplates['protractor'] = {
  name: 'Protractor',
  category: 'Geometry Tools',
  renderConfig(c) {
    c.appendChild(sectionLabel('Protractor'));
    c.appendChild(row(
      field('Type', select('pr-type', [['180', 'Semicircle (180°)'], ['360', 'Full circle (360°)']])),
      field('Marked angle', numberInput('pr-angle', 0, 0, 360, 1)),
    ));
    c.appendChild(row(checkbox('pr-rays', 'Show rays', true)));
  },
  readConfig() {
    return {
      type: val('pr-type') || '180',
      markedAngle: val('pr-angle') || 0,
      showRays: val('pr-rays'),
    };
  },
  generateSVG(s) {
    const R = 200;
    const isFull = s.type === '360';
    const pad = 40;
    const W = R * 2 + pad * 2;
    const H = isFull ? R * 2 + pad * 2 : R + pad * 2 + 30;
    const svg = makeSVG(W, H);
    const cx = W / 2, cy = isFull ? H / 2 : H - pad - 10;

    /* base line */
    svg.appendChild(svgEl('line', { x1: cx - R - 10, y1: cy, x2: cx + R + 10, y2: cy, stroke: '#2b2d42', 'stroke-width': '1.5' }));

    /* arc */
    if (isFull) {
      svg.appendChild(svgEl('circle', { cx, cy, r: R, fill: 'rgba(66,98,255,0.04)', stroke: '#2b2d42', 'stroke-width': '2' }));
    } else {
      svg.appendChild(svgEl('path', {
        d: `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`,
        fill: 'rgba(66,98,255,0.04)', stroke: '#2b2d42', 'stroke-width': '2',
      }));
    }

    /* centre dot */
    svg.appendChild(svgEl('circle', { cx, cy, r: '3', fill: '#e63946' }));

    /* degree ticks */
    const maxDeg = isFull ? 360 : 180;
    for (let d = 0; d <= maxDeg; d++) {
      const a = isFull ? degToRad(-d + 90) : degToRad(180 - d);
      const isMajor = d % 10 === 0;
      const isMid = d % 5 === 0;
      const tickLen = isMajor ? 18 : isMid ? 12 : 6;
      const x1 = cx + (R - tickLen) * Math.cos(a);
      const y1 = cy - (R - tickLen) * Math.sin(a);
      const x2 = cx + R * Math.cos(a);
      const y2 = cy - R * Math.sin(a);
      svg.appendChild(svgEl('line', {
        x1, y1, x2, y2,
        stroke: isMajor ? '#2b2d42' : '#aaa',
        'stroke-width': isMajor ? '1.5' : '0.5',
      }));
      if (isMajor && d < maxDeg) {
        const lr = R - 24;
        const lx = cx + lr * Math.cos(a);
        const ly = cy - lr * Math.sin(a);
        svg.appendChild(svgText(lx, ly + 4, String(d), 9, 'middle', { fill: '#333' }));
      }
    }

    /* marked angle ray */
    if (s.showRays && s.markedAngle > 0 && s.markedAngle <= maxDeg) {
      const a = isFull ? degToRad(-s.markedAngle + 90) : degToRad(180 - s.markedAngle);
      const rx = cx + (R + 15) * Math.cos(a);
      const ry = cy - (R + 15) * Math.sin(a);
      svg.appendChild(svgEl('line', { x1: cx, y1: cy, x2: rx, y2: ry, stroke: '#e63946', 'stroke-width': '2' }));

      /* angle arc */
      const baseA = isFull ? 90 : 180;
      const endA = isFull ? 90 - s.markedAngle : 180 - s.markedAngle;
      const arcPath = describeArc(cx, cy, 35, Math.min(baseA, endA), Math.max(baseA, endA));
      svg.appendChild(svgEl('path', { d: arcPath, fill: 'none', stroke: '#e63946', 'stroke-width': '1.5' }));
      svg.appendChild(svgText(cx, cy - 44, `${s.markedAngle}°`, 12, 'middle', { fill: '#e63946', 'font-weight': '600' }));
    }

    return svg;
  },
};

/* ================================================================
   17. ISOMETRIC DOT GRID
   ================================================================ */
extraTemplates['iso-dot-grid'] = {
  name: 'Isometric Dot Grid',
  category: 'Geometry Tools',
  renderConfig(c) {
    c.appendChild(sectionLabel('Grid'));
    c.appendChild(row(
      field('Columns', numberInput('ig-cols', 12, 3, 30, 1)),
      field('Rows', numberInput('ig-rows', 10, 3, 30, 1)),
    ));
    c.appendChild(row(
      field('Dot spacing', numberInput('ig-sp', 30, 10, 60, 2)),
    ));
    c.appendChild(row(field('Dot colour', colourSwatch('ig-col', '#adb5bd'))));
  },
  readConfig() {
    return {
      cols: val('ig-cols') || 12, rows: val('ig-rows') || 10,
      spacing: val('ig-sp') || 30,
      colour: val('ig-col') || '#adb5bd',
    };
  },
  generateSVG(s) {
    const dx = s.spacing;
    const dy = s.spacing * Math.sin(Math.PI / 3);
    const pad = 20;
    const W = s.cols * dx + pad * 2;
    const H = s.rows * dy + pad * 2;
    const svg = makeSVG(Math.round(W), Math.round(H));

    for (let r = 0; r < s.rows; r++) {
      const offset = (r % 2 === 1) ? dx / 2 : 0;
      for (let c = 0; c < s.cols; c++) {
        const x = pad + c * dx + offset;
        const y = pad + r * dy;
        svg.appendChild(svgEl('circle', { cx: x, cy: y, r: '2.5', fill: s.colour }));
      }
    }

    return svg;
  },
};

/* ================================================================
   18. SYMMETRY GRID
   ================================================================ */
extraTemplates['symmetry-grid'] = {
  name: 'Symmetry Grid',
  category: 'Geometry Tools',
  renderConfig(c) {
    c.appendChild(sectionLabel('Grid'));
    c.appendChild(row(
      field('Grid size', numberInput('sg-size', 10, 4, 20, 1)),
    ));
    c.appendChild(row(
      field('Mirror line', select('sg-mirror', [
        ['vertical', 'Vertical'], ['horizontal', 'Horizontal'], ['diagonal', 'Diagonal (↘)'],
      ])),
    ));
    c.appendChild(row(checkbox('sg-grid', 'Show grid', true)));
  },
  readConfig() {
    return {
      size: val('sg-size') || 10,
      mirror: val('sg-mirror') || 'vertical',
      showGrid: val('sg-grid'),
    };
  },
  generateSVG(s) {
    const cell = 36;
    const pad = 30;
    const n = s.size;
    const W = n * cell + pad * 2;
    const H = n * cell + pad * 2;
    const svg = makeSVG(W, H);
    const ox = pad, oy = pad;

    if (s.showGrid) {
      for (let i = 0; i <= n; i++) {
        svg.appendChild(svgEl('line', {
          x1: ox + i * cell, y1: oy, x2: ox + i * cell, y2: oy + n * cell,
          stroke: '#ddd', 'stroke-width': '1',
        }));
        svg.appendChild(svgEl('line', {
          x1: ox, y1: oy + i * cell, x2: ox + n * cell, y2: oy + i * cell,
          stroke: '#ddd', 'stroke-width': '1',
        }));
      }
    }

    /* mirror line */
    let lx1, ly1, lx2, ly2;
    if (s.mirror === 'vertical') {
      lx1 = ox + n * cell / 2; ly1 = oy - 10;
      lx2 = ox + n * cell / 2; ly2 = oy + n * cell + 10;
    } else if (s.mirror === 'horizontal') {
      lx1 = ox - 10; ly1 = oy + n * cell / 2;
      lx2 = ox + n * cell + 10; ly2 = oy + n * cell / 2;
    } else {
      lx1 = ox; ly1 = oy;
      lx2 = ox + n * cell; ly2 = oy + n * cell;
    }
    svg.appendChild(svgEl('line', {
      x1: lx1, y1: ly1, x2: lx2, y2: ly2,
      stroke: '#e63946', 'stroke-width': '2.5', 'stroke-dasharray': '8,4',
    }));

    /* label */
    svg.appendChild(svgText(W / 2, H - 8, 'Mirror Line', 11, 'middle', { fill: '#e63946', 'font-weight': '600' }));

    return svg;
  },
};

/* ================================================================
   19. STEM AND LEAF
   ================================================================ */
extraTemplates['stem-leaf'] = {
  name: 'Stem and Leaf',
  category: 'Statistics Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Stem & Leaf'));
    c.appendChild(row(
      field('Type', select('sl-type', [['single', 'Single'], ['back-to-back', 'Back-to-back']])),
    ));
    c.appendChild(row(
      field('Stems (comma sep)', textInput('sl-stems', '1,2,3,4,5')),
    ));
    c.appendChild(row(
      field('Leaves right (per stem, | sep)', textInput('sl-right', '2 3 5|1 4 7 8|0 2 6|3 5|1')),
    ));
    c.appendChild(row(
      field('Leaves left (back-to-back)', textInput('sl-left', '5 3|8 6 2|9 4 1|7 5|2')),
    ));
    c.appendChild(row(
      field('Title', textInput('sl-title', 'Stem and Leaf Diagram')),
    ));
    c.appendChild(row(checkbox('sl-key', 'Show key', true)));
  },
  readConfig() {
    return {
      type: val('sl-type') || 'single',
      stems: (val('sl-stems') || '1,2,3,4,5').split(',').map(s => s.trim()),
      leavesRight: (val('sl-right') || '').split('|').map(s => s.trim()),
      leavesLeft: (val('sl-left') || '').split('|').map(s => s.trim()),
      title: val('sl-title') || 'Stem and Leaf Diagram',
      showKey: val('sl-key'),
    };
  },
  generateSVG(s) {
    const rowH = 28;
    const stemW = 40;
    const leafCharW = 14;
    const isB2B = s.type === 'back-to-back';
    const pad = 30;

    /* compute max leaf width */
    let maxRight = 0, maxLeft = 0;
    s.leavesRight.forEach(l => { maxRight = Math.max(maxRight, l.split(/\s+/).filter(Boolean).length); });
    if (isB2B) s.leavesLeft.forEach(l => { maxLeft = Math.max(maxLeft, l.split(/\s+/).filter(Boolean).length); });

    const rightW = maxRight * leafCharW + 10;
    const leftW = isB2B ? maxLeft * leafCharW + 10 : 0;
    const W = pad * 2 + leftW + stemW + rightW + 20;
    const titleH = 30;
    const keyH = s.showKey ? 28 : 0;
    const H = pad * 2 + titleH + s.stems.length * rowH + keyH + 10;
    const svg = makeSVG(Math.max(W, 300), H);

    /* title */
    svg.appendChild(svgText(W / 2, pad + 16, s.title, 14, 'middle', { fill: '#333', 'font-weight': '700' }));

    const tableTop = pad + titleH + 4;
    const stemX = pad + leftW + (isB2B ? 10 : 0);

    /* header */
    if (isB2B) {
      svg.appendChild(svgText(stemX - leftW / 2, tableTop - 4, 'Leaf', 10, 'middle', { fill: '#888' }));
    }
    svg.appendChild(svgText(stemX + stemW / 2, tableTop - 4, 'Stem', 10, 'middle', { fill: '#888' }));
    svg.appendChild(svgText(stemX + stemW + rightW / 2, tableTop - 4, 'Leaf', 10, 'middle', { fill: '#888' }));

    s.stems.forEach((stem, i) => {
      const y = tableTop + i * rowH;

      /* stem column background */
      svg.appendChild(svgEl('rect', {
        x: stemX, y, width: stemW, height: rowH,
        fill: '#f0f4ff', stroke: '#d0d4dc', 'stroke-width': '1',
      }));
      svg.appendChild(svgText(stemX + stemW / 2, y + rowH / 2 + 5, stem, 13, 'middle', { fill: '#333', 'font-weight': '700' }));

      /* right leaves */
      const rLeaves = (s.leavesRight[i] || '').split(/\s+/).filter(Boolean);
      rLeaves.forEach((l, j) => {
        svg.appendChild(svgText(stemX + stemW + 8 + j * leafCharW, y + rowH / 2 + 5, l, 12, 'start', { fill: '#4262ff' }));
      });

      /* left leaves (back-to-back) */
      if (isB2B) {
        const lLeaves = (s.leavesLeft[i] || '').split(/\s+/).filter(Boolean);
        lLeaves.forEach((l, j) => {
          svg.appendChild(svgText(stemX - 8 - j * leafCharW, y + rowH / 2 + 5, l, 12, 'end', { fill: '#e63946' }));
        });
      }

      /* row border */
      svg.appendChild(svgEl('line', {
        x1: stemX - (isB2B ? leftW + 10 : 0), y1: y + rowH,
        x2: stemX + stemW + rightW, y2: y + rowH,
        stroke: '#e0e0e0', 'stroke-width': '0.5',
      }));
    });

    /* vertical separator lines */
    const tblBot = tableTop + s.stems.length * rowH;
    svg.appendChild(svgEl('line', { x1: stemX, y1: tableTop, x2: stemX, y2: tblBot, stroke: '#2b2d42', 'stroke-width': '1.5' }));
    svg.appendChild(svgEl('line', { x1: stemX + stemW, y1: tableTop, x2: stemX + stemW, y2: tblBot, stroke: '#2b2d42', 'stroke-width': '1.5' }));

    /* key */
    if (s.showKey) {
      svg.appendChild(svgText(W / 2, H - pad + 4, `Key: ${s.stems[0]} | ${(s.leavesRight[0] || '2').split(/\s+/)[0] || '2'} = ${s.stems[0]}${(s.leavesRight[0] || '2').split(/\s+/)[0] || '2'}`, 10, 'middle', { fill: '#888', 'font-style': 'italic' }));
    }

    return svg;
  },
};

/* ================================================================
   20. NORMAL DISTRIBUTION
   ================================================================ */
extraTemplates['normal-distribution'] = {
  name: 'Normal Distribution',
  category: 'Statistics Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Normal Distribution'));
    c.appendChild(row(
      field('Mean (μ)', numberInput('nd-mean', 0, -100, 100, 1)),
      field('Std Dev (σ)', numberInput('nd-sd', 1, 0.1, 50, 0.1)),
    ));
    c.appendChild(row(
      checkbox('nd-sdlines', 'Show σ lines', true),
      checkbox('nd-pct', 'Show percentages', true),
    ));
    c.appendChild(row(
      field('Shade from', numberInput('nd-from', -1, -5, 5, 0.1)),
      field('Shade to', numberInput('nd-to', 1, -5, 5, 0.1)),
    ));
    c.appendChild(row(
      field('Title', textInput('nd-title', 'Normal Distribution')),
    ));
  },
  readConfig() {
    return {
      mean: val('nd-mean'), sd: val('nd-sd') || 1,
      showSDLines: val('nd-sdlines'), showPct: val('nd-pct'),
      shadeFrom: val('nd-from'), shadeTo: val('nd-to'),
      title: val('nd-title') || 'Normal Distribution',
    };
  },
  generateSVG(s) {
    const W = 520, H = 320;
    const svg = makeSVG(W, H);
    const pad = { l: 50, r: 30, t: 40, b: 50 };
    const gw = W - pad.l - pad.r;
    const gh = H - pad.t - pad.b;

    /* title */
    svg.appendChild(svgText(W / 2, 24, s.title, 14, 'middle', { fill: '#333', 'font-weight': '700' }));

    /* normal PDF */
    const norm = (x) => {
      const z = (x - s.mean) / s.sd;
      return Math.exp(-0.5 * z * z) / (s.sd * Math.sqrt(2 * Math.PI));
    };

    const xMin = s.mean - 4 * s.sd;
    const xMax = s.mean + 4 * s.sd;
    const steps = 200;
    const xStep = (xMax - xMin) / steps;

    let maxY = norm(s.mean);
    const toSVGx = (x) => pad.l + ((x - xMin) / (xMax - xMin)) * gw;
    const toSVGy = (y) => pad.t + gh - (y / maxY) * gh;

    /* shaded region */
    if (s.shadeFrom !== undefined && s.shadeTo !== undefined) {
      const sfReal = s.mean + s.shadeFrom * s.sd;
      const stReal = s.mean + s.shadeTo * s.sd;
      let shadePath = `M ${toSVGx(sfReal)} ${toSVGy(0)}`;
      for (let x = sfReal; x <= stReal; x += xStep) {
        shadePath += ` L ${toSVGx(x)} ${toSVGy(norm(x))}`;
      }
      shadePath += ` L ${toSVGx(stReal)} ${toSVGy(0)} Z`;
      svg.appendChild(svgEl('path', { d: shadePath, fill: 'rgba(66,98,255,0.2)', stroke: 'none' }));
    }

    /* curve */
    let curvePath = `M ${toSVGx(xMin)} ${toSVGy(norm(xMin))}`;
    for (let i = 1; i <= steps; i++) {
      const x = xMin + i * xStep;
      curvePath += ` L ${toSVGx(x)} ${toSVGy(norm(x))}`;
    }
    svg.appendChild(svgEl('path', { d: curvePath, fill: 'none', stroke: '#4262ff', 'stroke-width': '2.5' }));

    /* x-axis */
    svg.appendChild(svgEl('line', {
      x1: pad.l, y1: pad.t + gh, x2: W - pad.r, y2: pad.t + gh,
      stroke: '#2b2d42', 'stroke-width': '1.5',
    }));

    /* SD lines and labels */
    const sdPercents = ['', '34.1%', '13.6%', '2.1%'];
    for (let i = -3; i <= 3; i++) {
      const x = s.mean + i * s.sd;
      const sx = toSVGx(x);

      if (s.showSDLines) {
        svg.appendChild(svgEl('line', {
          x1: sx, y1: pad.t, x2: sx, y2: pad.t + gh,
          stroke: i === 0 ? '#e63946' : '#ddd',
          'stroke-width': i === 0 ? '1.5' : '1',
          'stroke-dasharray': i === 0 ? 'none' : '4,3',
        }));
      }

      /* x-axis label */
      const label = i === 0 ? `μ=${s.mean}` : `${i > 0 ? '+' : ''}${i}σ`;
      svg.appendChild(svgText(sx, pad.t + gh + 16, label, 10, 'middle', { fill: '#555' }));
      svg.appendChild(svgText(sx, pad.t + gh + 28, String(Math.round((s.mean + i * s.sd) * 100) / 100), 9, 'middle', { fill: '#999' }));

      /* percentages between SD lines */
      if (s.showPct && i > 0 && i <= 3) {
        const lx = toSVGx(s.mean + (i - 0.5) * s.sd);
        const rx = toSVGx(s.mean - (i - 0.5) * s.sd);
        const py = pad.t + gh * 0.55 + i * 20;
        svg.appendChild(svgText(lx, py, sdPercents[i], 9, 'middle', { fill: '#4262ff', 'font-weight': '600' }));
        svg.appendChild(svgText(rx, py, sdPercents[i], 9, 'middle', { fill: '#4262ff', 'font-weight': '600' }));
      }
    }

    return svg;
  },
};

/* ================================================================
   21. TALLY CHART
   ================================================================ */
extraTemplates['tally-chart'] = {
  name: 'Tally Chart',
  category: 'Statistics Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Tally Chart'));
    c.appendChild(row(
      field('Number of rows', numberInput('tc-rows', 5, 1, 12, 1)),
    ));
    c.appendChild(row(
      field('Labels (comma sep)', textInput('tc-labels', 'Red,Blue,Green,Yellow,Purple')),
    ));
    c.appendChild(row(
      field('Tallies (comma sep)', textInput('tc-tallies', '7,12,4,9,3')),
    ));
    c.appendChild(row(
      checkbox('tc-freq', 'Show frequency column', true),
    ));
    c.appendChild(row(
      field('Title', textInput('tc-title', 'Favourite Colour')),
    ));
  },
  readConfig() {
    return {
      numRows: val('tc-rows') || 5,
      labels: (val('tc-labels') || '').split(',').map(s => s.trim()),
      tallies: (val('tc-tallies') || '').split(',').map(s => parseInt(s.trim()) || 0),
      showFreq: val('tc-freq'),
      title: val('tc-title') || 'Tally Chart',
    };
  },
  generateSVG(s) {
    const rowH = 32;
    const labelW = 100;
    const tallyW = 160;
    const freqW = s.showFreq ? 60 : 0;
    const W = labelW + tallyW + freqW + 60;
    const headerH = 30;
    const pad = 30;
    const titleH = 30;
    const H = pad * 2 + titleH + headerH + s.numRows * rowH + 10;
    const svg = makeSVG(W, H);

    svg.appendChild(svgText(W / 2, pad + 16, s.title, 14, 'middle', { fill: '#333', 'font-weight': '700' }));

    const tableX = 30, tableY = pad + titleH;

    /* header */
    svg.appendChild(svgEl('rect', { x: tableX, y: tableY, width: labelW, height: headerH, fill: '#eef2ff', stroke: '#d0d4dc', 'stroke-width': '1' }));
    svg.appendChild(svgText(tableX + labelW / 2, tableY + 20, 'Category', 11, 'middle', { fill: '#333', 'font-weight': '700' }));

    svg.appendChild(svgEl('rect', { x: tableX + labelW, y: tableY, width: tallyW, height: headerH, fill: '#eef2ff', stroke: '#d0d4dc', 'stroke-width': '1' }));
    svg.appendChild(svgText(tableX + labelW + tallyW / 2, tableY + 20, 'Tally', 11, 'middle', { fill: '#333', 'font-weight': '700' }));

    if (s.showFreq) {
      svg.appendChild(svgEl('rect', { x: tableX + labelW + tallyW, y: tableY, width: freqW, height: headerH, fill: '#eef2ff', stroke: '#d0d4dc', 'stroke-width': '1' }));
      svg.appendChild(svgText(tableX + labelW + tallyW + freqW / 2, tableY + 20, 'Freq', 11, 'middle', { fill: '#333', 'font-weight': '700' }));
    }

    /* rows */
    for (let i = 0; i < s.numRows; i++) {
      const y = tableY + headerH + i * rowH;
      const label = s.labels[i] || '';
      const count = s.tallies[i] || 0;

      /* cells */
      svg.appendChild(svgEl('rect', { x: tableX, y, width: labelW, height: rowH, fill: '#fff', stroke: '#d0d4dc', 'stroke-width': '1' }));
      svg.appendChild(svgText(tableX + labelW / 2, y + rowH / 2 + 5, label, 11, 'middle', { fill: '#333' }));

      svg.appendChild(svgEl('rect', { x: tableX + labelW, y, width: tallyW, height: rowH, fill: '#fff', stroke: '#d0d4dc', 'stroke-width': '1' }));

      /* draw tally marks */
      const tallyX = tableX + labelW + 10;
      const tallyY = y + rowH / 2;
      drawTallyMarks(svg, tallyX, tallyY, count);

      if (s.showFreq) {
        svg.appendChild(svgEl('rect', { x: tableX + labelW + tallyW, y, width: freqW, height: rowH, fill: '#fff', stroke: '#d0d4dc', 'stroke-width': '1' }));
        svg.appendChild(svgText(tableX + labelW + tallyW + freqW / 2, y + rowH / 2 + 5, String(count), 12, 'middle', { fill: '#4262ff', 'font-weight': '600' }));
      }
    }

    return svg;
  },
};

function drawTallyMarks(svg, x, cy, count) {
  const groups = Math.floor(count / 5);
  const rem = count % 5;
  let cx = x;
  const stickW = 6;
  const stickH = 16;
  const groupGap = 12;

  for (let g = 0; g < groups; g++) {
    /* 4 vertical + 1 diagonal */
    for (let j = 0; j < 4; j++) {
      svg.appendChild(svgEl('line', {
        x1: cx + j * stickW, y1: cy - stickH / 2,
        x2: cx + j * stickW, y2: cy + stickH / 2,
        stroke: '#2b2d42', 'stroke-width': '2',
      }));
    }
    /* diagonal through all 4 */
    svg.appendChild(svgEl('line', {
      x1: cx - 2, y1: cy + stickH / 2 - 2,
      x2: cx + 3 * stickW + 2, y2: cy - stickH / 2 + 2,
      stroke: '#2b2d42', 'stroke-width': '2',
    }));
    cx += 4 * stickW + groupGap;
  }

  /* remaining */
  for (let j = 0; j < rem; j++) {
    svg.appendChild(svgEl('line', {
      x1: cx + j * stickW, y1: cy - stickH / 2,
      x2: cx + j * stickW, y2: cy + stickH / 2,
      stroke: '#2b2d42', 'stroke-width': '2',
    }));
  }
}

/* ================================================================
   22. FREQUENCY TABLE
   ================================================================ */
extraTemplates['frequency-table'] = {
  name: 'Frequency Table',
  category: 'Statistics Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Frequency Table'));
    c.appendChild(row(
      field('Rows', numberInput('ft-rows', 6, 2, 15, 1)),
    ));
    c.appendChild(row(
      field('Interval labels (comma)', textInput('ft-intervals', '0-10,10-20,20-30,30-40,40-50,50-60')),
    ));
    c.appendChild(sectionLabel('Columns'));
    c.appendChild(row(
      checkbox('ft-interval', 'Interval', true),
      checkbox('ft-tally', 'Tally', false),
      checkbox('ft-freq', 'Frequency', true),
    ));
    c.appendChild(row(
      checkbox('ft-cumfreq', 'Cum. Freq', false),
      checkbox('ft-density', 'Freq Density', false),
      checkbox('ft-mid', 'Midpoint', false),
    ));
    c.appendChild(row(
      field('Title', textInput('ft-title', 'Grouped Frequency Table')),
    ));
  },
  readConfig() {
    return {
      numRows: val('ft-rows') || 6,
      intervals: (val('ft-intervals') || '').split(',').map(s => s.trim()),
      showInterval: val('ft-interval'),
      showTally: val('ft-tally'),
      showFreq: val('ft-freq'),
      showCumFreq: val('ft-cumfreq'),
      showDensity: val('ft-density'),
      showMidpoint: val('ft-mid'),
      title: val('ft-title') || 'Frequency Table',
    };
  },
  generateSVG(s) {
    const cols = [];
    if (s.showInterval) cols.push({ header: 'Interval', width: 80 });
    if (s.showTally) cols.push({ header: 'Tally', width: 80 });
    if (s.showFreq) cols.push({ header: 'Frequency', width: 80 });
    if (s.showCumFreq) cols.push({ header: 'Cum. Freq', width: 80 });
    if (s.showDensity) cols.push({ header: 'Freq Density', width: 90 });
    if (s.showMidpoint) cols.push({ header: 'Midpoint', width: 80 });
    if (cols.length === 0) cols.push({ header: 'Interval', width: 80 }, { header: 'Frequency', width: 80 });

    const rowH = 28;
    const headerH = 30;
    const pad = 30;
    const titleH = 30;
    const totalW = cols.reduce((a, c) => a + c.width, 0);
    const W = totalW + 60;
    const H = pad * 2 + titleH + headerH + s.numRows * rowH + 10;
    const svg = makeSVG(Math.max(W, 300), H);
    const tableX = 30, tableY = pad + titleH;

    svg.appendChild(svgText(W / 2, pad + 16, s.title, 14, 'middle', { fill: '#333', 'font-weight': '700' }));

    /* headers */
    let cx = tableX;
    cols.forEach(col => {
      svg.appendChild(svgEl('rect', { x: cx, y: tableY, width: col.width, height: headerH, fill: '#eef2ff', stroke: '#d0d4dc', 'stroke-width': '1' }));
      svg.appendChild(svgText(cx + col.width / 2, tableY + 20, col.header, 10, 'middle', { fill: '#333', 'font-weight': '700' }));
      cx += col.width;
    });

    /* rows */
    for (let i = 0; i < s.numRows; i++) {
      const y = tableY + headerH + i * rowH;
      let cx2 = tableX;
      cols.forEach(col => {
        svg.appendChild(svgEl('rect', { x: cx2, y, width: col.width, height: rowH, fill: '#fff', stroke: '#d0d4dc', 'stroke-width': '1' }));
        let cellText = '';
        if (col.header === 'Interval') cellText = s.intervals[i] || '';
        /* other columns left blank for teacher to fill */
        if (cellText) {
          svg.appendChild(svgText(cx2 + col.width / 2, y + rowH / 2 + 5, cellText, 11, 'middle', { fill: '#333' }));
        }
        cx2 += col.width;
      });
    }

    return svg;
  },
};

/* ================================================================
   23. CLOCK FACE
   ================================================================ */
extraTemplates['clock-face'] = {
  name: 'Clock Face',
  category: 'Number Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Clock'));
    c.appendChild(row(
      field('Time (HH:MM)', textInput('cl-time', '10:10')),
    ));
    c.appendChild(row(
      checkbox('cl-nums', 'Show hour numbers', true),
      checkbox('cl-ticks', 'Show minute ticks', true),
    ));
    c.appendChild(row(
      checkbox('cl-digital', 'Show digital time', false),
      checkbox('cl-24', '24-hour format', false),
    ));
    c.appendChild(row(
      checkbox('cl-roman', 'Roman numerals', false),
    ));
  },
  readConfig() {
    return {
      time: val('cl-time') || '10:10',
      showNums: val('cl-nums'),
      showTicks: val('cl-ticks'),
      showDigital: val('cl-digital'),
      format24: val('cl-24'),
      showRoman: val('cl-roman'),
    };
  },
  generateSVG(s) {
    const W = 360, H = s.showDigital ? 400 : 360;
    const svg = makeSVG(W, H);
    const cx = W / 2, cy = 180, R = 150;

    const parts = s.time.split(':');
    let hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;

    /* face */
    svg.appendChild(svgEl('circle', { cx, cy, r: R, fill: '#fafafa', stroke: '#2b2d42', 'stroke-width': '3' }));
    svg.appendChild(svgEl('circle', { cx, cy, r: R - 6, fill: 'none', stroke: '#e8e8e8', 'stroke-width': '1' }));

    const romanNums = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

    /* hour markers / numbers */
    for (let i = 0; i < 12; i++) {
      const a = degToRad(i * 30 - 90);
      if (s.showTicks) {
        const t1 = R - 12;
        const t2 = R - 4;
        svg.appendChild(svgEl('line', {
          x1: cx + t1 * Math.cos(a), y1: cy + t1 * Math.sin(a),
          x2: cx + t2 * Math.cos(a), y2: cy + t2 * Math.sin(a),
          stroke: '#2b2d42', 'stroke-width': '2.5',
        }));
      }
      if (s.showNums) {
        const nr = R - 26;
        const label = s.showRoman ? romanNums[i] : String(i === 0 ? 12 : i);
        svg.appendChild(svgText(
          cx + nr * Math.cos(a), cy + nr * Math.sin(a) + 5,
          label, s.showRoman ? 11 : 16, 'middle',
          { fill: '#2b2d42', 'font-weight': '700' },
        ));
      }
    }

    /* minute ticks */
    if (s.showTicks) {
      for (let i = 0; i < 60; i++) {
        if (i % 5 === 0) continue;
        const a = degToRad(i * 6 - 90);
        const t1 = R - 6;
        const t2 = R - 3;
        svg.appendChild(svgEl('line', {
          x1: cx + t1 * Math.cos(a), y1: cy + t1 * Math.sin(a),
          x2: cx + t2 * Math.cos(a), y2: cy + t2 * Math.sin(a),
          stroke: '#bbb', 'stroke-width': '1',
        }));
      }
    }

    /* hour hand */
    const hourAngle = degToRad((hours % 12 + minutes / 60) * 30 - 90);
    const hourLen = R * 0.5;
    svg.appendChild(svgEl('line', {
      x1: cx, y1: cy,
      x2: cx + hourLen * Math.cos(hourAngle),
      y2: cy + hourLen * Math.sin(hourAngle),
      stroke: '#2b2d42', 'stroke-width': '5', 'stroke-linecap': 'round',
    }));

    /* minute hand */
    const minAngle = degToRad(minutes * 6 - 90);
    const minLen = R * 0.72;
    svg.appendChild(svgEl('line', {
      x1: cx, y1: cy,
      x2: cx + minLen * Math.cos(minAngle),
      y2: cy + minLen * Math.sin(minAngle),
      stroke: '#4262ff', 'stroke-width': '3', 'stroke-linecap': 'round',
    }));

    /* centre dot */
    svg.appendChild(svgEl('circle', { cx, cy, r: '6', fill: '#2b2d42' }));

    /* digital display */
    if (s.showDigital) {
      let timeStr;
      if (s.format24) {
        timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      } else {
        const h12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        timeStr = `${h12}:${String(minutes).padStart(2, '0')} ${ampm}`;
      }
      svg.appendChild(svgEl('rect', {
        x: cx - 55, y: H - 42, width: 110, height: 30, rx: '6',
        fill: '#2b2d42', stroke: 'none',
      }));
      svg.appendChild(svgText(cx, H - 22, timeStr, 16, 'middle', { fill: '#fff', 'font-weight': '700', 'font-family': 'monospace' }));
    }

    return svg;
  },
};

/* ================================================================
   24. THERMOMETER
   ================================================================ */
extraTemplates['thermometer'] = {
  name: 'Thermometer',
  category: 'Number Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Thermometer'));
    c.appendChild(row(
      field('Min temp', numberInput('th-min', -10, -50, 50, 5)),
      field('Max temp', numberInput('th-max', 50, 0, 150, 5)),
      field('Step', numberInput('th-step', 10, 1, 50, 1)),
    ));
    c.appendChild(row(
      field('Current value', numberInput('th-val', 22, -50, 150, 1)),
      field('Unit', select('th-unit', [['C', '°C'], ['F', '°F']])),
    ));
    c.appendChild(row(checkbox('th-labels', 'Show labels', true)));
  },
  readConfig() {
    return {
      min: val('th-min'), max: val('th-max'),
      step: val('th-step') || 10, current: val('th-val'),
      unit: val('th-unit') || 'C', showLabels: val('th-labels'),
    };
  },
  generateSVG(s) {
    const W = 200, H = 420;
    const svg = makeSVG(W, H);
    const pad = { t: 30, b: 50 };
    const cx = 80;
    const tubeW = 24;
    const bulbR = 22;
    const tubeTop = pad.t;
    const tubeBot = H - pad.b - bulbR;
    const tubeH = tubeBot - tubeTop;

    /* tube outline */
    svg.appendChild(svgEl('rect', {
      x: cx - tubeW / 2, y: tubeTop, width: tubeW, height: tubeH,
      rx: tubeW / 2, fill: '#f0f0f0', stroke: '#2b2d42', 'stroke-width': '2',
    }));

    /* bulb */
    svg.appendChild(svgEl('circle', {
      cx, cy: tubeBot + bulbR / 2, r: bulbR,
      fill: '#e63946', stroke: '#2b2d42', 'stroke-width': '2',
    }));

    /* mercury level */
    const range = (s.max - s.min) || 1;
    const frac = Math.max(0, Math.min(1, (s.current - s.min) / range));
    const mercH = frac * (tubeH - tubeW / 2);
    const mercTop = tubeBot - mercH;

    svg.appendChild(svgEl('rect', {
      x: cx - tubeW / 2 + 3, y: mercTop, width: tubeW - 6, height: mercH + bulbR / 2,
      fill: '#e63946', rx: '4',
    }));

    /* scale ticks and labels */
    if (s.showLabels) {
      const numSteps = Math.floor(range / s.step);
      for (let i = 0; i <= numSteps; i++) {
        const tempVal = s.min + i * s.step;
        const f = (tempVal - s.min) / range;
        const y = tubeBot - f * (tubeH - tubeW / 2);
        const tickLen = 10;
        svg.appendChild(svgEl('line', {
          x1: cx + tubeW / 2 + 2, y1: y,
          x2: cx + tubeW / 2 + 2 + tickLen, y2: y,
          stroke: '#2b2d42', 'stroke-width': '1',
        }));
        svg.appendChild(svgText(cx + tubeW / 2 + 16, y + 4, `${tempVal}°${s.unit}`, 10, 'start', { fill: '#555' }));
      }
    }

    /* current value label */
    svg.appendChild(svgText(cx, H - 12, `${s.current}°${s.unit}`, 14, 'middle', { fill: '#e63946', 'font-weight': '700' }));

    return svg;
  },
};

/* ================================================================
   25. DICE
   ================================================================ */
extraTemplates['dice'] = {
  name: 'Dice',
  category: 'Number Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Dice'));
    c.appendChild(row(
      field('Number of dice', numberInput('di-num', 2, 1, 4, 1)),
    ));
    c.appendChild(row(
      field('Values (comma sep)', textInput('di-vals', '3,5')),
    ));
    c.appendChild(row(field('Colour', colourSwatch('di-col', '#ffffff'))));
  },
  readConfig() {
    return {
      numDice: Math.max(1, Math.min(4, val('di-num') || 2)),
      values: (val('di-vals') || '').split(',').map(s => Math.max(1, Math.min(6, parseInt(s.trim()) || 1))),
      colour: val('di-col') || '#ffffff',
    };
  },
  generateSVG(s) {
    const diceSize = 80;
    const gap = 20;
    const pad = 30;
    const n = s.numDice;
    const W = n * diceSize + (n - 1) * gap + pad * 2;
    const H = diceSize + pad * 2;
    const svg = makeSVG(W, H);

    const dotPositions = {
      1: [[0.5, 0.5]],
      2: [[0.25, 0.25], [0.75, 0.75]],
      3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
      4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
      5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
      6: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.5], [0.75, 0.5], [0.25, 0.75], [0.75, 0.75]],
    };

    for (let i = 0; i < n; i++) {
      const dx = pad + i * (diceSize + gap);
      const dy = pad;
      const v = s.values[i] || 1;

      /* die body */
      svg.appendChild(svgEl('rect', {
        x: dx, y: dy, width: diceSize, height: diceSize, rx: '10',
        fill: s.colour, stroke: '#2b2d42', 'stroke-width': '2',
        filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.15))',
      }));

      /* dots */
      const dots = dotPositions[v] || dotPositions[1];
      dots.forEach(([fx, fy]) => {
        svg.appendChild(svgEl('circle', {
          cx: dx + fx * diceSize, cy: dy + fy * diceSize, r: '7',
          fill: '#2b2d42',
        }));
      });
    }

    return svg;
  },
};

/* ================================================================
   26. SPINNER
   ================================================================ */
extraTemplates['spinner'] = {
  name: 'Spinner',
  category: 'Number Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Spinner'));
    c.appendChild(row(
      field('Sectors', numberInput('sp2-n', 4, 2, 8, 1)),
    ));
    c.appendChild(row(
      field('Labels (comma sep)', textInput('sp2-labels', '1,2,3,4')),
    ));
    c.appendChild(row(
      field('Colours (comma sep hex)', textInput('sp2-colours', '#e63946,#4262ff,#2a9d8f,#e9c46a')),
    ));
    c.appendChild(row(checkbox('sp2-equal', 'Equal sectors', true)));
  },
  readConfig() {
    return {
      n: Math.max(2, Math.min(8, val('sp2-n') || 4)),
      labels: (val('sp2-labels') || '').split(',').map(s => s.trim()),
      colours: (val('sp2-colours') || '').split(',').map(s => s.trim()),
      equal: val('sp2-equal'),
    };
  },
  generateSVG(s) {
    const W = 400, H = 400;
    const svg = makeSVG(W, H);
    const cx = W / 2, cy = H / 2, R = 160;

    const sectorAngle = 360 / s.n;
    const defaultColours = ['#e63946', '#4262ff', '#2a9d8f', '#e9c46a', '#f4a261', '#264653', '#d62828', '#8338ec'];

    for (let i = 0; i < s.n; i++) {
      const startDeg = i * sectorAngle - 90;
      const endDeg = (i + 1) * sectorAngle - 90;
      const startRad = degToRad(startDeg);
      const endRad = degToRad(endDeg);
      const x1 = cx + R * Math.cos(startRad);
      const y1 = cy + R * Math.sin(startRad);
      const x2 = cx + R * Math.cos(endRad);
      const y2 = cy + R * Math.sin(endRad);
      const large = sectorAngle > 180 ? 1 : 0;

      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
      const col = s.colours[i] || defaultColours[i % defaultColours.length];
      svg.appendChild(svgEl('path', { d, fill: col, stroke: '#fff', 'stroke-width': '2' }));

      /* label */
      const midDeg = degToRad((startDeg + endDeg) / 2);
      const lr = R * 0.6;
      const lx = cx + lr * Math.cos(midDeg);
      const ly = cy + lr * Math.sin(midDeg);
      svg.appendChild(svgText(lx, ly + 5, s.labels[i] || '', 16, 'middle', { fill: '#fff', 'font-weight': '700' }));
    }

    /* border circle */
    svg.appendChild(svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: '#2b2d42', 'stroke-width': '2.5' }));

    /* centre hub */
    svg.appendChild(svgEl('circle', { cx, cy, r: '12', fill: '#2b2d42', stroke: '#fff', 'stroke-width': '2' }));

    /* pointer (triangle at top) */
    svg.appendChild(svgEl('polygon', {
      points: `${cx},${cy - R - 18} ${cx - 10},${cy - R + 2} ${cx + 10},${cy - R + 2}`,
      fill: '#2b2d42', stroke: '#fff', 'stroke-width': '1',
    }));

    return svg;
  },
};

/* ================================================================
   27. PERCENTAGE BAR
   ================================================================ */
extraTemplates['percentage-bar'] = {
  name: 'Percentage Bar',
  category: 'Number Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Percentage Bar'));
    c.appendChild(row(
      field('Title', textInput('pb-title', 'Budget Breakdown')),
    ));
    c.appendChild(sectionLabel('Segments (label:pct:colour, one per line)'));
    const ta = document.createElement('textarea');
    ta.id = 'pb-segs';
    ta.className = 'cfg-input';
    ta.style.height = '100px';
    ta.style.fontFamily = 'monospace';
    ta.style.fontSize = '11px';
    ta.value = 'Food:35:#e63946\nTransport:20:#4262ff\nRent:30:#2a9d8f\nOther:15:#e9c46a';
    c.appendChild(ta);
  },
  readConfig() {
    const lines = (document.getElementById('pb-segs')?.value || '').split('\n').filter(Boolean);
    const segments = lines.map(l => {
      const parts = l.split(':');
      return {
        label: parts[0]?.trim() || '',
        pct: parseFloat(parts[1]) || 0,
        colour: parts[2]?.trim() || '#ccc',
      };
    });
    return {
      title: val('pb-title') || 'Percentage Bar',
      segments,
    };
  },
  generateSVG(s) {
    const W = 500, H = 120;
    const svg = makeSVG(W, H);
    const barX = 30, barY = 40, barW = W - 60, barH = 36;

    svg.appendChild(svgText(W / 2, 24, s.title, 14, 'middle', { fill: '#333', 'font-weight': '700' }));

    /* normalise to 100% */
    const total = s.segments.reduce((a, seg) => a + seg.pct, 0) || 100;
    let cx = barX;

    s.segments.forEach(seg => {
      const w = (seg.pct / total) * barW;
      svg.appendChild(svgEl('rect', {
        x: cx, y: barY, width: Math.max(w, 1), height: barH, fill: seg.colour,
      }));
      /* label inside if wide enough */
      if (w > 40) {
        svg.appendChild(svgText(cx + w / 2, barY + barH / 2 + 1, seg.label, 10, 'middle', { fill: '#fff', 'font-weight': '600' }));
        svg.appendChild(svgText(cx + w / 2, barY + barH / 2 + 13, `${Math.round(seg.pct)}%`, 9, 'middle', { fill: 'rgba(255,255,255,0.8)' }));
      }
      cx += w;
    });

    /* border */
    svg.appendChild(svgEl('rect', {
      x: barX, y: barY, width: barW, height: barH,
      fill: 'none', stroke: '#2b2d42', 'stroke-width': '1.5', rx: '4',
    }));

    /* legend below */
    let lx = barX;
    s.segments.forEach(seg => {
      svg.appendChild(svgEl('rect', { x: lx, y: barY + barH + 12, width: 10, height: 10, rx: '2', fill: seg.colour }));
      svg.appendChild(svgText(lx + 14, barY + barH + 21, `${seg.label} (${Math.round(seg.pct)}%)`, 9, 'start', { fill: '#555' }));
      lx += seg.label.length * 6 + 50;
    });

    return svg;
  },
};

/* ================================================================
   28. NUMBER PATTERN
   ================================================================ */
extraTemplates['number-pattern'] = {
  name: 'Number Pattern',
  category: 'Number Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Pattern'));
    c.appendChild(row(
      field('Terms', numberInput('np-terms', 5, 4, 8, 1)),
    ));
    c.appendChild(row(
      field('Values (comma, use ? for blank)', textInput('np-vals', '3,7,11,?,19')),
    ));
    c.appendChild(row(
      checkbox('np-diffs', 'Show differences', true),
      field('Difference label', textInput('np-dlabel', '+4')),
    ));
  },
  readConfig() {
    return {
      terms: val('np-terms') || 5,
      values: (val('np-vals') || '').split(',').map(s => s.trim()),
      showDiffs: val('np-diffs'),
      diffLabel: val('np-dlabel') || '',
    };
  },
  generateSVG(s) {
    const boxW = 56, boxH = 44, gap = 36;
    const n = Math.min(s.terms, s.values.length || s.terms);
    const pad = 30;
    const arrowH = s.showDiffs ? 40 : 0;
    const W = n * boxW + (n - 1) * gap + pad * 2;
    const H = boxH + arrowH + pad * 2 + 10;
    const svg = makeSVG(W, H);
    const y = pad + arrowH;

    for (let i = 0; i < n; i++) {
      const x = pad + i * (boxW + gap);
      const v = s.values[i] || '';
      const isBlank = v === '?';

      svg.appendChild(svgEl('rect', {
        x, y, width: boxW, height: boxH, rx: '8',
        fill: isBlank ? '#fff3cd' : '#eef2ff',
        stroke: isBlank ? '#ffc107' : '#4262ff',
        'stroke-width': '2',
      }));
      svg.appendChild(svgText(x + boxW / 2, y + boxH / 2 + 6, isBlank ? '?' : v, 18, 'middle', {
        fill: isBlank ? '#e65100' : '#333', 'font-weight': '700',
      }));

      /* arrow to next box */
      if (i < n - 1 && s.showDiffs) {
        const ax1 = x + boxW + 4;
        const ax2 = x + boxW + gap - 4;
        const ay = y + boxH / 2;
        svg.appendChild(svgEl('path', {
          d: `M ${ax1} ${ay} C ${(ax1 + ax2) / 2} ${ay - 30}, ${(ax1 + ax2) / 2} ${ay - 30}, ${ax2} ${ay}`,
          fill: 'none', stroke: '#e63946', 'stroke-width': '1.5',
        }));
        arrowHead(svg, ax2, ay, 0, 6, '#e63946');
        svg.appendChild(svgText((ax1 + ax2) / 2, ay - 22, s.diffLabel, 11, 'middle', { fill: '#e63946', 'font-weight': '600' }));
      }
    }

    return svg;
  },
};

/* ================================================================
   29. TRANSFORMATION GRID
   ================================================================ */
extraTemplates['transformation-grid'] = {
  name: 'Transformation Grid',
  category: 'Advanced/IB',
  renderConfig(c) {
    c.appendChild(sectionLabel('Grid'));
    c.appendChild(row(
      field('Grid size', numberInput('tg-size', 12, 6, 20, 1)),
    ));
    c.appendChild(row(
      checkbox('tg-obj', 'Show object', true),
    ));
    c.appendChild(row(
      field('Object vertices (x,y pairs)', textInput('tg-verts', '1,1 3,1 3,3 1,3')),
    ));
    c.appendChild(sectionLabel('Transformation'));
    c.appendChild(row(
      field('Type', select('tg-type', [
        ['reflection', 'Reflection'], ['rotation', 'Rotation'],
        ['translation', 'Translation'], ['enlargement', 'Enlargement'],
      ])),
    ));
    c.appendChild(row(
      field('Params (see tooltip)', textInput('tg-params', 'x=0', 'reflection: x=N or y=N; rotation: angle,cx,cy; translation: dx,dy; enlargement: sf,cx,cy')),
    ));
  },
  readConfig() {
    const vertStr = val('tg-verts') || '1,1 3,1 3,3 1,3';
    const verts = vertStr.split(/\s+/).map(s => {
      const [x, y] = s.split(',').map(Number);
      return { x: x || 0, y: y || 0 };
    });
    return {
      size: val('tg-size') || 12,
      showObj: val('tg-obj'),
      verts,
      type: val('tg-type') || 'reflection',
      params: val('tg-params') || '',
    };
  },
  generateSVG(s) {
    const cell = 30;
    const half = Math.floor(s.size / 2);
    const pad = 40;
    const W = s.size * cell + pad * 2;
    const H = s.size * cell + pad * 2;
    const svg = makeSVG(W, H);

    const toSVG = (gx, gy) => ({
      x: pad + (gx + half) * cell,
      y: pad + (half - gy) * cell,
    });

    /* grid */
    for (let i = 0; i <= s.size; i++) {
      const isAxis = i === half;
      svg.appendChild(svgEl('line', {
        x1: pad + i * cell, y1: pad, x2: pad + i * cell, y2: pad + s.size * cell,
        stroke: isAxis ? '#2b2d42' : '#e8e8e8', 'stroke-width': isAxis ? '1.5' : '0.5',
      }));
      svg.appendChild(svgEl('line', {
        x1: pad, y1: pad + i * cell, x2: pad + s.size * cell, y2: pad + i * cell,
        stroke: isAxis ? '#2b2d42' : '#e8e8e8', 'stroke-width': isAxis ? '1.5' : '0.5',
      }));
      /* axis labels */
      const v = i - half;
      if (v !== 0) {
        const axPt = toSVG(v, 0);
        svg.appendChild(svgText(axPt.x, axPt.y + 14, String(v), 8, 'middle', { fill: '#999' }));
        const ayPt = toSVG(0, v);
        svg.appendChild(svgText(ayPt.x - 12, ayPt.y + 4, String(v), 8, 'middle', { fill: '#999' }));
      }
    }

    /* axis labels x, y */
    svg.appendChild(svgText(W - pad + 14, toSVG(0, 0).y + 4, 'x', 12, 'start', { fill: '#888' }));
    svg.appendChild(svgText(toSVG(0, 0).x + 8, pad - 8, 'y', 12, 'start', { fill: '#888' }));

    /* object shape */
    if (s.showObj && s.verts.length >= 2) {
      const pts = s.verts.map(v => toSVG(v.x, v.y));
      svg.appendChild(svgEl('polygon', {
        points: pts.map(p => `${p.x},${p.y}`).join(' '),
        fill: 'rgba(66,98,255,0.2)', stroke: '#4262ff', 'stroke-width': '2',
      }));
      s.verts.forEach((v, i) => {
        const p = toSVG(v.x, v.y);
        svg.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: '3', fill: '#4262ff' }));
      });
    }

    /* transformed shape */
    const transformed = applyTransformation(s.verts, s.type, s.params);
    if (transformed.length >= 2) {
      const pts2 = transformed.map(v => toSVG(v.x, v.y));
      svg.appendChild(svgEl('polygon', {
        points: pts2.map(p => `${p.x},${p.y}`).join(' '),
        fill: 'rgba(230,57,70,0.2)', stroke: '#e63946', 'stroke-width': '2', 'stroke-dasharray': '5,3',
      }));
      transformed.forEach(v => {
        const p = toSVG(v.x, v.y);
        svg.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: '3', fill: '#e63946' }));
      });
    }

    /* mirror line / centre point depending on type */
    if (s.type === 'reflection') {
      const param = s.params.trim();
      if (param.startsWith('x=')) {
        const xv = parseFloat(param.slice(2)) || 0;
        const p1 = toSVG(xv, -half);
        const p2 = toSVG(xv, half);
        svg.appendChild(svgEl('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#e63946', 'stroke-width': '1.5', 'stroke-dasharray': '6,4' }));
      } else if (param.startsWith('y=')) {
        const yv = parseFloat(param.slice(2)) || 0;
        const p1 = toSVG(-half, yv);
        const p2 = toSVG(half, yv);
        svg.appendChild(svgEl('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#e63946', 'stroke-width': '1.5', 'stroke-dasharray': '6,4' }));
      }
    }

    /* legend */
    svg.appendChild(svgEl('rect', { x: pad, y: H - 20, width: 10, height: 10, fill: 'rgba(66,98,255,0.4)' }));
    svg.appendChild(svgText(pad + 14, H - 12, 'Object', 9, 'start', { fill: '#4262ff' }));
    svg.appendChild(svgEl('rect', { x: pad + 70, y: H - 20, width: 10, height: 10, fill: 'rgba(230,57,70,0.4)' }));
    svg.appendChild(svgText(pad + 84, H - 12, 'Image', 9, 'start', { fill: '#e63946' }));

    return svg;
  },
};

function applyTransformation(verts, type, params) {
  const p = params.trim();
  if (type === 'reflection') {
    if (p.startsWith('x=')) {
      const xLine = parseFloat(p.slice(2)) || 0;
      return verts.map(v => ({ x: 2 * xLine - v.x, y: v.y }));
    }
    if (p.startsWith('y=')) {
      const yLine = parseFloat(p.slice(2)) || 0;
      return verts.map(v => ({ x: v.x, y: 2 * yLine - v.y }));
    }
  }
  if (type === 'rotation') {
    const parts = p.split(',').map(Number);
    const angle = degToRad(parts[0] || 90);
    const cx = parts[1] || 0;
    const cy = parts[2] || 0;
    return verts.map(v => {
      const dx = v.x - cx, dy = v.y - cy;
      return {
        x: cx + dx * Math.cos(angle) - dy * Math.sin(angle),
        y: cy + dx * Math.sin(angle) + dy * Math.cos(angle),
      };
    });
  }
  if (type === 'translation') {
    const parts = p.split(',').map(Number);
    const dx = parts[0] || 0;
    const dy = parts[1] || 0;
    return verts.map(v => ({ x: v.x + dx, y: v.y + dy }));
  }
  if (type === 'enlargement') {
    const parts = p.split(',').map(Number);
    const sf = parts[0] || 2;
    const cx = parts[1] || 0;
    const cy = parts[2] || 0;
    return verts.map(v => ({
      x: cx + sf * (v.x - cx),
      y: cy + sf * (v.y - cy),
    }));
  }
  return verts;
}

/* ================================================================
   30. ARGAND DIAGRAM
   ================================================================ */
extraTemplates['argand-diagram'] = {
  name: 'Argand Diagram',
  category: 'Advanced/IB',
  renderConfig(c) {
    c.appendChild(sectionLabel('Argand Diagram'));
    c.appendChild(row(
      checkbox('ad-axes', 'Show axes', true),
    ));
    c.appendChild(row(
      field('Real range', numberInput('ad-xr', 5, 1, 20, 1)),
      field('Imaginary range', numberInput('ad-yr', 5, 1, 20, 1)),
    ));
    c.appendChild(sectionLabel('Points (label:real:imag, one per line)'));
    const ta = document.createElement('textarea');
    ta.id = 'ad-pts';
    ta.className = 'cfg-input';
    ta.style.height = '80px';
    ta.style.fontFamily = 'monospace';
    ta.style.fontSize = '11px';
    ta.value = 'z₁:3:2\nz₂:-1:4\nz₃:2:-3';
    c.appendChild(ta);
  },
  readConfig() {
    const lines = (document.getElementById('ad-pts')?.value || '').split('\n').filter(Boolean);
    const points = lines.map(l => {
      const parts = l.split(':');
      return {
        label: parts[0]?.trim() || '',
        real: parseFloat(parts[1]) || 0,
        imag: parseFloat(parts[2]) || 0,
      };
    });
    return {
      showAxes: val('ad-axes'),
      xRange: val('ad-xr') || 5,
      yRange: val('ad-yr') || 5,
      points,
    };
  },
  generateSVG(s) {
    const W = 460, H = 460;
    const svg = makeSVG(W, H);
    const pad = 50;
    const gw = W - pad * 2;
    const gh = H - pad * 2;
    const cx = W / 2, cy = H / 2;

    const toSVGx = (r) => cx + (r / s.xRange) * (gw / 2);
    const toSVGy = (i) => cy - (i / s.yRange) * (gh / 2);

    /* grid lines */
    for (let v = -s.xRange; v <= s.xRange; v++) {
      const sx = toSVGx(v);
      svg.appendChild(svgEl('line', {
        x1: sx, y1: pad, x2: sx, y2: H - pad,
        stroke: v === 0 ? '#2b2d42' : '#eee',
        'stroke-width': v === 0 ? '1.5' : '0.5',
      }));
      if (v !== 0) svg.appendChild(svgText(sx, cy + 16, String(v), 9, 'middle', { fill: '#999' }));
    }
    for (let v = -s.yRange; v <= s.yRange; v++) {
      const sy = toSVGy(v);
      svg.appendChild(svgEl('line', {
        x1: pad, y1: sy, x2: W - pad, y2: sy,
        stroke: v === 0 ? '#2b2d42' : '#eee',
        'stroke-width': v === 0 ? '1.5' : '0.5',
      }));
      if (v !== 0) svg.appendChild(svgText(cx - 14, sy + 4, String(v), 9, 'end', { fill: '#999' }));
    }

    /* axis labels */
    svg.appendChild(svgText(W - pad + 16, cy + 4, 'Re', 12, 'start', { fill: '#555', 'font-weight': '600' }));
    svg.appendChild(svgText(cx + 8, pad - 12, 'Im', 12, 'start', { fill: '#555', 'font-weight': '600' }));
    arrowHead(svg, W - pad, cy, 0, 8, '#2b2d42');
    arrowHead(svg, cx, pad, -Math.PI / 2, 8, '#2b2d42');

    /* points */
    const ptColours = ['#e63946', '#4262ff', '#2a9d8f', '#e9c46a', '#8338ec'];
    s.points.forEach((pt, i) => {
      const px = toSVGx(pt.real);
      const py = toSVGy(pt.imag);
      const col = ptColours[i % ptColours.length];

      /* vector line from origin */
      svg.appendChild(svgEl('line', {
        x1: cx, y1: cy, x2: px, y2: py,
        stroke: col, 'stroke-width': '1.5', 'stroke-dasharray': '4,3',
      }));

      /* point */
      svg.appendChild(svgEl('circle', { cx: px, cy: py, r: '5', fill: col, stroke: '#fff', 'stroke-width': '1.5' }));

      /* label */
      const sign = pt.imag >= 0 ? '+' : '';
      svg.appendChild(svgText(px + 10, py - 8, `${pt.label} (${pt.real}${sign}${pt.imag}i)`, 10, 'start', { fill: col, 'font-weight': '600' }));
    });

    return svg;
  },
};

/* ── Export ─────────────────────────────────────────────── */
export { extraTemplates };
