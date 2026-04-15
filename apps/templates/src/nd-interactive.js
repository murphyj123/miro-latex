/**
 * nd-interactive.js
 * Full-screen interactive normal distribution — GeoGebra-style.
 * SVG elements are updated in-place on every drag frame (no re-render from scratch).
 */

import { extraTemplates }  from './templates-extra.js';
import { svgToDataUrl }    from '../../shared/svg-utils.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const SVG_NS = 'http://www.w3.org/2000/svg';
const VW = 720, VH = 430;                        // fixed viewBox
const pad = { l: 55, r: 45, t: 50, b: 72 };
const GW  = VW - pad.l - pad.r;
const GH  = VH - pad.t - pad.b;
const AY  = pad.t + GH;                          // y of x-axis
const STEPS = 300;

// ── State ─────────────────────────────────────────────────────────────────────
const S = {
  mean: 0, sd: 1,
  shadeMode: 'none',
  ba: -1, bb: 1,
  title: 'Normal Distribution',
  xlabel: 'X',
  showSDLines: true, showSigLabels: true,
  showValLabels: false, showPct: false,
};

// ── Maths helpers ─────────────────────────────────────────────────────────────
const norm   = (x) => { const z = (x - S.mean) / S.sd; return Math.exp(-0.5*z*z) / (S.sd * Math.sqrt(2*Math.PI)); };
const maxY   = () => norm(S.mean);
const xMin   = () => S.mean - 4 * S.sd;
const xMax   = () => S.mean + 4 * S.sd;
const toSvgX = (d)  => pad.l + ((d - xMin()) / (xMax() - xMin())) * GW;
const toSvgY = (y)  => pad.t + GH - (y / maxY()) * GH * 0.88;
const toDataX = (px) => xMin() + ((px - pad.l) / GW) * (xMax() - xMin());
const clampX  = (px) => Math.max(pad.l, Math.min(pad.l + GW, px));

const erf = (x) => {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429*t - 1.453152027)*t) + 1.421413741)*t - 0.284496736)*t + 0.254829592) * t * Math.exp(-x*x);
  return x >= 0 ? y : -y;
};
const ncdf     = (x) => 0.5 * (1 + erf((x - S.mean) / (S.sd * Math.sqrt(2))));
const computeP = () => {
  const m = S.shadeMode, a = +S.ba, b = +S.bb;
  if (m === 'left')    return ncdf(a);
  if (m === 'right')   return 1 - ncdf(a);
  if (m === 'between') return ncdf(Math.max(a,b)) - ncdf(Math.min(a,b));
  if (m === 'outer')   return 1 - (ncdf(Math.max(a,b)) - ncdf(Math.min(a,b)));
  if (m === 'central') return ncdf(S.mean + a*S.sd) - ncdf(S.mean - a*S.sd);
  return null;
};

// ── SVG creation helper ───────────────────────────────────────────────────────
function el(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}
function txt(x, y, content, size, anchor, extra = {}) {
  const e = el('text', { x, y, 'font-size': size, 'font-family': 'Inter,Arial,sans-serif',
    'text-anchor': anchor, 'dominant-baseline': 'central', ...extra });
  e.textContent = content;
  return e;
}

// ── Build SVG skeleton (elements created once, updated on render) ──────────────
const svg = document.getElementById('nd-svg');

// Layers (appended in draw order)
const layerShade  = el('g');
const layerCurve  = el('g');
const layerAxis   = el('g');
const layerLabels = el('g');
const layerHUD    = el('g');   // p-value text
const layerHandles = el('g');  // drag handles on top
[layerShade, layerCurve, layerAxis, layerLabels, layerHUD, layerHandles].forEach(g => svg.appendChild(g));

// Static axis elements
const axisLine = el('line', { stroke: '#2b2d42', 'stroke-width': '1.8' });
const xlabelTxt = el('text', { 'font-family': 'Inter,Arial,sans-serif', 'font-size': '14',
  fill: '#444', 'font-style': 'italic', 'font-weight': '700', 'dominant-baseline': 'central' });
const titleTxt  = el('text', { 'font-family': 'Inter,Arial,sans-serif', 'font-size': '15',
  fill: '#222', 'font-weight': '700', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
layerAxis.appendChild(axisLine);
layerAxis.appendChild(xlabelTxt);
layerAxis.appendChild(titleTxt);

// Curve + shade paths
const curvePath = el('path', { fill: 'none', stroke: '#4262ff', 'stroke-width': '2.8' });
const shadePath = el('path', { fill: 'rgba(66,98,255,0.18)', stroke: 'none' });
layerCurve.appendChild(curvePath);
layerShade.appendChild(shadePath);

// HUD: p-value
const pvalTxt = el('text', { 'font-family': 'Inter,Arial,sans-serif', 'font-size': '14',
  fill: '#4262ff', 'font-weight': '700', 'text-anchor': 'end', 'dominant-baseline': 'central' });
layerHUD.appendChild(pvalTxt);

// ── Handle factory ────────────────────────────────────────────────────────────
const HS = 7;

function makeHandle(col, triUp) {
  const line = el('line', { stroke: col, 'stroke-width': '2.5', 'stroke-dasharray': '6,4' });
  const tri  = el('polygon', { fill: col });
  const hit  = el('rect', { width: 20, fill: 'transparent', cursor: 'ew-resize', style: 'touch-action:none' });
  layerHandles.appendChild(line);
  layerHandles.appendChild(tri);
  layerHandles.appendChild(hit);

  function place(svgX) {
    line.setAttribute('x1', svgX); line.setAttribute('x2', svgX);
    line.setAttribute('y1', pad.t); line.setAttribute('y2', AY);
    const ty = triUp ? pad.t + 8 : AY;
    tri.setAttribute('points', triUp
      ? `${svgX-HS},${ty} ${svgX+HS},${ty} ${svgX},${ty + HS*1.8}`
      : `${svgX-HS},${ty} ${svgX+HS},${ty} ${svgX},${ty - HS*1.8}`);
    hit.setAttribute('x', svgX - 10);
    hit.setAttribute('y', pad.t);
    hit.setAttribute('height', AY - pad.t);
  }

  function show(visible) {
    [line, tri, hit].forEach(e => e.style.display = visible ? '' : 'none');
  }

  return { place, show, hit };
}

const hMean = makeHandle('#e63946', false);   // red,   bottom triangle
const hSD   = makeHandle('#27ae60', true);    // green, top triangle
const hA    = makeHandle('#e67e22', false);   // orange, bottom
const hB    = makeHandle('#e67e22', false);   // orange, bottom

// σ label next to green handle
const sdLabelTxt = el('text', { 'font-family': 'Inter,Arial,sans-serif', 'font-size': '11',
  fill: '#27ae60', 'font-weight': '700', 'dominant-baseline': 'central' });
sdLabelTxt.textContent = 'σ';
layerHandles.appendChild(sdLabelTxt);

// ── Render: update all SVG attributes in-place ────────────────────────────────
function render() {
  const mn = xMin(), mx = xMax();
  const dx = (mx - mn) / STEPS;

  // Title
  titleTxt.setAttribute('x', VW / 2);
  titleTxt.setAttribute('y', 28);
  titleTxt.textContent = S.title;

  // Axis
  axisLine.setAttribute('x1', pad.l); axisLine.setAttribute('y1', AY);
  axisLine.setAttribute('x2', VW - pad.r); axisLine.setAttribute('y2', AY);
  xlabelTxt.setAttribute('x', VW - pad.r + 8);
  xlabelTxt.setAttribute('y', AY + 4);
  xlabelTxt.textContent = S.xlabel || 'X';

  // SD lines + ticks + labels (clear and rebuild — these are cheap)
  layerLabels.innerHTML = '';
  for (let i = -3; i <= 3; i++) {
    const xv = S.mean + i * S.sd;
    const sx = toSvgX(xv);
    if (S.showSDLines) {
      layerLabels.appendChild(el('line', {
        x1: sx, y1: pad.t, x2: sx, y2: AY,
        stroke: i === 0 ? '#e63946' : '#d0d0d0',
        'stroke-width': i === 0 ? '1.8' : '1',
        'stroke-dasharray': i === 0 ? 'none' : '5,4',
      }));
    }
    layerLabels.appendChild(el('line', { x1: sx, y1: AY, x2: sx, y2: AY + 7, stroke: '#444', 'stroke-width': '1.5' }));
    let ry = AY + 20;
    if (S.showSigLabels) {
      layerLabels.appendChild(txt(sx, ry, i === 0 ? 'μ' : `${i > 0 ? '+' : ''}${i}σ`, 12, 'middle', { fill: '#333', 'font-weight': '700' }));
      ry += 16;
    }
    if (S.showValLabels) {
      layerLabels.appendChild(txt(sx, ry, String(Math.round(xv * 100) / 100), 10, 'middle', { fill: '#888' }));
      ry += 14;
    }
    if (S.showPct && i > 0 && i <= 3) {
      const pcts = ['', '34.1%', '13.6%', '2.1%'];
      [toSvgX(S.mean + (i - 0.5) * S.sd), toSvgX(S.mean - (i - 0.5) * S.sd)].forEach(px => {
        layerLabels.appendChild(txt(px, pad.t + GH * 0.62 + i * 16, pcts[i], 11, 'middle', { fill: '#4262ff', 'font-weight': '700' }));
      });
    }
  }

  // Shade path
  const mode = S.shadeMode;
  const shade = (from, to) => {
    const sf = Math.max(from, mn), st = Math.min(to, mx);
    if (sf >= st) return '';
    const sdx = (st - sf) / 80;
    let p = `M ${toSvgX(sf)} ${toSvgY(0)}`;
    for (let x = sf; x <= st + sdx * 0.5; x += sdx) p += ` L ${toSvgX(Math.min(x,st))} ${toSvgY(norm(Math.min(x,st)))}`;
    return p + ` L ${toSvgX(st)} ${toSvgY(0)} Z`;
  };
  const a = +S.ba, b = +S.bb;
  let shd = '';
  if (mode === 'left')    shd = shade(mn, a);
  if (mode === 'right')   shd = shade(a, mx);
  if (mode === 'between') shd = shade(Math.min(a,b), Math.max(a,b));
  if (mode === 'outer')   shd = shade(mn, Math.min(a,b)) + ' ' + shade(Math.max(a,b), mx);
  if (mode === 'central') shd = shade(S.mean - a*S.sd, S.mean + a*S.sd);
  shadePath.setAttribute('d', shd);

  // Curve
  let cp = `M ${toSvgX(mn)} ${toSvgY(norm(mn))}`;
  for (let i = 1; i <= STEPS; i++) cp += ` L ${toSvgX(mn + i * dx)} ${toSvgY(norm(mn + i * dx))}`;
  curvePath.setAttribute('d', cp);

  // P-value
  const p = computeP();
  const pStr = p !== null ? `p = ${p.toFixed(4)}` : '';
  pvalTxt.textContent = pStr;
  pvalTxt.setAttribute('x', VW - pad.r - 4);
  pvalTxt.setAttribute('y', pad.t - 12);
  document.getElementById('nd-pval').textContent = pStr;

  // Handles
  hMean.place(toSvgX(S.mean));
  const sdX = toSvgX(S.mean + S.sd);
  hSD.place(sdX);
  sdLabelTxt.setAttribute('x', sdX + 12);
  sdLabelTxt.setAttribute('y', pad.t + 22);

  const hasBoundary = mode !== 'none' && mode !== 'central';
  const needsB = mode === 'between' || mode === 'outer';
  hA.show(hasBoundary); if (hasBoundary) hA.place(toSvgX(a));
  hB.show(needsB);      if (needsB)      hB.place(toSvgX(b));

  // Show/hide ba/bb inputs
  document.getElementById('nd-ba-field').style.display = hasBoundary ? '' : 'none';
  document.getElementById('nd-bb-field').style.display = needsB ? '' : 'none';
}

// ── Drag machinery ────────────────────────────────────────────────────────────
function svgClientX(ev) {
  const pt = svg.createSVGPoint();
  pt.x = ev.clientX; pt.y = ev.clientY;
  const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
  return clampX(svgP.x);
}

function drag(handle, onMove) {
  handle.hit.addEventListener('mousedown', (e) => {
    e.preventDefault(); e.stopPropagation();
    const mv = (ev) => onMove(svgClientX(ev));
    const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mouseup', up);
  });
}

// Mean drag — shift entire curve
drag(hMean, (svgX) => {
  S.mean = +(toDataX(svgX).toFixed(2));
  document.getElementById('nd-mean-num').value = S.mean;
  document.getElementById('nd-mean-sl').value  = S.mean;
  render();
});

// SD drag — handle always stays right of mean
drag(hSD, (svgX) => {
  const dist = toDataX(svgX) - S.mean;
  S.sd = Math.max(0.1, +(Math.abs(dist).toFixed(2)));
  document.getElementById('nd-sd-num').value = S.sd;
  document.getElementById('nd-sd-sl').value  = S.sd;
  render();
});

// Boundary a
drag(hA, (svgX) => {
  S.ba = +(toDataX(svgX).toFixed(2));
  document.getElementById('nd-ba-num').value = S.ba;
  render();
});

// Boundary b
drag(hB, (svgX) => {
  S.bb = +(toDataX(svgX).toFixed(2));
  document.getElementById('nd-bb-num').value = S.bb;
  render();
});

// ── Wire up panel controls ────────────────────────────────────────────────────
const syncMean = () => { S.mean = +document.getElementById('nd-mean-num').value || 0; render(); };
const syncSD   = () => { S.sd   = Math.max(0.1, +document.getElementById('nd-sd-num').value || 1); render(); };

document.getElementById('nd-mean-num').addEventListener('input', () => { document.getElementById('nd-mean-sl').value = document.getElementById('nd-mean-num').value; syncMean(); });
document.getElementById('nd-mean-sl').addEventListener('input', () => { document.getElementById('nd-mean-num').value = document.getElementById('nd-mean-sl').value; syncMean(); });
document.getElementById('nd-sd-num').addEventListener('input', () => { document.getElementById('nd-sd-sl').value = document.getElementById('nd-sd-num').value; syncSD(); });
document.getElementById('nd-sd-sl').addEventListener('input', () => { document.getElementById('nd-sd-num').value = document.getElementById('nd-sd-sl').value; syncSD(); });

document.getElementById('nd-ba-num').addEventListener('input', e => { S.ba = +e.target.value || 0; render(); });
document.getElementById('nd-bb-num').addEventListener('input', e => { S.bb = +e.target.value || 0; render(); });
document.getElementById('nd-title-inp').addEventListener('input', e => { S.title = e.target.value; render(); });

document.getElementById('nd-shade-sel').addEventListener('change', e => { S.shadeMode = e.target.value; render(); });
document.getElementById('nd-sdlines').addEventListener('change',   e => { S.showSDLines   = e.target.checked; render(); });
document.getElementById('nd-siglabels').addEventListener('change', e => { S.showSigLabels = e.target.checked; render(); });
document.getElementById('nd-vallabels').addEventListener('change', e => { S.showValLabels = e.target.checked; render(); });
document.getElementById('nd-pct').addEventListener('change',       e => { S.showPct       = e.target.checked; render(); });

// ── Place on board ────────────────────────────────────────────────────────────
document.getElementById('nd-place-btn').addEventListener('click', async () => {
  const btn = document.getElementById('nd-place-btn');
  btn.disabled = true;
  try {
    const tpl = extraTemplates['normal-distribution'];
    const staticSvg = tpl.generateSVG({
      mean: S.mean, sd: S.sd,
      title: S.title, xlabel: S.xlabel || 'X',
      showSDLines: S.showSDLines, showSDTicks: true,
      showSigLabels: S.showSigLabels, showValLabels: S.showValLabels,
      showPct: S.showPct,
      shadeMode: S.shadeMode, ba: S.ba, bb: S.bb,
      inv: false,
    });
    const dataUrl = svgToDataUrl(staticSvg);
    const vp = await miro.board.viewport.get();
    await miro.board.createImage({
      url: dataUrl,
      x: vp.x + vp.width / 2,
      y: vp.y + vp.height / 2,
      width: 600,
    });
    miro.board.ui.closeModal();
  } catch (err) {
    console.error('[nd-interactive] place failed:', err);
    await miro.board.notifications.showError('Failed to place — see console');
    btn.disabled = false;
  }
});

// ── Back button ───────────────────────────────────────────────────────────────
document.getElementById('nd-back-btn').addEventListener('click', () => {
  window.location.href = '/templates/app.html';
});

// ── Init ──────────────────────────────────────────────────────────────────────
render();
