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

function select(id, options, defaultVal) {
  const sel = document.createElement('select');
  sel.className = 'cfg-select';
  sel.id = id;
  options.forEach((opt) => {
    const o = document.createElement('option');
    const [v, l] = Array.isArray(opt) ? opt : [opt.v, opt.l];
    o.value = v;
    o.textContent = l;
    sel.appendChild(o);
  });
  if (defaultVal !== undefined) sel.value = defaultVal;
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
        svg.appendChild(svgText(lx, ly, `${Math.round(intAngle)}°`, 14, 'middle', { fill: '#e63946', 'font-weight': '700' }));
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
      const lr = arcR + 20;
      svg.appendChild(svgText(cx + lr * Math.cos(midA), cy + lr * Math.sin(midA), `${Math.round(s.angle)}°`, 16, 'middle', { fill: '#e63946', 'font-weight': '700' }));
    }

    if (s.showArc) {
      const arcLen = (s.angle / 360) * 2 * Math.PI * s.radius;
      const midA = degToRad(-90);
      const lr = s.radius + 24;
      svg.appendChild(svgText(cx + lr * Math.cos(midA), cy + lr * Math.sin(midA), `arc = ${arcLen.toFixed(1)}`, 14, 'middle', { fill: '#444', 'font-weight': '600' }));
    }

    /* radii labels */
    svg.appendChild(svgText((cx + sx) / 2 - 16, (cy + sy) / 2, `r = ${s.radius}`, 14, 'middle', { fill: '#444', 'font-weight': '600' }));

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
    c.appendChild(sectionLabel('Highlight Angle Pairs'));
    c.appendChild(row(
      field('Highlight', select('pt-highlight', [
        ['none', 'None'],
        ['alternate', 'Alternate angles'],
        ['corresponding', 'Corresponding angles'],
        ['co-interior', 'Co-interior angles'],
        ['all', 'All angles'],
      ])),
    ));
    c.appendChild(row(
      field('Highlight colour', colourSwatch('pt-hl-colour', '#4285f4')),
    ));
    c.appendChild(row(
      checkbox('pt-show-relationship', 'Show angle relationship text', false),
    ));
  },
  readConfig() {
    return {
      showLabels: val('pt-labels'),
      style: val('pt-style') || 'letters',
      angle: val('pt-angle') || 65,
      highlight: val('pt-highlight') || 'none',
      hlColour: val('pt-hl-colour') || '#4285f4',
      showRelationship: val('pt-show-relationship'),
    };
  },
  generateSVG(s) {
    const W = 480, H = 400;
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

    /* --- Highlight angle pair wedges --- */
    const ang = Math.round(s.angle);
    const co = 180 - ang;
    const hlCol = s.hlColour || '#4285f4';

    /*
     * Angles a-h at two intersection points.
     * Convention (measuring CCW from the positive-x direction of the parallel line):
     *   a = top-left of upper intersection   (angle = transversal angle, between line-left and transversal-up)
     *   b = top-right                         (supplement)
     *   c = bottom-right                      (vertically opposite a => same as a's value)
     *   d = bottom-left                       (supplement)
     *   e-h mirror a-d at lower intersection.
     *
     * The transversal goes up-left at angle s.angle from horizontal.
     * Angle wedge directions (startDeg, endDeg) measured in SVG coords (CW from right):
     *   At upper intersection (ix1, y1):
     *     a: from transversal-up direction to line-left   => from (180 + s.angle) to 180  -- but we need SVG angles.
     *   The transversal direction upward in SVG: angle = -(s.angle) from horizontal = -s.angle
     *   The transversal direction downward in SVG: 180 - s.angle
     *
     * SVG angle conventions: 0 = right, 90 = down, 180 = left, 270 = up
     * Transversal up-right direction in SVG:  -s.angle  (i.e. 360 - s.angle)
     * Transversal down-left direction in SVG: 180 - s.angle
     *
     * At upper intersection (ix1, y1) - four angles:
     *   a (top-left):      from 180 to (360 - s.angle)      => this is the acute angle = s.angle
     *   b (top-right):     from (360 - s.angle) to 360      => supplement = 180 - s.angle
     *   c (bottom-right):  from 0 to (180 - s.angle)        => = 180 - s.angle ... wait.
     *
     * Let me just define them carefully.
     * The transversal "up" direction (towards top of SVG) has SVG angle = -s.angle = (360 - s.angle).
     * The transversal "down" direction = (180 - s.angle).
     * The parallel line goes left (180) and right (0/360).
     *
     * Four angles at upper intersection:
     *   a: between left-ray (180) and up-ray (360-s.angle), measured going CW from left to up
     *      => startDeg=180, sweep CW to (360-s.angle) => endDeg=360-s.angle
     *      => angular size = (360-s.angle) - 180 = 180 - s.angle  ... that's the co-interior angle.
     *
     * Actually let me just use the simple mapping. The transversal angle from horizontal = s.angle.
     * At the top intersection going clockwise from the right ray:
     *   angle from right(0) to transversal-down(180-s.angle) = 180-s.angle  [this is 'c']
     *   angle from transversal-down(180-s.angle) to left(180) = s.angle     [this is 'd']
     *   angle from left(180) to transversal-up(360-s.angle) = 180-s.angle   [this is 'a']
     *   angle from transversal-up(360-s.angle) to right(360) = s.angle      [this is 'b']
     *
     * Correcting labels to match convention (a=top-left, b=top-right, c=bottom-right, d=bottom-left):
     *   a (top-left):     left(180) -> up(360-s.angle)       CW sweep = 180-s.angle
     *   b (top-right):    up(360-s.angle) -> right(360)      CW sweep = s.angle
     *   c (bottom-right): right(0) -> down(180-s.angle)      CW sweep = 180-s.angle
     *   d (bottom-left):  down(180-s.angle) -> left(180)     CW sweep = s.angle
     */
    const transUp = 360 - s.angle;   /* SVG angle of transversal going "up" */
    const transDn = 180 - s.angle;   /* SVG angle of transversal going "down" */

    /* Each angle: [startDeg, endDeg] going CW in SVG space. */
    /* Index matches letters: 0=a, 1=b, 2=c, 3=d (upper), 4=e, 5=f, 6=g, 7=h (lower) */
    const angleWedges = [
      /* upper intersection */
      { cx: ix1, cy: y1, start: 180,     end: transUp },  /* a: 180-angle degrees */
      { cx: ix1, cy: y1, start: transUp, end: 360 },      /* b: angle degrees */
      { cx: ix1, cy: y1, start: 0,       end: transDn },  /* c: 180-angle degrees */
      { cx: ix1, cy: y1, start: transDn, end: 180 },      /* d: angle degrees */
      /* lower intersection */
      { cx: ix2, cy: y2, start: 180,     end: transUp },  /* e: 180-angle degrees */
      { cx: ix2, cy: y2, start: transUp, end: 360 },      /* f: angle degrees */
      { cx: ix2, cy: y2, start: 0,       end: transDn },  /* g: 180-angle degrees */
      { cx: ix2, cy: y2, start: transDn, end: 180 },      /* h: angle degrees */
    ];

    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const vals = [co, ang, co, ang, co, ang, co, ang]; /* size of each angle in degrees */

    /* Determine which angles to highlight */
    let highlightIndices = [];
    if (s.highlight === 'alternate') {
      highlightIndices = [0, 6, 3, 5]; /* a=g, d=f */
    } else if (s.highlight === 'corresponding') {
      highlightIndices = [0, 4, 1, 5, 2, 6, 3, 7]; /* a=e, b=f, c=g, d=h */
    } else if (s.highlight === 'co-interior') {
      highlightIndices = [2, 4, 3, 5]; /* c+e=180, d+f=180 */
    } else if (s.highlight === 'all') {
      highlightIndices = [0, 1, 2, 3, 4, 5, 6, 7];
    }

    /* Draw highlighted angle wedges */
    const arcRadius = 28;
    const hlSet = new Set(highlightIndices);
    if (hlSet.size > 0) {
      /* Parse highlight colour and create semi-transparent version */
      const fillCol = hlCol + '33'; /* hex + ~20% alpha */

      angleWedges.forEach((w, i) => {
        if (!hlSet.has(i)) return;
        /* Draw a filled wedge (pie slice) */
        const sRad = degToRad(w.start);
        const eRad = degToRad(w.end);
        const sx = w.cx + arcRadius * Math.cos(sRad);
        const sy = w.cy + arcRadius * Math.sin(sRad);
        const ex = w.cx + arcRadius * Math.cos(eRad);
        const ey = w.cy + arcRadius * Math.sin(eRad);
        let sweep = w.end - w.start;
        if (sweep < 0) sweep += 360;
        const largeArc = sweep > 180 ? 1 : 0;
        const d = `M ${w.cx} ${w.cy} L ${sx} ${sy} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${ex} ${ey} Z`;
        svg.appendChild(svgEl('path', { d, fill: fillCol, stroke: hlCol, 'stroke-width': '1.5' }));
      });
    }

    if (s.showLabels) {
      /* angle label positions */
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
        const isHL = hlSet.has(i);
        const txt = s.style === 'letters' ? letters[i] : `${vals[i]}°`;
        const fill = isHL ? hlCol : '#e63946';
        const weight = isHL ? '800' : '600';
        svg.appendChild(svgText(p.x, p.y, txt, 14, 'middle', { fill, 'font-weight': weight }));
      });

      /* Annotations - always show the standard summary at the bottom */
      const annotations = [
        { txt: `Alternate: ${s.style === 'letters' ? 'a = g, d = f' : `${co}° = ${co}°, ${ang}° = ${ang}°`}`, y: H - 50 },
        { txt: `Corresponding: ${s.style === 'letters' ? 'a = e, b = f, c = g, d = h' : `${co}°, ${ang}°`}`, y: H - 34 },
        { txt: `Co-interior: ${s.style === 'letters' ? 'c + e = 180°, d + f = 180°' : `${co}° + ${co}° = 180°, ${ang}° + ${ang}° = 180°`}`, y: H - 18 },
      ];
      annotations.forEach(ann => {
        svg.appendChild(svgText(W / 2, ann.y, ann.txt, 10, 'middle', { fill: '#555' }));
      });
    }

    /* Relationship text next to highlighted pairs */
    if (s.showRelationship && s.highlight !== 'none') {
      const relTexts = [];
      if (s.highlight === 'alternate' || s.highlight === 'all') {
        relTexts.push(`a = g (alternate)`);
        relTexts.push(`d = f (alternate)`);
      }
      if (s.highlight === 'corresponding' || s.highlight === 'all') {
        relTexts.push(`a = e (corresponding)`);
        relTexts.push(`b = f (corresponding)`);
        relTexts.push(`c = g (corresponding)`);
        relTexts.push(`d = h (corresponding)`);
      }
      if (s.highlight === 'co-interior' || s.highlight === 'all') {
        relTexts.push(`c + e = 180° (co-interior)`);
        relTexts.push(`d + f = 180° (co-interior)`);
      }
      const relStartY = 22;
      relTexts.forEach((txt, i) => {
        svg.appendChild(svgText(W - 10, relStartY + i * 16, txt, 12, 'end', { fill: hlCol, 'font-weight': '600' }));
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
    c.appendChild(sectionLabel('Circle Theorem'));
    c.appendChild(row(
      field('Theorem', select('ct-type', [
        {v:'centre_circumference', l:'Angle at centre = 2× circumference'},
        {v:'same_segment',        l:'Angles in the same segment'},
        {v:'semicircle',          l:'Angle in a semicircle (90°)'},
        {v:'cyclic_quad',         l:'Cyclic quadrilateral (180°)'},
        {v:'tangent_radius',      l:'Tangent–radius (90°)'},
        {v:'alt_segment',         l:'Alternate segment theorem'},
        {v:'two_tangents',        l:'Two tangents from external point'},
        {v:'chord_bisect',        l:'Perpendicular from centre bisects chord'},
      ], 'centre_circumference')),
    ));
    c.appendChild(row(
      checkbox('ct-labels', 'Show angle labels', true),
      checkbox('ct-title',  'Show theorem title', true),
    ));
  },
  readConfig() {
    return {
      type:      val('ct-type')   || 'centre_circumference',
      labels:    val('ct-labels'),
      showTitle: val('ct-title'),
    };
  },
  generateSVG(s) {
    const W = 560, H = 500;
    const svg = makeSVG(W, H);
    const cx = W / 2, cy = H / 2 - 10, R = 170;

    /* ── helpers ── */
    const pt = (deg) => ({
      x: cx + R * Math.cos(degToRad(deg)),
      y: cy + R * Math.sin(degToRad(deg)),
    });
    const seg = (p1, p2, col, w) => svgEl('line', {
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
      stroke: col || '#4262ff', 'stroke-width': w || '2',
    });
    const dot = (p, lbl, ox, oy) => {
      svg.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: '5', fill: '#4262ff' }));
      if (lbl) svg.appendChild(svgText(p.x + (ox||0), p.y + (oy||0), lbl, 14, 'middle',
        { fill: '#1e293b', 'font-weight': '700' }));
    };
    const odot = (p, lbl, ox, oy) => {  /* centre dot */
      svg.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: '5', fill: '#e63946' }));
      if (lbl) svg.appendChild(svgText(p.x + (ox||0), p.y + (oy||0), lbl, 14, 'middle',
        { fill: '#1e293b', 'font-weight': '700' }));
    };
    /* right-angle marker at vertex V between rays to P1 and P2 */
    const rightAngle = (V, P1, P2, sz) => {
      const s2 = sz || 12;
      const d1 = { x: P1.x - V.x, y: P1.y - V.y };
      const d2 = { x: P2.x - V.x, y: P2.y - V.y };
      const l1 = Math.sqrt(d1.x*d1.x + d1.y*d1.y);
      const l2 = Math.sqrt(d2.x*d2.x + d2.y*d2.y);
      const u1 = { x: d1.x/l1*s2, y: d1.y/l1*s2 };
      const u2 = { x: d2.x/l2*s2, y: d2.y/l2*s2 };
      svg.appendChild(svgEl('path', {
        d: `M ${V.x+u1.x} ${V.y+u1.y} L ${V.x+u1.x+u2.x} ${V.y+u1.y+u2.y} L ${V.x+u2.x} ${V.y+u2.y}`,
        fill: 'none', stroke: '#e63946', 'stroke-width': '1.8',
      }));
    };
    const lbl = s.labels;

    /* ── draw circle ── */
    svg.appendChild(svgEl('circle', {
      cx, cy, r: R, fill: '#f8faff', stroke: '#2b2d42', 'stroke-width': '2.5',
    }));

    let title = '';

    /* ════════════════════════════════════════════
       1. Angle at centre = 2 × angle at circumference
       ════════════════════════════════════════════ */
    if (s.type === 'centre_circumference') {
      const A = pt(210), B = pt(330), C = pt(75);
      const O = { x: cx, y: cy };
      /* chords from circumference point C */
      svg.appendChild(seg(A, C, '#4262ff', '2'));
      svg.appendChild(seg(B, C, '#4262ff', '2'));
      /* radii from centre O */
      svg.appendChild(seg(A, O, '#e63946', '2'));
      svg.appendChild(seg(B, O, '#e63946', '2'));
      /* angle arcs */
      if (lbl) {
        /* circumference angle at C — between CA and CB */
        const aC = radToDeg(Math.atan2(A.y - C.y, A.x - C.x));
        const bC = radToDeg(Math.atan2(B.y - C.y, B.x - B.y));
        drawAngleArc(svg, C.x, C.y,
          radToDeg(Math.atan2(A.y-C.y, A.x-C.x)),
          radToDeg(Math.atan2(B.y-C.y, B.x-C.x)), 28, 'x', 11);
        /* centre angle at O — between OA and OB */
        drawAngleArc(svg, O.x, O.y,
          radToDeg(Math.atan2(A.y-O.y, A.x-O.x)),
          radToDeg(Math.atan2(B.y-O.y, B.x-O.x)), 32, '2x', 11);
      }
      dot(A, 'A', -18, 0);
      dot(B, 'B',  18, 0);
      dot(C, 'C',   0,-18);
      odot(O, 'O', -16, 0);
      title = 'Angle at centre = 2 × angle at circumference';
    }

    /* ════════════════════════════════════════════
       2. Angles in the same segment are equal
       ════════════════════════════════════════════ */
    if (s.type === 'same_segment') {
      const A = pt(200), B = pt(340);
      const C = pt(70), D = pt(110);
      /* chord AB */
      svg.appendChild(seg(A, B, '#888', '1.5'));
      /* two inscribed angles subtending AB */
      svg.appendChild(seg(A, C, '#4262ff', '2'));
      svg.appendChild(seg(B, C, '#4262ff', '2'));
      svg.appendChild(seg(A, D, '#e63946', '2'));
      svg.appendChild(seg(B, D, '#e63946', '2'));
      if (lbl) {
        drawAngleArc(svg, C.x, C.y,
          radToDeg(Math.atan2(A.y-C.y, A.x-C.x)),
          radToDeg(Math.atan2(B.y-C.y, B.x-C.x)), 28, 'x', 11);
        drawAngleArc(svg, D.x, D.y,
          radToDeg(Math.atan2(A.y-D.y, A.x-D.x)),
          radToDeg(Math.atan2(B.y-D.y, B.x-D.x)), 28, 'x', 11);
      }
      dot(A, 'A', -18, 4);
      dot(B, 'B',  18, 4);
      dot(C, 'C',   0,-18);
      dot(D, 'D',   0,-18);
      title = 'Angles in the same segment are equal';
    }

    /* ════════════════════════════════════════════
       3. Angle in a semicircle = 90°
       ════════════════════════════════════════════ */
    if (s.type === 'semicircle') {
      const A = pt(180), B = pt(0), C = pt(300);
      /* diameter */
      svg.appendChild(seg(A, B, '#888', '2'));
      /* centre dot on diameter */
      svg.appendChild(svgEl('circle', { cx, cy, r:'4', fill:'#e63946' }));
      svg.appendChild(svgText(cx, cy - 12, 'O', 13, 'middle',
        { fill: '#e63946', 'font-weight': '700' }));
      svg.appendChild(seg(A, C, '#4262ff', '2'));
      svg.appendChild(seg(B, C, '#4262ff', '2'));
      if (lbl) rightAngle(C, A, B);
      dot(A, 'A', -18, 0);
      dot(B, 'B',  18, 0);
      dot(C, 'C',  10, 18);
      title = 'Angle in a semicircle = 90°';
    }

    /* ════════════════════════════════════════════
       4. Cyclic quadrilateral
       ════════════════════════════════════════════ */
    if (s.type === 'cyclic_quad') {
      const A = pt(220), B = pt(320), C = pt(40), D = pt(140);
      svg.appendChild(seg(A, B, '#4262ff', '2'));
      svg.appendChild(seg(B, C, '#4262ff', '2'));
      svg.appendChild(seg(C, D, '#4262ff', '2'));
      svg.appendChild(seg(D, A, '#4262ff', '2'));
      if (lbl) {
        /* angles at A and C are opposite */
        drawAngleArc(svg, A.x, A.y,
          radToDeg(Math.atan2(B.y-A.y, B.x-A.x)),
          radToDeg(Math.atan2(D.y-A.y, D.x-A.x)), 28, 'α', 11);
        drawAngleArc(svg, C.x, C.y,
          radToDeg(Math.atan2(B.y-C.y, B.x-C.x)),
          radToDeg(Math.atan2(D.y-C.y, D.x-C.x)), 28, 'β', 11);
        svg.appendChild(svgText(cx, cy + R + 28, 'α + β = 180°', 13, 'middle',
          { fill: '#e63946', 'font-weight': '700' }));
      }
      dot(A, 'A', -18,  4);
      dot(B, 'B',   4,  18);
      dot(C, 'C',  18, -4);
      dot(D, 'D',  -4,-18);
      title = 'Opposite angles in a cyclic quadrilateral sum to 180°';
    }

    /* ════════════════════════════════════════════
       5. Tangent–radius = 90°
       ════════════════════════════════════════════ */
    if (s.type === 'tangent_radius') {
      /* radius to the right, tangent vertical */
      const P = pt(0);
      const O = { x: cx, y: cy };
      const tLen = 160;
      /* tangent line (vertical at P) */
      svg.appendChild(seg({ x: P.x, y: P.y - tLen }, { x: P.x, y: P.y + tLen }, '#4262ff', '2.5'));
      /* radius */
      svg.appendChild(seg(O, P, '#e63946', '2.5'));
      /* right-angle marker: arms go left (towards O) and up (along tangent) */
      if (lbl) rightAngle(P, O, { x: P.x, y: P.y - 50 });
      odot(O, 'O', -16, 0);
      dot(P, 'P', 20, 0);
      /* "tangent" label */
      svg.appendChild(svgText(P.x + 14, P.y - tLen + 14, 'tangent', 12, 'start',
        { fill: '#4262ff', 'font-weight': '600' }));
      title = 'The tangent to a circle is perpendicular to the radius';
    }

    /* ════════════════════════════════════════════
       6. Alternate segment theorem
       ════════════════════════════════════════════ */
    if (s.type === 'alt_segment') {
      /* chord from P (bottom, ~pt 160°) to Q (top-right, ~pt 40°).
         Tangent at P is perpendicular to radius OP. */
      const P = pt(160), Q = pt(40), T = pt(290);
      const O = { x: cx, y: cy };
      /* tangent at P: perpendicular to OP */
      const radAngle = degToRad(160);
      const tDir = { x: -Math.sin(radAngle), y: Math.cos(radAngle) };
      const tLen = 150;
      const t1 = { x: P.x + tLen * tDir.x, y: P.y + tLen * tDir.y };
      const t2 = { x: P.x - tLen * tDir.x, y: P.y - tLen * tDir.y };
      svg.appendChild(seg(t1, t2, '#e63946', '2.5'));
      /* chord PQ */
      svg.appendChild(seg(P, Q, '#4262ff', '2'));
      /* angle in alternate segment: T in the major arc */
      svg.appendChild(seg(T, P, '#059669', '2'));
      svg.appendChild(seg(T, Q, '#059669', '2'));
      if (lbl) {
        /* angle between tangent and chord at P */
        drawAngleArc(svg, P.x, P.y,
          radToDeg(Math.atan2(t2.y-P.y, t2.x-P.x)),
          radToDeg(Math.atan2(Q.y-P.y,  Q.x-P.x)), 30, 'x', 11);
        /* inscribed angle at T */
        drawAngleArc(svg, T.x, T.y,
          radToDeg(Math.atan2(P.y-T.y, P.x-T.x)),
          radToDeg(Math.atan2(Q.y-T.y, Q.x-T.x)), 28, 'x', 11);
      }
      dot(P, 'P', -14, 14);
      dot(Q, 'Q',  14, -8);
      dot(T, 'T',  14,  0);
      svg.appendChild(svgText(t1.x + 6, t1.y, 'tangent', 11, 'start',
        { fill: '#e63946', 'font-weight': '600' }));
      title = 'Tangent–chord angle = angle in alternate segment';
    }

    /* ════════════════════════════════════════════
       7. Two tangents from an external point
       ════════════════════════════════════════════ */
    if (s.type === 'two_tangents') {
      /* external point E to the right */
      const E = { x: cx + R + 120, y: cy };
      /* tangent contact points: angles where ET is tangent.
         sin(α) = R / |OE|, so α = asin(R/|OE|) */
      const OE = R + 120;
      const alpha = Math.asin(R / OE); /* angle from horizontal at O */
      /* contact points on circle (measured from the E-O direction = 0°) */
      const T1 = { x: cx + R * Math.cos(Math.PI - alpha), y: cy - R * Math.sin(alpha) };
      const T2 = { x: cx + R * Math.cos(Math.PI - alpha), y: cy + R * Math.sin(alpha) };
      /* tangent lines */
      svg.appendChild(seg(E, T1, '#4262ff', '2'));
      svg.appendChild(seg(E, T2, '#4262ff', '2'));
      /* radii to contact points */
      svg.appendChild(seg({ x: cx, y: cy }, T1, '#e63946', '1.8'));
      svg.appendChild(seg({ x: cx, y: cy }, T2, '#e63946', '1.8'));
      /* right-angle markers */
      if (lbl) {
        rightAngle(T1, { x: cx, y: cy }, E);
        rightAngle(T2, { x: cx, y: cy }, E);
        /* equal-length tick marks */
        const midET1 = { x: (E.x+T1.x)/2, y: (E.y+T1.y)/2 };
        const midET2 = { x: (E.x+T2.x)/2, y: (E.y+T2.y)/2 };
        [midET1, midET2].forEach(m => {
          svg.appendChild(svgEl('circle', { cx: m.x, cy: m.y, r: '3', fill: '#4262ff' }));
        });
        svg.appendChild(svgText((E.x + T1.x)/2 + 8, (E.y + T1.y)/2 - 8, 'l', 13, 'middle',
          { fill: '#4262ff', 'font-weight': '700' }));
        svg.appendChild(svgText((E.x + T2.x)/2 + 8, (E.y + T2.y)/2 + 8, 'l', 13, 'middle',
          { fill: '#4262ff', 'font-weight': '700' }));
      }
      odot({ x: cx, y: cy }, 'O', -16, 0);
      dot(T1, 'T₁', -8, -16);
      dot(T2, 'T₂', -8,  18);
      svg.appendChild(svgEl('circle', { cx: E.x, cy: E.y, r: '5', fill: '#059669' }));
      svg.appendChild(svgText(E.x + 14, E.y, 'E', 14, 'start',
        { fill: '#1e293b', 'font-weight': '700' }));
      title = 'Two tangents from an external point are equal in length';
    }

    /* ════════════════════════════════════════════
       8. Perpendicular from centre bisects chord
       ════════════════════════════════════════════ */
    if (s.type === 'chord_bisect') {
      const A = pt(220), B = pt(320);
      const O = { x: cx, y: cy };
      /* midpoint M of chord AB */
      const M = { x: (A.x + B.x)/2, y: (A.y + B.y)/2 };
      /* chord */
      svg.appendChild(seg(A, B, '#4262ff', '2'));
      /* perpendicular from O to chord */
      svg.appendChild(seg(O, M, '#e63946', '2'));
      /* right-angle marker at M */
      if (lbl) rightAngle(M, O, A);
      /* equal-half tick marks */
      const mAB1 = { x: (A.x + M.x)/2, y: (A.y + M.y)/2 };
      const mAB2 = { x: (M.x + B.x)/2, y: (M.y + B.y)/2 };
      [mAB1, mAB2].forEach(p => {
        const perp = { x: -(B.y-A.y), y: (B.x-A.x) };
        const pl = Math.sqrt(perp.x*perp.x + perp.y*perp.y);
        const t = 6 / pl;
        svg.appendChild(svgEl('line', {
          x1: p.x + perp.x*t, y1: p.y + perp.y*t,
          x2: p.x - perp.x*t, y2: p.y - perp.y*t,
          stroke: '#4262ff', 'stroke-width': '2',
        }));
      });
      odot(O, 'O', -16, 0);
      dot(A, 'A', -18, 4);
      dot(B, 'B',  18, 4);
      dot(M, 'M',  14, 14);
      title = 'The perpendicular from the centre bisects the chord';
    }

    /* ── title bar ── */
    if (s.showTitle) {
      /* text background */
      const tY = H - 30;
      svg.appendChild(svgEl('rect', {
        x: 20, y: tY - 16, width: W - 40, height: 26, rx: '6',
        fill: '#1e293b', opacity: '0.07',
      }));
      svg.appendChild(svgText(W/2, tY, title, 13, 'middle',
        { fill: '#1e293b', 'font-weight': '600' }));
    }

    return svg;
  },
};

/* ================================================================
   6. GEOBOARD (Circular & Square Pin Board)
   ================================================================ */

/* ── Geoboard helpers ──────────────────────────────────────── */

function gbParseAngles(str) {
  if (!str || !str.trim()) return [];
  return str.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
}

function gbParseVerts(str) {
  if (!str || !str.trim()) return [];
  return str.trim().split(/\s+/).map(t => {
    const parts = t.split(',');
    if (parts.length < 2) return null;
    const x = parseFloat(parts[0]), y = parseFloat(parts[1]);
    return (isNaN(x) || isNaN(y)) ? null : { x, y };
  }).filter(Boolean);
}

function gbShoelace(verts) {
  let area = 0;
  for (let i = 0; i < verts.length; i++) {
    const j = (i + 1) % verts.length;
    area += verts[i].x * verts[j].y - verts[j].x * verts[i].y;
  }
  return Math.abs(area) / 2;
}

/* ── Circular board ────────────────────────────────────────── */

function gbCircular(s) {
  const W = 600, H = 600;
  const svg = makeSVG(W, H);
  const cx = W / 2, cy = H / 2;
  const R  = 235;
  const PIN_R = s.step <= 10 ? 3 : (s.step <= 20 ? 4 : 5);
  const LABEL_R = R + 26;

  svg.appendChild(svgEl('rect', { x: '0', y: '0', width: W, height: H, fill: '#ffffff' }));

  /* 0° = top (12 o'clock), clockwise */
  const pinPt = deg => ({
    x: cx + R * Math.sin(degToRad(deg)),
    y: cy - R * Math.cos(degToRad(deg)),
  });

  if (s.ring) {
    svg.appendChild(svgEl('circle', {
      cx, cy, r: R,
      fill: 'none', stroke: '#d0d5e0', 'stroke-width': '1.5',
    }));
  }

  if (s.spokes) {
    [0, 90, 180, 270].forEach(deg => {
      const p = pinPt(deg);
      svg.appendChild(svgEl('line', {
        x1: cx, y1: cy, x2: p.x, y2: p.y,
        stroke: '#e8eaee', 'stroke-width': '1',
      }));
    });
  }

  const bands = [
    { angles: gbParseAngles(s.poly1), col: s.pcol1 },
    { angles: gbParseAngles(s.poly2), col: s.pcol2 },
    { angles: gbParseAngles(s.poly3), col: s.pcol3 },
  ];

  /* draw rubber bands BEFORE pins */
  bands.forEach(({ angles, col }) => {
    if (angles.length < 2) return;
    const pts = angles.map(a => pinPt(a));
    const ptsStr = pts.map(p => `${p.x},${p.y}`).join(' ');

    if (angles.length >= 3) {
      svg.appendChild(svgEl('polygon', {
        points: ptsStr,
        fill: col + '25',
        stroke: col,
        'stroke-width': '2.5',
        'stroke-linejoin': 'round',
      }));
    } else {
      svg.appendChild(svgEl('line', {
        x1: pts[0].x, y1: pts[0].y, x2: pts[1].x, y2: pts[1].y,
        stroke: col, 'stroke-width': '2.5', 'stroke-linecap': 'round',
      }));

      /* arc-angle label on chord midpoint */
      if (s.arclabel) {
        const diff = Math.abs(angles[1] - angles[0]);
        const arc = Math.min(diff, 360 - diff);
        const mx = (pts[0].x + pts[1].x) / 2;
        const my = (pts[0].y + pts[1].y) / 2;
        const toX = cx - mx, toY = cy - my;
        const tm = Math.sqrt(toX * toX + toY * toY) || 1;
        const ox = toX / tm * 16, oy = toY / tm * 16;
        svg.appendChild(svgEl('rect', {
          x: mx + ox - 18, y: my + oy - 9,
          width: 36, height: 14,
          fill: '#ffffff', rx: '3', opacity: '0.9',
        }));
        svg.appendChild(svgText(mx + ox, my + oy + 1, `${arc}°`, 11, 'middle', {
          fill: col, 'font-weight': '700',
        }));
      }
    }
  });

  /* highlight map: deg → [colours] */
  const hlMap = new Map();
  bands.forEach(({ angles, col }) => {
    angles.forEach(a => {
      const k = ((a % 360) + 360) % 360;
      if (!hlMap.has(k)) hlMap.set(k, []);
      hlMap.get(k).push(col);
    });
  });

  const step = Math.max(1, Math.min(45, s.step));
  for (let deg = 0; deg < 360; deg += step) {
    const p = pinPt(deg);

    const cols = hlMap.get(deg);
    if (cols) {
      cols.forEach((col, i) => {
        svg.appendChild(svgEl('circle', {
          cx: p.x, cy: p.y,
          r: PIN_R + 3 + i * 3,
          fill: 'none', stroke: col, 'stroke-width': '1.5',
        }));
      });
    }

    svg.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: PIN_R, fill: '#2b2d42' }));

    const showLabel = s.labels === 'all' ||
      (s.labels === 'major' && deg % 90 === 0);
    if (showLabel) {
      const lx = cx + LABEL_R * Math.sin(degToRad(deg));
      const ly = cy - LABEL_R * Math.cos(degToRad(deg));
      const isMajor = deg % 90 === 0;
      svg.appendChild(svgText(lx, ly + 4, `${deg}°`, isMajor ? 12 : 10, 'middle', {
        fill: isMajor ? '#2b2d42' : '#94a3b8',
        'font-weight': isMajor ? '700' : '400',
      }));
    }
  }

  if (s.centre) {
    svg.appendChild(svgEl('circle', { cx, cy, r: '4', fill: '#94a3b8' }));
  }

  return svg;
}

/* ── Square grid board ─────────────────────────────────────── */

function gbSquare(s) {
  const n    = Math.max(3, Math.min(10, s.size));
  const PAD  = 65;
  const GRID = 500;
  const W    = GRID + 2 * PAD;
  const H    = GRID + 2 * PAD;
  const cell = GRID / (n - 1);
  const svg  = makeSVG(W, H);

  const pinPt = (col, row) => ({
    x: PAD + col * cell,
    y: PAD + row * cell,
  });

  /* grid lines */
  if (s.gridlines) {
    for (let i = 0; i < n; i++) {
      const a = pinPt(0, i), b = pinPt(n - 1, i);
      svg.appendChild(svgEl('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#e0e4ea', 'stroke-width': '1' }));
      const c = pinPt(i, 0), d = pinPt(i, n - 1);
      svg.appendChild(svgEl('line', { x1: c.x, y1: c.y, x2: d.x, y2: d.y, stroke: '#e0e4ea', 'stroke-width': '1' }));
    }
  }

  const bands = [
    { verts: gbParseVerts(s.poly1), col: s.pcol1 },
    { verts: gbParseVerts(s.poly2), col: s.pcol2 },
    { verts: gbParseVerts(s.poly3), col: s.pcol3 },
  ];

  bands.forEach(({ verts, col }) => {
    if (!verts.length) return;
    const valid = verts.filter(v => v.x >= 0 && v.x <= n - 1 && v.y >= 0 && v.y <= n - 1);
    if (valid.length < 2) return;

    const svgPts = valid.map(v => pinPt(v.x, v.y));
    const ptsStr = svgPts.map(p => `${p.x},${p.y}`).join(' ');
    const isClosed = valid.length >= 3;

    if (isClosed) {
      svg.appendChild(svgEl('polygon', {
        points: ptsStr,
        fill: col + '25',
        stroke: col,
        'stroke-width': '2.5',
        'stroke-linejoin': 'round',
      }));
    } else {
      svg.appendChild(svgEl('line', {
        x1: svgPts[0].x, y1: svgPts[0].y,
        x2: svgPts[1].x, y2: svgPts[1].y,
        stroke: col, 'stroke-width': '2.5', 'stroke-linecap': 'round',
      }));
    }

    /* side-length labels */
    if (s.lengths) {
      const edgeCount = isClosed ? valid.length : valid.length - 1;
      for (let i = 0; i < edgeCount; i++) {
        const j = isClosed ? (i + 1) % valid.length : i + 1;
        const a = valid[i], b = valid[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const isInt = Math.abs(dist - Math.round(dist)) < 0.001;
        const label = isInt ? String(Math.round(dist)) : dist.toFixed(2);
        const pa = svgPts[i], pb = svgPts[j];
        const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
        const emag = Math.sqrt((pb.x - pa.x) ** 2 + (pb.y - pa.y) ** 2) || 1;
        const nx = -(pb.y - pa.y) / emag * 13;
        const ny =  (pb.x - pa.x) / emag * 13;
        svg.appendChild(svgEl('rect', {
          x: mx + nx - 15, y: my + ny - 8,
          width: 30, height: 14,
          fill: '#ffffff', rx: '3', opacity: '0.9',
        }));
        svg.appendChild(svgText(mx + nx, my + ny + 4, label, 11, 'middle', {
          fill: col, 'font-weight': '600',
        }));
      }
    }

    /* vertex-angle labels */
    if (s.angles && isClosed) {
      const centX = svgPts.reduce((a, p) => a + p.x, 0) / svgPts.length;
      const centY = svgPts.reduce((a, p) => a + p.y, 0) / svgPts.length;
      valid.forEach((curr, i) => {
        const prev = valid[(i - 1 + valid.length) % valid.length];
        const next = valid[(i + 1) % valid.length];
        const v1x = prev.x - curr.x, v1y = prev.y - curr.y;
        const v2x = next.x - curr.x, v2y = next.y - curr.y;
        const dot = v1x * v2x + v1y * v2y;
        const mag1 = Math.sqrt(v1x ** 2 + v1y ** 2);
        const mag2 = Math.sqrt(v2x ** 2 + v2y ** 2);
        const ang = Math.round(radToDeg(Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))))));
        const p = pinPt(curr.x, curr.y);
        const toX = centX - p.x, toY = centY - p.y;
        const tm = Math.sqrt(toX * toX + toY * toY) || 1;
        const ox = toX / tm * 20, oy = toY / tm * 20;
        svg.appendChild(svgEl('rect', {
          x: p.x + ox - 15, y: p.y + oy - 8,
          width: 30, height: 14,
          fill: '#ffffff', rx: '3', opacity: '0.9',
        }));
        svg.appendChild(svgText(p.x + ox, p.y + oy + 4, `${ang}°`, 11, 'middle', {
          fill: col, 'font-weight': '600',
        }));
      });
    }

    /* area label at centroid */
    if (s.area && isClosed) {
      const area = gbShoelace(valid);
      const aLabel = Number.isInteger(area) ? String(area) : area.toFixed(1);
      const centX = svgPts.reduce((a, p) => a + p.x, 0) / svgPts.length;
      const centY = svgPts.reduce((a, p) => a + p.y, 0) / svgPts.length;
      svg.appendChild(svgEl('rect', {
        x: centX - 40, y: centY - 10,
        width: 80, height: 18,
        fill: '#ffffffdd', rx: '4',
      }));
      svg.appendChild(svgText(centX, centY + 5, `A = ${aLabel} u²`, 13, 'middle', {
        fill: col, 'font-weight': '700',
      }));
    }
  });

  /* pins + optional coordinate labels */
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const p = pinPt(col, row);
      bands.forEach(({ verts, col: c }) => {
        if (verts.some(v => v.x === col && v.y === row)) {
          svg.appendChild(svgEl('circle', {
            cx: p.x, cy: p.y, r: '7',
            fill: 'none', stroke: c, 'stroke-width': '1.5',
          }));
        }
      });
      svg.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: '4', fill: '#2b2d42' }));
      if (s.coords) {
        svg.appendChild(svgText(p.x, p.y + 17, `${col},${row}`, 8, 'middle', {
          fill: '#94a3b8',
        }));
      }
    }
  }

  return svg;
}

/* ── Template definition ───────────────────────────────────── */

extraTemplates['geoboard'] = {
  name: 'Geoboard',
  category: 'Geometry Tools',
  renderConfig(c) {
    c.appendChild(sectionLabel('Board Type'));
    c.appendChild(row(
      field('Mode', select('gb-mode', [
        { v: 'circular', l: 'Circular' },
        { v: 'square',   l: 'Square grid' },
      ], 'circular')),
    ));

    c.appendChild(sectionLabel('Circular Settings'));
    c.appendChild(row(
      field('Angle between pins', select('gb-step', [
        { v: '5',  l: 'Every 5°  (72 pins)' },
        { v: '10', l: 'Every 10° (36 pins)' },
        { v: '15', l: 'Every 15° (24 pins)' },
        { v: '20', l: 'Every 20° (18 pins)' },
        { v: '30', l: 'Every 30° (12 pins)' },
        { v: '45', l: 'Every 45° (8 pins)'  },
      ], '10')),
      field('Angle labels', select('gb-labels', [
        { v: 'all',   l: 'All pins' },
        { v: 'major', l: '0 / 90 / 180 / 270 only' },
        { v: 'none',  l: 'No labels' },
      ], 'major')),
    ));
    c.appendChild(row(
      checkbox('gb-ring',     'Outer circle', true),
      checkbox('gb-centre',   'Centre dot',   true),
      checkbox('gb-spokes',   'Spokes',       false),
      checkbox('gb-arclabel', 'Arc labels',   true),
    ));

    c.appendChild(sectionLabel('Square Grid Settings'));
    c.appendChild(row(
      field('Grid size', select('gb-size', [
        { v: '4',  l: '4 × 4'   },
        { v: '5',  l: '5 × 5'   },
        { v: '6',  l: '6 × 6'   },
        { v: '7',  l: '7 × 7'   },
        { v: '8',  l: '8 × 8'   },
        { v: '9',  l: '9 × 9'   },
        { v: '10', l: '10 × 10' },
      ], '5')),
    ));
    c.appendChild(row(
      checkbox('gb-gridlines', 'Grid lines',     false),
      checkbox('gb-coords',    'Show coords',    false),
    ));
    c.appendChild(row(
      checkbox('gb-area',    'Area',          true),
      checkbox('gb-lengths', 'Side lengths',  true),
      checkbox('gb-angles',  'Vertex angles', false),
    ));

    c.appendChild(sectionLabel('Rubber Band 1'));
    c.appendChild(row(
      field('Angles / vertices',
        textInput('gb-poly1', '', 'circ: "0 90 180"  sq: "0,0 3,0 2,3"')),
    ));
    c.appendChild(row(
      field('Colour', colourSwatch('gb-pcol1', '#e63946')),
    ));

    c.appendChild(sectionLabel('Rubber Band 2'));
    c.appendChild(row(
      field('Angles / vertices', textInput('gb-poly2', '')),
    ));
    c.appendChild(row(
      field('Colour', colourSwatch('gb-pcol2', '#4262ff')),
    ));

    c.appendChild(sectionLabel('Rubber Band 3'));
    c.appendChild(row(
      field('Angles / vertices', textInput('gb-poly3', '')),
    ));
    c.appendChild(row(
      field('Colour', colourSwatch('gb-pcol3', '#2eb872')),
    ));
  },
  readConfig() {
    return {
      mode:      val('gb-mode')           || 'circular',
      step:      parseInt(val('gb-step')) || 10,
      labels:    val('gb-labels')         || 'major',
      ring:      val('gb-ring'),
      centre:    val('gb-centre'),
      spokes:    val('gb-spokes'),
      arclabel:  val('gb-arclabel'),
      size:      parseInt(val('gb-size')) || 5,
      gridlines: val('gb-gridlines'),
      coords:    val('gb-coords'),
      area:      val('gb-area'),
      lengths:   val('gb-lengths'),
      angles:    val('gb-angles'),
      poly1:     val('gb-poly1')          || '',
      pcol1:     val('gb-pcol1')          || '#e63946',
      poly2:     val('gb-poly2')          || '',
      pcol2:     val('gb-pcol2')          || '#4262ff',
      poly3:     val('gb-poly3')          || '',
      pcol3:     val('gb-pcol3')          || '#2eb872',
    };
  },
  generateSVG(s) {
    return s.mode === 'square' ? gbSquare(s) : gbCircular(s);
  },
};

/* ================================================================
   7. TRIGONOMETRY TRIANGLE
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

  /* ── internal: build per-leg config rows ── */
  _buildLegRows(container, n) {
    container.innerHTML = '';
    const defaultLabels = ['A', 'B', 'C', 'D'];
    const defaultBearings = [45, 120, 260];
    const defaultDists = ['5 km', '8 km', '3 km'];
    for (let i = 0; i < n; i++) {
      container.appendChild(sectionLabel(`Leg ${i + 1}  (${defaultLabels[i]} \u2192 ${defaultLabels[i + 1]})`));
      container.appendChild(row(
        field(`From (${defaultLabels[i]})`, textInput(`bd-pt-${i}`, val(`bd-pt-${i}`) || defaultLabels[i], defaultLabels[i])),
        field('Bearing (\u00B0)', numberInput(`bd-bear-${i}`, val(`bd-bear-${i}`) || defaultBearings[i], 0, 360, 1)),
      ));
      container.appendChild(row(
        field('Distance label', textInput(`bd-dist-${i}`, val(`bd-dist-${i}`) || defaultDists[i], defaultDists[i])),
      ));
      if (i === n - 1) {
        container.appendChild(row(
          field(`End point (${defaultLabels[i + 1]})`, textInput(`bd-pt-${i + 1}`, val(`bd-pt-${i + 1}`) || defaultLabels[i + 1], defaultLabels[i + 1])),
        ));
      }
    }
  },

  renderConfig(c) {
    c.appendChild(sectionLabel('Bearings Journey'));

    /* Number of legs slider */
    const slider = numberInput('bd-legs', 1, 1, 3, 1);
    slider.type = 'range';
    slider.style.width = '100%';
    const countLabel = document.createElement('span');
    countLabel.textContent = ' 1 leg';
    countLabel.style.fontSize = '11px';
    countLabel.style.color = '#777';
    const sliderRow = row(field('Number of legs', slider));
    sliderRow.appendChild(countLabel);
    c.appendChild(sliderRow);

    c.appendChild(row(
      checkbox('bd-north', 'Show North arrows', true),
      checkbox('bd-arc', 'Show angle arcs', true),
    ));
    c.appendChild(row(
      checkbox('bd-return', 'Show return bearing', false),
    ));

    const legContainer = document.createElement('div');
    legContainer.id = 'bd-leg-container';
    c.appendChild(legContainer);
    this._buildLegRows(legContainer, 1);

    slider.addEventListener('input', () => {
      const n = parseInt(slider.value, 10) || 1;
      countLabel.textContent = ` ${n} leg${n > 1 ? 's' : ''}`;
      this._buildLegRows(legContainer, n);
    });
  },

  readConfig() {
    const numLegs = parseInt(val('bd-legs')) || 1;
    const legs = [];
    for (let i = 0; i < numLegs; i++) {
      legs.push({
        from: val(`bd-pt-${i}`) || String.fromCharCode(65 + i),
        bearing: val(`bd-bear-${i}`) || 0,
        distance: val(`bd-dist-${i}`) || '',
      });
    }
    /* last point label */
    const lastLabel = val(`bd-pt-${numLegs}`) || String.fromCharCode(65 + numLegs);
    return {
      numLegs,
      legs,
      lastLabel,
      showNorth: val('bd-north'),
      showArc: val('bd-arc'),
      showReturn: val('bd-return'),
    };
  },

  generateSVG(s) {
    /* ── 1. Compute raw point positions (bearing: 0=N, clockwise) ── */
    const LEG_LEN = 140; /* base pixel length per leg */
    const rawPts = [{ x: 0, y: 0 }];
    for (let i = 0; i < s.numLegs; i++) {
      const prev = rawPts[rawPts.length - 1];
      const rad = degToRad(s.legs[i].bearing);
      rawPts.push({
        x: prev.x + LEG_LEN * Math.sin(rad),
        y: prev.y - LEG_LEN * Math.cos(rad),
      });
    }

    /* ── 2. Calculate bounding box and scale to fit ── */
    const MARGIN = 80;
    const W = 500, H = 460;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    rawPts.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    const rawW = (maxX - minX) || 1;
    const rawH = (maxY - minY) || 1;
    const scaleX = (W - 2 * MARGIN) / rawW;
    const scaleY = (H - 2 * MARGIN) / rawH;
    const scale = Math.min(scaleX, scaleY, 2.0); /* cap scale for single-leg */
    const cx = W / 2, cy = H / 2;
    const midRawX = (minX + maxX) / 2;
    const midRawY = (minY + maxY) / 2;
    const pts = rawPts.map(p => ({
      x: cx + (p.x - midRawX) * scale,
      y: cy + (p.y - midRawY) * scale,
    }));

    const svg = makeSVG(W, H);
    const NORTH_LEN = 50;
    const ARC_R = 32;

    /* ── 3. Collect all point labels ── */
    const ptLabels = [];
    for (let i = 0; i < s.numLegs; i++) ptLabels.push(s.legs[i].from);
    ptLabels.push(s.lastLabel);

    /* ── 4. Draw North arrows at every point ── */
    if (s.showNorth) {
      pts.forEach((p, i) => {
        svg.appendChild(svgEl('line', {
          x1: p.x, y1: p.y, x2: p.x, y2: p.y - NORTH_LEN,
          stroke: '#2b2d42', 'stroke-width': '1.5', 'stroke-dasharray': '5,3',
        }));
        svg.appendChild(svgText(p.x + 7, p.y - NORTH_LEN - 4, 'N', 13, 'start', {
          fill: '#2b2d42', 'font-weight': '800',
        }));
        arrowHead(svg, p.x, p.y - NORTH_LEN, -Math.PI / 2, 8, '#2b2d42');
      });
    }

    /* ── 5. Draw each leg: bearing line, arrowhead, distance label, arc ── */
    const legColours = ['#4262ff', '#2a9d8f', '#e76f51'];
    for (let i = 0; i < s.numLegs; i++) {
      const pA = pts[i], pB = pts[i + 1];
      const colour = legColours[i % legColours.length];
      const bearing = s.legs[i].bearing;
      const dist = s.legs[i].distance;

      /* bearing line */
      svg.appendChild(svgEl('line', {
        x1: pA.x, y1: pA.y, x2: pB.x, y2: pB.y,
        stroke: colour, 'stroke-width': '2.5',
      }));

      /* arrowhead at end */
      const lineAngle = Math.atan2(pB.y - pA.y, pB.x - pA.x);
      arrowHead(svg, pB.x, pB.y, lineAngle, 10, colour);

      /* distance label along middle, offset perpendicular */
      if (dist) {
        const mx = (pA.x + pB.x) / 2;
        const my = (pA.y + pB.y) / 2;
        /* offset perpendicular to the line */
        const perpAngle = lineAngle - Math.PI / 2;
        const offsetDist = 14;
        const lx = mx + offsetDist * Math.cos(perpAngle);
        const ly = my + offsetDist * Math.sin(perpAngle);
        svg.appendChild(svgText(lx, ly, dist, 12, 'middle', { fill: colour, 'font-weight': '600' }));
      }

      /* angle arc (clockwise from North) */
      if (s.showArc && bearing > 0) {
        const startDeg = -90; /* North in SVG coords */
        const endDeg = -90 + bearing;
        const arcPath = describeArc(pA.x, pA.y, ARC_R, startDeg, endDeg);
        svg.appendChild(svgEl('path', {
          d: arcPath, fill: 'none', stroke: '#e63946', 'stroke-width': '1.5',
        }));
        /* bearing label */
        const midDeg = startDeg + bearing / 2;
        const lr = ARC_R + 15;
        const lx = pA.x + lr * Math.cos(degToRad(midDeg));
        const ly = pA.y + lr * Math.sin(degToRad(midDeg));
        const bearStr = String(Math.round(bearing)).padStart(3, '0') + '\u00B0';
        svg.appendChild(svgText(lx, ly, bearStr, 15, 'middle', { fill: '#e63946', 'font-weight': '700' }));
      }
    }

    /* ── 6. Draw points and labels ── */
    pts.forEach((p, i) => {
      svg.appendChild(svgEl('circle', {
        cx: p.x, cy: p.y, r: '5', fill: '#2b2d42',
      }));
      /* place label offset below-right */
      const lx = p.x + 10;
      const ly = p.y + 18;
      svg.appendChild(svgText(lx, ly, ptLabels[i] || '', 15, 'start', {
        fill: '#2b2d42', 'font-weight': '700',
      }));
    });

    /* ── 7. Optional return bearing (dashed line from last point to A) ── */
    if (s.showReturn && s.numLegs >= 1) {
      const pFirst = pts[0];
      const pLast = pts[pts.length - 1];
      const dx = pFirst.x - pLast.x;
      const dy = pFirst.y - pLast.y;

      /* return bearing: angle from last point back to A */
      const retAngle = Math.atan2(dx, -dy); /* bearing angle in radians */
      let retBearing = radToDeg(retAngle);
      if (retBearing < 0) retBearing += 360;

      /* dashed line */
      svg.appendChild(svgEl('line', {
        x1: pLast.x, y1: pLast.y, x2: pFirst.x, y2: pFirst.y,
        stroke: '#999', 'stroke-width': '1.5', 'stroke-dasharray': '8,4',
      }));
      arrowHead(svg, pFirst.x, pFirst.y, Math.atan2(pFirst.y - pLast.y, pFirst.x - pLast.x), 8, '#999');

      /* return bearing arc at last point */
      const startDeg = -90;
      const endDeg = -90 + retBearing;
      const arcPath = describeArc(pLast.x, pLast.y, ARC_R - 6, startDeg, endDeg);
      svg.appendChild(svgEl('path', {
        d: arcPath, fill: 'none', stroke: '#999', 'stroke-width': '1', 'stroke-dasharray': '3,2',
      }));
      /* label */
      const midDeg = startDeg + retBearing / 2;
      const lr = ARC_R + 8;
      const lx = pLast.x + lr * Math.cos(degToRad(midDeg));
      const ly = pLast.y + lr * Math.sin(degToRad(midDeg));
      const retStr = String(Math.round(retBearing)).padStart(3, '0') + '\u00B0';
      svg.appendChild(svgText(lx, ly, retStr, 13, 'middle', { fill: '#777', 'font-weight': '600' }));
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
      checkbox('uc-answers', 'Answer boxes (blank)', false),
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
      answerBoxes: val('uc-answers'),
    };
  },
  generateSVG(s) {
    const W = 1100, H = 1080;
    const cx = W / 2, cy = H / 2 + 20;
    const R = 300;
    const svg = makeSVG(W, H);
    svg.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }));

    /* axes */
    const axEnd = R + 155;
    svg.appendChild(svgEl('line', { x1: cx - axEnd + 16, y1: cy, x2: cx + axEnd - 14, y2: cy, stroke: '#c0c0c0', 'stroke-width': '2' }));
    svg.appendChild(svgEl('line', { x1: cx, y1: cy + axEnd - 16, x2: cx, y2: cy - axEnd + 14, stroke: '#c0c0c0', 'stroke-width': '2' }));
    arrowHead(svg, cx + axEnd - 14, cy, 0, 11, '#bbb');
    arrowHead(svg, cx, cy - axEnd + 14, -Math.PI / 2, 11, '#bbb');
    svg.appendChild(svgText(cx + axEnd + 4, cy + 6, 'x', 18, 'start', { fill: '#aaa', 'font-weight': '700', 'font-style': 'italic' }));
    svg.appendChild(svgText(cx + 16, cy - axEnd + 12, 'y', 18, 'start', { fill: '#aaa', 'font-weight': '700', 'font-style': 'italic' }));

    /* ±1 marks */
    [[R, 0, '1', 'start'], [-R, 0, '−1', 'end'], [0, -R, '1', 'start'], [0, R, '−1', 'start']].forEach(([dx, dy, lbl, anchor]) => {
      const mx = cx + dx, my = cy + dy;
      svg.appendChild(svgEl('line', { x1: mx - 7, y1: my, x2: mx + 7, y2: my, stroke: '#999', 'stroke-width': '1.8' }));
      svg.appendChild(svgEl('line', { x1: mx, y1: my - 7, x2: mx, y2: my + 7, stroke: '#999', 'stroke-width': '1.8' }));
      const ox = dx !== 0 ? (dx > 0 ? 14 : -14) : 16;
      const oy = dy !== 0 ? (dy > 0 ? 24 : -10) : 6;
      svg.appendChild(svgText(mx + ox, my + oy, lbl, 16, anchor, { fill: '#555', 'font-weight': '600' }));
    });

    /* circle */
    svg.appendChild(svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: '#1a1a2e', 'stroke-width': '3.2' }));

    /* lookup tables — use '/' in values so drawVal renders proper stacked fractions */
    const radianLabels = {
      0: '0', 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2',
      120: '2π/3', 135: '3π/4', 150: '5π/6', 180: 'π',
      210: '7π/6', 225: '5π/4', 240: '4π/3', 270: '3π/2',
      300: '5π/3', 315: '7π/4', 330: '11π/6',
    };
    const cosVals = {
      0: '1',     30: '√3/2',  45: '√2/2',  60: '1/2',   90: '0',
      120: '-1/2', 135: '-√2/2', 150: '-√3/2', 180: '-1',
      210: '-√3/2', 225: '-√2/2', 240: '-1/2', 270: '0',
      300: '1/2', 315: '√2/2', 330: '√3/2',
    };
    const sinVals = {
      0: '0',    30: '1/2',   45: '√2/2',  60: '√3/2',  90: '1',
      120: '√3/2', 135: '√2/2', 150: '1/2',  180: '0',
      210: '-1/2', 225: '-√2/2', 240: '-√3/2', 270: '-1',
      300: '-√3/2', 315: '-√2/2', 330: '-1/2',
    };

    /* ── stacked fraction / plain value renderer, centered at (x, y) ── */
    const drawVal = (x, y, str, fill, fsize) => {
      if (str.includes('/')) {
        const si = str.indexOf('/');
        const num = str.slice(0, si);
        const den = str.slice(si + 1);
        const numW = num.replace(/[√\-]/g, 'X').length;
        const barHW = Math.max(numW, den.length) * fsize * 0.37 + 4;
        svg.appendChild(svgText(x, y - fsize * 0.58, num, fsize * 0.9, 'middle', { fill, 'font-weight': '700' }));
        svg.appendChild(svgEl('line', { x1: x - barHW, y1: y, x2: x + barHW, y2: y, stroke: fill, 'stroke-width': '1.2' }));
        svg.appendChild(svgText(x, y + fsize * 0.9, den, fsize * 0.9, 'middle', { fill, 'font-weight': '700' }));
      } else {
        svg.appendChild(svgText(x, y + 4, str, fsize, 'middle', { fill, 'font-weight': '700' }));
      }
    };

    /* ── coordinate box renderers ── */
    const boxW = 120, boxH = 50;
    const drawCoordBox = (bx, by, cosStr, sinStr, valFill, isHL) => {
      svg.appendChild(svgEl('rect', {
        x: bx - boxW / 2, y: by - boxH / 2, width: boxW, height: boxH, rx: 7,
        fill: '#fff', stroke: isHL ? '#e63946' : '#ccc', 'stroke-width': isHL ? '2.5' : '1.2',
      }));
      svg.appendChild(svgText(bx - 53, by + 5, '(', 22, 'middle', { fill: '#777', 'font-weight': '300' }));
      svg.appendChild(svgText(bx + 53, by + 5, ')', 22, 'middle', { fill: '#777', 'font-weight': '300' }));
      svg.appendChild(svgText(bx + 3, by + 11, ',', 13, 'middle', { fill: '#888' }));
      drawVal(bx - 24, by, cosStr, valFill, 11);
      drawVal(bx + 31, by, sinStr, valFill, 11);
    };
    const drawBlankBox = (bx, by) => {
      svg.appendChild(svgEl('rect', {
        x: bx - boxW / 2, y: by - boxH / 2, width: boxW, height: boxH, rx: 7,
        fill: '#fff', stroke: '#ddd', 'stroke-width': '1.2',
      }));
      svg.appendChild(svgText(bx - 53, by + 5, '(', 22, 'middle', { fill: '#ccc', 'font-weight': '300' }));
      svg.appendChild(svgText(bx + 53, by + 5, ')', 22, 'middle', { fill: '#ccc', 'font-weight': '300' }));
      /* two blank sub-boxes — no comma inside them */
      svg.appendChild(svgEl('rect', { x: bx - 49, y: by - 16, width: 37, height: 32, rx: 4, fill: '#f7f8fc', stroke: '#ddd', 'stroke-width': '1' }));
      svg.appendChild(svgEl('rect', { x: bx + 12, y: by - 16, width: 37, height: 32, rx: 4, fill: '#f7f8fc', stroke: '#ddd', 'stroke-width': '1' }));
      svg.appendChild(svgText(bx + 3, by + 10, ',', 13, 'middle', { fill: '#ccc' }));
    };

    const lrDeg   = R + 33;
    const lrRad   = R + 70;
    const lrOnly  = R + 48;
    const lrCoord = s.format === 'both' ? R + 130 : R + 112;

    const standardAngles = [0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330];
    const angles = s.show === 'all_standard' ? standardAngles : [Number(s.highlighted)];

    /* reference triangle */
    if (s.showTri) {
      const hRad = degToRad(Number(s.highlighted));
      const hx = cx + R * Math.cos(hRad);
      const hy = cy - R * Math.sin(hRad);
      svg.appendChild(svgEl('polygon', {
        points: `${cx},${cy} ${hx},${cy} ${hx},${hy}`,
        fill: 'rgba(230,57,70,0.08)', stroke: '#e63946', 'stroke-width': '2.5',
      }));
      drawAngleArc(svg, cx, cy, -Number(s.highlighted), 0, 34);
    }

    /* angle points */
    angles.forEach(deg => {
      const isHL = deg === Number(s.highlighted);
      const rad = degToRad(deg);
      const cosR = Math.cos(rad), sinR = Math.sin(rad);
      const px = cx + R * cosR;
      const py = cy - R * sinR;

      /* tick */
      const tk = isHL ? 12 : 8;
      svg.appendChild(svgEl('line', {
        x1: cx + (R - 2) * cosR, y1: cy - (R - 2) * sinR,
        x2: cx + (R + tk) * cosR, y2: cy - (R + tk) * sinR,
        stroke: isHL ? '#e63946' : '#555', 'stroke-width': isHL ? '2.8' : '1.5',
      }));

      /* dot */
      svg.appendChild(svgEl('circle', { cx: px, cy: py, r: isHL ? '6' : '4.5', fill: isHL ? '#e63946' : '#4262ff' }));

      const lFill = isHL ? '#e63946' : '#1a1a2e';
      const lDim  = isHL ? '#e63946' : '#555';

      /* angle label(s) */
      if (s.format === 'both') {
        const dlx = cx + lrDeg * cosR, dly = cy - lrDeg * sinR;
        svg.appendChild(svgText(dlx, dly + 5, `${deg}°`, 14, 'middle', { fill: lFill, 'font-weight': '800' }));
        const rlx = cx + lrRad * cosR, rly = cy - lrRad * sinR;
        svg.appendChild(svgText(rlx, rly + 5, radianLabels[deg] || '', 12, 'middle', { fill: lDim, 'font-weight': '500' }));
      } else {
        const lx = cx + lrOnly * cosR, ly = cy - lrOnly * sinR;
        const label = s.format === 'degrees' ? `${deg}°` : (radianLabels[deg] || `${deg}°`);
        const lsz = s.format === 'degrees' ? 15 : 13;
        svg.appendChild(svgText(lx, ly + 5, label, lsz, 'middle', { fill: lFill, 'font-weight': '700' }));
      }

      /* coordinate box */
      const bx = cx + lrCoord * cosR;
      const by = cy - lrCoord * sinR;
      if (s.answerBoxes) {
        drawBlankBox(bx, by);
      } else if (s.showCoords && cosVals[deg] !== undefined) {
        drawCoordBox(bx, by, cosVals[deg], sinVals[deg], lFill, isHL);
      }
    });

    /* quadrant labels */
    if (s.showQuads) {
      const qd = R * 0.56;
      [['I', 1, -1], ['II', -1, -1], ['III', -1, 1], ['IV', 1, 1]].forEach(([q, sx, sy]) => {
        svg.appendChild(svgText(cx + sx * qd, cy + sy * qd, q, 36, 'middle', {
          fill: 'rgba(0,0,0,0.055)', 'font-weight': '900',
        }));
      });
    }

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
    c.appendChild(row(
      field('Measure from', select('pr-dir', [['right', 'Right (anticlockwise)'], ['left', 'Left (clockwise)']])),
    ));
    c.appendChild(row(
      checkbox('pr-rays', 'Show rays', true),
      checkbox('pr-numbers', 'Show numbers', true),
      checkbox('pr-transparent', 'Scale only (no body)', false),
    ));
    // Usage tip
    const tip = document.createElement('p');
    tip.style.cssText = 'font-size:11px;color:#888;margin-top:8px;line-height:1.5;';
    tip.textContent = 'Tip: to measure an angle on your board, place the protractor then right-click → Send to back. Use the pen tool to draw your angle lines on top.';
    c.appendChild(tip);
  },
  readConfig() {
    return {
      type: val('pr-type') || '180',
      markedAngle: val('pr-angle') || 0,
      fromRight: (val('pr-dir') || 'right') === 'right',
      showRays: val('pr-rays'),
      showNumbers: val('pr-numbers') !== false,
      transparent: val('pr-transparent'),
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

    const arcFill   = s.transparent ? 'none' : 'rgba(66,98,255,0.04)';
    const arcStroke = s.transparent ? 'none' : '#2b2d42';

    // All geometry uses math coords: angle d° → x = cx + r·cos(d°), y = cy − r·sin(d°)
    // 0° = right, increases anticlockwise. For "from left" we mirror: d maps to (180−d).
    const toAngle = (d) => s.fromRight ? d : 180 - d;

    // Arc path helper in math coords (y-up), sweep counterclockwise in SVG (sweep=0)
    const mathArc = (r, startD, endD) => {
      const s1 = degToRad(startD), e1 = degToRad(endD);
      const sx = cx + r * Math.cos(s1), sy = cy - r * Math.sin(s1);
      const ex = cx + r * Math.cos(e1), ey = cy - r * Math.sin(e1);
      const large = (endD - startD > 180) ? 1 : 0;
      return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 0 ${ex} ${ey}`;
    };

    /* baseline */
    svg.appendChild(svgEl('line', { x1: cx - R - 10, y1: cy, x2: cx + R + 10, y2: cy, stroke: '#2b2d42', 'stroke-width': '1.5' }));

    /* body arc */
    if (isFull) {
      svg.appendChild(svgEl('circle', { cx, cy, r: R, fill: arcFill, stroke: arcStroke, 'stroke-width': '2' }));
    } else {
      svg.appendChild(svgEl('path', {
        d: `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`,
        fill: arcFill, stroke: arcStroke, 'stroke-width': '2',
      }));
    }

    /* centre dot */
    svg.appendChild(svgEl('circle', { cx, cy, r: '3', fill: '#e63946' }));

    /* degree ticks */
    const maxDeg = isFull ? 360 : 180;
    for (let d = 0; d <= maxDeg; d++) {
      const a = degToRad(toAngle(d));
      const isMajor = d % 10 === 0;
      const isMid   = d % 5 === 0;
      const tickLen = isMajor ? 18 : isMid ? 12 : 6;
      svg.appendChild(svgEl('line', {
        x1: cx + (R - tickLen) * Math.cos(a), y1: cy - (R - tickLen) * Math.sin(a),
        x2: cx + R * Math.cos(a),             y2: cy - R * Math.sin(a),
        stroke: isMajor ? '#2b2d42' : '#aaa',
        'stroke-width': isMajor ? '1.5' : '0.5',
      }));
      if (s.showNumbers && isMajor && d < maxDeg) {
        const lr = R - 24;
        const lx = cx + lr * Math.cos(a);
        const ly = cy - lr * Math.sin(a);
        svg.appendChild(svgText(lx, ly + 4, String(d), 11, 'middle', { fill: '#333', 'font-weight': '600' }));
      }
    }

    /* marked angle ray + arc indicator */
    if (s.showRays && s.markedAngle > 0 && s.markedAngle <= maxDeg) {
      const rayA = degToRad(toAngle(s.markedAngle));
      const rx = cx + (R + 15) * Math.cos(rayA);
      const ry = cy - (R + 15) * Math.sin(rayA);
      svg.appendChild(svgEl('line', { x1: cx, y1: cy, x2: rx, y2: ry, stroke: '#e63946', 'stroke-width': '2' }));

      // Small arc in the correct direction (math coords, sweep=0 = CCW in SVG)
      const baseA = toAngle(0);            // 0° or 180° depending on direction
      const markA = toAngle(s.markedAngle);
      const [arcStart, arcEnd] = baseA < markA ? [baseA, markA] : [markA, baseA];
      svg.appendChild(svgEl('path', { d: mathArc(35, arcStart, arcEnd), fill: 'none', stroke: '#e63946', 'stroke-width': '1.5' }));

      // Label at midpoint of the arc
      const midA = degToRad((toAngle(0) + toAngle(s.markedAngle)) / 2);
      const lr = 52;
      svg.appendChild(svgText(cx + lr * Math.cos(midA), cy - lr * Math.sin(midA), `${s.markedAngle}°`, 12, 'middle', { fill: '#e63946', 'font-weight': '600' }));
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
    svg.appendChild(svgText(W / 2, H - 8, 'Mirror Line', 14, 'middle', { fill: '#e63946', 'font-weight': '700' }));

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
      field('Input mode', select('sl-input-mode', [['raw', 'Raw data'], ['manual', 'Manual']])),
    ));

    /* --- Raw data inputs --- */
    const rawDiv = document.createElement('div');
    rawDiv.id = 'sl-raw-section';
    const taRight = document.createElement('textarea');
    taRight.id = 'sl-raw-right';
    taRight.className = 'cfg-input';
    taRight.style.height = '60px';
    taRight.style.fontFamily = 'monospace';
    taRight.style.fontSize = '11px';
    taRight.placeholder = 'e.g. 12, 15, 23, 24, 27, 31, 35, 38, 42, 45, 51';
    taRight.value = '12, 15, 23, 24, 27, 31, 35, 38, 42, 45, 51';
    rawDiv.appendChild(field('Data (right / main)', taRight));
    const taLeft = document.createElement('textarea');
    taLeft.id = 'sl-raw-left';
    taLeft.className = 'cfg-input';
    taLeft.style.height = '60px';
    taLeft.style.fontFamily = 'monospace';
    taLeft.style.fontSize = '11px';
    taLeft.placeholder = 'e.g. 11, 18, 22, 26, 34, 39, 41, 47, 52';
    taLeft.value = '';
    rawDiv.appendChild(field('Data (left, back-to-back only)', taLeft));
    c.appendChild(rawDiv);

    /* --- Manual inputs --- */
    const manDiv = document.createElement('div');
    manDiv.id = 'sl-manual-section';
    manDiv.style.display = 'none';
    manDiv.appendChild(row(
      field('Stems (comma sep)', textInput('sl-stems', '1,2,3,4,5')),
    ));
    manDiv.appendChild(row(
      field('Leaves right (per stem, | sep)', textInput('sl-right', '2 3 5|1 4 7 8|0 2 6|3 5|1')),
    ));
    const hintR = document.createElement('div');
    hintR.style.cssText = 'font-size:10px;color:#888;margin:-6px 0 6px 0;';
    hintR.textContent = 'Hint: separate each stem\'s leaves with | and individual leaves with spaces. E.g. 2 3 5|1 4 7 8';
    manDiv.appendChild(hintR);
    manDiv.appendChild(row(
      field('Leaves left (back-to-back)', textInput('sl-left', '5 3|8 6 2|9 4 1|7 5|2')),
    ));
    const hintL = document.createElement('div');
    hintL.style.cssText = 'font-size:10px;color:#888;margin:-6px 0 6px 0;';
    hintL.textContent = 'Hint: same format as right leaves, used only for back-to-back diagrams.';
    manDiv.appendChild(hintL);
    c.appendChild(manDiv);

    /* Toggle visibility based on input mode */
    const modeSelect = document.getElementById('sl-input-mode');
    function toggleMode() {
      const isRaw = modeSelect.value === 'raw';
      rawDiv.style.display = isRaw ? '' : 'none';
      manDiv.style.display = isRaw ? 'none' : '';
    }
    modeSelect.addEventListener('change', toggleMode);
    toggleMode();

    c.appendChild(row(
      field('Title', textInput('sl-title', 'Stem and Leaf Diagram')),
    ));
    c.appendChild(row(checkbox('sl-key', 'Show key', true)));
  },
  readConfig() {
    const inputMode = val('sl-input-mode') || 'raw';
    const type = val('sl-type') || 'single';
    const title = val('sl-title') || 'Stem and Leaf Diagram';
    const showKey = val('sl-key');

    if (inputMode === 'raw') {
      /* Parse raw comma-separated numbers into stems and leaves */
      function parseRawData(text) {
        const nums = (text || '').split(/[,\s]+/).map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n >= 0);
        const map = {};
        nums.forEach(n => {
          const stem = Math.floor(n / 10);
          const leaf = n % 10;
          if (!map[stem]) map[stem] = [];
          map[stem].push(leaf);
        });
        /* Sort leaves within each stem */
        for (const k of Object.keys(map)) map[k].sort((a, b) => a - b);
        return map;
      }

      const rightMap = parseRawData(document.getElementById('sl-raw-right')?.value || '');
      const leftMap = type === 'back-to-back' ? parseRawData(document.getElementById('sl-raw-left')?.value || '') : {};

      /* Merge all stems from both sides, sorted */
      const allStems = [...new Set([...Object.keys(rightMap), ...Object.keys(leftMap)].map(Number))];
      allStems.sort((a, b) => a - b);

      const stems = allStems.map(String);
      const leavesRight = allStems.map(st => (rightMap[st] || []).join(' '));
      const leavesLeft = allStems.map(st => (leftMap[st] || []).join(' '));

      return { type, stems, leavesRight, leavesLeft, title, showKey };
    }

    /* Manual mode -- existing behaviour */
    return {
      type,
      stems: (val('sl-stems') || '1,2,3,4,5').split(',').map(s => s.trim()),
      leavesRight: (val('sl-right') || '').split('|').map(s => s.trim()),
      leavesLeft: (val('sl-left') || '').split('|').map(s => s.trim()),
      title,
      showKey,
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
   DISTRIBUTION MATH HELPERS
   ================================================================ */
function _lnGamma(x) {
  const g = 7;
  const c = [0.99999999999980993,676.5203681218851,-1259.1392167224028,
    771.32342877765313,-176.61502916214059,12.507343278686905,
    -0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - _lnGamma(1 - x);
  x -= 1;
  let a = c[0];
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  const t = x + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
function _chiPDF(x, df) {
  if (x <= 0) return 0;
  const k2 = df / 2;
  return Math.exp((k2 - 1) * Math.log(x) - x / 2 - k2 * Math.log(2) - _lnGamma(k2));
}
function _tPDF(x, df) {
  return Math.exp(_lnGamma((df + 1) / 2) - 0.5 * Math.log(df * Math.PI) - _lnGamma(df / 2) - (df + 1) / 2 * Math.log(1 + x * x / df));
}
function _binomPMF(k, n, p) {
  if (k < 0 || k > n) return 0;
  const logC = _lnGamma(n + 1) - _lnGamma(k + 1) - _lnGamma(n - k + 1);
  const logP = k * Math.log(p > 0 ? p : 1e-15) + (n - k) * Math.log(p < 1 ? 1 - p : 1e-15);
  return Math.exp(logC + logP);
}
function _invNorm(p) {
  /* Peter Acklam rational approximation for the probit function */
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
              1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
              6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00,  4.374664141464968e+00,  2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const pLow = 0.02425, pHigh = 1 - pLow;
  let q, r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5; r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
              ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

/* ================================================================
   20. NORMAL DISTRIBUTION
   ================================================================ */
extraTemplates['normal-distribution'] = {
  name: 'Normal Distribution',
  category: 'Statistics Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Normal Distribution'));
    c.appendChild(row(
      field('Mean (μ)', numberInput('nd-mean', 0, -1000, 1000, 1)),
      field('Std Dev (σ)', numberInput('nd-sd', 1, 0.01, 500, 0.1)),
    ));
    c.appendChild(row(
      field('Title', textInput('nd-title', 'Normal Distribution')),
      field('X-axis label', textInput('nd-xlabel', 'X')),
    ));

    c.appendChild(sectionLabel('Curve & Labels'));
    c.appendChild(row(
      checkbox('nd-sdlines', 'Show σ dashed lines', true),
      checkbox('nd-sdticks', 'Show σ tick marks', true),
    ));
    c.appendChild(row(
      checkbox('nd-siglabels', 'Show σ notation (μ, ±1σ…)', true),
      checkbox('nd-vallabels', 'Show actual x-values', false),
    ));
    c.appendChild(row(
      checkbox('nd-pct', 'Show empirical % (68–95–99.7)', false),
    ));

    c.appendChild(sectionLabel('Shading'));
    c.appendChild(row(
      field('Shade region', select('nd-shade-mode', [
        { v: 'none', l: 'None' },
        { v: 'left', l: 'Left tail  P(X < a)' },
        { v: 'right', l: 'Right tail  P(X > a)' },
        { v: 'between', l: 'Between  P(a < X < b)' },
        { v: 'outer', l: 'Outer tails  P(X<a or X>b)' },
        { v: 'central', l: 'Central  μ ± kσ' },
      ], 'none')),
    ));
    const shadeInputs = document.createElement('div');
    shadeInputs.id = 'nd-shade-inputs';
    c.appendChild(shadeInputs);

    const buildShadeInputs = () => {
      const mode = (document.getElementById('nd-shade-mode') || {}).value || 'none';
      const si = document.getElementById('nd-shade-inputs');
      if (!si) return;
      si.innerHTML = '';
      if (mode === 'left') {
        si.appendChild(row(field('Boundary a', numberInput('nd-ba', -1, -9999, 9999, 0.1))));
      } else if (mode === 'right') {
        si.appendChild(row(field('Boundary a', numberInput('nd-ba', 1, -9999, 9999, 0.1))));
      } else if (mode === 'between' || mode === 'outer') {
        si.appendChild(row(
          field('From a', numberInput('nd-ba', -1, -9999, 9999, 0.1)),
          field('To b', numberInput('nd-bb', 1, -9999, 9999, 0.1)),
        ));
      } else if (mode === 'central') {
        si.appendChild(row(field('k (σ from μ)', numberInput('nd-ba', 1, 0.1, 5, 0.1))));
      }
      si.querySelectorAll('input').forEach(el =>
        el.addEventListener('input', () => { if (window._tplSchedulePreview) window._tplSchedulePreview(); })
      );
    };
    document.getElementById('nd-shade-mode').addEventListener('change', () => {
      buildShadeInputs();
      if (window._tplSchedulePreview) window._tplSchedulePreview();
    });
    buildShadeInputs();

    c.appendChild(sectionLabel('Inverse Normal'));
    c.appendChild(row(checkbox('nd-inv', 'Enable inverse normal', false)));
    const invInputs = document.createElement('div');
    invInputs.id = 'nd-inv-inputs';
    c.appendChild(invInputs);

    const buildInvInputs = () => {
      const on = document.getElementById('nd-inv') && document.getElementById('nd-inv').checked;
      const ii = document.getElementById('nd-inv-inputs');
      if (!ii) return;
      ii.innerHTML = '';
      if (!on) return;
      ii.appendChild(row(
        field('Probability (p)', numberInput('nd-inv-p', 0.95, 0.001, 0.9999, 0.001)),
        field('Tail', select('nd-inv-tail', [
          { v: 'left', l: 'Left  P(X < a) = p' },
          { v: 'right', l: 'Right  P(X > a) = p' },
          { v: 'central', l: 'Central  P(|X−μ| < a) = p' },
        ], 'left')),
      ));
      ii.appendChild(row(
        checkbox('nd-inv-showval', 'Show computed value', true),
        checkbox('nd-inv-blank', 'Blank answer box', false),
      ));
      ii.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', () => { if (window._tplSchedulePreview) window._tplSchedulePreview(); });
        el.addEventListener('change', () => { if (window._tplSchedulePreview) window._tplSchedulePreview(); });
      });
    };
    document.getElementById('nd-inv').addEventListener('change', () => {
      buildInvInputs();
      if (window._tplSchedulePreview) window._tplSchedulePreview();
    });
    buildInvInputs();
  },
  readConfig() {
    const mode = val('nd-shade-mode') || 'none';
    const inv = val('nd-inv');
    return {
      mean: val('nd-mean') || 0, sd: val('nd-sd') || 1,
      title: val('nd-title') || 'Normal Distribution',
      xlabel: val('nd-xlabel') || 'X',
      showSDLines: val('nd-sdlines'), showSDTicks: val('nd-sdticks'),
      showSigLabels: val('nd-siglabels'), showValLabels: val('nd-vallabels'),
      showPct: val('nd-pct'),
      shadeMode: mode, ba: val('nd-ba'), bb: val('nd-bb'),
      inv, invP: val('nd-inv-p') || 0.95,
      invTail: val('nd-inv-tail') || 'left',
      invShowVal: val('nd-inv-showval'), invBlank: val('nd-inv-blank'),
    };
  },
  generateSVG(s) {
    const W = 720, H = 430;
    const svg = makeSVG(W, H);
    const pad = { l: 55, r: 45, t: 50, b: 72 };
    const gw = W - pad.l - pad.r;
    const gh = H - pad.t - pad.b;
    const axisY = pad.t + gh;

    svg.appendChild(svgText(W / 2, 28, s.title, 15, 'middle', { fill: '#222', 'font-weight': '700' }));

    const norm = (x) => {
      const z = (x - s.mean) / s.sd;
      return Math.exp(-0.5 * z * z) / (s.sd * Math.sqrt(2 * Math.PI));
    };
    const xMin = s.mean - 4 * s.sd, xMax = s.mean + 4 * s.sd;
    const steps = 400, dx = (xMax - xMin) / steps;
    const maxY = norm(s.mean);
    const toX = (x) => pad.l + ((x - xMin) / (xMax - xMin)) * gw;
    const toY = (y) => pad.t + gh - (y / maxY) * gh * 0.88;

    /* ── Compute shade bounds ── */
    let shLo = null, shHi = null, shOuter = false;
    let invBounds = null;

    if (s.inv && s.invP > 0 && s.invP < 1) {
      if (s.invTail === 'left') {
        const z = _invNorm(s.invP);
        const a = s.mean + z * s.sd;
        shLo = xMin; shHi = a;
        invBounds = [a];
      } else if (s.invTail === 'right') {
        const z = _invNorm(1 - s.invP);
        const a = s.mean + z * s.sd;
        shLo = a; shHi = xMax;
        invBounds = [a];
      } else { /* central */
        const zc = _invNorm((1 + s.invP) / 2);
        shLo = s.mean - zc * s.sd; shHi = s.mean + zc * s.sd;
        invBounds = [shLo, shHi];
      }
    } else {
      const ba = s.ba, bb = s.bb;
      if (s.shadeMode === 'left')    { shLo = xMin; shHi = ba; }
      else if (s.shadeMode === 'right')  { shLo = ba; shHi = xMax; }
      else if (s.shadeMode === 'between') { shLo = Math.min(ba, bb); shHi = Math.max(ba, bb); }
      else if (s.shadeMode === 'outer')   { shLo = Math.min(ba, bb); shHi = Math.max(ba, bb); shOuter = true; }
      else if (s.shadeMode === 'central') { shLo = s.mean - ba * s.sd; shHi = s.mean + ba * s.sd; }
    }

    /* ── Draw shade ── */
    const drawShade = (from, to, clr) => {
      const sf = Math.max(from, xMin), st = Math.min(to, xMax);
      if (sf >= st) return;
      let p = `M ${toX(sf)} ${toY(0)}`;
      const sdx2 = (st - sf) / 120;
      for (let x = sf; x <= st + sdx2 * 0.5; x += sdx2) {
        const cx = Math.min(x, st);
        p += ` L ${toX(cx)} ${toY(norm(cx))}`;
      }
      p += ` L ${toX(st)} ${toY(0)} Z`;
      svg.appendChild(svgEl('path', { d: p, fill: clr || 'rgba(66,98,255,0.18)', stroke: 'none' }));
    };

    if (shLo !== null) {
      if (shOuter) {
        drawShade(xMin, shLo);
        drawShade(shHi, xMax);
      } else {
        drawShade(shLo, shHi);
      }
    }

    /* ── Curve ── */
    let cp = `M ${toX(xMin)} ${toY(norm(xMin))}`;
    for (let i = 1; i <= steps; i++) cp += ` L ${toX(xMin + i * dx)} ${toY(norm(xMin + i * dx))}`;
    svg.appendChild(svgEl('path', { d: cp, fill: 'none', stroke: '#4262ff', 'stroke-width': '2.8' }));

    /* ── X-axis ── */
    svg.appendChild(svgEl('line', { x1: pad.l, y1: axisY, x2: W - pad.r, y2: axisY, stroke: '#2b2d42', 'stroke-width': '1.8' }));

    /* X-axis variable label */
    svg.appendChild(svgText(W - pad.r + 8, axisY + 4, s.xlabel || 'X', 14, 'start', { fill: '#444', 'font-style': 'italic', 'font-weight': '700' }));

    /* ── SD lines, ticks, labels ── */
    const sdPercents = ['', '34.1%', '13.6%', '2.1%'];
    for (let i = -3; i <= 3; i++) {
      const xv = s.mean + i * s.sd;
      const sx = toX(xv);

      if (s.showSDLines) {
        svg.appendChild(svgEl('line', {
          x1: sx, y1: pad.t, x2: sx, y2: axisY,
          stroke: i === 0 ? '#e63946' : '#d0d0d0',
          'stroke-width': i === 0 ? '1.8' : '1',
          'stroke-dasharray': i === 0 ? 'none' : '5,4',
        }));
      }
      if (s.showSDTicks) {
        svg.appendChild(svgEl('line', { x1: sx, y1: axisY, x2: sx, y2: axisY + 7, stroke: '#444', 'stroke-width': '1.5' }));
      }

      let row1Y = axisY + 20, row2Y = axisY + 36;
      if (s.showSigLabels) {
        const sigLabel = i === 0 ? 'μ' : `${i > 0 ? '+' : ''}${i}σ`;
        svg.appendChild(svgText(sx, row1Y, sigLabel, 12, 'middle', { fill: '#333', 'font-weight': '700' }));
        row2Y = axisY + 36;
      }
      if (s.showValLabels) {
        const vl = String(Math.round(xv * 1000) / 1000);
        const vy = s.showSigLabels ? row2Y : row1Y;
        svg.appendChild(svgText(sx, vy, vl, 10, 'middle', { fill: '#888' }));
      }

      if (s.showPct && i > 0 && i <= 3) {
        const lx = toX(s.mean + (i - 0.5) * s.sd);
        const rx = toX(s.mean - (i - 0.5) * s.sd);
        const py = pad.t + gh * 0.62 + i * 16;
        svg.appendChild(svgText(lx, py, sdPercents[i], 11, 'middle', { fill: '#4262ff', 'font-weight': '700' }));
        svg.appendChild(svgText(rx, py, sdPercents[i], 11, 'middle', { fill: '#4262ff', 'font-weight': '700' }));
      }
    }

    /* ── Inverse normal annotations ── */
    if (s.inv && invBounds) {
      const r3 = (v) => String(Math.round(v * 1000) / 1000);
      const labelRowY = s.showSigLabels && s.showValLabels ? axisY + 54 : s.showSigLabels || s.showValLabels ? axisY + 38 : axisY + 22;

      invBounds.forEach((bv) => {
        const sx = toX(bv);
        svg.appendChild(svgEl('line', { x1: sx, y1: pad.t, x2: sx, y2: axisY, stroke: '#e63946', 'stroke-width': '2', 'stroke-dasharray': '7,3' }));
        if (s.invShowVal) {
          svg.appendChild(svgText(sx, labelRowY, r3(bv), 11, 'middle', { fill: '#e63946', 'font-weight': '700' }));
        }
        if (s.invBlank) {
          const bw = 52, bh = 19;
          const blankY = s.invShowVal ? labelRowY + 8 : labelRowY - 10;
          svg.appendChild(svgEl('rect', { x: sx - bw / 2, y: blankY, width: bw, height: bh, fill: '#fff', stroke: '#e63946', 'stroke-width': '1.5', rx: '3' }));
        }
      });

      /* probability label inside shade */
      const pLabel = `p = ${s.invP}`;
      if (s.invTail === 'left') {
        svg.appendChild(svgText(toX((xMin + invBounds[0]) / 2), pad.t + gh * 0.52, pLabel, 12, 'middle', { fill: '#4262ff', 'font-weight': '700' }));
      } else if (s.invTail === 'right') {
        svg.appendChild(svgText(toX((invBounds[0] + xMax) / 2), pad.t + gh * 0.52, pLabel, 12, 'middle', { fill: '#4262ff', 'font-weight': '700' }));
      } else {
        svg.appendChild(svgText(toX(s.mean), pad.t + gh * 0.42, pLabel, 12, 'middle', { fill: '#4262ff', 'font-weight': '700' }));
      }
    }

    return svg;
  },
};

/* ================================================================
   20b. CHI-SQUARED DISTRIBUTION
   ================================================================ */
extraTemplates['chi-squared'] = {
  name: 'Chi-Squared Distribution',
  category: 'Statistics Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Chi-Squared Distribution'));
    c.appendChild(row(
      field('Degrees of freedom (df)', numberInput('cs-df', 4, 1, 30, 1)),
      field('Significance (α)', select('cs-alpha', [
        { v: '0.10', l: 'α = 0.10' }, { v: '0.05', l: 'α = 0.05' },
        { v: '0.025', l: 'α = 0.025' }, { v: '0.01', l: 'α = 0.01' },
      ], '0.05')),
    ));
    c.appendChild(row(
      checkbox('cs-shading', 'Shade critical region', true),
      checkbox('cs-critline', 'Show χ²_crit line', true),
    ));
    c.appendChild(row(
      checkbox('cs-xlabels', 'Show x-axis labels', true),
      checkbox('cs-blank', 'Blank mode (no labels)', false),
    ));
    c.appendChild(sectionLabel('Test Statistic (optional)'));
    c.appendChild(row(
      field('χ² test statistic', numberInput('cs-stat', '', 0, 200, 0.001)),
    ));
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:10.5px;color:#888;padding:1px 4px 6px;';
    hint.textContent = 'Shows your calculated χ² on the diagram and indicates if H₀ is rejected.';
    c.appendChild(hint);
    c.appendChild(row(
      field('Title', textInput('cs-title', 'Chi-Squared Distribution')),
    ));
  },
  readConfig() {
    const statRaw = document.getElementById('cs-stat') ? document.getElementById('cs-stat').value : '';
    return {
      df: val('cs-df') || 4, alpha: parseFloat(val('cs-alpha') || 0.05),
      shading: val('cs-shading'), critline: val('cs-critline'),
      xlabels: val('cs-xlabels'), blank: val('cs-blank'),
      stat: statRaw !== '' ? parseFloat(statRaw) : null,
      title: val('cs-title') || 'Chi-Squared Distribution',
    };
  },
  generateSVG(s) {
    const CHI_CRIT = {
      1:{0.10:2.706,0.05:3.841,0.025:5.024,0.01:6.635},
      2:{0.10:4.605,0.05:5.991,0.025:7.378,0.01:9.210},
      3:{0.10:6.251,0.05:7.815,0.025:9.348,0.01:11.345},
      4:{0.10:7.779,0.05:9.488,0.025:11.143,0.01:13.277},
      5:{0.10:9.236,0.05:11.070,0.025:12.833,0.01:15.086},
      6:{0.10:10.645,0.05:12.592,0.025:14.449,0.01:16.812},
      7:{0.10:12.017,0.05:14.067,0.025:16.013,0.01:18.475},
      8:{0.10:13.362,0.05:15.507,0.025:17.535,0.01:20.090},
      9:{0.10:14.684,0.05:16.919,0.025:19.023,0.01:21.666},
      10:{0.10:15.987,0.05:18.307,0.025:20.483,0.01:23.209},
      12:{0.10:18.549,0.05:21.026,0.025:23.337,0.01:26.217},
      15:{0.10:22.307,0.05:24.996,0.025:27.488,0.01:30.578},
      20:{0.10:28.412,0.05:31.410,0.025:34.170,0.01:37.566},
      25:{0.10:34.382,0.05:37.652,0.025:40.646,0.01:44.314},
      30:{0.10:40.256,0.05:43.773,0.025:46.979,0.01:50.892},
    };
    const df = Math.min(Math.max(Math.round(s.df), 1), 30);
    const alpha = s.alpha;
    const dfs = Object.keys(CHI_CRIT).map(Number).sort((a, b) => a - b);
    let critVal;
    if (CHI_CRIT[df]) {
      critVal = CHI_CRIT[df][alpha] || CHI_CRIT[df][0.05];
    } else {
      const lo = dfs.filter(d => d <= df).pop();
      const hi = dfs.filter(d => d > df)[0];
      const t = (df - lo) / (hi - lo);
      critVal = CHI_CRIT[lo][alpha] * (1 - t) + CHI_CRIT[hi][alpha] * t;
    }

    const hasStat = s.stat !== null && s.stat !== undefined && !isNaN(s.stat);
    const rejected = hasStat && s.stat > critVal;

    const W = 720, H = 390;
    const svg = makeSVG(W, H);
    const pad = { l: 50, r: 40, t: 50, b: 62 };
    const gw = W - pad.l - pad.r;
    const gh = H - pad.t - pad.b;
    const axisY = pad.t + gh;

    svg.appendChild(svgText(W / 2, 28, s.title, 15, 'middle', { fill: '#222', 'font-weight': '700' }));

    /* x range: accommodate both critVal and stat */
    const xMax = Math.max(critVal * 1.6, hasStat ? s.stat * 1.3 : 0, df * 2.4, 10);
    const steps = 300, xStep = xMax / steps;
    const toX = (x) => pad.l + (x / xMax) * gw;
    const peakX = Math.max(df - 2, 0.1);
    const peakY = _chiPDF(peakX, df);
    const toY = (y) => pad.t + gh - (y / peakY) * gh * 0.88;

    /* shade critical region */
    if (s.shading) {
      let p = `M ${toX(critVal)} ${toY(0)}`;
      for (let x = critVal; x <= xMax + xStep; x += xStep) {
        const cx = Math.min(x, xMax);
        p += ` L ${toX(cx)} ${toY(_chiPDF(cx, df))}`;
      }
      p += ` L ${toX(xMax)} ${toY(0)} Z`;
      svg.appendChild(svgEl('path', { d: p, fill: 'rgba(230,57,70,0.15)', stroke: 'none' }));
    }

    /* shade accept region up to stat (green) if stat shown */
    if (hasStat && !rejected) {
      let p = `M ${toX(0)} ${toY(0)}`;
      for (let x = 0.001; x <= s.stat + xStep; x += xStep) {
        const cx = Math.min(x, s.stat);
        p += ` L ${toX(cx)} ${toY(_chiPDF(cx, df))}`;
      }
      p += ` L ${toX(s.stat)} ${toY(0)} Z`;
      svg.appendChild(svgEl('path', { d: p, fill: 'rgba(16,185,129,0.13)', stroke: 'none' }));
    }

    /* curve */
    let cp = '';
    for (let i = 0; i <= steps; i++) {
      const x = i * xStep + 0.001;
      const y = toY(_chiPDF(x, df));
      cp += i === 0 ? `M ${toX(x)} ${y}` : ` L ${toX(x)} ${y}`;
    }
    svg.appendChild(svgEl('path', { d: cp, fill: 'none', stroke: '#4262ff', 'stroke-width': '2.8' }));

    /* x-axis */
    svg.appendChild(svgEl('line', { x1: pad.l, y1: axisY, x2: W - pad.r, y2: axisY, stroke: '#2b2d42', 'stroke-width': '1.8' }));

    /* critical value line */
    if (s.critline) {
      const cx = toX(critVal);
      svg.appendChild(svgEl('line', { x1: cx, y1: pad.t, x2: cx, y2: axisY, stroke: '#e63946', 'stroke-width': '1.8', 'stroke-dasharray': '6,4' }));
    }

    /* test statistic line */
    if (hasStat) {
      const sx = toX(s.stat);
      const statClr = rejected ? '#e63946' : '#10b981';
      svg.appendChild(svgEl('line', { x1: sx, y1: pad.t, x2: sx, y2: axisY, stroke: statClr, 'stroke-width': '2.2' }));
      /* triangle marker at top */
      svg.appendChild(svgEl('polygon', {
        points: `${sx},${pad.t + 8} ${sx - 6},${pad.t - 2} ${sx + 6},${pad.t - 2}`,
        fill: statClr,
      }));
    }

    /* x-axis labels */
    if (s.xlabels && !s.blank) {
      svg.appendChild(svgText(toX(0), axisY + 20, '0', 12, 'middle', { fill: '#444', 'font-weight': '600' }));
      const cv = Math.round(critVal * 100) / 100;
      svg.appendChild(svgText(toX(critVal), axisY + 20, String(cv), 11, 'middle', { fill: '#e63946', 'font-weight': '700' }));
      svg.appendChild(svgText(toX((critVal + xMax) / 2), axisY + 20, `α = ${s.alpha}`, 10, 'middle', { fill: '#e63946' }));
      if (hasStat) {
        const statClr = rejected ? '#e63946' : '#10b981';
        svg.appendChild(svgText(toX(s.stat), axisY + 34, `χ²=${Math.round(s.stat * 100) / 100}`, 10, 'middle', { fill: statClr, 'font-weight': '700' }));
      }
    }

    if (!s.blank) {
      svg.appendChild(svgText(W - pad.r, pad.t + 14, `χ²(${df})`, 12, 'end', { fill: '#666', 'font-style': 'italic' }));
      if (hasStat) {
        const verdict = rejected ? 'Reject H₀' : 'Fail to reject H₀';
        const verdictClr = rejected ? '#e63946' : '#10b981';
        svg.appendChild(svgText(W / 2, pad.t + 22, verdict, 13, 'middle', { fill: verdictClr, 'font-weight': '700' }));
      }
    }

    return svg;
  },
};

/* ================================================================
   20c. T-DISTRIBUTION
   ================================================================ */
extraTemplates['t-distribution'] = {
  name: 't-Distribution',
  category: 'Statistics Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('t-Distribution'));
    c.appendChild(row(
      field('Degrees of freedom (df)', numberInput('td-df', 10, 1, 120, 1)),
      field('Significance (α)', select('td-alpha', [
        { v: '0.10', l: 'α = 0.10' }, { v: '0.05', l: 'α = 0.05' },
        { v: '0.025', l: 'α = 0.025' }, { v: '0.01', l: 'α = 0.01' },
      ], '0.05')),
    ));
    c.appendChild(row(
      field('Tails', select('td-tails', [
        { v: 'two', l: 'Two-tailed' },
        { v: 'right', l: 'Right-tailed' },
        { v: 'left', l: 'Left-tailed' },
      ], 'two')),
    ));
    c.appendChild(row(
      checkbox('td-shading', 'Shade critical region(s)', true),
      checkbox('td-critline', 'Show critical value line(s)', true),
    ));
    c.appendChild(row(
      checkbox('td-normal', 'Overlay N(0,1) curve', false),
      checkbox('td-blank', 'Blank mode (no labels)', false),
    ));
    c.appendChild(sectionLabel('Test Statistic (optional)'));
    c.appendChild(row(
      field('t test statistic', numberInput('td-stat', '', -20, 20, 0.001)),
    ));
    const hint2 = document.createElement('div');
    hint2.style.cssText = 'font-size:10.5px;color:#888;padding:1px 4px 6px;';
    hint2.textContent = 'Shows your calculated t on the diagram and indicates if H₀ is rejected.';
    c.appendChild(hint2);
    c.appendChild(row(field('Title', textInput('td-title', 't-Distribution'))));
  },
  readConfig() {
    const statRaw = document.getElementById('td-stat') ? document.getElementById('td-stat').value : '';
    return {
      df: val('td-df') || 10, alpha: parseFloat(val('td-alpha') || 0.05),
      tails: val('td-tails') || 'two',
      shading: val('td-shading'), critline: val('td-critline'),
      normal: val('td-normal'), blank: val('td-blank'),
      stat: statRaw !== '' ? parseFloat(statRaw) : null,
      title: val('td-title') || 't-Distribution',
    };
  },
  generateSVG(s) {
    const T_CRIT = {
      1:{0.10:3.078,0.05:6.314,0.025:12.706,0.01:31.821},
      2:{0.10:1.886,0.05:2.920,0.025:4.303,0.01:6.965},
      3:{0.10:1.638,0.05:2.353,0.025:3.182,0.01:4.541},
      4:{0.10:1.533,0.05:2.132,0.025:2.776,0.01:3.747},
      5:{0.10:1.476,0.05:2.015,0.025:2.571,0.01:3.365},
      6:{0.10:1.440,0.05:1.943,0.025:2.447,0.01:3.143},
      7:{0.10:1.415,0.05:1.895,0.025:2.365,0.01:2.998},
      8:{0.10:1.397,0.05:1.860,0.025:2.306,0.01:2.896},
      9:{0.10:1.383,0.05:1.833,0.025:2.262,0.01:2.821},
      10:{0.10:1.372,0.05:1.812,0.025:2.228,0.01:2.764},
      15:{0.10:1.341,0.05:1.753,0.025:2.131,0.01:2.602},
      20:{0.10:1.325,0.05:1.725,0.025:2.086,0.01:2.528},
      25:{0.10:1.316,0.05:1.708,0.025:2.060,0.01:2.485},
      30:{0.10:1.310,0.05:1.697,0.025:2.042,0.01:2.457},
      40:{0.10:1.303,0.05:1.684,0.025:2.021,0.01:2.423},
      60:{0.10:1.296,0.05:1.671,0.025:2.000,0.01:2.390},
      120:{0.10:1.289,0.05:1.658,0.025:1.980,0.01:2.358},
    };
    const df = Math.min(Math.max(Math.round(s.df), 1), 120);
    const alpha = s.alpha;
    const dfs = Object.keys(T_CRIT).map(Number).sort((a, b) => a - b);
    let tCrit;
    if (T_CRIT[df]) {
      tCrit = T_CRIT[df][alpha] || T_CRIT[df][0.05];
    } else {
      const lo = dfs.filter(d => d <= df).pop();
      const hi = dfs.filter(d => d > df)[0];
      const t2 = (df - lo) / (hi - lo);
      tCrit = T_CRIT[lo][alpha] * (1 - t2) + T_CRIT[hi][alpha] * t2;
    }

    const hasStat = s.stat !== null && s.stat !== undefined && !isNaN(s.stat);
    const absStat = hasStat ? Math.abs(s.stat) : 0;
    let rejected = false;
    if (hasStat) {
      if (s.tails === 'two') rejected = absStat > tCrit;
      else if (s.tails === 'right') rejected = s.stat > tCrit;
      else rejected = s.stat < -tCrit;
    }

    const W = 720, H = 410;
    const svg = makeSVG(W, H);
    const pad = { l: 50, r: 40, t: 50, b: 62 };
    const gw = W - pad.l - pad.r;
    const gh = H - pad.t - pad.b;
    const axisY = pad.t + gh;

    svg.appendChild(svgText(W / 2, 28, s.title, 15, 'middle', { fill: '#222', 'font-weight': '700' }));

    const xRange = Math.max(tCrit * 1.55, hasStat ? absStat * 1.3 : 0, 4);
    const xMin = -xRange, xMax = xRange;
    const steps = 300, xStep = (xMax - xMin) / steps;
    const toX = (x) => pad.l + ((x - xMin) / (xMax - xMin)) * gw;
    const peakY = _tPDF(0, df);
    const toY = (y) => pad.t + gh - (y / peakY) * gh * 0.88;

    /* shading */
    const shade = (from, to, clr) => {
      let p = `M ${toX(from)} ${toY(0)}`;
      const st2 = (to - from) / 100;
      for (let x = from; x <= to + st2 * 0.5; x += st2) {
        const cx = Math.min(x, to);
        p += ` L ${toX(cx)} ${toY(_tPDF(cx, df))}`;
      }
      p += ` L ${toX(to)} ${toY(0)} Z`;
      svg.appendChild(svgEl('path', { d: p, fill: clr, stroke: 'none' }));
    };

    if (s.shading) {
      if (s.tails === 'two') {
        shade(tCrit, xMax, 'rgba(230,57,70,0.15)');
        shade(xMin, -tCrit, 'rgba(230,57,70,0.15)');
      } else if (s.tails === 'right') {
        shade(tCrit, xMax, 'rgba(230,57,70,0.15)');
      } else {
        shade(xMin, -tCrit, 'rgba(230,57,70,0.15)');
      }
    }

    /* normal overlay */
    if (s.normal) {
      const normPDF = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
      let np = `M ${toX(xMin)} ${toY(normPDF(xMin))}`;
      for (let i = 1; i <= steps; i++) {
        const x = xMin + i * xStep;
        np += ` L ${toX(x)} ${toY(normPDF(x))}`;
      }
      svg.appendChild(svgEl('path', { d: np, fill: 'none', stroke: '#aaa', 'stroke-width': '1.5', 'stroke-dasharray': '6,4' }));
    }

    /* t curve */
    let cp = `M ${toX(xMin)} ${toY(_tPDF(xMin, df))}`;
    for (let i = 1; i <= steps; i++) {
      const x = xMin + i * xStep;
      cp += ` L ${toX(x)} ${toY(_tPDF(x, df))}`;
    }
    svg.appendChild(svgEl('path', { d: cp, fill: 'none', stroke: '#4262ff', 'stroke-width': '2.8' }));

    /* x-axis */
    svg.appendChild(svgEl('line', { x1: pad.l, y1: axisY, x2: W - pad.r, y2: axisY, stroke: '#2b2d42', 'stroke-width': '1.8' }));

    /* critical value lines */
    if (s.critline) {
      const drawCrit = (xv) => {
        const cx = toX(xv);
        svg.appendChild(svgEl('line', { x1: cx, y1: pad.t, x2: cx, y2: axisY, stroke: '#e63946', 'stroke-width': '1.8', 'stroke-dasharray': '6,4' }));
      };
      if (s.tails === 'two') { drawCrit(tCrit); drawCrit(-tCrit); }
      else if (s.tails === 'right') drawCrit(tCrit);
      else drawCrit(-tCrit);
    }

    /* test statistic line */
    if (hasStat) {
      const sx = toX(s.stat);
      const statClr = rejected ? '#e63946' : '#10b981';
      svg.appendChild(svgEl('line', { x1: sx, y1: pad.t, x2: sx, y2: axisY, stroke: statClr, 'stroke-width': '2.2' }));
      svg.appendChild(svgEl('polygon', {
        points: `${sx},${pad.t + 8} ${sx - 6},${pad.t - 2} ${sx + 6},${pad.t - 2}`,
        fill: statClr,
      }));
    }

    /* labels */
    if (!s.blank) {
      svg.appendChild(svgText(toX(0), axisY + 20, '0', 12, 'middle', { fill: '#444', 'font-weight': '600' }));
      const cv = Math.round(tCrit * 1000) / 1000;
      if (s.tails === 'two' || s.tails === 'right') {
        svg.appendChild(svgText(toX(tCrit), axisY + 20, String(cv), 11, 'middle', { fill: '#e63946', 'font-weight': '700' }));
      }
      if (s.tails === 'two' || s.tails === 'left') {
        svg.appendChild(svgText(toX(-tCrit), axisY + 20, `-${cv}`, 11, 'middle', { fill: '#e63946', 'font-weight': '700' }));
      }
      if (hasStat) {
        const statClr = rejected ? '#e63946' : '#10b981';
        svg.appendChild(svgText(toX(s.stat), axisY + 34, `t=${Math.round(s.stat * 1000) / 1000}`, 10, 'middle', { fill: statClr, 'font-weight': '700' }));
      }
      svg.appendChild(svgText(W - pad.r, pad.t + 14, `t(${df})`, 12, 'end', { fill: '#666', 'font-style': 'italic' }));
      if (s.normal) {
        svg.appendChild(svgText(toX(xMax * 0.82), pad.t + gh * 0.14, 'N(0,1)', 10, 'middle', { fill: '#aaa', 'font-style': 'italic' }));
      }
      if (hasStat) {
        const verdict = rejected ? 'Reject H₀' : 'Fail to reject H₀';
        const verdictClr = rejected ? '#e63946' : '#10b981';
        svg.appendChild(svgText(W / 2, pad.t + 22, verdict, 13, 'middle', { fill: verdictClr, 'font-weight': '700' }));
      }
    }

    return svg;
  },
};

/* ================================================================
   20d. BINOMIAL DISTRIBUTION
   ================================================================ */
extraTemplates['binomial'] = {
  name: 'Binomial Distribution',
  category: 'Statistics Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Binomial Distribution'));
    c.appendChild(row(
      field('Trials (n)', numberInput('bd-n', 10, 1, 50, 1)),
      field('Probability (p)', numberInput('bd-p', 0.5, 0.01, 0.99, 0.01)),
    ));
    c.appendChild(row(
      field('Shade P(X…)', select('bd-shade', [
        { v: 'none', l: 'None' },
        { v: 'eq', l: '= k' },
        { v: 'le', l: '≤ k' },
        { v: 'ge', l: '≥ k' },
        { v: 'lt', l: '< k' },
        { v: 'gt', l: '> k' },
      ], 'none')),
      field('k', numberInput('bd-k', 5, 0, 50, 1)),
    ));
    c.appendChild(row(
      checkbox('bd-meanline', 'Show mean (np) line', true),
      checkbox('bd-pvals', 'Show P(X=k) on bars', false),
    ));
    c.appendChild(row(
      checkbox('bd-xlabels', 'Show x-axis labels', true),
      checkbox('bd-blank', 'Blank mode (no labels)', false),
    ));
    c.appendChild(row(
      field('Title', textInput('bd-title', 'Binomial Distribution')),
    ));
  },
  readConfig() {
    return {
      n: val('bd-n') || 10, p: val('bd-p') || 0.5,
      shade: val('bd-shade') || 'none', k: val('bd-k') || 5,
      meanline: val('bd-meanline'), pvals: val('bd-pvals'),
      xlabels: val('bd-xlabels'), blank: val('bd-blank'),
      title: val('bd-title') || 'Binomial Distribution',
    };
  },
  generateSVG(s) {
    const n = Math.min(Math.max(Math.round(s.n), 1), 50);
    const p = Math.min(Math.max(s.p, 0.01), 0.99);
    const k = Math.min(Math.max(Math.round(s.k), 0), n);

    const probs = [];
    for (let i = 0; i <= n; i++) probs.push(_binomPMF(i, n, p));
    const maxP = Math.max(...probs);

    const barW0 = Math.max(4, Math.min(36, 560 / (n + 1) - 3));
    const W = Math.min(800, Math.max(420, (n + 1) * (barW0 + 3) + 110));
    const H = 400;
    const svg = makeSVG(W, H);
    const pad = { l: 58, r: 30, t: 50, b: 64 };
    const gw = W - pad.l - pad.r;
    const gh = H - pad.t - pad.b;
    const axisY = pad.t + gh;

    svg.appendChild(svgText(W / 2, 28, s.title, 15, 'middle', { fill: '#222', 'font-weight': '700' }));

    const barW = Math.max(4, gw / (n + 1) - 3);
    const toX = (i) => pad.l + (i + 0.5) * gw / (n + 1);
    const toY = (pv) => pad.t + gh - (pv / maxP) * gh * 0.88;

    /* bars */
    for (let i = 0; i <= n; i++) {
      const bx = toX(i) - barW / 2;
      const by = toY(probs[i]);
      const bh = axisY - by;

      let isShaded = false;
      if (s.shade === 'eq') isShaded = i === k;
      else if (s.shade === 'le') isShaded = i <= k;
      else if (s.shade === 'ge') isShaded = i >= k;
      else if (s.shade === 'lt') isShaded = i < k;
      else if (s.shade === 'gt') isShaded = i > k;

      const fill = isShaded ? '#e63946' : '#4262ff';
      svg.appendChild(svgEl('rect', { x: bx, y: by, width: barW, height: bh, fill, opacity: isShaded ? '0.82' : '0.6', rx: '1' }));

      /* P(X=k) value on bar */
      if (s.pvals && !s.blank && probs[i] > maxP * 0.04) {
        const pStr = probs[i] < 0.001 ? probs[i].toExponential(1) : String(Math.round(probs[i] * 1000) / 1000);
        svg.appendChild(svgText(toX(i), by - 4, pStr, 8, 'middle', { fill: isShaded ? '#e63946' : '#4262ff', 'font-weight': '600' }));
      }
    }

    /* x-axis */
    svg.appendChild(svgEl('line', { x1: pad.l, y1: axisY, x2: W - pad.r, y2: axisY, stroke: '#2b2d42', 'stroke-width': '1.8' }));

    /* y-axis */
    svg.appendChild(svgEl('line', { x1: pad.l, y1: pad.t, x2: pad.l, y2: axisY, stroke: '#2b2d42', 'stroke-width': '1.5' }));

    /* mean line */
    if (s.meanline && !s.blank) {
      const mean = n * p;
      const mx = toX(mean);
      svg.appendChild(svgEl('line', { x1: mx, y1: pad.t, x2: mx, y2: axisY, stroke: '#f59e0b', 'stroke-width': '2', 'stroke-dasharray': '6,3' }));
      svg.appendChild(svgText(mx, pad.t - 6, `μ=${Math.round(mean * 100) / 100}`, 10, 'middle', { fill: '#f59e0b', 'font-weight': '700' }));
    }

    /* x-axis labels */
    if (s.xlabels && !s.blank) {
      const step = n <= 20 ? 1 : n <= 40 ? 2 : 5;
      for (let i = 0; i <= n; i += step) {
        svg.appendChild(svgEl('line', { x1: toX(i), y1: axisY, x2: toX(i), y2: axisY + 5, stroke: '#555', 'stroke-width': '1' }));
        svg.appendChild(svgText(toX(i), axisY + 18, String(i), 10, 'middle', { fill: '#555' }));
      }
      svg.appendChild(svgText(W / 2, axisY + 40, 'k', 13, 'middle', { fill: '#333', 'font-style': 'italic' }));
    }

    if (!s.blank) {
      /* y-axis label */
      svg.appendChild(svgText(13, pad.t + gh / 2, 'P(X = k)', 10, 'middle', { fill: '#666', transform: `rotate(-90,13,${pad.t + gh / 2})` }));
      svg.appendChild(svgText(W - pad.r, pad.t + 14, `B(${n}, ${p})`, 12, 'end', { fill: '#555', 'font-style': 'italic' }));
      /* SD */
      const sdStr = `σ = ${Math.round(Math.sqrt(n * p * (1 - p)) * 100) / 100}`;
      svg.appendChild(svgText(W - pad.r, pad.t + 28, sdStr, 10, 'end', { fill: '#888' }));
    }

    return svg;
  },
};

/* ================================================================
   20e. CONTINGENCY TABLE (Chi-Test for Independence)
   ================================================================ */
extraTemplates['contingency-table'] = {
  name: 'Contingency Table',
  category: 'Statistics Extra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Contingency Table'));
    c.appendChild(row(
      field('Rows (excl. totals)', numberInput('ct-rows', 2, 1, 5, 1)),
      field('Columns (excl. totals)', numberInput('ct-cols', 2, 1, 5, 1)),
    ));
    c.appendChild(row(
      checkbox('ct-totals', 'Show totals row/col', true),
      checkbox('ct-blank', 'Blank cells (no values)', true),
    ));

    const valContainer = document.createElement('div');
    valContainer.id = 'ct-val-container';
    c.appendChild(valContainer);

    const buildCTInputs = () => {
      const nr = parseInt(document.getElementById('ct-rows').value, 10) || 2;
      const nc = parseInt(document.getElementById('ct-cols').value, 10) || 2;
      const container = document.getElementById('ct-val-container');
      if (!container) return;

      /* preserve old values */
      const oldRowLabels = [], oldColLabels = [];
      const oldVals = {};
      container.querySelectorAll('[data-ct-rlabel]').forEach(el => oldRowLabels.push(el.value));
      container.querySelectorAll('[data-ct-clabel]').forEach(el => oldColLabels.push(el.value));
      container.querySelectorAll('[data-ct-cell]').forEach(el => {
        const [r,cl] = el.dataset.ctCell.split('-').map(Number);
        if (!oldVals[r]) oldVals[r] = {};
        oldVals[r][cl] = el.value;
      });
      container.innerHTML = '';

      /* column labels */
      const defaultColLabels = ['Category A','Category B','Category C','Category D','Category E'];
      const defaultRowLabels = ['Group 1','Group 2','Group 3','Group 4','Group 5'];
      const clRow = document.createElement('div');
      clRow.className = 'cfg-row';
      clRow.style.cssText = 'gap:4px;margin-bottom:2px;';
      for (let col = 0; col < nc; col++) {
        const inp = document.createElement('input');
        inp.type = 'text'; inp.className = 'cfg-input'; inp.style.flex = '1';
        inp.setAttribute('data-ct-clabel', col);
        inp.value = col < oldColLabels.length ? oldColLabels[col] : (defaultColLabels[col] || `Col ${col+1}`);
        inp.placeholder = `Col ${col+1}`;
        clRow.appendChild(inp);
      }
      container.appendChild(clRow);

      /* value rows */
      for (let r = 0; r < nr; r++) {
        const rRow = document.createElement('div');
        rRow.className = 'cfg-row';
        rRow.style.cssText = 'gap:4px;margin-bottom:2px;';
        const rl = document.createElement('input');
        rl.type = 'text'; rl.className = 'cfg-input'; rl.style.flex = '1.4';
        rl.setAttribute('data-ct-rlabel', r);
        rl.value = r < oldRowLabels.length ? oldRowLabels[r] : (defaultRowLabels[r] || `Row ${r+1}`);
        rl.placeholder = `Row ${r+1}`;
        rRow.appendChild(rl);
        for (let col = 0; col < nc; col++) {
          const vi = document.createElement('input');
          vi.type = 'number'; vi.className = 'cfg-input cfg-input-sm'; vi.style.flex = '1';
          vi.setAttribute('data-ct-cell', `${r}-${col}`);
          vi.min = 0;
          vi.value = (oldVals[r] && oldVals[r][col] !== undefined) ? oldVals[r][col] : Math.floor(Math.random() * 30 + 5);
          rRow.appendChild(vi);
        }
        container.appendChild(rRow);
      }

      container.querySelectorAll('input').forEach(el => {
        el.addEventListener('input', () => { if (window._tplSchedulePreview) window._tplSchedulePreview(); });
      });
    };

    document.getElementById('ct-rows').addEventListener('change', buildCTInputs);
    document.getElementById('ct-cols').addEventListener('change', buildCTInputs);
    buildCTInputs();

    c.appendChild(row(field('Title', textInput('ct-title', 'Contingency Table'))));
  },
  readConfig() {
    const rowLabels = [], colLabels = [];
    const cells = {};
    document.querySelectorAll('[data-ct-rlabel]').forEach(el => rowLabels.push(el.value.trim() || `Row ${rowLabels.length+1}`));
    document.querySelectorAll('[data-ct-clabel]').forEach(el => colLabels.push(el.value.trim() || `Col ${colLabels.length+1}`));
    document.querySelectorAll('[data-ct-cell]').forEach(el => {
      const [r,col] = el.dataset.ctCell.split('-').map(Number);
      if (!cells[r]) cells[r] = {};
      cells[r][col] = parseInt(el.value) || 0;
    });
    return {
      rows: val('ct-rows') || 2, cols: val('ct-cols') || 2,
      rowLabels, colLabels, cells,
      showTotals: val('ct-totals'), blank: val('ct-blank'),
      title: val('ct-title') || 'Contingency Table',
    };
  },
  generateSVG(s) {
    const nr = Math.min(Math.max(Math.round(s.rows), 1), 5);
    const nc = Math.min(Math.max(Math.round(s.cols), 1), 5);
    const cells = s.cells || {};

    /* row/col totals */
    const rowTotals = [], colTotals = new Array(nc).fill(0);
    let grandTotal = 0;
    for (let r = 0; r < nr; r++) {
      let rt = 0;
      for (let col = 0; col < nc; col++) {
        const v = cells[r] ? (cells[r][col] || 0) : 0;
        rt += v; colTotals[col] += v; grandTotal += v;
      }
      rowTotals.push(rt);
    }

    const rowH = 38, headerH = 42;
    const labelW = 110, cellW = 76;
    const totalCols = nc + (s.showTotals ? 1 : 0);
    const totalRows = nr + (s.showTotals ? 1 : 0);
    const pad = 20;
    const titleH = 34;
    const W = pad * 2 + labelW + cellW * totalCols;
    const H = pad * 2 + titleH + headerH + rowH * totalRows;
    const svg = makeSVG(W, H);

    /* colour palette — clean, light */
    const CLR = {
      colHead: '#e8edf8',    /* column header bg */
      colHeadTxt: '#1e3a5f', /* column header text */
      rowHead: '#f4f6fb',    /* row label bg */
      rowHeadTxt: '#2d3748', /* row label text */
      totalHead: '#dde3f0',  /* totals header bg */
      totalHeadTxt: '#1e3a5f',
      cellEven: '#ffffff',
      cellOdd: '#f8f9fc',
      totalCell: '#eef1f8',
      grandCell: '#dde3f0',
      border: '#c8d0e0',
      headerBorder: '#a0aec0',
    };

    const tableLeft = pad;
    const tableTop = pad + titleH;

    /* helper: cell text with dominant-baseline for true vertical centering */
    const cellTxt = (x, y, h, txt, size, weight, fill) =>
      svgText(x, y + h / 2, txt, size, 'middle', { fill, 'font-weight': weight, 'dominant-baseline': 'central' });

    const truncate = (str, maxLen) => str.length > maxLen ? str.slice(0, maxLen) + '…' : str;

    /* title */
    svg.appendChild(svgText(W / 2, pad + 18, s.title, 14, 'middle', { fill: '#1a202c', 'font-weight': '700', 'dominant-baseline': 'central' }));

    /* outer border */
    const tableW = labelW + cellW * totalCols;
    const tableH = headerH + rowH * totalRows;
    svg.appendChild(svgEl('rect', { x: tableLeft, y: tableTop, width: tableW, height: tableH, fill: 'none', stroke: CLR.headerBorder, 'stroke-width': '1.5', rx: '3' }));

    /* header row — top-left corner cell */
    svg.appendChild(svgEl('rect', { x: tableLeft, y: tableTop, width: labelW, height: headerH, fill: CLR.totalHead, stroke: CLR.border, 'stroke-width': '0.75' }));

    /* column headers */
    for (let col = 0; col < nc; col++) {
      const cx = tableLeft + labelW + col * cellW;
      svg.appendChild(svgEl('rect', { x: cx, y: tableTop, width: cellW, height: headerH, fill: CLR.colHead, stroke: CLR.border, 'stroke-width': '0.75' }));
      const lbl = truncate(s.colLabels[col] || `Col ${col+1}`, 10);
      svg.appendChild(cellTxt(cx + cellW / 2, tableTop, headerH, lbl, 11, '700', CLR.colHeadTxt));
    }
    if (s.showTotals) {
      const cx = tableLeft + labelW + nc * cellW;
      svg.appendChild(svgEl('rect', { x: cx, y: tableTop, width: cellW, height: headerH, fill: CLR.totalHead, stroke: CLR.border, 'stroke-width': '0.75' }));
      svg.appendChild(cellTxt(cx + cellW / 2, tableTop, headerH, 'Total', 11, '700', CLR.totalHeadTxt));
    }

    /* data rows */
    for (let r = 0; r < nr; r++) {
      const ry = tableTop + headerH + r * rowH;
      const cFill = r % 2 === 0 ? CLR.cellEven : CLR.cellOdd;
      /* row label */
      svg.appendChild(svgEl('rect', { x: tableLeft, y: ry, width: labelW, height: rowH, fill: CLR.rowHead, stroke: CLR.border, 'stroke-width': '0.75' }));
      const lbl = truncate(s.rowLabels[r] || `Row ${r+1}`, 12);
      svg.appendChild(cellTxt(tableLeft + labelW / 2, ry, rowH, lbl, 11, '600', CLR.rowHeadTxt));
      /* data cells */
      for (let col = 0; col < nc; col++) {
        const cx = tableLeft + labelW + col * cellW;
        svg.appendChild(svgEl('rect', { x: cx, y: ry, width: cellW, height: rowH, fill: cFill, stroke: CLR.border, 'stroke-width': '0.75' }));
        if (!s.blank) {
          const v = cells[r] ? (cells[r][col] || 0) : 0;
          svg.appendChild(cellTxt(cx + cellW / 2, ry, rowH, String(v), 13, '500', '#2d3748'));
        }
      }
      /* row total */
      if (s.showTotals) {
        const cx = tableLeft + labelW + nc * cellW;
        svg.appendChild(svgEl('rect', { x: cx, y: ry, width: cellW, height: rowH, fill: CLR.totalCell, stroke: CLR.border, 'stroke-width': '0.75' }));
        if (!s.blank) {
          svg.appendChild(cellTxt(cx + cellW / 2, ry, rowH, String(rowTotals[r]), 13, '700', CLR.colHeadTxt));
        }
      }
    }

    /* totals row */
    if (s.showTotals) {
      const ry = tableTop + headerH + nr * rowH;
      /* "Total" label */
      svg.appendChild(svgEl('rect', { x: tableLeft, y: ry, width: labelW, height: rowH, fill: CLR.totalHead, stroke: CLR.border, 'stroke-width': '0.75' }));
      svg.appendChild(cellTxt(tableLeft + labelW / 2, ry, rowH, 'Total', 11, '700', CLR.totalHeadTxt));
      /* col totals */
      for (let col = 0; col < nc; col++) {
        const cx = tableLeft + labelW + col * cellW;
        svg.appendChild(svgEl('rect', { x: cx, y: ry, width: cellW, height: rowH, fill: CLR.totalCell, stroke: CLR.border, 'stroke-width': '0.75' }));
        if (!s.blank) {
          svg.appendChild(cellTxt(cx + cellW / 2, ry, rowH, String(colTotals[col]), 13, '700', CLR.colHeadTxt));
        }
      }
      /* grand total */
      const cx = tableLeft + labelW + nc * cellW;
      svg.appendChild(svgEl('rect', { x: cx, y: ry, width: cellW, height: rowH, fill: CLR.grandCell, stroke: CLR.border, 'stroke-width': '0.75' }));
      if (!s.blank) {
        svg.appendChild(cellTxt(cx + cellW / 2, ry, rowH, String(grandTotal), 13, '700', CLR.colHeadTxt));
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
    const rowContainer = document.createElement('div');
    rowContainer.id = 'tc-row-inputs';
    c.appendChild(rowContainer);
    c.appendChild(row(
      checkbox('tc-freq', 'Show frequency column', true),
    ));
    c.appendChild(row(
      field('Title', textInput('tc-title', 'Favourite Colour')),
    ));

    const defaultLabels = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Black', 'White', 'Grey', 'Cyan'];
    const defaultTallies = [7, 12, 4, 9, 3, 6, 8, 2, 11, 5, 10, 1];

    const buildRows = () => {
      const n = parseInt(document.getElementById('tc-rows').value, 10) || 5;
      const ct2 = document.getElementById('tc-row-inputs');
      const oldLabels = [], oldTallies = [];
      ct2.querySelectorAll('[data-tc-label]').forEach(el => oldLabels.push(el.value));
      ct2.querySelectorAll('[data-tc-tally]').forEach(el => oldTallies.push(parseInt(el.value) || 0));
      ct2.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const r2 = document.createElement('div');
        r2.className = 'cfg-row';
        r2.style.marginBottom = '2px';
        const fLabel = document.createElement('div');
        fLabel.className = 'cfg-field';
        fLabel.style.flex = '2';
        if (i === 0) { const h = document.createElement('div'); h.className = 'cfg-field-label'; h.textContent = 'Label'; fLabel.appendChild(h); }
        const lbl = document.createElement('input');
        lbl.type = 'text'; lbl.className = 'cfg-input';
        lbl.setAttribute('data-tc-label', i);
        lbl.value = i < oldLabels.length ? oldLabels[i] : (defaultLabels[i] || `Category ${i + 1}`);
        lbl.placeholder = `Label ${i + 1}`;
        fLabel.appendChild(lbl);

        const fTally = document.createElement('div');
        fTally.className = 'cfg-field';
        fTally.style.flex = '1';
        if (i === 0) { const h = document.createElement('div'); h.className = 'cfg-field-label'; h.textContent = 'Tally'; fTally.appendChild(h); }
        const tly = document.createElement('input');
        tly.type = 'number'; tly.className = 'cfg-input cfg-input-sm';
        tly.setAttribute('data-tc-tally', i);
        tly.min = 0;
        tly.value = i < oldTallies.length ? oldTallies[i] : (defaultTallies[i] !== undefined ? defaultTallies[i] : 0);
        fTally.appendChild(tly);

        r2.appendChild(fLabel);
        r2.appendChild(fTally);
        ct2.appendChild(r2);
      }
      ct2.querySelectorAll('input').forEach(el => { el.addEventListener('input', () => { if (window._tplSchedulePreview) window._tplSchedulePreview(); }); });
    };

    document.getElementById('tc-rows').addEventListener('change', buildRows);
    document.getElementById('tc-rows').addEventListener('input', buildRows);
    buildRows();
  },
  readConfig() {
    const labels = [], tallies = [];
    document.querySelectorAll('[data-tc-label]').forEach(el => labels.push(el.value.trim()));
    document.querySelectorAll('[data-tc-tally]').forEach(el => tallies.push(parseInt(el.value) || 0));
    return {
      numRows: val('tc-rows') || 5,
      labels,
      tallies,
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
    const intContainer = document.createElement('div');
    intContainer.id = 'ft-interval-inputs';
    c.appendChild(intContainer);
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

    const buildIntervalRows = () => {
      const n = parseInt(document.getElementById('ft-rows').value, 10) || 6;
      const ct2 = document.getElementById('ft-interval-inputs');
      const oldVals = [];
      ct2.querySelectorAll('[data-ft-interval]').forEach(el => oldVals.push(el.value));
      ct2.innerHTML = '';
      const lbl = document.createElement('div');
      lbl.className = 'cfg-field-label';
      lbl.textContent = 'Interval labels';
      ct2.appendChild(lbl);
      for (let i = 0; i < n; i++) {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'cfg-input';
        inp.setAttribute('data-ft-interval', i);
        inp.value = i < oldVals.length ? oldVals[i] : `${i * 10}-${(i + 1) * 10}`;
        inp.placeholder = `Interval ${i + 1}`;
        inp.style.marginBottom = '2px';
        ct2.appendChild(inp);
      }
      ct2.querySelectorAll('input').forEach(el => { el.addEventListener('input', () => { if (window._tplSchedulePreview) window._tplSchedulePreview(); }); });
    };

    document.getElementById('ft-rows').addEventListener('change', buildIntervalRows);
    document.getElementById('ft-rows').addEventListener('input', buildIntervalRows);
    buildIntervalRows();
  },
  readConfig() {
    const intervals = [];
    document.querySelectorAll('[data-ft-interval]').forEach(el => intervals.push(el.value.trim()));
    return {
      numRows: val('ft-rows') || 6,
      intervals,
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
      field('Hours (1\u201312)', numberInput('cl-hours', 10, 1, 12, 1)),
      field('Minutes (0\u201359)', numberInput('cl-mins', 10, 0, 59, 5)),
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
    const h = Math.max(1, Math.min(12, parseInt(val('cl-hours'), 10) || 10));
    const m = Math.max(0, Math.min(59, parseInt(val('cl-mins'), 10) || 0));
    return {
      time: `${h}:${String(m).padStart(2, '0')}`,
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
    const diceContainer = document.createElement('div');
    diceContainer.id = 'di-value-inputs';
    c.appendChild(diceContainer);
    c.appendChild(row(field('Colour', colourSwatch('di-col', '#ffffff'))));

    const defaultVals = [3, 5, 2, 6];
    const buildDiceInputs = () => {
      const n = Math.max(1, Math.min(4, parseInt(document.getElementById('di-num').value, 10) || 2));
      const ct2 = document.getElementById('di-value-inputs');
      const oldVals = [];
      ct2.querySelectorAll('[data-di-val]').forEach(el => oldVals.push(parseInt(el.value) || 1));
      ct2.innerHTML = '';
      const r2 = document.createElement('div');
      r2.className = 'cfg-row';
      for (let i = 0; i < n; i++) {
        const f = document.createElement('div');
        f.className = 'cfg-field';
        const lbl2 = document.createElement('div');
        lbl2.className = 'cfg-field-label';
        lbl2.textContent = `Die ${i + 1}`;
        f.appendChild(lbl2);
        const inp = document.createElement('input');
        inp.type = 'number'; inp.className = 'cfg-input cfg-input-sm';
        inp.setAttribute('data-di-val', i);
        inp.min = 1; inp.max = 6;
        inp.value = i < oldVals.length ? oldVals[i] : (defaultVals[i] || 1);
        f.appendChild(inp);
        r2.appendChild(f);
      }
      ct2.appendChild(r2);
      ct2.querySelectorAll('input').forEach(el => { el.addEventListener('input', () => { if (window._tplSchedulePreview) window._tplSchedulePreview(); }); });
    };

    document.getElementById('di-num').addEventListener('change', buildDiceInputs);
    document.getElementById('di-num').addEventListener('input', buildDiceInputs);
    buildDiceInputs();
  },
  readConfig() {
    const values = [];
    document.querySelectorAll('[data-di-val]').forEach(el => values.push(Math.max(1, Math.min(6, parseInt(el.value) || 1))));
    return {
      numDice: Math.max(1, Math.min(4, val('di-num') || 2)),
      values,
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
  _palette: ['#e63946','#4262ff','#2a9d8f','#e9c46a','#9b59b6','#e67e22','#1abc9c','#34495e'],
  _defaults: [
    {label:'1',pct:25},{label:'2',pct:25},{label:'3',pct:25},{label:'4',pct:25},
    {label:'5',pct:20},{label:'6',pct:20},{label:'7',pct:20},{label:'8',pct:20},
  ],
  _buildRows(container, n, equal) {
    container.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const def = this._defaults[i] || {label:`${i+1}`, pct: Math.round(100/n)};
      const col = this._palette[i % this._palette.length];
      if (equal) {
        container.appendChild(row(
          field(`Sector ${i+1}`, textInput(`sp2-label-${i}`, def.label, 'label')),
          field('Colour', colourSwatch(`sp2-col-${i}`, col)),
        ));
      } else {
        container.appendChild(row(
          field(`Sector ${i+1}`, textInput(`sp2-label-${i}`, def.label, 'label')),
          field('%', numberInput(`sp2-pct-${i}`, def.pct, 1, 99, 1)),
          field('Colour', colourSwatch(`sp2-col-${i}`, col)),
        ));
      }
    }
  },
  renderConfig(c) {
    c.appendChild(sectionLabel('Spinner'));
    const nInput = numberInput('sp2-n', 4, 2, 8, 1);
    const eqCheck = checkbox('sp2-equal', 'Equal sectors', true);
    c.appendChild(row(field('Sectors', nInput)));
    c.appendChild(row(eqCheck));

    const sectorRows = document.createElement('div');
    sectorRows.id = 'sp2-rows';
    c.appendChild(sectorRows);
    this._buildRows(sectorRows, 4, true);

    const rebuild = () => {
      const n = Math.max(2, Math.min(8, parseInt(nInput.value, 10) || 4));
      const eq = document.getElementById('sp2-equal')?.checked ?? true;
      this._buildRows(sectorRows, n, eq);
    };
    nInput.addEventListener('change', rebuild);
    // Attach change listener after checkbox is in DOM
    setTimeout(() => {
      const el = document.getElementById('sp2-equal');
      if (el) el.addEventListener('change', rebuild);
    }, 0);
  },
  readConfig() {
    const n = Math.max(2, Math.min(8, val('sp2-n') || 4));
    const equal = val('sp2-equal') !== false;
    const sectors = [];
    for (let i = 0; i < n; i++) {
      const labelEl = document.getElementById(`sp2-label-${i}`);
      const colEl = document.getElementById(`sp2-col-${i}`);
      const pctEl = document.getElementById(`sp2-pct-${i}`);
      sectors.push({
        label: labelEl ? labelEl.value.trim() : String(i + 1),
        colour: colEl ? colEl.value : this._palette[i % this._palette.length],
        pct: pctEl ? (parseInt(pctEl.value, 10) || 1) : Math.round(100 / n),
      });
    }
    return { n, equal, sectors };
  },
  generateSVG(s) {
    const W = 400, H = 400;
    const svg = makeSVG(W, H);
    const cx = W / 2, cy = H / 2, R = 160;

    // Compute actual angles
    let angles;
    if (s.equal) {
      const a = 360 / s.n;
      angles = s.sectors.map(() => a);
    } else {
      const total = s.sectors.reduce((acc, sec) => acc + sec.pct, 0) || 1;
      angles = s.sectors.map(sec => (sec.pct / total) * 360);
    }

    let cumDeg = -90; // start at top
    s.sectors.forEach((sec, i) => {
      const sectorAngle = angles[i];
      const startDeg = cumDeg;
      const endDeg = cumDeg + sectorAngle;
      cumDeg = endDeg;

      const startRad = degToRad(startDeg);
      const endRad = degToRad(endDeg);
      const x1 = cx + R * Math.cos(startRad);
      const y1 = cy + R * Math.sin(startRad);
      const x2 = cx + R * Math.cos(endRad);
      const y2 = cy + R * Math.sin(endRad);
      const large = sectorAngle > 180 ? 1 : 0;

      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
      svg.appendChild(svgEl('path', { d, fill: sec.colour, stroke: '#fff', 'stroke-width': '2' }));

      // Label at sector midpoint
      const midRad = degToRad(startDeg + sectorAngle / 2);
      const lr = R * 0.62;
      const lx = cx + lr * Math.cos(midRad);
      const ly = cy + lr * Math.sin(midRad);
      if (sectorAngle >= 15) {
        svg.appendChild(svgText(lx, ly + 5, sec.label, 15, 'middle', { fill: '#fff', 'font-weight': '700' }));
      }
    });

    svg.appendChild(svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: '#2b2d42', 'stroke-width': '2.5' }));
    svg.appendChild(svgEl('circle', { cx, cy, r: '12', fill: '#2b2d42', stroke: '#fff', 'stroke-width': '2' }));
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
  _pbDefaults: [
    { label: 'Food', pct: 35, colour: '#e63946' },
    { label: 'Transport', pct: 20, colour: '#4262ff' },
    { label: 'Rent', pct: 30, colour: '#2a9d8f' },
    { label: 'Other', pct: 15, colour: '#e9c46a' },
    { label: 'Savings', pct: 10, colour: '#9b59b6' },
    { label: 'Bills', pct: 5, colour: '#e67e22' },
  ],
  _buildPbRows(container, n) {
    container.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const def = this._pbDefaults[i] || { label: `Seg ${i + 1}`, pct: Math.round(100 / n), colour: '#999' };
      container.appendChild(row(
        field('Label', textInput(`pb-label-${i}`, def.label)),
        field('%', numberInput(`pb-pct-${i}`, def.pct, 0, 100, 1)),
        field('Colour', colourSwatch(`pb-col-${i}`, def.colour)),
      ));
    }
  },
  renderConfig(c) {
    c.appendChild(sectionLabel('Percentage Bar'));
    c.appendChild(row(
      field('Title', textInput('pb-title', 'Budget Breakdown')),
    ));

    const slider = numberInput('pb-count', 3, 2, 6, 1);
    slider.type = 'range';
    slider.style.width = '100%';
    const countLabel = document.createElement('span');
    countLabel.textContent = ' 3 segments';
    countLabel.style.fontSize = '11px';
    countLabel.style.color = '#777';
    const sliderRow = row(field('Number of segments', slider));
    sliderRow.appendChild(countLabel);
    c.appendChild(sliderRow);

    const segContainer = document.createElement('div');
    segContainer.id = 'pb-seg-container';
    c.appendChild(segContainer);
    this._buildPbRows(segContainer, 3);

    slider.addEventListener('input', () => {
      const n = parseInt(slider.value, 10) || 3;
      countLabel.textContent = ` ${n} segments`;
      this._buildPbRows(segContainer, n);
    });
  },
  readConfig() {
    const count = parseInt(document.getElementById('pb-count')?.value, 10) || 3;
    const segments = [];
    for (let i = 0; i < count; i++) {
      segments.push({
        label: val(`pb-label-${i}`) || `Seg ${i + 1}`,
        pct: val(`pb-pct-${i}`) || 0,
        colour: document.getElementById(`pb-col-${i}`)?.value || '#ccc',
      });
    }
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
    const termContainer = document.createElement('div');
    termContainer.id = 'np-term-inputs';
    c.appendChild(termContainer);
    c.appendChild(row(
      checkbox('np-diffs', 'Show differences', true),
      field('Difference label', textInput('np-dlabel', '+4')),
    ));

    const defaultVals = [3, 7, 11, 15, 19];
    const defaultHidden = [false, false, false, true, true];

    const buildTermInputs = () => {
      const n = parseInt(document.getElementById('np-terms').value, 10) || 5;
      const ct2 = document.getElementById('np-term-inputs');
      const oldVals = [], oldHidden = [];
      ct2.querySelectorAll('[data-np-val]').forEach(el => oldVals.push(el.value));
      ct2.querySelectorAll('[data-np-hide]').forEach(el => oldHidden.push(el.checked));
      ct2.innerHTML = '';
      const r = document.createElement('div');
      r.className = 'cfg-row';
      r.style.flexWrap = 'wrap';
      r.style.gap = '6px';
      for (let i = 0; i < n; i++) {
        const v = i < oldVals.length ? oldVals[i] : (defaultVals[i] !== undefined ? String(defaultVals[i]) : '');
        const h = i < oldHidden.length ? oldHidden[i] : (defaultHidden[i] !== undefined ? defaultHidden[i] : false);
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;';
        const lbl = document.createElement('div');
        lbl.style.cssText = 'font-size:10px;color:#888;';
        lbl.textContent = 'T' + (i + 1);
        wrap.appendChild(lbl);
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'cfg-input cfg-input-sm';
        inp.style.width = '52px';
        inp.style.textAlign = 'center';
        inp.value = v;
        inp.setAttribute('data-np-val', i);
        wrap.appendChild(inp);
        const chkLbl = document.createElement('label');
        chkLbl.style.cssText = 'font-size:10px;color:#888;display:flex;align-items:center;gap:2px;cursor:pointer;';
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = h;
        chk.setAttribute('data-np-hide', i);
        chkLbl.appendChild(chk);
        chkLbl.appendChild(document.createTextNode('Hide'));
        wrap.appendChild(chkLbl);
        r.appendChild(wrap);
      }
      ct2.appendChild(r);
      ct2.querySelectorAll('input').forEach(el => {
        el.addEventListener('input', () => { if (window._tplSchedulePreview) window._tplSchedulePreview(); });
        el.addEventListener('change', () => { if (window._tplSchedulePreview) window._tplSchedulePreview(); });
      });
    };

    document.getElementById('np-terms').addEventListener('change', buildTermInputs);
    document.getElementById('np-terms').addEventListener('input', buildTermInputs);
    buildTermInputs();
  },
  readConfig() {
    const values = [];
    document.querySelectorAll('[data-np-val]').forEach((el, i) => {
      const hideEl = document.querySelector(`[data-np-hide="${i}"]`);
      const hidden = hideEl ? hideEl.checked : false;
      values.push(hidden ? '?' : el.value.trim());
    });
    return {
      terms: val('np-terms') || 5,
      values,
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
  _adDefaultPts: [
    { label: 'z\u2081', re: 3, im: 2, colour: '#e63946' },
    { label: 'z\u2082', re: -1, im: 4, colour: '#4262ff' },
  ],
  _adPalette: ['#e63946', '#4262ff', '#2a9d8f', '#e9c46a', '#8338ec'],
  _addAdPointRow(container, i, defaults) {
    const def = defaults || {
      label: `z\u2080${String.fromCharCode(8321 + i)}`.replace(/z\u2080/, 'z'),
      re: 0, im: 0,
      colour: this._adPalette[i % this._adPalette.length],
    };
    const r = row(
      field('Label', textInput(`ad-label-${i}`, def.label)),
      field('Real', numberInput(`ad-re-${i}`, def.re, -20, 20, 0.5)),
      field('Imag', numberInput(`ad-im-${i}`, def.im, -20, 20, 0.5)),
      field('Colour', colourSwatch(`ad-col-${i}`, def.colour)),
    );
    r.className = 'cfg-row ad-point-row';
    r.dataset.index = i;
    container.appendChild(r);
  },
  renderConfig(c) {
    c.appendChild(sectionLabel('Argand Diagram'));
    c.appendChild(row(
      checkbox('ad-axes', 'Show axes', true),
    ));
    c.appendChild(row(
      field('Real range', numberInput('ad-xr', 5, 1, 20, 1)),
      field('Imaginary range', numberInput('ad-yr', 5, 1, 20, 1)),
    ));
    c.appendChild(sectionLabel('Points'));

    const ptsContainer = document.createElement('div');
    ptsContainer.id = 'ad-pts-container';
    c.appendChild(ptsContainer);

    this._adDefaultPts.forEach((def, i) => {
      this._addAdPointRow(ptsContainer, i, def);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'bar-btn';
    addBtn.textContent = '+ Add Point';
    addBtn.style.marginTop = '4px';
    addBtn.addEventListener('click', () => {
      const count = ptsContainer.querySelectorAll('.ad-point-row').length;
      if (count < 5) this._addAdPointRow(ptsContainer, count);
    });
    c.appendChild(addBtn);
  },
  readConfig() {
    const points = [];
    for (let i = 0; i < 5; i++) {
      const labelEl = document.getElementById(`ad-label-${i}`);
      if (!labelEl) break;
      points.push({
        label: labelEl.value || '',
        real: val(`ad-re-${i}`) || 0,
        imag: val(`ad-im-${i}`) || 0,
        colour: document.getElementById(`ad-col-${i}`)?.value || this._adPalette[i % this._adPalette.length],
      });
    }
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
      const col = pt.colour || ptColours[i % ptColours.length];

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

/* ================================================================
   31. FACTOR TREE
   ================================================================ */
extraTemplates['factor-tree'] = {
  name: 'Factor Tree',
  category: 'Number',
  renderConfig(c) {
    c.appendChild(sectionLabel('Factor Tree'));
    c.appendChild(row(
      field('Number', numberInput('ft-number', 60, 2, 9999, 1)),
    ));
    c.appendChild(row(
      checkbox('ft-prime-hl', 'Highlight primes', true),
    ));
    c.appendChild(row(
      field('Highlight colour', colourSwatch('ft-hl-colour', '#e63946')),
    ));
  },
  readConfig() {
    return {
      number: Math.max(2, Math.round(val('ft-number') || 60)),
      showPrimeHighlight: val('ft-prime-hl'),
      highlightColour: val('ft-hl-colour') || '#e63946',
    };
  },
  generateSVG(s) {
    function isPrime(n) {
      if (n < 2) return false;
      if (n < 4) return true;
      if (n % 2 === 0 || n % 3 === 0) return false;
      for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
      }
      return true;
    }

    function smallestFactor(n) {
      if (n % 2 === 0) return 2;
      for (let i = 3; i * i <= n; i += 2) {
        if (n % i === 0) return i;
      }
      return n;
    }

    function buildTree(n) {
      if (isPrime(n) || n <= 1) return { value: n, left: null, right: null };
      const f = smallestFactor(n);
      return { value: n, left: buildTree(f), right: buildTree(n / f) };
    }

    function treeDepth(node) {
      if (!node || (!node.left && !node.right)) return 0;
      return 1 + Math.max(treeDepth(node.left), treeDepth(node.right));
    }

    const tree = buildTree(s.number);
    const depth = treeDepth(tree);
    const levelH = 70;
    const nodeR = 20;
    const W = Math.max(400, Math.pow(2, depth) * 60 + 80);
    const H = (depth + 1) * levelH + 80;
    const svg = makeSVG(W, H);

    function drawNode(node, cx, cy, spread) {
      if (!node) return;
      const prime = isPrime(node.value);

      if (node.left) {
        const lx = cx - spread;
        const ly = cy + levelH;
        svg.appendChild(svgEl('line', {
          x1: String(cx), y1: String(cy + nodeR),
          x2: String(lx), y2: String(ly - nodeR),
          stroke: '#555', 'stroke-width': '1.5',
        }));
        drawNode(node.left, lx, ly, spread / 2);
      }
      if (node.right) {
        const rx = cx + spread;
        const ry = cy + levelH;
        svg.appendChild(svgEl('line', {
          x1: String(cx), y1: String(cy + nodeR),
          x2: String(rx), y2: String(ry - nodeR),
          stroke: '#555', 'stroke-width': '1.5',
        }));
        drawNode(node.right, rx, ry, spread / 2);
      }

      const fill = (prime && s.showPrimeHighlight) ? s.highlightColour : '#fff';
      const textFill = (prime && s.showPrimeHighlight) ? '#fff' : '#333';
      svg.appendChild(svgEl('circle', {
        cx: String(cx), cy: String(cy), r: String(nodeR),
        fill, stroke: prime ? s.highlightColour : '#555', 'stroke-width': '2',
      }));
      svg.appendChild(svgText(cx, cy + 5, String(node.value), 14, 'middle', {
        fill: textFill, 'font-weight': prime ? '700' : '400',
      }));
    }

    const startSpread = Math.max(40, (W - 80) / 4);
    drawNode(tree, W / 2, 40 + nodeR, startSpread);

    return svg;
  },
};

/* ================================================================
   32. PIE CHART FROM DATA
   ================================================================ */
extraTemplates['pie-chart-data'] = {
  name: 'Pie Chart',
  category: 'Statistics',

  _defaultSegments: [
    { label: 'A', value: 30, colour: '#4262ff' },
    { label: 'B', value: 20, colour: '#e63946' },
    { label: 'C', value: 25, colour: '#2a9d8f' },
    { label: 'D', value: 25, colour: '#f4a261' },
  ],

  _buildSegmentRows(container, n) {
    container.innerHTML = '';
    const defs = this._defaultSegments;
    for (let i = 0; i < n; i++) {
      const d = defs[i] || { label: `Seg ${i + 1}`, value: 10, colour: '#888' };
      container.appendChild(sectionLabel(`Segment ${i + 1}`));
      container.appendChild(row(
        field('Label', textInput(`pc-lbl-${i}`, val(`pc-lbl-${i}`) || d.label)),
        field('Value', numberInput(`pc-val-${i}`, val(`pc-val-${i}`) || d.value, 0, 9999, 1)),
        field('Colour', colourSwatch(`pc-col-${i}`, val(`pc-col-${i}`) || d.colour)),
      ));
    }
  },

  renderConfig(c) {
    c.appendChild(sectionLabel('Pie Chart'));
    c.appendChild(row(field('Title', textInput('pc-title', 'Pie Chart'))));

    const slider = numberInput('pc-segs', 4, 2, 8, 1);
    slider.type = 'range';
    slider.style.width = '100%';
    const countLabel = document.createElement('span');
    countLabel.textContent = ' 4 segments';
    countLabel.style.fontSize = '11px';
    countLabel.style.color = '#777';
    const sliderRow = row(field('Segments', slider));
    sliderRow.appendChild(countLabel);
    c.appendChild(sliderRow);

    const segContainer = document.createElement('div');
    segContainer.id = 'pc-seg-container';
    c.appendChild(segContainer);
    this._buildSegmentRows(segContainer, 4);

    slider.addEventListener('input', () => {
      const n = parseInt(slider.value, 10) || 2;
      countLabel.textContent = ` ${n} segments`;
      this._buildSegmentRows(segContainer, n);
    });
  },

  readConfig() {
    const n = Math.max(2, Math.min(8, Math.round(val('pc-segs') || 4)));
    const segments = [];
    for (let i = 0; i < n; i++) {
      segments.push({
        label: val(`pc-lbl-${i}`) || `Seg ${i + 1}`,
        value: Math.max(0, val(`pc-val-${i}`)) || 10,
        colour: val(`pc-col-${i}`) || '#888',
      });
    }
    return { title: val('pc-title') || '', segments };
  },

  generateSVG(s) {
    const W = 500, H = 450;
    const svg = makeSVG(W, H);
    const cx = W / 2, cy = 230;
    const R = 150;

    if (s.title) {
      svg.appendChild(svgText(cx, 30, s.title, 18, 'middle', { 'font-weight': '700', fill: '#222' }));
    }

    const total = s.segments.reduce((a, seg) => a + seg.value, 0);
    if (total === 0) return svg;

    let currentAngle = -90;
    s.segments.forEach(seg => {
      const angleDeg = (seg.value / total) * 360;
      const startRad = degToRad(currentAngle);
      const endRad = degToRad(currentAngle + angleDeg);

      const x1 = cx + R * Math.cos(startRad);
      const y1 = cy + R * Math.sin(startRad);
      const x2 = cx + R * Math.cos(endRad);
      const y2 = cy + R * Math.sin(endRad);
      const largeArc = angleDeg > 180 ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      svg.appendChild(svgEl('path', { d, fill: seg.colour, stroke: '#fff', 'stroke-width': '2' }));

      const midAngle = degToRad(currentAngle + angleDeg / 2);
      const labelR = R * 0.65;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);
      const pct = Math.round((seg.value / total) * 100);
      svg.appendChild(svgText(lx, ly - 4, seg.label, 12, 'middle', { fill: '#fff', 'font-weight': '700' }));
      svg.appendChild(svgText(lx, ly + 12, `${pct}%`, 10, 'middle', { fill: '#fff' }));

      currentAngle += angleDeg;
    });

    const legendY = cy + R + 30;
    const legendX = 40;
    const colW = Math.min(120, (W - 80) / Math.min(s.segments.length, 4));
    s.segments.forEach((seg, i) => {
      const col = i % 4;
      const rowIdx = Math.floor(i / 4);
      const x = legendX + col * colW;
      const y = legendY + rowIdx * 20;
      svg.appendChild(svgEl('rect', { x: String(x), y: String(y - 8), width: '10', height: '10', fill: seg.colour, rx: '2' }));
      svg.appendChild(svgText(x + 16, y + 1, `${seg.label} (${seg.value})`, 10, 'start', { fill: '#555' }));
    });

    return svg;
  },
};

/* ================================================================
   33. SCATTER PLOT
   ================================================================ */
extraTemplates['scatter-plot'] = {
  name: 'Scatter Plot',
  category: 'Statistics',
  renderConfig(c) {
    c.appendChild(sectionLabel('Scatter Plot'));
    c.appendChild(row(field('Title', textInput('sp-title', 'Scatter Plot'))));
    c.appendChild(row(
      field('X-axis label', textInput('sp-xlabel', 'x')),
      field('Y-axis label', textInput('sp-ylabel', 'y')),
    ));
    const ta = document.createElement('textarea');
    ta.id = 'sp-data';
    ta.className = 'cfg-input';
    ta.rows = 6;
    ta.placeholder = 'x,y per line e.g.\n1,2\n3,5\n4,4';
    ta.value = '1,2\n2,4\n3,5\n4,4\n5,8\n6,7\n7,10\n8,9';
    ta.style.fontFamily = 'monospace';
    ta.style.fontSize = '11px';
    c.appendChild(field('Data points (x,y per line)', ta));
    c.appendChild(row(
      checkbox('sp-lobf', 'Line of best fit', false),
    ));
    c.appendChild(row(
      checkbox('sp-mean', 'Show mean lines (x̄, ȳ)', false),
    ));
    c.appendChild(row(
      field('Point colour', colourSwatch('sp-colour', '#4262ff')),
    ));
  },
  readConfig() {
    const raw = val('sp-data') || '';
    const points = raw.split('\n').map(line => {
      const parts = line.trim().split(',');
      if (parts.length >= 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (!isNaN(x) && !isNaN(y)) return { x, y };
      }
      return null;
    }).filter(Boolean);
    return {
      title: val('sp-title') || '',
      xLabel: val('sp-xlabel') || 'x',
      yLabel: val('sp-ylabel') || 'y',
      points,
      showLOBF: val('sp-lobf'),
      showMean: val('sp-mean'),
      pointColour: val('sp-colour') || '#4262ff',
    };
  },
  generateSVG(s) {
    const W = 520, H = 440;
    const svg = makeSVG(W, H);
    const margin = { top: 50, right: 30, bottom: 60, left: 70 };
    const plotW = W - margin.left - margin.right;
    const plotH = H - margin.top - margin.bottom;

    if (s.title) {
      svg.appendChild(svgText(W / 2, 28, s.title, 16, 'middle', { 'font-weight': '700', fill: '#222' }));
    }

    if (s.points.length === 0) {
      svg.appendChild(svgText(W / 2, H / 2, 'No data', 14, 'middle', { fill: '#999' }));
      return svg;
    }

    const xs = s.points.map(p => p.x);
    const ys = s.points.map(p => p.y);
    let xMin = Math.min(...xs), xMax = Math.max(...xs);
    let yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xPad = (xMax - xMin) * 0.1 || 1;
    const yPad = (yMax - yMin) * 0.1 || 1;
    xMin -= xPad; xMax += xPad;
    yMin -= yPad; yMax += yPad;

    function px(v) { return margin.left + ((v - xMin) / (xMax - xMin)) * plotW; }
    function py(v) { return margin.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH; }

    const xTicks = 6, yTicks = 6;
    for (let i = 0; i <= xTicks; i++) {
      const v = xMin + (i / xTicks) * (xMax - xMin);
      const x = px(v);
      svg.appendChild(svgEl('line', { x1: x, y1: margin.top, x2: x, y2: margin.top + plotH, stroke: '#e9ecef', 'stroke-width': '1' }));
      svg.appendChild(svgText(x, margin.top + plotH + 18, String(Math.round(v * 10) / 10), 10, 'middle', { fill: '#888' }));
    }
    for (let i = 0; i <= yTicks; i++) {
      const v = yMin + (i / yTicks) * (yMax - yMin);
      const y = py(v);
      svg.appendChild(svgEl('line', { x1: margin.left, y1: y, x2: margin.left + plotW, y2: y, stroke: '#e9ecef', 'stroke-width': '1' }));
      svg.appendChild(svgText(margin.left - 10, y + 4, String(Math.round(v * 10) / 10), 10, 'end', { fill: '#888' }));
    }

    svg.appendChild(svgEl('line', { x1: margin.left, y1: margin.top, x2: margin.left, y2: margin.top + plotH, stroke: '#333', 'stroke-width': '1.5' }));
    svg.appendChild(svgEl('line', { x1: margin.left, y1: margin.top + plotH, x2: margin.left + plotW, y2: margin.top + plotH, stroke: '#333', 'stroke-width': '1.5' }));

    svg.appendChild(svgText(W / 2, H - 10, s.xLabel, 13, 'middle', { fill: '#333', 'font-weight': '600' }));
    const yLbl = svgText(18, H / 2, s.yLabel, 13, 'middle', { fill: '#333', 'font-weight': '600' });
    yLbl.setAttribute('transform', `rotate(-90, 18, ${H / 2})`);
    svg.appendChild(yLbl);

    if (s.showLOBF && s.points.length >= 2) {
      const n = s.points.length;
      const sumX = xs.reduce((a, b) => a + b, 0);
      const sumY = ys.reduce((a, b) => a + b, 0);
      const sumXY = s.points.reduce((a, p) => a + p.x * p.y, 0);
      const sumX2 = xs.reduce((a, b) => a + b * b, 0);
      const denom = n * sumX2 - sumX * sumX;
      if (Math.abs(denom) > 1e-10) {
        const m = (n * sumXY - sumX * sumY) / denom;
        const b = (sumY - m * sumX) / n;
        const lx1 = xMin, ly1 = m * lx1 + b;
        const lx2 = xMax, ly2 = m * lx2 + b;
        svg.appendChild(svgEl('line', {
          x1: px(lx1), y1: py(ly1), x2: px(lx2), y2: py(ly2),
          stroke: '#e63946', 'stroke-width': '2', 'stroke-dasharray': '6,3',
        }));
      }
    }

    if (s.showMean && s.points.length > 0) {
      const xMean = xs.reduce((a, b) => a + b, 0) / xs.length;
      const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
      const mxLine = px(xMean), myLine = py(yMean);
      /* vertical mean x line */
      svg.appendChild(svgEl('line', {
        x1: mxLine, y1: margin.top, x2: mxLine, y2: margin.top + plotH,
        stroke: '#14b8a6', 'stroke-width': '1.8', 'stroke-dasharray': '6,3',
      }));
      svg.appendChild(svgText(mxLine + 5, margin.top + 12, `x\u0305=${Math.round(xMean*100)/100}`, 10, 'start', { fill: '#14b8a6', 'font-weight': '700' }));
      /* horizontal mean y line */
      svg.appendChild(svgEl('line', {
        x1: margin.left, y1: myLine, x2: margin.left + plotW, y2: myLine,
        stroke: '#f59e0b', 'stroke-width': '1.8', 'stroke-dasharray': '6,3',
      }));
      svg.appendChild(svgText(margin.left + 5, myLine - 5, `y\u0305=${Math.round(yMean*100)/100}`, 10, 'start', { fill: '#f59e0b', 'font-weight': '700' }));
    }

    s.points.forEach(p => {
      svg.appendChild(svgEl('circle', {
        cx: String(px(p.x)), cy: String(py(p.y)), r: '5',
        fill: s.pointColour, stroke: '#fff', 'stroke-width': '1.5',
      }));
    });

    return svg;
  },
};

/* ================================================================
   34. HISTOGRAM
   ================================================================ */
extraTemplates['histogram'] = {
  name: 'Histogram',
  category: 'Statistics',

  _defaultBars: [
    { label: '0-10', fd: 1.2 },
    { label: '10-20', fd: 2.5 },
    { label: '20-30', fd: 3.8 },
    { label: '30-40', fd: 2.1 },
    { label: '40-50', fd: 0.9 },
  ],

  _buildBarRows(container, n) {
    container.innerHTML = '';
    const defs = this._defaultBars;
    for (let i = 0; i < n; i++) {
      const d = defs[i] || { label: `${i * 10}-${(i + 1) * 10}`, fd: 1 };
      container.appendChild(row(
        field(`Interval ${i + 1}`, textInput(`hg-lbl-${i}`, val(`hg-lbl-${i}`) || d.label)),
        field('Freq. density', numberInput(`hg-fd-${i}`, val(`hg-fd-${i}`) || d.fd, 0, 100, 0.1)),
      ));
    }
  },

  renderConfig(c) {
    c.appendChild(sectionLabel('Histogram'));

    const slider = numberInput('hg-bars', 5, 3, 10, 1);
    slider.type = 'range';
    slider.style.width = '100%';
    const countLabel = document.createElement('span');
    countLabel.textContent = ' 5 bars';
    countLabel.style.fontSize = '11px';
    countLabel.style.color = '#777';
    const sliderRow = row(field('Number of bars', slider));
    sliderRow.appendChild(countLabel);
    c.appendChild(sliderRow);

    c.appendChild(row(
      field('Bar colour', colourSwatch('hg-colour', '#4262ff')),
    ));

    const barContainer = document.createElement('div');
    barContainer.id = 'hg-bar-container';
    c.appendChild(barContainer);
    this._buildBarRows(barContainer, 5);

    slider.addEventListener('input', () => {
      const n = parseInt(slider.value, 10) || 5;
      countLabel.textContent = ` ${n} bars`;
      this._buildBarRows(barContainer, n);
    });
  },

  readConfig() {
    const n = Math.max(3, Math.min(10, Math.round(val('hg-bars') || 5)));
    const bars = [];
    for (let i = 0; i < n; i++) {
      bars.push({
        label: val(`hg-lbl-${i}`) || `${i * 10}-${(i + 1) * 10}`,
        fd: Math.max(0, val(`hg-fd-${i}`)) || 1,
      });
    }
    return {
      bars,
      barColour: val('hg-colour') || '#4262ff',
    };
  },

  generateSVG(s) {
    const W = 520, H = 400;
    const svg = makeSVG(W, H);
    const margin = { top: 30, right: 30, bottom: 70, left: 70 };
    const plotW = W - margin.left - margin.right;
    const plotH = H - margin.top - margin.bottom;

    const n = s.bars.length;
    const maxFD = Math.max(...s.bars.map(b => b.fd));
    const yScale = plotH / (maxFD * 1.15);
    const barW = plotW / n;

    s.bars.forEach((bar, i) => {
      const x = margin.left + i * barW;
      const h = bar.fd * yScale;
      const y = margin.top + plotH - h;
      svg.appendChild(svgEl('rect', {
        x: String(x), y: String(y), width: String(barW), height: String(h),
        fill: s.barColour, stroke: '#fff', 'stroke-width': '1',
      }));
    });

    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const v = (maxFD * 1.15 / yTicks) * i;
      const y = margin.top + plotH - v * yScale;
      svg.appendChild(svgEl('line', { x1: margin.left, y1: y, x2: margin.left + plotW, y2: y, stroke: '#e9ecef', 'stroke-width': '1' }));
      svg.appendChild(svgText(margin.left - 10, y + 4, String(Math.round(v * 10) / 10), 10, 'end', { fill: '#888' }));
    }

    svg.appendChild(svgEl('line', { x1: margin.left, y1: margin.top, x2: margin.left, y2: margin.top + plotH, stroke: '#333', 'stroke-width': '1.5' }));
    svg.appendChild(svgEl('line', { x1: margin.left, y1: margin.top + plotH, x2: margin.left + plotW, y2: margin.top + plotH, stroke: '#333', 'stroke-width': '1.5' }));

    s.bars.forEach((bar, i) => {
      const x = margin.left + i * barW + barW / 2;
      const y = margin.top + plotH + 18;
      svg.appendChild(svgText(x, y, bar.label, 10, 'middle', { fill: '#555' }));
    });

    svg.appendChild(svgText(W / 2, H - 10, 'Interval', 13, 'middle', { fill: '#333', 'font-weight': '600' }));
    const yLbl = svgText(18, H / 2, 'Frequency density', 13, 'middle', { fill: '#333', 'font-weight': '600' });
    yLbl.setAttribute('transform', `rotate(-90, 18, ${H / 2})`);
    svg.appendChild(yLbl);

    return svg;
  },
};

/* ================================================================
   35. CUMULATIVE FREQUENCY CURVE
   ================================================================ */
extraTemplates['cumulative-frequency'] = {
  name: 'Cumulative Frequency',
  category: 'Statistics',

  _defaultClasses: [
    { ub: 10, cf: 5 },
    { ub: 20, cf: 18 },
    { ub: 30, cf: 42 },
    { ub: 40, cf: 67 },
    { ub: 50, cf: 85 },
    { ub: 60, cf: 95 },
    { ub: 70, cf: 100 },
  ],

  _addClassRow(container, ub, cf) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'cfg-row cf-data-row';
    rowDiv.style.cssText = 'display:flex;align-items:flex-end;gap:4px;margin-bottom:4px;';

    const ubWrap = document.createElement('div');
    ubWrap.className = 'cfg-field';
    ubWrap.style.flex = '1';
    const ubLabel = document.createElement('div');
    ubLabel.className = 'cfg-field-label';
    ubLabel.textContent = 'Upper bound';
    const ubInput = document.createElement('input');
    ubInput.type = 'number';
    ubInput.className = 'cfg-input';
    ubInput.setAttribute('data-cf-ub', '');
    ubInput.value = ub;
    ubInput.min = 0;
    ubInput.step = 1;
    ubWrap.appendChild(ubLabel);
    ubWrap.appendChild(ubInput);

    const cfWrap = document.createElement('div');
    cfWrap.className = 'cfg-field';
    cfWrap.style.flex = '1';
    const cfLabel = document.createElement('div');
    cfLabel.className = 'cfg-field-label';
    cfLabel.textContent = 'Cum. freq.';
    const cfInput = document.createElement('input');
    cfInput.type = 'number';
    cfInput.className = 'cfg-input';
    cfInput.setAttribute('data-cf-cf', '');
    cfInput.value = cf;
    cfInput.min = 0;
    cfInput.step = 1;
    cfWrap.appendChild(cfLabel);
    cfWrap.appendChild(cfInput);

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.title = 'Remove row';
    removeBtn.style.cssText = 'flex-shrink:0;width:24px;height:28px;border:1px solid #ddd;background:#fafafa;border-radius:4px;cursor:pointer;font-size:15px;line-height:1;padding:0;margin-bottom:1px;';
    removeBtn.type = 'button';
    removeBtn.onclick = () => {
      const rows = container.querySelectorAll('.cf-data-row');
      if (rows.length > 2) {
        rowDiv.remove();
        if (window._tplSchedulePreview) window._tplSchedulePreview();
      }
    };

    rowDiv.appendChild(ubWrap);
    rowDiv.appendChild(cfWrap);
    rowDiv.appendChild(removeBtn);
    container.appendChild(rowDiv);

    [ubInput, cfInput].forEach(el =>
      el.addEventListener('input', () => { if (window._tplSchedulePreview) window._tplSchedulePreview(); })
    );
  },

  renderConfig(c) {
    c.appendChild(sectionLabel('Cumulative Frequency Curve'));
    c.appendChild(row(field('Title', textInput('cf-title', 'Cumulative Frequency'))));
    c.appendChild(row(
      field('X-axis label', textInput('cf-xlabel', 'Value')),
      field('Y-axis label', textInput('cf-ylabel', 'Cumulative frequency')),
    ));
    c.appendChild(row(checkbox('cf-quartiles', 'Show quartiles (Q1, Q2, Q3)', false)));
    c.appendChild(row(field('Custom percentile lines (e.g. 10,90)', textInput('cf-percentiles', '', 'e.g. 10,90'))));

    const classContainer = document.createElement('div');
    classContainer.id = 'cf-class-container';
    c.appendChild(classContainer);
    this._defaultClasses.forEach(d => this._addClassRow(classContainer, d.ub, d.cf));

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '+ Add row';
    addBtn.style.cssText = 'margin-top:4px;padding:4px 10px;font-size:12px;border:1px solid #ccc;background:#f5f5f5;border-radius:4px;cursor:pointer;';
    addBtn.onclick = () => {
      const rows = classContainer.querySelectorAll('.cf-data-row');
      const lastRow = rows[rows.length - 1];
      const lastUb = lastRow ? parseFloat(lastRow.querySelector('[data-cf-ub]').value) || 0 : 0;
      const lastCf = lastRow ? parseFloat(lastRow.querySelector('[data-cf-cf]').value) || 0 : 0;
      this._addClassRow(classContainer, lastUb + 10, lastCf);
      if (window._tplSchedulePreview) window._tplSchedulePreview();
    };
    c.appendChild(addBtn);
  },

  readConfig() {
    const classes = [];
    document.querySelectorAll('#cf-class-container .cf-data-row').forEach(rowEl => {
      const ub = parseFloat(rowEl.querySelector('[data-cf-ub]').value) || 0;
      const cf = parseFloat(rowEl.querySelector('[data-cf-cf]').value) || 0;
      classes.push({ ub, cf });
    });
    return {
      title: val('cf-title') || '',
      xLabel: val('cf-xlabel') || 'Value',
      yLabel: val('cf-ylabel') || 'Cumulative frequency',
      classes: classes.length ? classes : this._defaultClasses,
      showQuartiles: val('cf-quartiles'),
      customPercentiles: val('cf-percentiles') || '',
    };
  },

  generateSVG(s) {
    const W = 520, H = 440;
    const svg = makeSVG(W, H);
    const margin = { top: 50, right: 30, bottom: 60, left: 70 };
    const plotW = W - margin.left - margin.right;
    const plotH = H - margin.top - margin.bottom;

    if (s.title) {
      svg.appendChild(svgText(W / 2, 28, s.title, 16, 'middle', { 'font-weight': '700', fill: '#222' }));
    }

    const pts = [...s.classes].sort((a, b) => a.ub - b.ub);
    if (pts.length === 0) return svg;

    const xMax = pts[pts.length - 1].ub * 1.05;
    const yMax = Math.max(...pts.map(p => p.cf)) * 1.1;

    function px(v) { return margin.left + (v / xMax) * plotW; }
    function py(v) { return margin.top + plotH - (v / yMax) * plotH; }

    for (let i = 0; i <= 5; i++) {
      const v = (xMax / 5) * i;
      const x = px(v);
      svg.appendChild(svgEl('line', { x1: x, y1: margin.top, x2: x, y2: margin.top + plotH, stroke: '#e9ecef', 'stroke-width': '1' }));
      svg.appendChild(svgText(x, margin.top + plotH + 18, String(Math.round(v)), 10, 'middle', { fill: '#888' }));
    }
    for (let i = 0; i <= 5; i++) {
      const v = (yMax / 5) * i;
      const y = py(v);
      svg.appendChild(svgEl('line', { x1: margin.left, y1: y, x2: margin.left + plotW, y2: y, stroke: '#e9ecef', 'stroke-width': '1' }));
      svg.appendChild(svgText(margin.left - 10, y + 4, String(Math.round(v)), 10, 'end', { fill: '#888' }));
    }

    svg.appendChild(svgEl('line', { x1: margin.left, y1: margin.top, x2: margin.left, y2: margin.top + plotH, stroke: '#333', 'stroke-width': '1.5' }));
    svg.appendChild(svgEl('line', { x1: margin.left, y1: margin.top + plotH, x2: margin.left + plotW, y2: margin.top + plotH, stroke: '#333', 'stroke-width': '1.5' }));

    svg.appendChild(svgText(W / 2, H - 8, s.xLabel, 13, 'middle', { fill: '#333', 'font-weight': '600' }));
    const yLbl = svgText(18, H / 2, s.yLabel, 13, 'middle', { fill: '#333', 'font-weight': '600' });
    yLbl.setAttribute('transform', `rotate(-90, 18, ${H / 2})`);
    svg.appendChild(yLbl);

    const allPts = [{ ub: 0, cf: 0 }, ...pts];
    if (allPts.length >= 2) {
      let pathD = `M ${px(allPts[0].ub)} ${py(allPts[0].cf)}`;
      for (let i = 0; i < allPts.length - 1; i++) {
        const p0 = allPts[Math.max(0, i - 1)];
        const p1 = allPts[i];
        const p2 = allPts[i + 1];
        const p3 = allPts[Math.min(allPts.length - 1, i + 2)];
        const tension = 6;
        const cp1x = px(p1.ub) + (px(p2.ub) - px(p0.ub)) / tension;
        const cp1y = py(p1.cf) + (py(p2.cf) - py(p0.cf)) / tension;
        const cp2x = px(p2.ub) - (px(p3.ub) - px(p1.ub)) / tension;
        const cp2y = py(p2.cf) - (py(p3.cf) - py(p1.cf)) / tension;
        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${px(p2.ub)} ${py(p2.cf)}`;
      }
      svg.appendChild(svgEl('path', { d: pathD, fill: 'none', stroke: '#4262ff', 'stroke-width': '2.5' }));
    }

    allPts.forEach(p => {
      if (p.cf === 0 && p.ub === 0) return;
      const pxx = px(p.ub), pyy = py(p.cf);
      const sz = 4;
      svg.appendChild(svgEl('line', { x1: pxx - sz, y1: pyy - sz, x2: pxx + sz, y2: pyy + sz, stroke: '#4262ff', 'stroke-width': '2' }));
      svg.appendChild(svgEl('line', { x1: pxx + sz, y1: pyy - sz, x2: pxx - sz, y2: pyy + sz, stroke: '#4262ff', 'stroke-width': '2' }));
    });

    if (s.showQuartiles) {
      const maxCF = pts[pts.length - 1].cf;
      [0.25, 0.5, 0.75].forEach((frac, qi) => {
        const qVal = frac * maxCF;
        let qX = 0;
        for (let i = 0; i < allPts.length - 1; i++) {
          if (allPts[i].cf <= qVal && allPts[i + 1].cf >= qVal) {
            const t = (qVal - allPts[i].cf) / (allPts[i + 1].cf - allPts[i].cf);
            qX = allPts[i].ub + t * (allPts[i + 1].ub - allPts[i].ub);
            break;
          }
        }
        const dashStyle = '4,3';
        svg.appendChild(svgEl('line', {
          x1: margin.left, y1: py(qVal), x2: px(qX), y2: py(qVal),
          stroke: '#e63946', 'stroke-width': '1.2', 'stroke-dasharray': dashStyle,
        }));
        svg.appendChild(svgEl('line', {
          x1: px(qX), y1: py(qVal), x2: px(qX), y2: margin.top + plotH,
          stroke: '#e63946', 'stroke-width': '1.2', 'stroke-dasharray': dashStyle,
        }));
        const qLabel = qi === 1 ? 'Q2 (Median)' : `Q${qi + 1}`;
        svg.appendChild(svgText(px(qX), margin.top + plotH + 32, qLabel, 10, 'middle', { fill: '#e63946', 'font-weight': '600' }));
      });
    }

    if (s.customPercentiles) {
      const maxCF = pts[pts.length - 1].cf;
      const percents = s.customPercentiles.split(',').map(v => parseFloat(v.trim())).filter(p => !isNaN(p) && p > 0 && p < 100);
      percents.forEach(p => {
        const pVal = (p / 100) * maxCF;
        let pX = 0;
        for (let i = 0; i < allPts.length - 1; i++) {
          if (allPts[i].cf <= pVal && allPts[i + 1].cf >= pVal) {
            const t = (pVal - allPts[i].cf) / (allPts[i + 1].cf - allPts[i].cf);
            pX = allPts[i].ub + t * (allPts[i + 1].ub - allPts[i].ub);
            break;
          }
        }
        svg.appendChild(svgEl('line', {
          x1: margin.left, y1: py(pVal), x2: px(pX), y2: py(pVal),
          stroke: '#7c3aed', 'stroke-width': '1.2', 'stroke-dasharray': '5,3',
        }));
        svg.appendChild(svgEl('line', {
          x1: px(pX), y1: py(pVal), x2: px(pX), y2: margin.top + plotH,
          stroke: '#7c3aed', 'stroke-width': '1.2', 'stroke-dasharray': '5,3',
        }));
        svg.appendChild(svgText(px(pX), margin.top + plotH + 32, `P${p}=${Math.round(pX * 10) / 10}`, 9, 'middle', { fill: '#7c3aed', 'font-weight': '600' }));
      });
    }

    return svg;
  },
};

/* ================================================================
   36. FORMULA TRIANGLE (Speed-Distance-Time etc.)
   ================================================================ */
/* ================================================================
   37. COLUMN ADDITION/SUBTRACTION
   ================================================================ */
extraTemplates['column-arithmetic'] = {
  name: 'Column Arithmetic',
  category: 'Number',
  renderConfig(c) {
    c.appendChild(sectionLabel('Column Addition / Subtraction'));
    c.appendChild(row(
      field('Operation', select('ca-op', [['+', 'Addition (+)'], ['-', 'Subtraction (\u2212)']])),
    ));
    c.appendChild(row(
      field('Number 1', textInput('ca-n1', '3456')),
      field('Number 2', textInput('ca-n2', '1278')),
    ));
    c.appendChild(row(
      checkbox('ca-carry', 'Show carry/borrow boxes', true),
      checkbox('ca-answer', 'Show answer', true),
    ));
  },
  readConfig() {
    return {
      op: val('ca-op') || '+',
      num1: (val('ca-n1') || '3456').replace(/[^0-9.]/g, ''),
      num2: (val('ca-n2') || '1278').replace(/[^0-9.]/g, ''),
      showCarry: val('ca-carry'),
      showAnswer: val('ca-answer'),
    };
  },
  generateSVG(s) {
    const digits1 = s.num1.split('');
    const digits2 = s.num2.split('');
    const maxLen = Math.max(digits1.length, digits2.length);
    while (digits1.length < maxLen) digits1.unshift(' ');
    while (digits2.length < maxLen) digits2.unshift(' ');

    const n1 = parseInt(s.num1, 10) || 0;
    const n2 = parseInt(s.num2, 10) || 0;
    const result = s.op === '+' ? n1 + n2 : n1 - n2;
    const answerStr = String(Math.abs(result));
    const answerDigits = answerStr.split('');
    const totalCols = Math.max(maxLen, answerDigits.length);
    while (digits1.length < totalCols) digits1.unshift(' ');
    while (digits2.length < totalCols) digits2.unshift(' ');
    while (answerDigits.length < totalCols) answerDigits.unshift(' ');

    const cellW = 44, cellH = 50;
    const opColW = 36;
    const carryH = s.showCarry ? 28 : 0;
    const W = opColW + totalCols * cellW + 40;
    const startY = 30 + carryH;
    const answerRows = s.showAnswer ? 1 : 0;
    const H = startY + (2 + answerRows) * cellH + 30;
    const svg = makeSVG(W, H);
    const startX = opColW + 10;

    if (s.showCarry) {
      for (let i = 0; i < totalCols; i++) {
        const x = startX + i * cellW;
        const y = startY - carryH;
        svg.appendChild(svgEl('rect', {
          x: String(x), y: String(y), width: String(cellW), height: String(carryH - 2),
          fill: '#fff8e1', stroke: '#e0d6a8', 'stroke-width': '1', rx: '3',
        }));
      }
    }

    for (let i = 0; i < totalCols; i++) {
      const x = startX + i * cellW + cellW / 2;
      const y = startY + cellH / 2 + 6;
      if (digits1[i] !== ' ') {
        svg.appendChild(svgText(x, y, digits1[i], 22, 'middle', { fill: '#333', 'font-weight': '600' }));
      }
    }

    svg.appendChild(svgText(opColW / 2 + 5, startY + cellH + cellH / 2 + 6, s.op === '+' ? '+' : '\u2212', 22, 'middle', { fill: '#333', 'font-weight': '700' }));
    for (let i = 0; i < totalCols; i++) {
      const x = startX + i * cellW + cellW / 2;
      const y = startY + cellH + cellH / 2 + 6;
      if (digits2[i] !== ' ') {
        svg.appendChild(svgText(x, y, digits2[i], 22, 'middle', { fill: '#333', 'font-weight': '600' }));
      }
    }

    const lineY = startY + 2 * cellH;
    svg.appendChild(svgEl('line', {
      x1: String(startX - 5), y1: String(lineY),
      x2: String(startX + totalCols * cellW + 5), y2: String(lineY),
      stroke: '#333', 'stroke-width': '2.5',
    }));

    if (s.showAnswer) {
      if (result < 0) {
        svg.appendChild(svgText(opColW / 2 + 5, lineY + cellH / 2 + 6, '\u2212', 22, 'middle', { fill: '#2a9d8f', 'font-weight': '700' }));
      }
      for (let i = 0; i < totalCols; i++) {
        const x = startX + i * cellW + cellW / 2;
        const y = lineY + cellH / 2 + 6;
        if (answerDigits[i] !== ' ') {
          svg.appendChild(svgText(x, y, answerDigits[i], 22, 'middle', { fill: '#2a9d8f', 'font-weight': '700' }));
        }
      }
      svg.appendChild(svgEl('line', {
        x1: String(startX - 5), y1: String(lineY + cellH + 2),
        x2: String(startX + totalCols * cellW + 5), y2: String(lineY + cellH + 2),
        stroke: '#333', 'stroke-width': '1.5',
      }));
      svg.appendChild(svgEl('line', {
        x1: String(startX - 5), y1: String(lineY + cellH + 6),
        x2: String(startX + totalCols * cellW + 5), y2: String(lineY + cellH + 6),
        stroke: '#333', 'stroke-width': '1.5',
      }));
    }

    for (let i = 0; i <= totalCols; i++) {
      const x = startX + i * cellW;
      svg.appendChild(svgEl('line', {
        x1: String(x), y1: String(startY - carryH),
        x2: String(x), y2: String(lineY + (s.showAnswer ? cellH + 8 : 4)),
        stroke: '#e0e0e0', 'stroke-width': '0.5',
      }));
    }

    return svg;
  },
};

/* ================================================================
   38. LONG DIVISION
   ================================================================ */
extraTemplates['long-division'] = {
  name: 'Long Division',
  category: 'Number',
  renderConfig(c) {
    c.appendChild(sectionLabel('Long Division (Bus Stop Method)'));
    c.appendChild(row(
      field('Dividend', numberInput('ld-dividend', 432, 1, 99999, 1)),
      field('Divisor', numberInput('ld-divisor', 15, 1, 999, 1)),
    ));
    c.appendChild(row(
      checkbox('ld-working', 'Show working', true),
      checkbox('ld-answer', 'Show answer', true),
    ));
  },
  readConfig() {
    return {
      dividend: Math.max(1, Math.round(val('ld-dividend') || 432)),
      divisor: Math.max(1, Math.round(val('ld-divisor') || 15)),
      showWorking: val('ld-working'),
      showAnswer: val('ld-answer'),
    };
  },
  generateSVG(s) {
    const dividend = s.dividend;
    const divisor = s.divisor;
    const dividendStr = String(dividend);
    const numDigits = dividendStr.length;

    const steps = [];
    let remainder = 0;
    let quotientStr = '';
    for (let i = 0; i < numDigits; i++) {
      remainder = remainder * 10 + parseInt(dividendStr[i], 10);
      const q = Math.floor(remainder / divisor);
      quotientStr += String(q);
      const product = q * divisor;
      steps.push({ bring: remainder, quotientDigit: q, product, remainder: remainder - product });
      remainder = remainder - product;
    }
    const quotientDisplay = quotientStr.replace(/^0+/, '') || '0';
    const finalRemainder = remainder;

    const cellW = 44, cellH = 44;
    const divisorW = String(divisor).length * 22 + 20;
    const leftPad = divisorW + 20;
    const topPad = 50;
    const workingRows = s.showWorking ? steps.length * 2 : 0;
    const W = leftPad + numDigits * cellW + 40;
    const H = topPad + cellH + workingRows * (cellH * 0.6) + 60;
    const svg = makeSVG(W, H);

    svg.appendChild(svgText(leftPad - 14, topPad + cellH / 2 + 6, String(divisor), 20, 'end', { fill: '#333', 'font-weight': '600' }));

    svg.appendChild(svgEl('line', {
      x1: String(leftPad - 6), y1: String(topPad - 4),
      x2: String(leftPad - 6), y2: String(topPad + cellH + 4),
      stroke: '#333', 'stroke-width': '2.5',
    }));
    svg.appendChild(svgEl('line', {
      x1: String(leftPad - 6), y1: String(topPad - 4),
      x2: String(leftPad + numDigits * cellW + 6), y2: String(topPad - 4),
      stroke: '#333', 'stroke-width': '2.5',
    }));

    for (let i = 0; i < numDigits; i++) {
      const x = leftPad + i * cellW + cellW / 2;
      svg.appendChild(svgText(x, topPad + cellH / 2 + 6, dividendStr[i], 20, 'middle', { fill: '#333', 'font-weight': '600' }));
    }

    if (s.showAnswer) {
      const qDigits = quotientStr.split('');
      for (let i = 0; i < numDigits; i++) {
        const x = leftPad + i * cellW + cellW / 2;
        const digit = qDigits[i] || '';
        if (digit && (digit !== '0' || i >= numDigits - quotientDisplay.length)) {
          svg.appendChild(svgText(x, topPad - 16, qDigits[i] || '', 18, 'middle', { fill: '#2a9d8f', 'font-weight': '700' }));
        }
      }
      if (finalRemainder > 0) {
        svg.appendChild(svgText(leftPad + numDigits * cellW + 8, topPad - 16, `r${finalRemainder}`, 13, 'start', { fill: '#e63946', 'font-weight': '600' }));
      }
    }

    if (s.showWorking) {
      let wy = topPad + cellH + 8;
      const stepH = cellH * 0.6;
      steps.forEach((step, idx) => {
        if (step.quotientDigit === 0 && idx < steps.length - 1 && step.product === 0) return;
        const productStr = String(step.product);
        const endCol = idx;
        for (let j = 0; j < productStr.length; j++) {
          const col = endCol - productStr.length + 1 + j;
          if (col >= 0 && col < numDigits) {
            const x = leftPad + col * cellW + cellW / 2;
            svg.appendChild(svgText(x, wy + 14, productStr[j], 15, 'middle', { fill: '#888' }));
          }
        }
        svg.appendChild(svgEl('line', {
          x1: String(leftPad + Math.max(0, endCol - productStr.length + 1) * cellW),
          y1: String(wy + 20),
          x2: String(leftPad + (endCol + 1) * cellW),
          y2: String(wy + 20),
          stroke: '#aaa', 'stroke-width': '1',
        }));

        wy += stepH;

        const remStr = String(step.remainder);
        for (let j = 0; j < remStr.length; j++) {
          const col = endCol - remStr.length + 1 + j;
          if (col >= 0 && col < numDigits) {
            const x = leftPad + col * cellW + cellW / 2;
            svg.appendChild(svgText(x, wy + 14, remStr[j], 15, 'middle', { fill: '#e63946' }));
          }
        }
        wy += stepH;
      });
    }

    return svg;
  },
};

/* ================================================================
   39. EQUATION BALANCE
   ================================================================ */
extraTemplates['equation-balance'] = {
  name: 'Equation Balance',
  category: 'Algebra',
  renderConfig(c) {
    c.appendChild(sectionLabel('Equation Balance'));
    c.appendChild(row(
      field('Left expression', textInput('eb-left', '2x + 3')),
      field('Right expression', textInput('eb-right', '11')),
    ));
    c.appendChild(row(
      checkbox('eb-scale', 'Show balance/scales', true),
    ));
  },
  readConfig() {
    return {
      leftExpr: val('eb-left') || '2x + 3',
      rightExpr: val('eb-right') || '11',
      showScale: val('eb-scale'),
    };
  },
  generateSVG(s) {
    const W = 500, H = 320;
    const svg = makeSVG(W, H);
    const cx = W / 2;

    if (s.showScale) {
      const fulcrumTop = 200;
      const fulcrumBot = 280;
      const fulcrumW = 40;
      svg.appendChild(svgEl('polygon', {
        points: `${cx},${fulcrumTop} ${cx - fulcrumW},${fulcrumBot} ${cx + fulcrumW},${fulcrumBot}`,
        fill: '#e9ecef', stroke: '#555', 'stroke-width': '2',
      }));

      const beamY = fulcrumTop;
      const beamLeft = 60;
      const beamRight = W - 60;
      svg.appendChild(svgEl('line', {
        x1: String(beamLeft), y1: String(beamY),
        x2: String(beamRight), y2: String(beamY),
        stroke: '#2b2d42', 'stroke-width': '4',
      }));

      const panW = 140, panH = 8;
      const leftPanX = beamLeft + 30;
      svg.appendChild(svgEl('line', { x1: String(leftPanX + panW / 2), y1: String(beamY), x2: String(leftPanX + panW / 2), y2: String(beamY + 30), stroke: '#888', 'stroke-width': '1.5' }));
      svg.appendChild(svgEl('line', { x1: String(leftPanX), y1: String(beamY + 30), x2: String(leftPanX + panW), y2: String(beamY + 30), stroke: '#888', 'stroke-width': '1.5' }));
      svg.appendChild(svgEl('rect', {
        x: String(leftPanX), y: String(beamY + 30),
        width: String(panW), height: String(panH),
        fill: '#d4edda', stroke: '#555', 'stroke-width': '1', rx: '3',
      }));
      svg.appendChild(svgText(leftPanX + panW / 2, beamY + 20, s.leftExpr, 18, 'middle', { fill: '#2b2d42', 'font-weight': '700' }));

      const rightPanX = beamRight - panW - 30;
      svg.appendChild(svgEl('line', { x1: String(rightPanX + panW / 2), y1: String(beamY), x2: String(rightPanX + panW / 2), y2: String(beamY + 30), stroke: '#888', 'stroke-width': '1.5' }));
      svg.appendChild(svgEl('line', { x1: String(rightPanX), y1: String(beamY + 30), x2: String(rightPanX + panW), y2: String(beamY + 30), stroke: '#888', 'stroke-width': '1.5' }));
      svg.appendChild(svgEl('rect', {
        x: String(rightPanX), y: String(beamY + 30),
        width: String(panW), height: String(panH),
        fill: '#dbe9ff', stroke: '#555', 'stroke-width': '1', rx: '3',
      }));
      svg.appendChild(svgText(rightPanX + panW / 2, beamY + 20, s.rightExpr, 18, 'middle', { fill: '#2b2d42', 'font-weight': '700' }));

      svg.appendChild(svgText(cx, beamY - 16, '=', 24, 'middle', { fill: '#e63946', 'font-weight': '700' }));

      svg.appendChild(svgEl('rect', {
        x: String(cx - 60), y: String(fulcrumBot),
        width: '120', height: '8',
        fill: '#2b2d42', rx: '3',
      }));
    } else {
      svg.appendChild(svgText(cx, H / 2, `${s.leftExpr}  =  ${s.rightExpr}`, 28, 'middle', { fill: '#2b2d42', 'font-weight': '700' }));
    }

    svg.appendChild(svgText(cx, 30, `${s.leftExpr} = ${s.rightExpr}`, 16, 'middle', { fill: '#555' }));

    return svg;
  },
};

/* ================================================================
   40. TWO-COLUMN PROOF
   ================================================================ */
extraTemplates['two-column-proof'] = {
  name: 'Two-Column Proof',
  category: 'Algebra',

  _defaultSteps: [
    { statement: '2x + 3 = 11', reason: 'Given' },
    { statement: '2x = 8', reason: 'Subtract 3 from both sides' },
    { statement: 'x = 4', reason: 'Divide both sides by 2' },
  ],

  _buildStepRows(container, n) {
    container.innerHTML = '';
    const defs = this._defaultSteps;
    for (let i = 0; i < n; i++) {
      const d = defs[i] || { statement: '', reason: '' };
      container.appendChild(sectionLabel(`Step ${i + 1}`));
      container.appendChild(row(
        field('Statement', textInput(`tcp-stmt-${i}`, val(`tcp-stmt-${i}`) || d.statement)),
        field('Reason', textInput(`tcp-reas-${i}`, val(`tcp-reas-${i}`) || d.reason)),
      ));
    }
  },

  renderConfig(c) {
    c.appendChild(sectionLabel('Two-Column Proof'));
    c.appendChild(row(field('Title', textInput('tcp-title', 'Proof'))));

    const slider = numberInput('tcp-steps', 3, 2, 8, 1);
    slider.type = 'range';
    slider.style.width = '100%';
    const countLabel = document.createElement('span');
    countLabel.textContent = ' 3 steps';
    countLabel.style.fontSize = '11px';
    countLabel.style.color = '#777';
    const sliderRow = row(field('Number of steps', slider));
    sliderRow.appendChild(countLabel);
    c.appendChild(sliderRow);

    const stepContainer = document.createElement('div');
    stepContainer.id = 'tcp-step-container';
    c.appendChild(stepContainer);
    this._buildStepRows(stepContainer, 3);

    slider.addEventListener('input', () => {
      const n = parseInt(slider.value, 10) || 3;
      countLabel.textContent = ` ${n} steps`;
      this._buildStepRows(stepContainer, n);
    });
  },

  readConfig() {
    const n = Math.max(2, Math.min(8, Math.round(val('tcp-steps') || 3)));
    const steps = [];
    for (let i = 0; i < n; i++) {
      steps.push({
        statement: val(`tcp-stmt-${i}`) || '',
        reason: val(`tcp-reas-${i}`) || '',
      });
    }
    return { title: val('tcp-title') || 'Proof', steps };
  },

  generateSVG(s) {
    const rowH = 36;
    const headerH = 40;
    const titleH = s.title ? 40 : 0;
    const W = 520;
    const H = titleH + headerH + s.steps.length * rowH + 20;
    const svg = makeSVG(W, H);
    const tableX = 20;
    const tableW = W - 40;
    const colSplit = tableW * 0.45;
    let y = 10;

    if (s.title) {
      svg.appendChild(svgText(W / 2, y + 24, s.title, 16, 'middle', { fill: '#222', 'font-weight': '700' }));
      y += titleH;
    }

    svg.appendChild(svgEl('rect', {
      x: String(tableX), y: String(y), width: String(tableW), height: String(headerH),
      fill: '#2b2d42', rx: '4',
    }));
    svg.appendChild(svgText(tableX + 30, y + 26, '#', 12, 'middle', { fill: '#fff', 'font-weight': '700' }));
    svg.appendChild(svgText(tableX + 30 + colSplit / 2, y + 26, 'Statement', 13, 'middle', { fill: '#fff', 'font-weight': '700' }));
    svg.appendChild(svgText(tableX + colSplit + (tableW - colSplit) / 2, y + 26, 'Reason', 13, 'middle', { fill: '#fff', 'font-weight': '700' }));
    y += headerH;

    s.steps.forEach((step, i) => {
      const bgFill = i % 2 === 0 ? '#f8f9fa' : '#fff';
      svg.appendChild(svgEl('rect', {
        x: String(tableX), y: String(y), width: String(tableW), height: String(rowH),
        fill: bgFill, stroke: '#dee2e6', 'stroke-width': '0.5',
      }));
      svg.appendChild(svgText(tableX + 30, y + rowH / 2 + 5, String(i + 1), 12, 'middle', { fill: '#888', 'font-weight': '600' }));
      svg.appendChild(svgEl('line', { x1: String(tableX + 50), y1: String(y), x2: String(tableX + 50), y2: String(y + rowH), stroke: '#dee2e6', 'stroke-width': '0.5' }));
      svg.appendChild(svgEl('line', { x1: String(tableX + colSplit), y1: String(y), x2: String(tableX + colSplit), y2: String(y + rowH), stroke: '#dee2e6', 'stroke-width': '0.5' }));
      svg.appendChild(svgText(tableX + 60, y + rowH / 2 + 5, step.statement, 12, 'start', { fill: '#333' }));
      svg.appendChild(svgText(tableX + colSplit + 10, y + rowH / 2 + 5, step.reason, 11, 'start', { fill: '#555' }));
      y += rowH;
    });

    svg.appendChild(svgEl('rect', {
      x: String(tableX), y: String(titleH > 0 ? titleH + 10 : 10),
      width: String(tableW), height: String(headerH + s.steps.length * rowH),
      fill: 'none', stroke: '#2b2d42', 'stroke-width': '2', rx: '4',
    }));

    return svg;
  },
};

/* ================================================================
   41. CONVERSION CHART
   ================================================================ */
extraTemplates['conversion-chart'] = {
  name: 'Conversion Chart',
  category: 'Number',
  renderConfig(c) {
    c.appendChild(sectionLabel('Conversion Chart'));
    c.appendChild(row(
      field('Chart type', select('cc-type', [
        ['metric_length', 'Metric Length'],
        ['metric_mass', 'Metric Mass'],
        ['metric_capacity', 'Metric Capacity'],
        ['temperature', 'Temperature (C / F)'],
        ['custom', 'Custom'],
      ])),
    ));
    c.appendChild(row(
      checkbox('cc-arrows', 'Show conversion arrows', true),
    ));
    c.appendChild(sectionLabel('Include prefixes'));
    c.appendChild(row(
      checkbox('cc-hecto', 'hecto (h) ×100', false),
      checkbox('cc-deca', 'deca (da) ×10', false),
    ));
    c.appendChild(row(
      checkbox('cc-deci', 'deci (d) ÷10', false),
      checkbox('cc-centi', 'centi (c) ÷100', false),
    ));
  },
  readConfig() {
    return {
      chartType: val('cc-type') || 'metric_length',
      showArrows: val('cc-arrows'),
      showHecto: val('cc-hecto'),
      showDeca: val('cc-deca'),
      showDeci: val('cc-deci'),
      showCenti: val('cc-centi'),
    };
  },
  generateSVG(s) {
    /* ── metric prefix builder ─────────────────────────────── */
    const METRIC_DEFS = {
      metric_length:   { syms: ['km','hm','dam','m','dm','cm','mm'], title: 'Metric Length' },
      metric_mass:     { syms: ['kg','hg','dag','g','dg','cg','mg'], title: 'Metric Mass' },
      metric_capacity: { syms: ['kL','hL','daL','L','dL','cL','mL'], title: 'Metric Capacity' },
    };
    // positions: 0=kilo,1=hecto,2=deca,3=base,4=deci,5=centi,6=milli
    const PREFIX_FLAGS = [null, 'showHecto', 'showDeca', null, 'showDeci', 'showCenti', null];

    function buildMetric(type) {
      const def = METRIC_DEFS[type];
      const selPos = def.syms.map((sym, i) => ({ sym, pos: i })).filter(({ pos }) => PREFIX_FLAGS[pos] === null || s[PREFIX_FLAGS[pos]]);
      const factors = [], reverseFactors = [];
      for (let i = 0; i < selPos.length - 1; i++) {
        const diff = selPos[i + 1].pos - selPos[i].pos;
        const mult = Math.pow(10, diff);
        factors.push('\u00D7' + mult);
        reverseFactors.push('\u00F7' + mult);
      }
      return { units: selPos.map(u => u.sym), factors, reverseFactors, title: def.title };
    }

    const presets = {
      temperature: null,
      custom: {
        units: ['Unit A', 'Unit B', 'Unit C'],
        factors: ['\u00D7?', '\u00D7?'],
        reverseFactors: ['\u00F7?', '\u00F7?'],
        title: 'Custom Conversion',
      },
    };

    if (s.chartType === 'temperature') {
      const W = 400, H = 400;
      const svg = makeSVG(W, H);
      svg.appendChild(svgText(W / 2, 30, 'Temperature Conversion', 16, 'middle', { 'font-weight': '700', fill: '#222' }));

      const cX = 120, fX = 280;
      const topY = 60, botY = 360;

      svg.appendChild(svgText(cX, topY - 10, '\u00B0C', 14, 'middle', { fill: '#4262ff', 'font-weight': '700' }));
      svg.appendChild(svgEl('line', { x1: cX, y1: topY, x2: cX, y2: botY, stroke: '#4262ff', 'stroke-width': '3' }));
      const cPoints = [{ v: 100, label: '100\u00B0C' }, { v: 37, label: '37\u00B0C' }, { v: 0, label: '0\u00B0C' }, { v: -40, label: '-40\u00B0C' }];
      cPoints.forEach(p => {
        const y = topY + ((100 - p.v) / 140) * (botY - topY);
        svg.appendChild(svgEl('line', { x1: cX - 8, y1: y, x2: cX + 8, y2: y, stroke: '#4262ff', 'stroke-width': '2' }));
        svg.appendChild(svgText(cX - 16, y + 4, p.label, 11, 'end', { fill: '#4262ff' }));
      });

      svg.appendChild(svgText(fX, topY - 10, '\u00B0F', 14, 'middle', { fill: '#e63946', 'font-weight': '700' }));
      svg.appendChild(svgEl('line', { x1: fX, y1: topY, x2: fX, y2: botY, stroke: '#e63946', 'stroke-width': '3' }));
      const fPoints = [{ v: 212, label: '212\u00B0F', cVal: 100 }, { v: 98.6, label: '98.6\u00B0F', cVal: 37 }, { v: 32, label: '32\u00B0F', cVal: 0 }, { v: -40, label: '-40\u00B0F', cVal: -40 }];
      fPoints.forEach(p => {
        const y = topY + ((100 - p.cVal) / 140) * (botY - topY);
        svg.appendChild(svgEl('line', { x1: fX - 8, y1: y, x2: fX + 8, y2: y, stroke: '#e63946', 'stroke-width': '2' }));
        svg.appendChild(svgText(fX + 16, y + 4, p.label, 11, 'start', { fill: '#e63946' }));
      });

      if (s.showArrows) {
        fPoints.forEach(p => {
          const y = topY + ((100 - p.cVal) / 140) * (botY - topY);
          svg.appendChild(svgEl('line', { x1: cX + 10, y1: y, x2: fX - 10, y2: y, stroke: '#aaa', 'stroke-width': '1', 'stroke-dasharray': '3,3' }));
        });
      }

      svg.appendChild(svgText(W / 2, botY + 20, 'F = (C \u00D7 9/5) + 32', 12, 'middle', { fill: '#555', 'font-weight': '600' }));

      return svg;
    }

    const data = METRIC_DEFS[s.chartType] ? buildMetric(s.chartType) : (presets[s.chartType] || presets.custom);
    const n = data.units.length;
    const W = Math.max(400, n * 110 + 60);
    const H = 200;
    const svg = makeSVG(W, H);

    svg.appendChild(svgText(W / 2, 30, data.title, 16, 'middle', { 'font-weight': '700', fill: '#222' }));

    const barY = 90;
    const barH = 44;
    const unitW = (W - 60) / n;
    const startX = 30;

    data.units.forEach((unit, i) => {
      const x = startX + i * unitW;
      const colours = ['#4262ff', '#2a9d8f', '#f4a261', '#e63946', '#7b2d8e'];
      const col = colours[i % colours.length];
      svg.appendChild(svgEl('rect', {
        x: String(x + 2), y: String(barY), width: String(unitW - 4), height: String(barH),
        fill: col, rx: '6', stroke: '#fff', 'stroke-width': '2',
      }));
      svg.appendChild(svgText(x + unitW / 2, barY + barH / 2 + 7, unit, 18, 'middle', { fill: '#fff', 'font-weight': '700' }));
    });

    if (s.showArrows && data.factors) {
      data.factors.forEach((factor, i) => {
        const x1 = startX + i * unitW + unitW / 2;
        const x2 = startX + (i + 1) * unitW + unitW / 2;
        const midX = (x1 + x2) / 2;

        const arrowTopY = barY - 8;
        svg.appendChild(svgEl('path', {
          d: `M ${x1 + 10} ${arrowTopY} Q ${midX} ${arrowTopY - 28} ${x2 - 10} ${arrowTopY}`,
          fill: 'none', stroke: '#333', 'stroke-width': '1.5',
        }));
        arrowHead(svg, x2 - 10, arrowTopY, 0, 6, '#333');
        svg.appendChild(svgText(midX, arrowTopY - 22, factor, 10, 'middle', { fill: '#333', 'font-weight': '600' }));

        const arrowBotY = barY + barH + 8;
        svg.appendChild(svgEl('path', {
          d: `M ${x2 - 10} ${arrowBotY} Q ${midX} ${arrowBotY + 28} ${x1 + 10} ${arrowBotY}`,
          fill: 'none', stroke: '#888', 'stroke-width': '1.5',
        }));
        arrowHead(svg, x1 + 10, arrowBotY, Math.PI, 6, '#888');
        svg.appendChild(svgText(midX, arrowBotY + 30, data.reverseFactors[i], 10, 'middle', { fill: '#888', 'font-weight': '600' }));
      });
    }

    return svg;
  },
};

/* ================================================================
   42. BIDMAS / ORDER OF OPERATIONS
   ================================================================ */
extraTemplates['bidmas'] = {
  name: 'BIDMAS',
  category: 'Number',
  renderConfig(c) {
    c.appendChild(sectionLabel('BIDMAS / Order of Operations'));
    c.appendChild(row(
      field('Expression', textInput('bm-expr', '3 + 4 \u00D7 2')),
    ));
    c.appendChild(row(
      checkbox('bm-steps', 'Show steps', true),
    ));
    c.appendChild(row(
      field('Style', select('bm-style', [
        ['pyramid', 'Pyramid'],
        ['vertical_steps', 'Vertical Steps'],
        ['horizontal', 'Horizontal'],
      ])),
    ));
  },
  readConfig() {
    return {
      expression: val('bm-expr') || '3 + 4 \u00D7 2',
      showSteps: val('bm-steps'),
      style: val('bm-style') || 'pyramid',
    };
  },
  generateSVG(s) {
    if (s.style === 'pyramid') {
      const W = 400, H = 380;
      const svg = makeSVG(W, H);
      const cx = W / 2;
      svg.appendChild(svgText(cx, 26, 'Order of Operations (BIDMAS)', 14, 'middle', { fill: '#555', 'font-weight': '600' }));

      const layers = [
        { label: 'B', full: 'Brackets', colour: '#e63946' },
        { label: 'I', full: 'Indices (Powers)', colour: '#f4a261' },
        { label: 'DM', full: 'Division & Multiplication', colour: '#2a9d8f' },
        { label: 'AS', full: 'Addition & Subtraction', colour: '#4262ff' },
      ];

      const topY = 50, botY = 320;
      const topW = 80, botW = 360;
      const layerH = (botY - topY) / layers.length;

      layers.forEach((layer, i) => {
        const y = topY + i * layerH;
        const t1 = i / layers.length;
        const t2 = (i + 1) / layers.length;
        const w1 = topW + (botW - topW) * t1;
        const w2 = topW + (botW - topW) * t2;
        const x1l = cx - w1 / 2, x1r = cx + w1 / 2;
        const x2l = cx - w2 / 2, x2r = cx + w2 / 2;

        svg.appendChild(svgEl('polygon', {
          points: `${x1l},${y} ${x1r},${y} ${x2r},${y + layerH} ${x2l},${y + layerH}`,
          fill: layer.colour, stroke: '#fff', 'stroke-width': '2',
        }));
        svg.appendChild(svgText(cx, y + layerH / 2 + 2, layer.label, 22, 'middle', { fill: '#fff', 'font-weight': '800' }));
        svg.appendChild(svgText(cx, y + layerH / 2 + 18, layer.full, 11, 'middle', { fill: '#fff' }));
      });

      if (s.expression) {
        svg.appendChild(svgText(cx, botY + 30, s.expression, 16, 'middle', { fill: '#333', 'font-weight': '600' }));
      }

      return svg;
    }

    if (s.style === 'vertical_steps') {
      const W = 400, H = 300;
      const svg = makeSVG(W, H);
      const cx = W / 2;
      svg.appendChild(svgText(cx, 30, 'BIDMAS', 16, 'middle', { fill: '#222', 'font-weight': '700' }));

      const items = [
        { letter: 'B', word: 'Brackets', colour: '#e63946' },
        { letter: 'I', word: 'Indices', colour: '#f4a261' },
        { letter: 'D', word: 'Division', colour: '#2a9d8f' },
        { letter: 'M', word: 'Multiplication', colour: '#2a9d8f' },
        { letter: 'A', word: 'Addition', colour: '#4262ff' },
        { letter: 'S', word: 'Subtraction', colour: '#4262ff' },
      ];

      const startY = 55;
      const itemH = 36;
      items.forEach((item, i) => {
        const y = startY + i * itemH;
        svg.appendChild(svgEl('rect', {
          x: '60', y: String(y), width: '280', height: String(itemH - 4),
          fill: item.colour, rx: '6', stroke: '#fff', 'stroke-width': '1',
        }));
        svg.appendChild(svgText(90, y + itemH / 2 + 2, item.letter, 18, 'middle', { fill: '#fff', 'font-weight': '800' }));
        svg.appendChild(svgText(120, y + itemH / 2 + 2, item.word, 14, 'start', { fill: '#fff', 'font-weight': '600' }));

        if (i < items.length - 1) {
          svg.appendChild(svgText(40, y + itemH - 2, '\u2193', 16, 'middle', { fill: '#888' }));
        }
      });

      if (s.expression) {
        svg.appendChild(svgText(cx, startY + items.length * itemH + 16, s.expression, 15, 'middle', { fill: '#333', 'font-weight': '600' }));
      }

      return svg;
    }

    /* Horizontal style */
    const W = 520, H = 160;
    const svg = makeSVG(W, H);
    svg.appendChild(svgText(W / 2, 26, 'Order of Operations (BIDMAS)', 14, 'middle', { fill: '#555', 'font-weight': '600' }));

    const items = [
      { letter: 'B', colour: '#e63946' },
      { letter: 'I', colour: '#f4a261' },
      { letter: 'D', colour: '#2a9d8f' },
      { letter: 'M', colour: '#2a9d8f' },
      { letter: 'A', colour: '#4262ff' },
      { letter: 'S', colour: '#4262ff' },
    ];

    const boxW = 60, boxH = 50;
    const gap = 12;
    const totalW = items.length * boxW + (items.length - 1) * gap;
    const startX = (W - totalW) / 2;
    const boxY = 50;

    items.forEach((item, i) => {
      const x = startX + i * (boxW + gap);
      svg.appendChild(svgEl('rect', {
        x: String(x), y: String(boxY), width: String(boxW), height: String(boxH),
        fill: item.colour, rx: '8', stroke: '#fff', 'stroke-width': '2',
      }));
      svg.appendChild(svgText(x + boxW / 2, boxY + boxH / 2 + 8, item.letter, 24, 'middle', { fill: '#fff', 'font-weight': '800' }));

      if (i < items.length - 1) {
        const ax = x + boxW + gap / 2;
        svg.appendChild(svgText(ax, boxY + boxH / 2 + 6, '\u2192', 16, 'middle', { fill: '#aaa' }));
      }
    });

    if (s.expression) {
      svg.appendChild(svgText(W / 2, boxY + boxH + 36, s.expression, 16, 'middle', { fill: '#333', 'font-weight': '600' }));
    }

    return svg;
  },
};

/* ================================================================
   DOUBLE NUMBER LINE
   ================================================================ */
extraTemplates['double-number-line'] = {
  name: 'Double Number Line',
  category: 'Number',
  renderConfig(c) {
    c.appendChild(sectionLabel('Top line'));
    c.appendChild(row(
      field('Label', textInput('dnl-top-label', '', 'e.g. km')),
      field('Start', numberInput('dnl-top-start', 0, -1000, 1000, 1)),
      field('End', numberInput('dnl-top-end', 10, -1000, 1000, 1)),
    ));
    c.appendChild(sectionLabel('Bottom line'));
    c.appendChild(row(
      field('Label', textInput('dnl-bot-label', '', 'e.g. miles')),
      field('Start', numberInput('dnl-bot-start', 0, -1000, 1000, 1)),
      field('End', numberInput('dnl-bot-end', 16, -1000, 1000, 1)),
    ));
    c.appendChild(sectionLabel('Options'));
    c.appendChild(row(
      field('Intervals', numberInput('dnl-intervals', 8, 1, 20, 1)),
    ));
    c.appendChild(row(
      checkbox('dnl-blank', 'Blank (no numbers)', false),
      checkbox('dnl-arrows', 'Show arrows', true),
    ));
  },
  readConfig() {
    return {
      topLabel: val('dnl-top-label'),
      topStart: val('dnl-top-start'),
      topEnd: val('dnl-top-end'),
      botLabel: val('dnl-bot-label'),
      botStart: val('dnl-bot-start'),
      botEnd: val('dnl-bot-end'),
      intervals: Math.max(1, Math.min(20, Math.round(val('dnl-intervals') || 8))),
      blank: val('dnl-blank'),
      arrows: val('dnl-arrows'),
    };
  },
  generateSVG(s) {
    const W = 900, H = 400, PAD = 90;
    const svg = makeSVG(W, H);
    const topY = PAD + 80;
    const botY = topY + 120;
    const lx = PAD + 40;
    const rx = lx + 680;
    const N = s.intervals;
    const BLUE = '#4262ff';
    const RED = '#e63946';

    // Dashed vertical connectors
    for (let i = 0; i <= N; i++) {
      const x = lx + (rx - lx) * i / N;
      svg.appendChild(svgEl('line', {
        x1: String(x), y1: String(topY),
        x2: String(x), y2: String(botY),
        stroke: '#ccc', 'stroke-width': '1', 'stroke-dasharray': '4,3',
      }));
    }

    // Top line
    svg.appendChild(svgEl('line', {
      x1: String(lx), y1: String(topY),
      x2: String(s.arrows ? rx - 6 : rx), y2: String(topY),
      stroke: BLUE, 'stroke-width': '2.5',
    }));

    // Bottom line
    svg.appendChild(svgEl('line', {
      x1: String(lx), y1: String(botY),
      x2: String(s.arrows ? rx - 6 : rx), y2: String(botY),
      stroke: RED, 'stroke-width': '2.5',
    }));

    // Arrow heads
    if (s.arrows) {
      arrowHead(svg, rx, topY, 0, 9, BLUE);
      arrowHead(svg, rx, botY, 0, 9, RED);
    }

    // Ticks and labels
    for (let i = 0; i <= N; i++) {
      const x = lx + (rx - lx) * i / N;
      const topVal = s.topStart + (s.topEnd - s.topStart) * i / N;
      const botVal = s.botStart + (s.botEnd - s.botStart) * i / N;
      const topStr = Number.isInteger(topVal) ? String(topVal) : topVal.toFixed(2).replace(/\.?0+$/, '');
      const botStr = Number.isInteger(botVal) ? String(botVal) : botVal.toFixed(2).replace(/\.?0+$/, '');

      // Top tick (upward)
      svg.appendChild(svgEl('line', {
        x1: String(x), y1: String(topY),
        x2: String(x), y2: String(topY - 14),
        stroke: BLUE, 'stroke-width': '1.8',
      }));
      // Bottom tick (downward)
      svg.appendChild(svgEl('line', {
        x1: String(x), y1: String(botY),
        x2: String(x), y2: String(botY + 14),
        stroke: RED, 'stroke-width': '1.8',
      }));

      if (!s.blank) {
        svg.appendChild(svgText(x, topY - 22, topStr, 13, 'middle', { fill: BLUE, 'font-weight': '700' }));
        svg.appendChild(svgText(x, botY + 28, botStr, 13, 'middle', { fill: RED, 'font-weight': '700' }));
      }
    }

    // Labels at far left
    if (s.topLabel) {
      svg.appendChild(svgText(lx - 12, topY, s.topLabel, 13, 'end', { fill: BLUE, 'font-weight': '700' }));
    }
    if (s.botLabel) {
      svg.appendChild(svgText(lx - 12, botY, s.botLabel, 13, 'end', { fill: RED, 'font-weight': '700' }));
    }

    return svg;
  },
};

/* ================================================================
   RATIO BAR
   ================================================================ */
extraTemplates['ratio-bar'] = {
  name: 'Ratio Bar',
  category: 'Number',
  renderConfig(c) {
    c.appendChild(sectionLabel('Ratio'));
    c.appendChild(row(
      field('Ratio', textInput('rb-ratio', '2:3', 'e.g. 2:3 or 1:2:3')),
    ));
    c.appendChild(sectionLabel('Row Labels (optional)'));
    c.appendChild(row(
      field('Row A', textInput('rb-la', '', 'e.g. Boys')),
      field('Row B', textInput('rb-lb', '', 'e.g. Girls')),
    ));
    c.appendChild(row(
      field('Row C', textInput('rb-lc', '', 'optional')),
      field('Row D', textInput('rb-ld', '', 'optional')),
    ));
    c.appendChild(sectionLabel('Options'));
    c.appendChild(row(
      field('Square size', numberInput('rb-size', 40, 20, 80, 4)),
    ));
    c.appendChild(row(
      checkbox('rb-showlabels', 'Show row labels', false),
      checkbox('rb-showratio', 'Show ratio title', false),
    ));
  },
  readConfig() {
    const ratioStr = val('rb-ratio') || '2:3';
    const parts = ratioStr.split(':').map(p => Math.max(1, Math.min(20, parseInt(p, 10) || 1))).slice(0, 4);
    if (parts.length < 2) parts.push(1);
    const labelInputs = [val('rb-la'), val('rb-lb'), val('rb-lc'), val('rb-ld')];
    const defaultLetters = ['A', 'B', 'C', 'D'];
    const labels = parts.map((_, i) => labelInputs[i] || defaultLetters[i]);
    return {
      parts,
      labels,
      sqSize: val('rb-size') || 40,
      showLabels: val('rb-showlabels'),
      showRatio: val('rb-showratio'),
    };
  },
  generateSVG(s) {
    const SQ = s.sqSize;
    const GAP = 3;           // gap between squares
    const ROW_GAP = 12;      // gap between rows
    const LABEL_W = s.showLabels ? 90 : 0;
    const PAD_X = 60;
    const PAD_Y = 60;
    const TITLE_H = s.showRatio ? 34 : 0;

    const maxBlocks = Math.max(...s.parts);
    const numRows = s.parts.length;
    const W = PAD_X * 2 + LABEL_W + maxBlocks * (SQ + GAP) + 40;
    const H = PAD_Y * 2 + TITLE_H + numRows * SQ + (numRows - 1) * ROW_GAP;
    const svg = makeSVG(W, H);

    // Ratio title
    if (s.showRatio) {
      svg.appendChild(svgText(W / 2, PAD_Y + 20, `Ratio  ${s.parts.join(' : ')}`, 16, 'middle', { fill: '#222', 'font-weight': '700' }));
    }

    const startY = PAD_Y + TITLE_H;
    const startX = PAD_X + LABEL_W;

    s.parts.forEach((count, i) => {
      const rowY = startY + i * (SQ + ROW_GAP);

      // Optional row label
      if (s.showLabels) {
        svg.appendChild(svgText(PAD_X + LABEL_W - 10, rowY + SQ / 2 + 5, s.labels[i], 13, 'end', { fill: '#333', 'font-weight': '600' }));
      }

      // Outline squares — no fill, no numbers
      for (let j = 0; j < count; j++) {
        const bx = startX + j * (SQ + GAP);
        svg.appendChild(svgEl('rect', {
          x: String(bx), y: String(rowY),
          width: String(SQ), height: String(SQ),
          fill: '#ffffff', stroke: '#222', 'stroke-width': '1.5',
        }));
      }
    });

    return svg;
  },
};

/* ================================================================
   RULER
   ================================================================ */
extraTemplates['ruler'] = {
  name: 'Ruler',
  category: 'Measurement',
  renderConfig(c) {
    c.appendChild(sectionLabel('Ruler'));
    c.appendChild(row(
      field('Length', numberInput('ru-length', 15, 1, 60, 1)),
      field('Units', select('ru-units', [['cm', 'cm'], ['mm', 'mm'], ['inches', 'in'], ['generic', 'generic']])),
    ));
    c.appendChild(row(
      field('Start value', numberInput('ru-start', 0, -100, 100, 1)),
      field('Subdivisions', numberInput('ru-subs', 10, 1, 20, 1)),
    ));
    c.appendChild(sectionLabel('Marker'));
    c.appendChild(row(
      field('Marker at', numberInput('ru-marker', 0, -1000, 1000, 0.1)),
      checkbox('ru-show-marker', 'Show marker', false),
    ));
    c.appendChild(row(
      checkbox('ru-blank', 'Blank', false),
    ));
  },
  readConfig() {
    return {
      length: Math.max(1, Math.min(60, val('ru-length') || 15)),
      units: val('ru-units') || 'cm',
      start: val('ru-start'),
      subs: Math.max(1, Math.min(20, Math.round(val('ru-subs') || 10))),
      markerAt: val('ru-marker'),
      showMarker: val('ru-show-marker'),
      blank: val('ru-blank'),
    };
  },
  generateSVG(s) {
    const PAD = 80;
    const pxPerUnit = 42;
    const rulerW = s.length * pxPerUnit;
    const W = rulerW + PAD * 2 + 20;
    const H = 280;
    const rulerX = PAD;
    const rulerY = H / 2 - 20;
    const rulerH = 44;
    const svg = makeSVG(W, H);

    // Ruler body
    svg.appendChild(svgEl('rect', {
      x: String(rulerX), y: String(rulerY),
      width: String(rulerW), height: String(rulerH),
      fill: '#fef9c3', stroke: '#555', 'stroke-width': '1.5', rx: '3',
    }));

    const totalTicks = s.length * s.subs;
    for (let i = 0; i <= totalTicks; i++) {
      const x = rulerX + i * pxPerUnit / s.subs;
      const isMajor = i % s.subs === 0;
      const isMid = s.subs >= 4 && i % Math.floor(s.subs / 2) === 0 && !isMajor;
      const tickLen = isMajor ? 33 : isMid ? 22 : 11;
      svg.appendChild(svgEl('line', {
        x1: String(x), y1: String(rulerY + rulerH),
        x2: String(x), y2: String(rulerY + rulerH - tickLen),
        stroke: '#555', 'stroke-width': isMajor ? '1.5' : '1',
      }));
      if (isMajor && !s.blank) {
        const labelVal = s.start + i / s.subs;
        const labelStr = Number.isInteger(labelVal) ? String(labelVal) : labelVal.toFixed(1);
        svg.appendChild(svgText(x, rulerY + rulerH + 16, labelStr, 12, 'middle', { fill: '#333' }));
      }
    }

    // Unit label
    if (!s.blank) {
      const unitStr = s.units !== 'generic' ? s.units : '';
      if (unitStr) {
        svg.appendChild(svgText(rulerX + rulerW + 18, rulerY + rulerH + 16, unitStr, 12, 'start', { fill: '#555' }));
      }
    }

    // Red triangle marker above ruler
    if (s.showMarker) {
      const markerFrac = (s.markerAt - s.start) / s.length;
      const mx = rulerX + markerFrac * rulerW;
      const triY = rulerY - 8;
      const triSize = 8;
      // Downward-pointing triangle
      const d = `M ${mx} ${triY + triSize} L ${mx - triSize} ${triY - triSize} L ${mx + triSize} ${triY - triSize} Z`;
      svg.appendChild(svgEl('path', { d, fill: '#e63946', stroke: 'none' }));
      if (!s.blank) {
        const markerStr = Number.isInteger(s.markerAt) ? String(s.markerAt) : s.markerAt.toFixed(1);
        svg.appendChild(svgText(mx, triY - triSize - 8, markerStr, 12, 'middle', { fill: '#e63946', 'font-weight': '700' }));
      }
    }

    return svg;
  },
};

/* ================================================================
   WEIGHING SCALE
   ================================================================ */
extraTemplates['weighing-scale'] = {
  name: 'Weighing Scale',
  category: 'Measurement',
  renderConfig(c) {
    c.appendChild(sectionLabel('Scale'));
    c.appendChild(row(
      field('Min', numberInput('ws-min', 0, -10000, 10000, 1)),
      field('Max', numberInput('ws-max', 1000, -10000, 10000, 1)),
      field('Unit', textInput('ws-unit', 'g', 'e.g. g, kg, N')),
    ));
    c.appendChild(row(
      field('Major step', numberInput('ws-major', 100, 1, 10000, 1)),
      field('Subdivisions', numberInput('ws-subs', 5, 1, 10, 1)),
    ));
    c.appendChild(sectionLabel('Reading'));
    c.appendChild(row(
      field('Reading', numberInput('ws-reading', 0, -10000, 10000, 1)),
    ));
    c.appendChild(row(
      checkbox('ws-blank', 'Blank', false),
    ));
  },
  readConfig() {
    const min = val('ws-min');
    const max = val('ws-max') || 1000;
    const majorStep = val('ws-major') || 100;
    const subs = Math.max(1, Math.min(10, Math.round(val('ws-subs') || 5)));
    return {
      min,
      max,
      unit: val('ws-unit') || 'g',
      majorStep,
      subs,
      reading: val('ws-reading'),
      blank: val('ws-blank'),
    };
  },
  generateSVG(s) {
    const R = 140, PAD = 70;
    const W = R * 2 + PAD * 2 + 80;
    const H = 420;
    const cx = W / 2;
    const cy = PAD + 30 + R;

    const svg = makeSVG(W, H);

    function polarXY(angleDeg, r) {
      const rad = degToRad(angleDeg);
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    // Arc from 150° to 390° (= 30°), clockwise, sweep = 240°
    const arcStart = polarXY(150, R);
    const arcEnd = polarXY(30, R);

    // Background arc
    const bgArcD = `M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 1 1 ${arcEnd.x} ${arcEnd.y}`;
    svg.appendChild(svgEl('path', {
      d: bgArcD, fill: 'none',
      stroke: '#e5e7eb', 'stroke-width': '14', 'stroke-linecap': 'round',
    }));

    // Foreground arc (coloured up to reading)
    const range = s.max - s.min || 1;
    const readingFrac = Math.max(0, Math.min(1, (s.reading - s.min) / range));
    const readingAngle = 150 + readingFrac * 240;
    const arcFgEnd = polarXY(readingAngle, R);
    // Only draw if not blank and reading > min
    if (!s.blank && readingFrac > 0) {
      const largeArc = readingFrac * 240 > 180 ? 1 : 0;
      const fgArcD = `M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 ${largeArc} 1 ${arcFgEnd.x} ${arcFgEnd.y}`;
      svg.appendChild(svgEl('path', {
        d: fgArcD, fill: 'none',
        stroke: '#fca5a5', 'stroke-width': '14', 'stroke-linecap': 'round',
      }));
    }

    // Tick marks
    const numMajor = Math.round(range / (s.majorStep || 1));
    const totalTicks = Math.max(1, numMajor) * s.subs;
    for (let i = 0; i <= totalTicks; i++) {
      const frac = i / totalTicks;
      const angleDeg = 150 + frac * 240;
      const isMajor = i % s.subs === 0;
      const tickLen = isMajor ? 20 : 10;
      const outer = polarXY(angleDeg, R);
      const inner = polarXY(angleDeg, R - tickLen);
      svg.appendChild(svgEl('line', {
        x1: String(outer.x), y1: String(outer.y),
        x2: String(inner.x), y2: String(inner.y),
        stroke: '#555', 'stroke-width': isMajor ? '2' : '1',
      }));
      if (isMajor && !s.blank) {
        const labelPos = polarXY(angleDeg, R - 36);
        const labelVal = s.min + (i / s.subs) * s.majorStep;
        const labelStr = Number.isInteger(labelVal) ? String(labelVal) : labelVal.toFixed(1);
        svg.appendChild(svgText(labelPos.x, labelPos.y + 5, labelStr, 11, 'middle', { fill: '#333' }));
      }
    }

    // Needle
    const needleTip = polarXY(readingAngle, R - 18);
    svg.appendChild(svgEl('line', {
      x1: String(cx), y1: String(cy),
      x2: String(needleTip.x), y2: String(needleTip.y),
      stroke: '#e63946', 'stroke-width': '3', 'stroke-linecap': 'round',
    }));

    // Centre dot
    svg.appendChild(svgEl('circle', { cx: String(cx), cy: String(cy), r: '8', fill: '#e63946' }));

    // Reading text below pivot
    const textY = cy + 36;
    if (!s.blank) {
      const readingStr = Number.isInteger(s.reading) ? String(s.reading) : s.reading.toFixed(1);
      svg.appendChild(svgText(cx, textY, `${readingStr} ${s.unit}`, 16, 'middle', { fill: '#e63946', 'font-weight': '700' }));
    } else {
      svg.appendChild(svgText(cx, textY, s.unit, 14, 'middle', { fill: '#aaa' }));
    }

    return svg;
  },
};

/* ================================================================
   READING SCALE
   ================================================================ */
extraTemplates['reading-scale'] = {
  name: 'Reading Scale',
  category: 'Measurement',
  renderConfig(c) {
    c.appendChild(sectionLabel('Scale'));
    c.appendChild(row(
      field('Min', numberInput('rs-min', 0, -10000, 10000, 1)),
      field('Max', numberInput('rs-max', 100, -10000, 10000, 1)),
      field('Major step', numberInput('rs-major', 10, -10000, 10000, 0.1)),
    ));
    c.appendChild(row(
      field('Subdivisions', numberInput('rs-subs', 5, 1, 20, 1)),
      field('Unit', textInput('rs-unit', '', 'e.g. ml, °C, N')),
    ));
    c.appendChild(sectionLabel('Reading'));
    c.appendChild(row(
      field('Reading', numberInput('rs-reading', 0, -10000, 10000, 1)),
    ));
    c.appendChild(row(
      field('Orientation', select('rs-orient', [['vertical', 'Vertical'], ['horizontal', 'Horizontal']])),
    ));
    c.appendChild(row(
      checkbox('rs-blank', 'Blank', false),
      checkbox('rs-pointer', 'Show pointer', true),
    ));
  },
  readConfig() {
    return {
      min: val('rs-min'),
      max: val('rs-max') || 100,
      majorStep: val('rs-major') || 10,
      subs: Math.max(1, Math.min(20, Math.round(val('rs-subs') || 5))),
      unit: val('rs-unit'),
      reading: val('rs-reading'),
      orient: val('rs-orient') || 'vertical',
      blank: val('rs-blank'),
      showPointer: val('rs-pointer'),
    };
  },
  generateSVG(s) {
    const PAD = 90;
    const lineLen = 420;
    const range = (s.max - s.min) || 1;
    const isVert = s.orient === 'vertical';

    const W = isVert ? 280 : lineLen + PAD * 2;
    const H = isVert ? lineLen + PAD * 2 : 280;
    const svg = makeSVG(W, H);

    const numMajor = Math.round(range / (s.majorStep || 1));
    const totalTicks = Math.max(1, numMajor) * s.subs;

    if (isVert) {
      const lineX = W / 2 + 30;
      const lineTop = PAD;
      const lineBot = PAD + lineLen;

      // Scale line
      svg.appendChild(svgEl('line', {
        x1: String(lineX), y1: String(lineTop),
        x2: String(lineX), y2: String(lineBot),
        stroke: '#333', 'stroke-width': '2.5',
      }));

      // Ticks (min at bottom, max at top)
      for (let i = 0; i <= totalTicks; i++) {
        const frac = i / totalTicks;
        const tickY = lineTop + (1 - frac) * lineLen;
        const isMajor = i % s.subs === 0;
        const tickLen = isMajor ? 22 : 11;
        svg.appendChild(svgEl('line', {
          x1: String(lineX), y1: String(tickY),
          x2: String(lineX + tickLen), y2: String(tickY),
          stroke: '#333', 'stroke-width': isMajor ? '1.8' : '1',
        }));
        if (isMajor && !s.blank) {
          const labelVal = s.min + frac * range;
          const labelStr = Number.isInteger(labelVal) ? String(labelVal) : labelVal.toFixed(1);
          svg.appendChild(svgText(lineX + tickLen + 8, tickY + 4, labelStr, 13, 'start', { fill: '#333' }));
        }
      }

      // Unit label at top
      if (s.unit) {
        svg.appendChild(svgText(lineX, lineTop - 12, s.unit, 12, 'middle', { fill: '#555' }));
      }

      // Pointer (red left-pointing triangle to the left of line at reading)
      if (s.showPointer) {
        const readingFrac = Math.max(0, Math.min(1, (s.reading - s.min) / range));
        const py = lineTop + (1 - readingFrac) * lineLen;
        const triSize = 9;
        const triX = lineX - 4;
        // Left-pointing triangle
        const d = `M ${triX} ${py} L ${triX + triSize + 4} ${py - triSize} L ${triX + triSize + 4} ${py + triSize} Z`;
        svg.appendChild(svgEl('path', { d, fill: '#e63946', stroke: 'none' }));
        if (!s.blank) {
          const readingStr = Number.isInteger(s.reading) ? String(s.reading) : s.reading.toFixed(1);
          svg.appendChild(svgText(triX - 8, py + 4, readingStr, 13, 'end', { fill: '#e63946', 'font-weight': '700' }));
        }
      }
    } else {
      // Horizontal
      const lineY = H / 2 - 20;
      const lineLeft = PAD;
      const lineRight = PAD + lineLen;

      // Scale line
      svg.appendChild(svgEl('line', {
        x1: String(lineLeft), y1: String(lineY),
        x2: String(lineRight), y2: String(lineY),
        stroke: '#333', 'stroke-width': '2.5',
      }));

      // Ticks (min at left, max at right)
      for (let i = 0; i <= totalTicks; i++) {
        const frac = i / totalTicks;
        const tickX = lineLeft + frac * lineLen;
        const isMajor = i % s.subs === 0;
        const tickLen = isMajor ? 22 : 11;
        svg.appendChild(svgEl('line', {
          x1: String(tickX), y1: String(lineY),
          x2: String(tickX), y2: String(lineY + tickLen),
          stroke: '#333', 'stroke-width': isMajor ? '1.8' : '1',
        }));
        if (isMajor && !s.blank) {
          const labelVal = s.min + frac * range;
          const labelStr = Number.isInteger(labelVal) ? String(labelVal) : labelVal.toFixed(1);
          svg.appendChild(svgText(tickX, lineY + tickLen + 16, labelStr, 13, 'middle', { fill: '#333' }));
        }
      }

      // Unit label at right end
      if (s.unit) {
        svg.appendChild(svgText(lineRight + 12, lineY + 4, s.unit, 12, 'start', { fill: '#555' }));
      }

      // Pointer (red upward-pointing triangle above line)
      if (s.showPointer) {
        const readingFrac = Math.max(0, Math.min(1, (s.reading - s.min) / range));
        const px = lineLeft + readingFrac * lineLen;
        const triSize = 9;
        const triY = lineY - 4;
        // Downward-pointing triangle (pointing down toward line)
        const d = `M ${px} ${triY} L ${px - triSize} ${triY - triSize - 4} L ${px + triSize} ${triY - triSize - 4} Z`;
        svg.appendChild(svgEl('path', { d, fill: '#e63946', stroke: 'none' }));
        if (!s.blank) {
          const readingStr = Number.isInteger(s.reading) ? String(s.reading) : s.reading.toFixed(1);
          svg.appendChild(svgText(px, triY - triSize - 16, readingStr, 13, 'middle', { fill: '#e63946', 'font-weight': '700' }));
        }
      }
    }

    return svg;
  },
};

/* ================================================================
   SI PREFIX CHART
   ================================================================ */
extraTemplates['si-prefixes'] = {
  name: 'SI Prefix Chart',
  category: 'Number',
  renderConfig(c) {
    /* All SI prefixes in descending order */
    const ALL = [
      { id: 'sp-tera',  sym: 'T',  name: 'tera',  exp: 12  },
      { id: 'sp-giga',  sym: 'G',  name: 'giga',  exp: 9   },
      { id: 'sp-mega',  sym: 'M',  name: 'mega',  exp: 6   },
      { id: 'sp-kilo',  sym: 'k',  name: 'kilo',  exp: 3   },
      { id: 'sp-hecto', sym: 'h',  name: 'hecto', exp: 2   },
      { id: 'sp-deca',  sym: 'da', name: 'deca',  exp: 1   },
      { id: 'sp-base',  sym: '',   name: 'base',  exp: 0   },
      { id: 'sp-deci',  sym: 'd',  name: 'deci',  exp: -1  },
      { id: 'sp-centi', sym: 'c',  name: 'centi', exp: -2  },
      { id: 'sp-milli', sym: 'm',  name: 'milli', exp: -3  },
      { id: 'sp-micro', sym: 'μ',  name: 'micro', exp: -6  },
      { id: 'sp-nano',  sym: 'n',  name: 'nano',  exp: -9  },
      { id: 'sp-pico',  sym: 'p',  name: 'pico',  exp: -12 },
      { id: 'sp-femto', sym: 'f',  name: 'femto', exp: -15 },
    ];

    c.appendChild(sectionLabel('SI Prefix Chart'));
    c.appendChild(row(field('Base unit', textInput('sp-unit', 'm', 'e.g. m, g, W, J'))));
    c.appendChild(row(checkbox('sp-bytes', 'Bytes mode (×1024)', false)));
    c.appendChild(sectionLabel('Large prefixes'));
    c.appendChild(row(
      checkbox('sp-tera',  'tera (T) 10¹²', false),
      checkbox('sp-giga',  'giga (G) 10⁹',  true),
    ));
    c.appendChild(row(
      checkbox('sp-mega',  'mega (M) 10⁶',  true),
      checkbox('sp-kilo',  'kilo (k) 10³',  true),
    ));
    c.appendChild(sectionLabel('Intermediate'));
    c.appendChild(row(
      checkbox('sp-hecto', 'hecto (h) 10²', false),
      checkbox('sp-deca',  'deca (da) 10¹', false),
    ));
    c.appendChild(row(
      checkbox('sp-base',  'base unit',     true),
      checkbox('sp-deci',  'deci (d) 10⁻¹', false),
    ));
    c.appendChild(row(
      checkbox('sp-centi', 'centi (c) 10⁻²', false),
      checkbox('sp-milli', 'milli (m) 10⁻³', true),
    ));
    c.appendChild(sectionLabel('Small prefixes'));
    c.appendChild(row(
      checkbox('sp-micro', 'micro (μ) 10⁻⁶', true),
      checkbox('sp-nano',  'nano (n) 10⁻⁹',  true),
    ));
    c.appendChild(row(
      checkbox('sp-pico',  'pico (p) 10⁻¹²', false),
      checkbox('sp-femto', 'femto (f) 10⁻¹⁵', false),
    ));
    c.appendChild(sectionLabel('Display'));
    c.appendChild(row(
      checkbox('sp-show-exp',  'Show 10ⁿ notation', true),
      checkbox('sp-show-name', 'Show prefix name',  false),
    ));
  },
  readConfig() {
    return {
      unit: val('sp-unit') || 'm',
      bytesMode: val('sp-bytes'),
      showExp:   val('sp-show-exp'),
      showName:  val('sp-show-name'),
      tera:  val('sp-tera'),  giga:  val('sp-giga'),  mega:  val('sp-mega'),
      kilo:  val('sp-kilo'),  hecto: val('sp-hecto'), deca:  val('sp-deca'),
      base:  val('sp-base'),  deci:  val('sp-deci'),  centi: val('sp-centi'),
      milli: val('sp-milli'), micro: val('sp-micro'), nano:  val('sp-nano'),
      pico:  val('sp-pico'),  femto: val('sp-femto'),
    };
  },
  generateSVG(s) {
    /* ── Bytes mode ─────────────────────────────── */
    if (s.bytesMode) {
      const byteUnits = [
        { sym: 'PB', name: 'petabyte', exp: 5 },
        { sym: 'TB', name: 'terabyte', exp: 4 },
        { sym: 'GB', name: 'gigabyte', exp: 3 },
        { sym: 'MB', name: 'megabyte', exp: 2 },
        { sym: 'KB', name: 'kilobyte', exp: 1 },
        { sym: 'B',  name: 'byte',     exp: 0 },
      ];
      const n = byteUnits.length;
      const cellW = 110, cellH = 56, pad = 24;
      const W = n * cellW + pad * 2;
      const H = s.showName ? 220 : 190;
      const svg = makeSVG(W, H);
      svg.appendChild(svgText(W / 2, 24, 'Bytes Conversion', 16, 'middle', { 'font-weight': '700', fill: '#222' }));

      const colours = ['#7b2d8e','#e63946','#f4a261','#2a9d8f','#4262ff','#555'];
      byteUnits.forEach((u, i) => {
        const x = pad + i * cellW;
        const y = 44;
        svg.appendChild(svgEl('rect', { x: x+2, y, width: cellW-4, height: cellH, rx: 8, fill: colours[i], stroke: '#fff', 'stroke-width': '2' }));
        svg.appendChild(svgText(x + cellW/2, y + cellH/2 + 1, u.sym, 20, 'middle', { fill: '#fff', 'font-weight': '700', 'dominant-baseline': 'central' }));
        if (s.showName) svg.appendChild(svgText(x + cellW/2, y + cellH + 18, u.name, 10, 'middle', { fill: '#555' }));
        if (s.showExp && i > 0) {
          const exp = u.exp;
          svg.appendChild(svgText(x + cellW/2, y + cellH + (s.showName ? 32 : 18), `1024${superscript(exp)} B`, 10, 'middle', { fill: '#888' }));
        }
      });

      /* arrows between adjacent boxes (left=larger, right=smaller) */
      for (let i = 0; i < n - 1; i++) {
        const x1 = pad + i * cellW + cellW / 2;
        const x2 = pad + (i+1) * cellW + cellW / 2;
        const midX = (x1 + x2) / 2;
        const topY = 44 - 6;
        svg.appendChild(svgEl('path', { d: `M ${x1+10} ${topY} Q ${midX} ${topY-22} ${x2-10} ${topY}`, fill: 'none', stroke: '#333', 'stroke-width': '1.5' }));
        arrowHead(svg, x2-10, topY, 0, 5, '#333');
        svg.appendChild(svgText(midX, topY - 16, '\u00F71024', 10, 'middle', { fill: '#333', 'font-weight': '600' }));
        const botY = 44 + cellH + 6;
        svg.appendChild(svgEl('path', { d: `M ${x2-10} ${botY} Q ${midX} ${botY+22} ${x1+10} ${botY}`, fill: 'none', stroke: '#999', 'stroke-width': '1.5' }));
        arrowHead(svg, x1+10, botY, Math.PI, 5, '#999');
        svg.appendChild(svgText(midX, botY + 18, '\u00D71024', 10, 'middle', { fill: '#999', 'font-weight': '600' }));
      }

      svg.appendChild(svgText(W/2, H - 10, '1 KB = 1024 B (computing convention)', 10, 'middle', { fill: '#999', 'font-style': 'italic' }));
      return svg;
    }

    /* ── Standard SI mode ───────────────────────── */
    const SI_ALL = [
      { key: 'tera',  sym: 'T',  name: 'tera',  exp: 12  },
      { key: 'giga',  sym: 'G',  name: 'giga',  exp: 9   },
      { key: 'mega',  sym: 'M',  name: 'mega',  exp: 6   },
      { key: 'kilo',  sym: 'k',  name: 'kilo',  exp: 3   },
      { key: 'hecto', sym: 'h',  name: 'hecto', exp: 2   },
      { key: 'deca',  sym: 'da', name: 'deca',  exp: 1   },
      { key: 'base',  sym: '',   name: 'base',  exp: 0   },
      { key: 'deci',  sym: 'd',  name: 'deci',  exp: -1  },
      { key: 'centi', sym: 'c',  name: 'centi', exp: -2  },
      { key: 'milli', sym: 'm',  name: 'milli', exp: -3  },
      { key: 'micro', sym: '\u03bc', name: 'micro', exp: -6  },
      { key: 'nano',  sym: 'n',  name: 'nano',  exp: -9  },
      { key: 'pico',  sym: 'p',  name: 'pico',  exp: -12 },
      { key: 'femto', sym: 'f',  name: 'femto', exp: -15 },
    ];

    const selected = SI_ALL.filter(p => s[p.key]);
    if (selected.length < 2) {
      const svg = makeSVG(400, 100);
      svg.appendChild(svgText(200, 50, 'Select at least 2 prefixes', 14, 'middle', { fill: '#888' }));
      return svg;
    }

    const extraRows = (s.showExp ? 1 : 0) + (s.showName ? 1 : 0);
    const cellW = 100, cellH = 52, arrowH = 44, pad = 20;
    const n = selected.length;
    const W = n * cellW + pad * 2;
    const H = 48 + cellH + arrowH * 2 + extraRows * 16 + 16;
    const svg = makeSVG(W, H);

    const title = `SI Prefixes — ${s.unit}`;
    svg.appendChild(svgText(W/2, 24, title, 15, 'middle', { 'font-weight': '700', fill: '#222' }));

    const colours = ['#7b2d8e','#2563eb','#0891b2','#059669','#4262ff','#f4a261','#e63946','#888'];
    const barY = 40;

    selected.forEach((p, i) => {
      const x = pad + i * cellW;
      const col = colours[i % colours.length];
      const label = p.sym ? `${p.sym}${s.unit}` : s.unit;
      svg.appendChild(svgEl('rect', { x: x+2, y: barY, width: cellW-4, height: cellH, rx: 8, fill: col, stroke: '#fff', 'stroke-width': '2' }));
      svg.appendChild(svgText(x + cellW/2, barY + cellH/2 + 1, label, 17, 'middle', { fill: '#fff', 'font-weight': '700', 'dominant-baseline': 'central' }));

      let ry = barY + cellH + 8;
      if (s.showExp) {
        const expStr = p.exp === 0 ? '10⁰' : `10${p.exp > 0 ? superscript(p.exp) : '⁻' + superscript(-p.exp)}`;
        svg.appendChild(svgText(x + cellW/2, ry, expStr, 11, 'middle', { fill: '#555', 'font-weight': '600' }));
        ry += 16;
      }
      if (s.showName) {
        svg.appendChild(svgText(x + cellW/2, ry, p.name, 10, 'middle', { fill: '#888' }));
      }
    });

    /* Conversion arrows between adjacent selected prefixes */
    for (let i = 0; i < selected.length - 1; i++) {
      const expDiff = selected[i].exp - selected[i+1].exp; /* always positive — going right = smaller */
      const factorStr = expDiff === 1 ? '×10' : expDiff === 3 ? '×1000' : `×10${superscript(expDiff)}`;
      const revStr    = expDiff === 1 ? '÷10' : expDiff === 3 ? '÷1000' : `÷10${superscript(expDiff)}`;
      const x1 = pad + (i+1)*cellW - cellW/2 + 2;
      const x2 = pad + (i+1)*cellW + cellW/2 - 2;
      const midX = (x1 + x2) / 2;
      const topY = barY - 6;
      svg.appendChild(svgEl('path', { d: `M ${x1} ${topY} Q ${midX} ${topY - 24} ${x2} ${topY}`, fill: 'none', stroke: '#333', 'stroke-width': '1.5' }));
      arrowHead(svg, x2, topY, 0, 5, '#333');
      svg.appendChild(svgText(midX, topY - 18, factorStr, 10, 'middle', { fill: '#333', 'font-weight': '600' }));
      const botY = barY + cellH + (s.showExp ? 32 : 14) + (s.showName ? 14 : 0) + 8;
      svg.appendChild(svgEl('path', { d: `M ${x2} ${botY} Q ${midX} ${botY + 22} ${x1} ${botY}`, fill: 'none', stroke: '#999', 'stroke-width': '1.5' }));
      arrowHead(svg, x1, botY, Math.PI, 5, '#999');
      svg.appendChild(svgText(midX, botY + 20, revStr, 10, 'middle', { fill: '#999', 'font-weight': '600' }));
    }

    return svg;
  },
};

/* helper: integer → superscript string */
function superscript(n) {
  const SUPS = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
  return String(n).split('').map(d => SUPS[d] || d).join('');
}

/* ================================================================
   BINARY PLACE VALUE FRAME
   ================================================================ */
extraTemplates['binary-frame'] = {
  name: 'Binary Frame',
  category: 'Number',
  renderConfig(c) {
    c.appendChild(sectionLabel('Binary Place Value'));
    c.appendChild(row(
      field('Number of bits', select('bf-bits', [['4','4 bits (nibble)'],['8','8 bits (byte)'],['16','16 bits']])),
    ));
    c.appendChild(sectionLabel('Show rows'));
    c.appendChild(row(
      checkbox('bf-powers',   'Powers (2ⁿ)',             true),
      checkbox('bf-decimals', 'Decimal values',          true),
    ));
    c.appendChild(row(
      checkbox('bf-hex',      'Hex equivalents',         false),
    ));
    c.appendChild(sectionLabel('Example'));
    c.appendChild(row(field('Decimal number', numberInput('bf-num', 0, 0, 65535, 1))));
    c.appendChild(row(
      checkbox('bf-fill',    'Fill binary digits',       false),
      checkbox('bf-working', 'Show working (sum)',       false),
    ));
    c.appendChild(row(
      field('Box colour', colourSwatch('bf-colour', '#e8eaf6')),
      field('Bit colour', colourSwatch('bf-bit-colour', '#4262ff')),
    ));
  },
  readConfig() {
    return {
      bits:      parseInt(val('bf-bits') || '8', 10),
      powers:    val('bf-powers'),
      decimals:  val('bf-decimals'),
      hex:       val('bf-hex'),
      num:       parseInt(val('bf-num') || '0', 10),
      fill:      val('bf-fill'),
      working:   val('bf-working'),
      colour:    val('bf-colour') || '#e8eaf6',
      bitColour: val('bf-bit-colour') || '#4262ff',
    };
  },
  generateSVG(s) {
    const n = Math.max(4, Math.min(16, s.bits));
    const num = Math.max(0, Math.min(Math.pow(2, n) - 1, s.num || 0));

    /* Build binary digits array (MSB first) */
    const digits = [];
    for (let i = n - 1; i >= 0; i--) digits.push((num >> i) & 1);

    /* Layout */
    const cellW = n <= 8 ? 64 : 36;
    const cellH = 52;
    const rowGap = 4;
    const pad = 28;
    const labelW = 90;

    const rows = [];
    if (s.powers)   rows.push('powers');
    if (s.decimals) rows.push('decimals');
    if (s.hex)      rows.push('hex');
    rows.push('bits');
    if (s.working && s.fill) rows.push('working');

    const W = labelW + n * cellW + pad;
    const H = pad + rows.length * (cellH + rowGap) + (s.working && s.fill ? 48 : 24);
    const svg = makeSVG(W, H);

    svg.appendChild(svgText(W/2, 18, 'Binary Place Value', 15, 'middle', { 'font-weight': '700', fill: '#222' }));

    rows.forEach((rowType, ri) => {
      const y = pad + ri * (cellH + rowGap);

      /* Row label */
      const labelMap = {
        powers:   '2ⁿ',
        decimals: 'Value',
        hex:      'Hex',
        bits:     'Binary',
        working:  '',
      };
      svg.appendChild(svgText(labelW - 10, y + cellH/2 + 1, labelMap[rowType], 12, 'end', { fill: '#555', 'font-weight': '600', 'dominant-baseline': 'central' }));

      for (let i = 0; i < n; i++) {
        const exp = n - 1 - i;
        const x = labelW + i * cellW;
        const val2 = Math.pow(2, exp);

        if (rowType === 'bits') {
          /* Student input box */
          const filled = s.fill;
          const bit = digits[i];
          const boxFill = filled && bit === 1 ? s.bitColour : s.colour;
          const textFill = filled && bit === 1 ? '#fff' : '#333';
          svg.appendChild(svgEl('rect', { x: x+1, y: y+1, width: cellW-2, height: cellH-2, rx: 6, fill: boxFill, stroke: '#5c6bc0', 'stroke-width': '2' }));
          if (filled) {
            svg.appendChild(svgText(x + cellW/2, y + cellH/2 + 1, String(bit), n <= 8 ? 24 : 18, 'middle', { fill: textFill, 'font-weight': '700', 'dominant-baseline': 'central' }));
          }
          /* Group separators every 4 bits */
          if (i > 0 && (n - i) % 4 === 0) {
            svg.appendChild(svgEl('line', { x1: x, y1: y, x2: x, y2: y + cellH, stroke: '#7b2d8e', 'stroke-width': '2', 'stroke-dasharray': '4 2' }));
          }
        } else if (rowType === 'powers') {
          svg.appendChild(svgEl('rect', { x: x+1, y: y+1, width: cellW-2, height: cellH-2, rx: 4, fill: '#f8fafc', stroke: '#cbd5e1', 'stroke-width': '1.5' }));
          const expStr = `2${superscript(exp)}`;
          svg.appendChild(svgText(x + cellW/2, y + cellH/2 + 1, expStr, n <= 8 ? 14 : 11, 'middle', { fill: '#334155', 'font-weight': '600', 'dominant-baseline': 'central' }));
        } else if (rowType === 'decimals') {
          svg.appendChild(svgEl('rect', { x: x+1, y: y+1, width: cellW-2, height: cellH-2, rx: 4, fill: '#f0fdf4', stroke: '#86efac', 'stroke-width': '1.5' }));
          svg.appendChild(svgText(x + cellW/2, y + cellH/2 + 1, String(val2), n <= 8 ? 14 : 10, 'middle', { fill: '#166534', 'font-weight': '700', 'dominant-baseline': 'central' }));
        } else if (rowType === 'hex') {
          const hexNibble = n <= 8 ? (i < n/2 ? 'upper' : 'lower') : null;
          svg.appendChild(svgEl('rect', { x: x+1, y: y+1, width: cellW-2, height: cellH-2, rx: 4, fill: '#fdf4ff', stroke: '#e879f9', 'stroke-width': '1.5' }));
          /* for hex, show grouped nibble values */
          if ((exp + 1) % 4 === 0) {
            const nibbleVal = s.fill ? ((num >> exp) & 0xF) : null;
            const hexStr = nibbleVal !== null ? nibbleVal.toString(16).toUpperCase() : '_';
            svg.appendChild(svgEl('rect', { x: x+1, y: y+1, width: cellW*4-2, height: cellH-2, rx: 4, fill: '#fdf4ff', stroke: '#e879f9', 'stroke-width': '1.5' }));
            svg.appendChild(svgText(x + cellW*2, y + cellH/2 + 1, hexStr, 16, 'middle', { fill: '#7e22ce', 'font-weight': '700', 'dominant-baseline': 'central' }));
          }
        }
      }
    });

    /* Working row */
    if (s.working && s.fill && num > 0) {
      const workY = pad + rows.length * (cellH + rowGap) + 8;
      const parts = [];
      for (let i = 0; i < n; i++) {
        if (digits[i] === 1) parts.push(String(Math.pow(2, n - 1 - i)));
      }
      const workStr = parts.join(' + ') + ' = ' + num;
      svg.appendChild(svgText(W/2, workY + 16, workStr, 13, 'middle', { fill: '#333', 'font-weight': '600' }));
    }

    return svg;
  },
};

/* ================================================================
   BACKGROUND PAPER TEMPLATES
   1 cm ≈ 38 px at 96 dpi.  Canvas: 1600 × 1130 (A4 landscape).
   ================================================================ */

/* ── Shared colour palettes ──────────────────────────────────── */
const _BG = {
  white:    '#ffffff', cream:    '#fffef2', 'lt-blue':  '#eff5ff',
  'lt-gray':'#f5f5f6', 'lt-yellow':'#fffbf0', 'lt-green':'#f2fbf5',
  'lt-pink':'#fff0f5', 'lt-purple':'#f5f0ff', 'lt-teal': '#f0fbfa',
};
const _BG_OPTS = [
  {v:'white',l:'White'},{v:'cream',l:'Cream'},{v:'lt-blue',l:'Light blue'},
  {v:'lt-gray',l:'Light gray'},{v:'lt-yellow',l:'Light yellow'},
  {v:'lt-green',l:'Light green'},{v:'lt-pink',l:'Light pink'},
  {v:'lt-purple',l:'Light purple'},{v:'lt-teal',l:'Light teal'},
];
const _LC = {
  blue:     {light:'#c4d6ee',bold:'#88aad0'},
  gray:     {light:'#c4c4cc',bold:'#9898a8'},
  green:    {light:'#b4d8bc',bold:'#78a882'},
  lavender: {light:'#c4bedd',bold:'#9688bb'},
  pink:     {light:'#ddbcc8',bold:'#bb8ea0'},
  red:      {light:'#f4b4b4',bold:'#d47878'},
  teal:     {light:'#aadcd8',bold:'#66b0aa'},
  orange:   {light:'#f0d0a8',bold:'#d4a060'},
};
const _LC_OPTS = [
  {v:'blue',l:'Blue'},{v:'gray',l:'Gray'},{v:'green',l:'Green'},
  {v:'lavender',l:'Lavender'},{v:'pink',l:'Pink'},
  {v:'red',l:'Red'},{v:'teal',l:'Teal'},{v:'orange',l:'Orange'},
];
/* cm to pixels.  Selectable sizes span 0.5 – 2 cm. */
const _CM_PX = {'0.5':19,'0.7':26,'1':38,'1.5':57,'2':76};
const _CM_OPTS = [
  {v:'0.5',l:'0.5 cm'},{v:'0.7',l:'0.7 cm'},{v:'1',l:'1 cm (standard)'},
  {v:'1.5',l:'1.5 cm'},{v:'2',l:'2 cm'},
];

/* ── Lined Paper ─────────────────────────────────────────────── */
extraTemplates['lined-paper'] = {
  name: 'Lined Paper',
  category: 'Backgrounds',
  renderConfig(c) {
    c.appendChild(sectionLabel('Lined Paper'));
    c.appendChild(row(
      field('Line spacing', select('lp-sp', _CM_OPTS, '1')),
      field('Line colour',  select('lp-lc', _LC_OPTS, 'blue')),
    ));
    c.appendChild(row(
      field('Background', select('lp-bg', _BG_OPTS, 'white')),
    ));
    c.appendChild(row(
      checkbox('lp-margin', 'Show margin line', true),
    ));
  },
  readConfig() {
    return {
      sp:     val('lp-sp')     || '1',
      lc:     val('lp-lc')     || 'blue',
      bg:     val('lp-bg')     || 'white',
      margin: val('lp-margin'),
    };
  },
  generateSVG(s) {
    const W = 1600, H = 1130;
    const sp  = _CM_PX[s.sp] || 38;
    const lc  = _LC[s.lc]    || _LC.blue;
    const bgC = _BG[s.bg]    || '#ffffff';
    const svg = makeSVG(W, H);
    const defs = svgEl('defs', {});
    const pat = svgEl('pattern', { id:'lp-pat', x:0, y:0, width:W, height:sp, patternUnits:'userSpaceOnUse' });
    pat.appendChild(svgEl('line', { x1:0, y1:sp, x2:W, y2:sp, stroke:lc.light, 'stroke-width':'1' }));
    defs.appendChild(pat);
    svg.appendChild(defs);
    svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill:bgC }));
    svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill:'url(#lp-pat)' }));
    if (s.margin) {
      svg.appendChild(svgEl('line', { x1:130, y1:0, x2:130, y2:H, stroke:'#f28b82', 'stroke-width':'1.5' }));
    }
    return svg;
  },
};

/* ── Grid Paper ──────────────────────────────────────────────── */
extraTemplates['grid-paper'] = {
  name: 'Grid Paper',
  category: 'Backgrounds',
  renderConfig(c) {
    c.appendChild(sectionLabel('Grid Paper'));
    c.appendChild(row(
      field('Cell size',   select('gp-sp', _CM_OPTS, '1')),
      field('Line colour', select('gp-lc', _LC_OPTS, 'blue')),
    ));
    c.appendChild(row(
      field('Background', select('gp-bg', _BG_OPTS, 'white')),
    ));
    c.appendChild(row(
      checkbox('gp-bold', 'Bold every 5 squares', true),
    ));
  },
  readConfig() {
    return {
      sp:   val('gp-sp')   || '1',
      lc:   val('gp-lc')   || 'blue',
      bg:   val('gp-bg')   || 'white',
      bold: val('gp-bold'),
    };
  },
  generateSVG(s) {
    const W = 1600, H = 1130;
    const sp  = _CM_PX[s.sp] || 38;
    const lc  = _LC[s.lc]    || _LC.blue;
    const bgC = _BG[s.bg]    || '#ffffff';
    const svg = makeSVG(W, H);
    const defs = svgEl('defs', {});
    /* light grid: sp×sp tile with right+bottom edges */
    const pat = svgEl('pattern', { id:'gp-pat', x:0, y:0, width:sp, height:sp, patternUnits:'userSpaceOnUse' });
    pat.appendChild(svgEl('line', { x1:sp, y1:0, x2:sp, y2:sp, stroke:lc.light, 'stroke-width':'0.6' }));
    pat.appendChild(svgEl('line', { x1:0, y1:sp, x2:sp, y2:sp, stroke:lc.light, 'stroke-width':'0.6' }));
    defs.appendChild(pat);
    if (s.bold) {
      /* bold overlay: 5sp×5sp tile with thick right+bottom edges */
      const bp = 5 * sp;
      const boldPat = svgEl('pattern', { id:'gp-bold', x:0, y:0, width:bp, height:bp, patternUnits:'userSpaceOnUse' });
      boldPat.appendChild(svgEl('line', { x1:bp, y1:0, x2:bp, y2:bp, stroke:lc.bold, 'stroke-width':'1.4' }));
      boldPat.appendChild(svgEl('line', { x1:0, y1:bp, x2:bp, y2:bp, stroke:lc.bold, 'stroke-width':'1.4' }));
      defs.appendChild(boldPat);
    }
    svg.appendChild(defs);
    svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill:bgC }));
    svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill:'url(#gp-pat)' }));
    if (s.bold) svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill:'url(#gp-bold)' }));
    return svg;
  },
};

/* ── Dot Grid ────────────────────────────────────────────────── */
extraTemplates['dot-grid'] = {
  name: 'Dot Grid',
  category: 'Backgrounds',
  renderConfig(c) {
    c.appendChild(sectionLabel('Dot Grid'));
    c.appendChild(row(
      field('Dot spacing', select('dg-sp', _CM_OPTS, '1')),
      field('Dot colour',  select('dg-lc', _LC_OPTS, 'gray')),
    ));
    c.appendChild(row(
      field('Background', select('dg-bg', _BG_OPTS, 'white')),
      field('Dot size', select('dg-ds', [{v:'s',l:'Small'},{v:'m',l:'Medium'},{v:'l',l:'Large'}], 'm')),
    ));
  },
  readConfig() {
    return {
      sp: val('dg-sp') || '1',
      lc: val('dg-lc') || 'gray',
      bg: val('dg-bg') || 'white',
      ds: val('dg-ds') || 'm',
    };
  },
  generateSVG(s) {
    const W = 1600, H = 1130;
    const sp  = _CM_PX[s.sp] || 38;
    const lc  = _LC[s.lc]    || _LC.gray;
    const bgC = _BG[s.bg]    || '#ffffff';
    const r   = {s:1.2, m:1.8, l:2.8}[s.ds] || 1.8;
    const svg = makeSVG(W, H);
    const defs = svgEl('defs', {});
    const pat = svgEl('pattern', { id:'dg-pat', x:0, y:0, width:sp, height:sp, patternUnits:'userSpaceOnUse' });
    pat.appendChild(svgEl('circle', { cx:sp/2, cy:sp/2, r, fill:lc.bold }));
    defs.appendChild(pat);
    svg.appendChild(defs);
    svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill:bgC }));
    svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill:'url(#dg-pat)' }));
    return svg;
  },
};

/* ── Isometric Dot Grid ──────────────────────────────────────── */
extraTemplates['isometric-dot'] = {
  name: 'Isometric Dot Grid',
  category: 'Backgrounds',
  renderConfig(c) {
    c.appendChild(sectionLabel('Isometric Dot Grid'));
    c.appendChild(row(
      field('Dot spacing', select('id-sp', _CM_OPTS, '1')),
      field('Dot colour',  select('id-lc', _LC_OPTS, 'gray')),
    ));
    c.appendChild(row(
      field('Background', select('id-bg', _BG_OPTS, 'white')),
      field('Dot size', select('id-ds', [{v:'s',l:'Small'},{v:'m',l:'Medium'},{v:'l',l:'Large'}], 'm')),
    ));
  },
  readConfig() {
    return {
      sp: val('id-sp') || '1',
      lc: val('id-lc') || 'gray',
      bg: val('id-bg') || 'white',
      ds: val('id-ds') || 'm',
    };
  },
  generateSVG(s) {
    const W = 1600, H = 1130;
    const sp   = _CM_PX[s.sp] || 38;
    const lc   = _LC[s.lc]    || _LC.gray;
    const bgC  = _BG[s.bg]    || '#ffffff';
    const r    = {s:1.2, m:1.8, l:2.8}[s.ds] || 1.8;
    const rowH = sp * Math.sqrt(3) / 2;
    const svg  = makeSVG(W, H);
    /* Isometric tile: sp wide × 2*rowH tall.
       Even row dot at (0,0), odd row dot at (sp/2, rowH).
       Pattern repeat handles the rest. */
    const defs = svgEl('defs', {});
    const pat = svgEl('pattern', { id:'id-pat', x:0, y:0, width:sp, height:2*rowH, patternUnits:'userSpaceOnUse' });
    pat.appendChild(svgEl('circle', { cx:0,     cy:0,    r, fill:lc.bold }));
    pat.appendChild(svgEl('circle', { cx:sp/2,  cy:rowH, r, fill:lc.bold }));
    defs.appendChild(pat);
    svg.appendChild(defs);
    svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill:bgC }));
    svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill:'url(#id-pat)' }));
    return svg;
  },
};

/* ── Isometric Grid ──────────────────────────────────────────── */
extraTemplates['isometric-grid'] = {
  name: 'Isometric Grid',
  category: 'Backgrounds',
  renderConfig(c) {
    c.appendChild(sectionLabel('Isometric Grid'));
    c.appendChild(row(
      field('Cell size',   select('ig2-sp', _CM_OPTS, '1')),
      field('Line colour', select('ig2-lc', _LC_OPTS, 'blue')),
    ));
    c.appendChild(row(
      field('Background', select('ig2-bg', _BG_OPTS, 'white')),
    ));
  },
  readConfig() {
    return {
      sp: val('ig2-sp') || '1',
      lc: val('ig2-lc') || 'blue',
      bg: val('ig2-bg') || 'white',
    };
  },
  generateSVG(s) {
    const W = 1600, H = 1130;
    const sp    = _CM_PX[s.sp] || 38;
    const lc    = _LC[s.lc]    || _LC.blue;
    const bgC   = _BG[s.bg]    || '#ffffff';
    const svg   = makeSVG(W, H);
    const rowH  = sp * Math.sqrt(3) / 2;
    const stroke = lc.light, sw = '0.8';
    /* Pattern tile: sp wide × rowH tall.
       Contains one horizontal line segment and two diagonal segments
       that together tile into a full isometric grid. */
    const defs = svgEl('defs', {});
    const pat = svgEl('pattern', { id:'ig2-pat', x:0, y:0, width:sp, height:rowH, patternUnits:'userSpaceOnUse' });
    /* horizontal line at bottom of tile */
    pat.appendChild(svgEl('line', { x1:0, y1:rowH, x2:sp, y2:rowH, stroke, 'stroke-width':sw }));
    /* ↘ diagonal: from top-left (0,0) to bottom-right (sp/2, rowH) */
    pat.appendChild(svgEl('line', { x1:0, y1:0, x2:sp/2, y2:rowH, stroke, 'stroke-width':sw }));
    /* ↙ diagonal: from top-right (sp,0) to bottom-left (sp/2, rowH) */
    pat.appendChild(svgEl('line', { x1:sp, y1:0, x2:sp/2, y2:rowH, stroke, 'stroke-width':sw }));
    defs.appendChild(pat);
    svg.appendChild(defs);
    svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill:bgC }));
    svg.appendChild(svgEl('rect', { x:0, y:0, width:W, height:H, fill:'url(#ig2-pat)' }));
    return svg;
  },
};

/* ── Export ─────────────────────────────────────────────── */
export { extraTemplates };
