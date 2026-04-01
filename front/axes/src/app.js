/* ── Graph Axes Generator ─────────────────────────── */

const SVG_NS = 'http://www.w3.org/2000/svg';

// ── DOM references ──────────────────────────────────

const $ = (id) => document.getElementById(id);

const els = {
  xMin:            $('x-min'),
  xMax:            $('x-max'),
  yMin:            $('y-min'),
  yMax:            $('y-max'),
  squareScale:     $('square-scale'),
  arrowHeads:      $('arrow-heads'),
  axisThickness:   $('axis-thickness'),
  axisThicknessVal:$('axis-thickness-val'),
  axisColour:      $('axis-colour'),
  axisColourDot:   $('axis-colour-dot'),
  majorGrid:       $('major-grid'),
  majorGridColour: $('major-grid-colour'),
  majorGridColourDot: $('major-grid-colour-dot'),
  majorGridStyle:  $('major-grid-style'),
  minorGrid:       $('minor-grid'),
  minorGridColour: $('minor-grid-colour'),
  minorGridColourDot: $('minor-grid-colour-dot'),
  minorGridStyle:  $('minor-grid-style'),
  minorSubdiv:     $('minor-subdivisions'),
  xStep:           $('x-step'),
  yStep:           $('y-step'),
  showNumbers:     $('show-numbers'),
  fontSize:        $('font-size'),
  fontSizeVal:     $('font-size-val'),
  showOrigin:      $('show-origin'),
  piLabels:        $('pi-labels'),
  piInterval:      $('pi-interval'),
  titleText:       $('title-text'),
  xLabel:          $('x-label'),
  yLabel:          $('y-label'),
  preview:         $('preview-area'),
  placeBtn:        $('place-btn'),
  editBtn:         $('edit-selected-btn'),
  imgSize:         $('img-size'),
  sizeValue:       $('size-value'),
};

// ── Presets ─────────────────────────────────────────

const PRESETS = {
  standard: {
    xMin: -10, xMax: 10, yMin: -10, yMax: 10,
    quadrants: '4', xStep: 1, yStep: 1,
    majorGrid: true, minorGrid: false,
    majorGridStyle: 'solid', minorGridStyle: 'solid',
    majorGridColour: '#cccccc', minorGridColour: '#e8e8e8',
    arrowHeads: true, axisThickness: 2, axisColour: '#000000',
    showNumbers: true, fontSize: 11, showOrigin: true,
    squareScale: false, minorSubdiv: 5,
    piLabels: false, piInterval: '1',
    titleText: '', xLabel: '', yLabel: '',
  },
  positive: {
    xMin: 0, xMax: 10, yMin: 0, yMax: 10,
    quadrants: '1', xStep: 1, yStep: 1,
    majorGrid: true, minorGrid: false,
    majorGridStyle: 'solid', minorGridStyle: 'solid',
    majorGridColour: '#cccccc', minorGridColour: '#e8e8e8',
    arrowHeads: true, axisThickness: 2, axisColour: '#000000',
    showNumbers: true, fontSize: 11, showOrigin: true,
    squareScale: false, minorSubdiv: 5,
    piLabels: false, piInterval: '1',
    titleText: '', xLabel: '', yLabel: '',
  },
  numberline: {
    xMin: -10, xMax: 10, yMin: 0, yMax: 0,
    quadrants: '4', xStep: 1, yStep: 1,
    majorGrid: false, minorGrid: false,
    majorGridStyle: 'solid', minorGridStyle: 'solid',
    majorGridColour: '#cccccc', minorGridColour: '#e8e8e8',
    arrowHeads: true, axisThickness: 2, axisColour: '#000000',
    showNumbers: true, fontSize: 11, showOrigin: true,
    squareScale: false, minorSubdiv: 5,
    piLabels: false, piInterval: '1',
    titleText: '', xLabel: '', yLabel: '',
  },
  trig: {
    xMin: -6.2832, xMax: 6.2832, yMin: -2, yMax: 2,
    quadrants: '4', xStep: 1.5708, yStep: 1,
    majorGrid: true, minorGrid: false,
    majorGridStyle: 'dashed', minorGridStyle: 'solid',
    majorGridColour: '#cccccc', minorGridColour: '#e8e8e8',
    arrowHeads: true, axisThickness: 2, axisColour: '#000000',
    showNumbers: true, fontSize: 11, showOrigin: true,
    squareScale: false, minorSubdiv: 4,
    piLabels: true, piInterval: '2',
    titleText: '', xLabel: '', yLabel: '',
  },
  stats: {
    xMin: 0, xMax: 20, yMin: 0, yMax: 100,
    quadrants: '1', xStep: 2, yStep: 10,
    majorGrid: true, minorGrid: false,
    majorGridStyle: 'solid', minorGridStyle: 'solid',
    majorGridColour: '#cccccc', minorGridColour: '#e8e8e8',
    arrowHeads: true, axisThickness: 2, axisColour: '#000000',
    showNumbers: true, fontSize: 11, showOrigin: true,
    squareScale: false, minorSubdiv: 5,
    piLabels: false, piInterval: '1',
    titleText: '', xLabel: '', yLabel: '',
  },
  graphpaper: {
    xMin: -10, xMax: 10, yMin: -10, yMax: 10,
    quadrants: '4', xStep: 1, yStep: 1,
    majorGrid: true, minorGrid: true,
    majorGridStyle: 'solid', minorGridStyle: 'solid',
    majorGridColour: '#aaccee', minorGridColour: '#ddeeff',
    arrowHeads: false, axisThickness: 2, axisColour: '#000000',
    showNumbers: true, fontSize: 11, showOrigin: true,
    squareScale: true, minorSubdiv: 5,
    piLabels: false, piInterval: '1',
    titleText: '', xLabel: '', yLabel: '',
  },
};

// ── Read settings from controls ─────────────────────

function readSettings() {
  const quadrantRadio = document.querySelector('input[name="quadrants"]:checked');
  return {
    xMin:             parseFloat(els.xMin.value) || -10,
    xMax:             parseFloat(els.xMax.value) || 10,
    yMin:             parseFloat(els.yMin.value) || -10,
    yMax:             parseFloat(els.yMax.value) || 10,
    squareScale:      els.squareScale.checked,
    quadrants:        quadrantRadio ? quadrantRadio.value : '4',
    arrowHeads:       els.arrowHeads.checked,
    axisThickness:    parseFloat(els.axisThickness.value) || 2,
    axisColour:       els.axisColour.value,
    majorGrid:        els.majorGrid.checked,
    majorGridColour:  els.majorGridColour.value,
    majorGridStyle:   els.majorGridStyle.value,
    minorGrid:        els.minorGrid.checked,
    minorGridColour:  els.minorGridColour.value,
    minorGridStyle:   els.minorGridStyle.value,
    minorSubdiv:      parseInt(els.minorSubdiv.value, 10) || 5,
    xStep:            parseFloat(els.xStep.value) || 1,
    yStep:            parseFloat(els.yStep.value) || 1,
    showNumbers:      els.showNumbers.checked,
    fontSize:         parseInt(els.fontSize.value, 10) || 11,
    showOrigin:       els.showOrigin.checked,
    piLabels:         els.piLabels.checked,
    piInterval:       els.piInterval.value,
    titleText:        els.titleText.value,
    xLabel:           els.xLabel.value,
    yLabel:           els.yLabel.value,
  };
}

// ── Apply settings to controls ──────────────────────

function applySettings(s) {
  els.xMin.value          = s.xMin;
  els.xMax.value          = s.xMax;
  els.yMin.value          = s.yMin;
  els.yMax.value          = s.yMax;
  els.squareScale.checked = s.squareScale;
  els.arrowHeads.checked  = s.arrowHeads;
  els.axisThickness.value = s.axisThickness;
  els.axisThicknessVal.textContent = s.axisThickness;
  els.axisColour.value    = s.axisColour;
  els.axisColourDot.style.background = s.axisColour;
  els.majorGrid.checked   = s.majorGrid;
  els.majorGridColour.value = s.majorGridColour;
  els.majorGridColourDot.style.background = s.majorGridColour;
  els.majorGridStyle.value = s.majorGridStyle;
  els.minorGrid.checked   = s.minorGrid;
  els.minorGridColour.value = s.minorGridColour;
  els.minorGridColourDot.style.background = s.minorGridColour;
  els.minorGridStyle.value = s.minorGridStyle;
  els.minorSubdiv.value   = s.minorSubdiv;
  els.xStep.value         = s.xStep;
  els.yStep.value         = s.yStep;
  els.showNumbers.checked = s.showNumbers;
  els.fontSize.value      = s.fontSize;
  els.fontSizeVal.textContent = s.fontSize;
  els.showOrigin.checked  = s.showOrigin;
  els.piLabels.checked    = s.piLabels || false;
  els.piInterval.value    = s.piInterval || '1';
  els.titleText.value     = s.titleText || '';
  els.xLabel.value        = s.xLabel || '';
  els.yLabel.value        = s.yLabel || '';

  const radio = document.querySelector(`input[name="quadrants"][value="${s.quadrants}"]`);
  if (radio) radio.checked = true;
}

// ── SVG helpers ─────────────────────────────────────

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

function dashArray(style) {
  if (style === 'dashed') return '6,3';
  if (style === 'dotted') return '2,3';
  return 'none';
}

function formatNum(val, step, piLabels) {
  if (piLabels) {
    return formatPi(val);
  }
  const stepStr = String(step);
  const dot = stepStr.indexOf('.');
  const decimals = dot >= 0 ? stepStr.length - dot - 1 : 0;
  const rounded = Math.round(val * 1e12) / 1e12;
  return decimals > 0 ? rounded.toFixed(decimals) : String(Math.round(rounded));
}

function formatPi(val) {
  const PI = Math.PI;
  const ratio = val / PI;
  const rounded = Math.round(ratio * 12) / 12; // precision to 12ths of pi
  if (Math.abs(rounded) < 0.001) return '0';
  if (Math.abs(rounded - 1) < 0.001) return 'π';
  if (Math.abs(rounded + 1) < 0.001) return '-π';
  // Check simple fractions
  const fracs = [
    [1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6],
    [5, 4], [4, 3], [3, 2], [5, 3], [7, 4], [11, 6],
    [2, 1], [3, 1], [4, 1],
  ];
  for (const [n, d] of fracs) {
    if (Math.abs(Math.abs(rounded) - n / d) < 0.001) {
      const sign = rounded < 0 ? '-' : '';
      if (d === 1) return n === 1 ? sign + 'π' : sign + n + 'π';
      return sign + (n === 1 ? '' : n) + 'π/' + d;
    }
  }
  return val.toFixed(2);
}

// ── Generate SVG ────────────────────────────────────

function generateAxesSVG() {
  const s = readSettings();

  // Validate
  if (s.xMin >= s.xMax) s.xMax = s.xMin + 1;
  if (s.yMin >= s.yMax && !(s.yMin === 0 && s.yMax === 0)) s.yMax = s.yMin + 1;

  const isNumberLine = (s.yMin === 0 && s.yMax === 0);

  // Padding for labels/numbers
  const padLeft   = 44;
  const padRight  = 24;
  const padTop    = s.titleText ? 32 : 20;
  const padBottom = 34;

  // Canvas dimensions
  const canvasW = 600;
  let canvasH = isNumberLine ? 80 : 600;

  // Math range
  const mathW = s.xMax - s.xMin;
  const mathH = isNumberLine ? 1 : (s.yMax - s.yMin);

  // Plot area
  let plotW = canvasW - padLeft - padRight;
  let plotH = canvasH - padTop - padBottom;

  // Square scale: adjust aspect ratio
  if (s.squareScale && !isNumberLine) {
    const aspect = mathW / mathH;
    if (aspect > plotW / plotH) {
      plotH = plotW / aspect;
    } else {
      plotW = plotH * aspect;
    }
    canvasH = plotH + padTop + padBottom;
  }

  // Mapping functions: math coords -> SVG coords
  const scaleX = plotW / mathW;
  const scaleY = isNumberLine ? 1 : (plotH / mathH);

  function mapX(mx) { return padLeft + (mx - s.xMin) * scaleX; }
  function mapY(my) {
    if (isNumberLine) return padTop + plotH / 2;
    return padTop + (s.yMax - my) * scaleY; // y flipped
  }

  const svg = svgEl('svg', {
    xmlns: SVG_NS,
    viewBox: `0 0 ${canvasW} ${canvasH}`,
    width: canvasW,
    height: canvasH,
  });

  // Background
  svg.appendChild(svgEl('rect', {
    x: 0, y: 0, width: canvasW, height: canvasH,
    fill: '#ffffff',
  }));

  // Clip path for grid/ticks inside plot area
  const defs = svgEl('defs', {});
  const clipPath = svgEl('clipPath', { id: 'plot-clip' });
  clipPath.appendChild(svgEl('rect', {
    x: padLeft, y: padTop, width: plotW, height: plotH,
  }));
  defs.appendChild(clipPath);

  // Arrow head marker
  if (s.arrowHeads) {
    const marker = svgEl('marker', {
      id: 'arrowhead',
      markerWidth: '8', markerHeight: '6',
      refX: '8', refY: '3',
      orient: 'auto',
    });
    marker.appendChild(svgEl('polygon', {
      points: '0 0, 8 3, 0 6',
      fill: s.axisColour,
    }));
    defs.appendChild(marker);
  }

  svg.appendChild(defs);

  // Grid group (clipped)
  const gridGroup = svgEl('g', { 'clip-path': 'url(#plot-clip)' });

  // ── Minor grid ────────────────────────────────
  if (s.minorGrid && !isNumberLine) {
    const minorXStep = s.xStep / s.minorSubdiv;
    const minorYStep = s.yStep / s.minorSubdiv;
    const da = dashArray(s.minorGridStyle);
    const attrs = {
      stroke: s.minorGridColour,
      'stroke-width': '0.5',
    };
    if (da !== 'none') attrs['stroke-dasharray'] = da;

    // Vertical minor lines
    let x = Math.ceil(s.xMin / minorXStep) * minorXStep;
    for (; x <= s.xMax; x += minorXStep) {
      gridGroup.appendChild(svgEl('line', {
        x1: mapX(x), y1: mapY(s.yMax), x2: mapX(x), y2: mapY(s.yMin),
        ...attrs,
      }));
    }

    // Horizontal minor lines
    let y = Math.ceil(s.yMin / minorYStep) * minorYStep;
    for (; y <= s.yMax; y += minorYStep) {
      gridGroup.appendChild(svgEl('line', {
        x1: mapX(s.xMin), y1: mapY(y), x2: mapX(s.xMax), y2: mapY(y),
        ...attrs,
      }));
    }
  }

  // ── Major grid ────────────────────────────────
  if (s.majorGrid && !isNumberLine) {
    const da = dashArray(s.majorGridStyle);
    const attrs = {
      stroke: s.majorGridColour,
      'stroke-width': '0.8',
    };
    if (da !== 'none') attrs['stroke-dasharray'] = da;

    // Vertical major lines
    let x = Math.ceil(s.xMin / s.xStep) * s.xStep;
    for (; x <= s.xMax + s.xStep * 0.01; x += s.xStep) {
      gridGroup.appendChild(svgEl('line', {
        x1: mapX(x), y1: mapY(s.yMax), x2: mapX(x), y2: mapY(s.yMin),
        ...attrs,
      }));
    }

    // Horizontal major lines
    let y = Math.ceil(s.yMin / s.yStep) * s.yStep;
    for (; y <= s.yMax + s.yStep * 0.01; y += s.yStep) {
      gridGroup.appendChild(svgEl('line', {
        x1: mapX(s.xMin), y1: mapY(y), x2: mapX(s.xMax), y2: mapY(y),
        ...attrs,
      }));
    }
  }

  svg.appendChild(gridGroup);

  // ── Axes ──────────────────────────────────────

  const axisAttrs = {
    stroke: s.axisColour,
    'stroke-width': s.axisThickness,
    'stroke-linecap': 'round',
  };

  // Determine axis positions
  // Origin position in math coords, clamped to the visible window
  const originX = Math.max(s.xMin, Math.min(s.xMax, 0));
  const originY = isNumberLine ? 0 : Math.max(s.yMin, Math.min(s.yMax, 0));

  // X axis (horizontal)
  const xAxisLine = svgEl('line', {
    x1: mapX(s.xMin), y1: mapY(originY),
    x2: mapX(s.xMax), y2: mapY(originY),
    ...axisAttrs,
  });
  if (s.arrowHeads) xAxisLine.setAttribute('marker-end', 'url(#arrowhead)');
  svg.appendChild(xAxisLine);

  // Y axis (vertical) -- skip for number line
  if (!isNumberLine) {
    const yAxisLine = svgEl('line', {
      x1: mapX(originX), y1: mapY(s.yMin),
      x2: mapX(originX), y2: mapY(s.yMax),
      ...axisAttrs,
    });
    if (s.arrowHeads) yAxisLine.setAttribute('marker-end', 'url(#arrowhead)');
    svg.appendChild(yAxisLine);
  }

  // ── Tick marks & numbers ──────────────────────

  const tickLen = 5;
  const tickAttrs = {
    stroke: s.axisColour,
    'stroke-width': Math.max(1, s.axisThickness * 0.6),
  };

  const textStyle = {
    'font-family': 'Inter, Arial, sans-serif',
    'font-size': s.fontSize,
    fill: s.axisColour,
    'text-anchor': 'middle',
  };

  // X axis ticks
  {
    let x = Math.ceil(s.xMin / s.xStep) * s.xStep;
    for (; x <= s.xMax + s.xStep * 0.01; x += s.xStep) {
      const nearZero = Math.abs(x) < s.xStep * 0.001;
      const sx = mapX(x);
      const sy = mapY(originY);

      // Tick mark
      svg.appendChild(svgEl('line', {
        x1: sx, y1: sy - tickLen, x2: sx, y2: sy + tickLen,
        ...tickAttrs,
      }));

      // Number label
      if (s.showNumbers) {
        if (nearZero && !s.showOrigin) continue;
        if (nearZero && !isNumberLine) continue; // origin drawn separately for 2D
        const txt = svgEl('text', {
          x: sx, y: sy + tickLen + s.fontSize + 2,
          ...textStyle,
        });
        txt.textContent = formatNum(x, s.xStep, s.piLabels);
        svg.appendChild(txt);
      }
    }
  }

  // Y axis ticks (skip for number line)
  if (!isNumberLine) {
    let y = Math.ceil(s.yMin / s.yStep) * s.yStep;
    for (; y <= s.yMax + s.yStep * 0.01; y += s.yStep) {
      const nearZero = Math.abs(y) < s.yStep * 0.001;
      const sx = mapX(originX);
      const sy = mapY(y);

      // Tick mark
      svg.appendChild(svgEl('line', {
        x1: sx - tickLen, y1: sy, x2: sx + tickLen, y2: sy,
        ...tickAttrs,
      }));

      // Number label
      if (s.showNumbers) {
        if (nearZero && !s.showOrigin) continue;
        if (nearZero) continue; // origin drawn below
        const txt = svgEl('text', {
          x: sx - tickLen - 4, y: sy + s.fontSize * 0.35,
          ...textStyle,
          'text-anchor': 'end',
        });
        txt.textContent = formatNum(y, s.yStep, false);
        svg.appendChild(txt);
      }
    }
  }

  // Origin label
  if (s.showNumbers && s.showOrigin && !isNumberLine) {
    const ox = mapX(originX);
    const oy = mapY(originY);
    const txt = svgEl('text', {
      x: ox - tickLen - 4, y: oy + tickLen + s.fontSize + 2,
      ...textStyle,
      'text-anchor': 'end',
    });
    txt.textContent = '0';
    svg.appendChild(txt);
  }

  // ── Axis labels ───────────────────────────────

  if (s.xLabel) {
    const lbl = svgEl('text', {
      x: mapX(s.xMax) + 10, y: mapY(originY) + 4,
      'font-family': 'Inter, Arial, sans-serif',
      'font-size': s.fontSize + 1,
      'font-style': 'italic',
      fill: s.axisColour,
      'text-anchor': 'start',
    });
    lbl.textContent = s.xLabel;
    svg.appendChild(lbl);
  }

  if (s.yLabel && !isNumberLine) {
    const lbl = svgEl('text', {
      x: mapX(originX) + 4, y: mapY(s.yMax) - 8,
      'font-family': 'Inter, Arial, sans-serif',
      'font-size': s.fontSize + 1,
      'font-style': 'italic',
      fill: s.axisColour,
      'text-anchor': 'start',
    });
    lbl.textContent = s.yLabel;
    svg.appendChild(lbl);
  }

  // ── Title ─────────────────────────────────────

  if (s.titleText) {
    const titleEl = svgEl('text', {
      x: canvasW / 2, y: 16,
      'font-family': 'Inter, Arial, sans-serif',
      'font-size': s.fontSize + 3,
      'font-weight': '600',
      fill: '#333',
      'text-anchor': 'middle',
    });
    titleEl.textContent = s.titleText;
    svg.appendChild(titleEl);
  }

  return svg;
}

// ── Preview update ──────────────────────────────────

let debounceTimer = null;

function updatePreview() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    els.preview.innerHTML = '';
    els.preview.appendChild(generateAxesSVG());
  }, 100);
}

function updatePreviewImmediate() {
  els.preview.innerHTML = '';
  els.preview.appendChild(generateAxesSVG());
}

// ── Place on board ──────────────────────────────────

async function placeOnBoard() {
  const svg = generateAxesSVG();
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svg);
  const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));

  const size = parseInt(els.imgSize.value, 10) || 500;
  const settings = readSettings();

  // Store settings in title as JSON so Edit Selected can recover them
  const titleJson = JSON.stringify({ _axesGen: true, ...settings });

  const vp = await miro.board.viewport.get();
  await miro.board.createImage({
    url: dataUrl,
    x: vp.x + vp.width / 2,
    y: vp.y + vp.height / 2,
    width: size,
    title: titleJson,
  });

  miro.board.ui.closeModal();
}

// ── Edit selected ───────────────────────────────────

async function editSelected() {
  const selection = await miro.board.getSelection();
  const images = selection.filter((item) => item.type === 'image');
  if (images.length === 0) {
    await miro.board.notifications.showInfo('Select an axes image first.');
    return;
  }

  const img = images[0];
  let settings;
  try {
    settings = JSON.parse(img.title);
    if (!settings._axesGen) throw new Error('Not an axes image');
  } catch {
    await miro.board.notifications.showInfo('Selected image was not created by Axes Generator.');
    return;
  }

  delete settings._axesGen;
  applySettings(settings);
  updatePreviewImmediate();
}

// ── Presets ─────────────────────────────────────────

function initPresets() {
  const chips = document.querySelectorAll('.preset-chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const preset = PRESETS[chip.dataset.preset];
      if (preset) {
        applySettings(preset);
        updatePreviewImmediate();
      }
    });
  });
}

// ── Colour swatch sync ─────────────────────────────

function syncSwatchDot(input, dot) {
  input.addEventListener('input', () => {
    dot.style.background = input.value;
  });
}

// ── Wire up events ──────────────────────────────────

function init() {
  // Presets
  initPresets();

  // Place & edit buttons
  els.placeBtn.addEventListener('click', placeOnBoard);
  els.editBtn.addEventListener('click', editSelected);

  // Size slider value display
  els.imgSize.addEventListener('input', () => {
    els.sizeValue.textContent = els.imgSize.value;
  });

  // Range slider value displays
  els.axisThickness.addEventListener('input', () => {
    els.axisThicknessVal.textContent = els.axisThickness.value;
  });
  els.fontSize.addEventListener('input', () => {
    els.fontSizeVal.textContent = els.fontSize.value;
  });

  // Pi interval → auto-set xStep
  els.piInterval.addEventListener('change', () => {
    if (els.piLabels.checked) {
      const div = parseInt(els.piInterval.value, 10) || 1;
      els.xStep.value = (Math.PI / div).toFixed(4);
      updatePreviewImmediate();
    }
  });
  els.piLabels.addEventListener('change', () => {
    if (els.piLabels.checked) {
      const div = parseInt(els.piInterval.value, 10) || 1;
      els.xStep.value = (Math.PI / div).toFixed(4);
      els.xMin.value = (-2 * Math.PI).toFixed(4);
      els.xMax.value = (2 * Math.PI).toFixed(4);
      updatePreviewImmediate();
    }
  });

  // Colour swatch dots
  syncSwatchDot(els.axisColour, els.axisColourDot);
  syncSwatchDot(els.majorGridColour, els.majorGridColourDot);
  syncSwatchDot(els.minorGridColour, els.minorGridColourDot);

  // Listen to all inputs for live preview
  const allInputs = document.querySelectorAll(
    'input[type="number"], input[type="text"], input[type="range"], ' +
    'input[type="checkbox"], input[type="color"], input[type="radio"], select'
  );
  allInputs.forEach((el) => {
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
  });

  // Initial render
  updatePreviewImmediate();
}

init();
