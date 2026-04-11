/**
 * Shared SVG utilities — all Miro apps.
 */

/**
 * Encode an SVG string as base64.
 * Safe UTF-8 replacement for the deprecated btoa(unescape(encodeURIComponent(str))).
 */
export function svgToBase64(svgStr) {
  const bytes = new TextEncoder().encode(svgStr);
  let binStr = '';
  for (const b of bytes) binStr += String.fromCharCode(b);
  return btoa(binStr);
}

/**
 * Convert an SVG element to an SVG data URL.
 */
export function svgToDataUrl(svgEl) {
  const str = new XMLSerializer().serializeToString(svgEl);
  return 'data:image/svg+xml;base64,' + svgToBase64(str);
}

/**
 * Render an SVG element to a PNG data URL via canvas.
 * Always revokes the intermediate blob URL (even on error).
 * Falls back to an SVG data URL if canvas rendering fails.
 *
 * @param {SVGElement} svgEl
 * @param {number} [scale=2]  Pixel density multiplier (2 = retina quality)
 * @returns {Promise<string>}
 */
export function svgToPngDataUrl(svgEl, scale = 2) {
  const str = new XMLSerializer().serializeToString(svgEl);
  const w = Math.round(parseFloat(svgEl.getAttribute('width')) || 600);
  const h = Math.round(parseFloat(svgEl.getAttribute('height')) || 600);
  const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;

    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      console.warn('[svg-utils] Canvas render failed, falling back to SVG data URL');
      resolve('data:image/svg+xml;base64,' + svgToBase64(str));
    };
    img.src = blobUrl;
  });
}
