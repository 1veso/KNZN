/* ═══════════════════════════════════════════════════════════════
   KNZN – Wunschkennzeichen  |  app.js
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── State ────────────────────────────────────────────────────────
let plateState = {
  district: 'KN',
  letters:  'AB',
  numbers:  '1234',
  type:     'standard', // 'standard' | 'H' | 'E'
  suffix:   '',         // '' | 'H' | 'E'
};

// Prices (EUR)
const PRICES = { 1: 19.90, 2: 34.90 };

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Wire up inputs
  document.getElementById('district').addEventListener('input', e => {
    plateState.district = e.target.value.toUpperCase().replace(/[^A-ZÄÖÜ]/g, '').slice(0, 3);
    e.target.value = plateState.district;
    renderAllPlates();
  });
  document.getElementById('letters').addEventListener('input', e => {
    plateState.letters = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    e.target.value = plateState.letters;
    renderAllPlates();
  });
  document.getElementById('numbers').addEventListener('input', e => {
    plateState.numbers = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    e.target.value = plateState.numbers;
    renderAllPlates();
  });

  // Quantity change updates summary price
  document.getElementById('quantity').addEventListener('change', updateSummaryTotal);

  // Initial render
  renderAllPlates();
  updateSummaryTotal();
});

// ── ISSUE 6 — setPlateType: updates type strip + suffix buttons ───
function setPlateType(type) {
  plateState.type = type;

  // Derive suffix from type
  const suffixMap = { standard: '', H: 'H', E: 'E' };
  plateState.suffix = suffixMap[type] ?? '';

  // Update plate type strip active state
  document.querySelectorAll('#plateTypeStrip .plate-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  // Keep suffix buttons in sync
  document.querySelectorAll('.suffix-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.suffix === plateState.suffix);
  });

  renderAllPlates();
}

// ── ISSUE 6 — setSuffix: updates suffix buttons + type strip ──────
function setSuffix(suffix) {
  plateState.suffix = suffix;

  // Derive type from suffix
  const typeMap = { '': 'standard', H: 'H', E: 'E' };
  plateState.type = typeMap[suffix] ?? 'standard';

  // Update suffix buttons
  document.querySelectorAll('.suffix-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.suffix === suffix);
  });

  // Keep plate type strip in sync
  document.querySelectorAll('#plateTypeStrip .plate-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === plateState.type);
  });

  renderAllPlates();
}

// ── Render all three canvases ──────────────────────────────────────
function renderAllPlates() {
  const text = buildPlateText();

  drawPlate(document.getElementById('plateCanvas'),   text, plateState.type, 520, 110);
  drawPlate(document.getElementById('heroPlate'),      text, plateState.type, 480, 102);
  drawPlate(document.getElementById('summaryPlate'),   text, plateState.type, 260, 55);
}

// Build the display text: "KN · AB 1234" (with suffix appended)
function buildPlateText() {
  const d = plateState.district || 'XX';
  const l = plateState.letters  || 'AB';
  const n = plateState.numbers  || '1234';
  const s = plateState.suffix   || '';
  return `${d} · ${l} ${n}${s}`;
}

// ── ISSUE 3 — drawPlate ───────────────────────────────────────────
/**
 * Renders a German license plate onto `canvas`.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string}  text   Formatted plate text, e.g. "KN · AB 1234"
 * @param {string}  type   'standard' | 'H' | 'E'
 * @param {number}  W      Canvas width  (520 | 480 | 260)
 * @param {number}  H      Canvas height (110 | 102 |  55)
 */
function drawPlate(canvas, text, type, W, H) {
  if (!canvas) return;
  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  // 520px is the reference (full-size) canvas width; all measurements
  // below are defined at that size and scaled proportionally.
  const scale = W / 520;

  const isE = type === 'E';
  const isH = type === 'H';

  // ── Background ───────────────────────────────────────────────────
  const bgColor = isH ? '#fffde7' : '#ffffff';
  const radius  = Math.round(4 * scale);
  roundRect(ctx, 0, 0, W, H, radius, bgColor, null, 0);

  // ── Border ───────────────────────────────────────────────────────
  const borderColor = isE ? '#006400' : '#222222';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth   = Math.max(1.5, 2 * scale);
  ctx.beginPath();
  roundedRectPath(ctx, 1, 1, W - 2, H - 2, radius);
  ctx.stroke();

  // ── EU band ──────────────────────────────────────────────────────
  const bandW    = Math.round(40 * scale);
  const bandColor = isE ? '#006400' : '#003399';

  // Band background (left side)
  roundRect(ctx, 1, 1, bandW, H - 2, radius, bandColor, null, 0);
  // Square off the right edge of the band
  ctx.fillStyle = bandColor;
  ctx.fillRect(Math.round(bandW / 2), 1, bandW - Math.round(bandW / 2), H - 2);

  // 12 EU stars in a circle
  drawEuStars(ctx, 1, 1, bandW, H - 2, scale);

  // Country letter "D"
  const dSize = Math.max(7, Math.round(11 * scale));
  ctx.font      = `bold ${dSize}px Arial, sans-serif`;
  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('D', 1 + bandW / 2, H - Math.round(4 * scale));

  // ── Main text ────────────────────────────────────────────────────
  const textX = bandW + Math.round(14 * scale);
  const textY = H - Math.round(14 * scale);

  // Calculate font size: base 52px at 520px, scale proportionally,
  // reduce further if text is long (> ~10 chars)
  const chars   = text.replace(/\s/g, '').length;
  const baseSize = Math.round(52 * scale);
  const fontSize = chars > 10 ? Math.round(baseSize * (10 / chars)) : baseSize;

  ctx.font      = `bold ${fontSize}px "FE-Schrift", "Arial Narrow", Arial, sans-serif`;
  ctx.fillStyle = isE ? '#1a5c1a' : '#111111';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, textX, textY);

  // ── TÜV sticker circles (right edge) ────────────────────────────
  drawStickers(ctx, W, H, scale);
}

// Draw 12 EU stars in a circle pattern inside the EU band
function drawEuStars(ctx, bx, by, bw, bh, scale) {
  const cx     = bx + bw / 2;
  // stars occupy upper ~75% of band height, leaving room for "D"
  const starAreaH = bh * 0.72;
  const cy     = by + starAreaH / 2;
  const radius = Math.min(bw, starAreaH) * 0.30;
  const count  = 12;
  const starR  = Math.max(1.5, 2.2 * scale); // point radius of each star

  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const sx = cx + radius * Math.cos(angle);
    const sy = cy + radius * Math.sin(angle);
    drawStar(ctx, sx, sy, starR, 5);
  }
}

// Draw a single 5-pointed star centred at (cx, cy) with outer radius r
function drawStar(ctx, cx, cy, r, points) {
  const inner = r * 0.45;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const dist  = i % 2 === 0 ? r : inner;
    const x = cx + dist * Math.cos(angle);
    const y = cy + dist * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

// TÜV / registration sticker circles on the right edge of the plate
function drawStickers(ctx, W, H, scale) {
  const r  = Math.round(18 * scale);
  const y  = H / 2;
  const x1 = W - Math.round(52 * scale);
  const x2 = W - Math.round(22 * scale);

  // Left sticker (HU – orange/red)
  ctx.beginPath();
  ctx.arc(x1, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#e65100';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.stroke();

  // Right sticker (registration year – blue)
  ctx.beginPath();
  ctx.arc(x2, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#1565c0';
  ctx.fill();
  ctx.stroke();
}

// ── Canvas helpers ────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r, fillColor, strokeColor, strokeWidth) {
  ctx.beginPath();
  roundedRectPath(ctx, x, y, w, h, r);
  if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = strokeWidth;
    ctx.stroke();
  }
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Summary total ─────────────────────────────────────────────────
function updateSummaryTotal() {
  const qty   = parseInt(document.getElementById('quantity').value, 10);
  const price = PRICES[qty] ?? 19.90;
  document.getElementById('summaryTotal').textContent =
    `Gesamt: ${price.toFixed(2).replace('.', ',')} €`;
}

// ── ISSUE 5 — Checkout ────────────────────────────────────────────
async function handleCheckout() {
  const errorEl  = document.getElementById('checkout-error');
  const btn      = document.getElementById('checkoutBtn');

  errorEl.style.display = 'none';
  errorEl.textContent   = '';
  btn.disabled = true;
  btn.textContent = 'Weiterleitung …';

  const qty      = parseInt(document.getElementById('quantity').value, 10);
  const price    = PRICES[qty] ?? 19.90;
  const plateText = buildPlateText();

  try {
    const res = await fetch('/functions/create-checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        plateText,
        type:     plateState.type,
        quantity: qty,
        price,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Server-Fehler ${res.status}`);
    }

    const { url } = await res.json();
    if (!url) throw new Error('Keine Checkout-URL erhalten.');
    window.location.href = url;

  } catch (err) {
    // ISSUE 5 — visible DOM error instead of alert()
    errorEl.textContent   = `Fehler beim Checkout: ${err.message}`;
    errorEl.style.display = 'block';
    btn.disabled    = false;
    btn.textContent = 'Jetzt bestellen →';
  }
}
