/* ─── STATE ─── */
const state = {
    ort: 'DÜ',
    buchstaben: 'AB',
    ziffern: '1234',
    suffix: '',
    size: 'standard',
    material: 'standard',
    addons: { zulassung: false, plakette: false, versand: false }
};

const PRICES = {
    standard: 10,
    carbon: 20,
    zulassung: 20,
    plakette: 5,
    versand: 5
};

/* ─── PLATE RENDERING ─── */
function drawPlate(canvasId, ort, buchstaben, ziffern, suffix, material, width, height) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const scale = W / 520;

    ctx.clearRect(0, 0, W, H);

    const isCarbon = material === 'carbon';

    // Background
    if (isCarbon) {
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 10; patternCanvas.height = 10;
        const pCtx = patternCanvas.getContext('2d');
        pCtx.fillStyle = '#2a2a2a';
        pCtx.fillRect(0, 0, 10, 10);
        pCtx.fillStyle = '#333';
        pCtx.fillRect(0, 0, 5, 5);
        pCtx.fillRect(5, 5, 5, 5);
        const pattern = ctx.createPattern(patternCanvas, 'repeat');
        ctx.fillStyle = pattern;
    } else {
        ctx.fillStyle = '#FFFFFF';
    }
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 6 * scale);
    ctx.fill();

    // Border
    ctx.strokeStyle = isCarbon ? '#555' : '#999999';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.roundRect(1 * scale, 1 * scale, W - 2 * scale, H - 2 * scale, 5 * scale);
    ctx.stroke();

    // EU strip (blue band left)
    const stripW = 38 * scale;
    ctx.fillStyle = '#003399';
    ctx.beginPath();
    ctx.roundRect(2 * scale, 2 * scale, stripW, H - 4 * scale, [4 * scale, 0, 0, 4 * scale]);
    ctx.fill();

    // Stars on EU strip
    const starCenterX = 2 * scale + stripW / 2;
    const starAreaTop = 8 * scale;
    const starAreaH = (H - 16 * scale) * 0.55;
    const starRadius = 2.5 * scale;
    const numStars = 12;
    for (let i = 0; i < numStars; i++) {
        const angle = (i / numStars) * Math.PI * 2 - Math.PI / 2;
        const r = starAreaH / 2;
        const sx = starCenterX + Math.cos(angle) * r * 0.5;
        const sy = starAreaTop + starAreaH / 2 + Math.sin(angle) * r * 0.5;
        drawStar(ctx, sx, sy, starRadius, '#FFD700');
    }

    // D letter on EU strip
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${11 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('D', starCenterX, H - 10 * scale);

    // Plate text
    const textColor = isCarbon ? '#e8e8e8' : '#000000';
    const plateText = buildPlateText(ort, buchstaben, ziffern, suffix);
    const textX = stripW + 8 * scale + (W - stripW - 10 * scale) / 2;
    const textY = H / 2 + 18 * scale;

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';

    // Font size scales with text length
    const textLen = plateText.replace(' ', '').length;
    const fontSize = textLen <= 7 ? 52 * scale : textLen <= 9 ? 46 * scale : 40 * scale;
    ctx.font = `bold ${fontSize}px 'Arial Black', 'Arial', sans-serif`;
    ctx.letterSpacing = `${3 * scale}px`;
    ctx.fillText(plateText, textX, textY);

    // Dot separator (between buchstaben and ziffern)
    if (buchstaben && ziffern) {
        // rendered inline in text
    }
}

function drawStar(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const innerAngle = outerAngle + (2 * Math.PI) / 10;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(outerAngle), cy + r * Math.sin(outerAngle));
        else ctx.lineTo(cx + r * Math.cos(outerAngle), cy + r * Math.sin(outerAngle));
        ctx.lineTo(cx + (r * 0.4) * Math.cos(innerAngle), cy + (r * 0.4) * Math.sin(innerAngle));
    }
    ctx.closePath();
    ctx.fill();
}

function buildPlateText(ort, buchstaben, ziffern, suffix) {
    const o = (ort || '').toUpperCase().trim();
    const b = (buchstaben || '').toUpperCase().trim();
    const z = (ziffern || '').trim();
    const s = (suffix || '').toUpperCase().trim();
    if (!o && !b && !z) return 'DÜ · AB 1234';
    let text = o;
    if (b || z) text += ' · ';
    if (b) text += b + ' ';
    if (z) text += z;
    if (s) text += ' ' + s;
    return text;
}

function renderAllPlates() {
    const { ort, buchstaben, ziffern, suffix, material } = state;
    drawPlate('plateCanvas', ort, buchstaben, ziffern, suffix, material, 520, 110);
    drawPlate('heroPlate', ort, buchstaben, ziffern, suffix, material, 520, 110);
    drawPlate('summaryPlate', ort, buchstaben, ziffern, suffix, material, 320, 68);
}

/* ─── INPUT HANDLERS ─── */
function updatePlate() {
    state.ort = document.getElementById('ort').value;
    state.buchstaben = document.getElementById('buchstaben').value;
    state.ziffern = document.getElementById('ziffern').value;
    validatePlate();
    renderAllPlates();
    updateSummary();
}

function validatePlate() {
    const ort = state.ort.trim();
    const b = state.buchstaben.trim();
    const z = state.ziffern.trim();
    const el = document.getElementById('plateValidation');

    if (!ort && !b && !z) { el.textContent = ''; el.className = 'plate-validation'; return; }

    const ortValid = /^[A-ZÄÖÜ]{1,3}$/.test(ort.toUpperCase());
    const bValid = /^[A-Z]{1,2}$/.test(b.toUpperCase());
    const zValid = /^[0-9]{1,4}$/.test(z);

    if (ortValid && bValid && zValid) {
        el.textContent = '✓ Gültiges Kennzeichenformat';
        el.className = 'plate-validation valid';
    } else {
        const issues = [];
        if (!ortValid && ort) issues.push('Ortskenzeichen (1–3 Buchstaben)');
        if (!bValid && b) issues.push('Buchstaben (1–2 Buchstaben)');
        if (!zValid && z) issues.push('Ziffern (1–4 Ziffern)');
        if (issues.length) {
            el.textContent = '⚠ Prüfen Sie: ' + issues.join(', ');
            el.className = 'plate-validation invalid';
        } else {
            el.textContent = '';
            el.className = 'plate-validation';
        }
    }
}

function setSuffix(val) {
    state.suffix = val;
    document.querySelectorAll('.suffix-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderAllPlates();
}

function setSize(val) {
    state.size = val;
    document.getElementById('sizeStd').classList.toggle('active', val === 'standard');
    document.getElementById('sizeKlein').classList.toggle('active', val === 'klein');
}

function setMaterial(val) {
    state.material = val;
    document.getElementById('matStd').classList.toggle('active', val === 'standard');
    document.getElementById('matCarbon').classList.toggle('active', val === 'carbon');
    renderAllPlates();
    updatePrice();
    updateSummary();
}

/* ─── PRICING ─── */
function updatePrice() {
    const chkZ = document.getElementById('chkZulassung');
    const chkP = document.getElementById('chkPlakette');
    const chkV = document.getElementById('chkVersand');

    state.addons.zulassung = chkZ.checked;
    state.addons.plakette = chkP.checked;
    state.addons.versand = chkV.checked;

    // Toggle addon card styles
    document.getElementById('addonZulassung').classList.toggle('checked', chkZ.checked);
    document.getElementById('addonPlakette').classList.toggle('checked', chkP.checked);
    document.getElementById('addonVersand').classList.toggle('checked', chkV.checked);

    // Show Fahrzeugschein upload if Zulassung selected
    document.getElementById('fahrzeugscheinField').style.display = chkZ.checked ? 'flex' : 'none';

    // Komplettpaket banner
    const isKomplett = chkZ.checked && chkP.checked;
    const banner = document.getElementById('paketBanner');
    banner.classList.toggle('visible', isKomplett);

    updateSummary();
}

function calcTotal() {
    let total = PRICES[state.material];
    if (state.addons.zulassung) total += PRICES.zulassung;
    if (state.addons.plakette) total += PRICES.plakette;
    if (state.addons.versand) total += PRICES.versand;
    return total;
}

function updateSummary() {
    const lines = [];
    lines.push({ name: `2 Kennzeichen (${state.material === 'carbon' ? 'Carbon' : 'Standard'})`, price: PRICES[state.material] });
    if (state.addons.zulassung) lines.push({ name: 'KFZ Zulassung', price: PRICES.zulassung });
    if (state.addons.plakette) lines.push({ name: 'Umweltplakette', price: PRICES.plakette });
    if (state.addons.versand) lines.push({ name: 'DHL Versand', price: PRICES.versand });

    const container = document.getElementById('summaryLines');
    container.innerHTML = lines.map(l =>
        `<div class="summary-line"><span class="line-name">${l.name}</span><span class="line-price">€${l.price}</span></div>`
    ).join('');

    document.getElementById('totalPrice').textContent = `€${calcTotal()}`;
}

/* ─── CHECKOUT ─── */
async function handleCheckout() {
    // Validate form
    const name = document.getElementById('buyerName').value.trim();
    const email = document.getElementById('buyerEmail').value.trim();
    const phone = document.getElementById('buyerPhone').value.trim();
    const street = document.getElementById('buyerStreet').value.trim();
    const plz = document.getElementById('buyerPLZ').value.trim();
    const city = document.getElementById('buyerCity').value.trim();
    const privacy = document.getElementById('privacyCheck').checked;

    if (!name || !email || !phone || !street || !plz || !city) {
        alert('Bitte füllen Sie alle Pflichtfelder aus.');
        return;
    }
    if (!privacy) {
        alert('Bitte bestätigen Sie die Datenschutzerklärung.');
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        return;
    }

    // Validate plate
    const ort = state.ort.trim();
    const b = state.buchstaben.trim();
    const z = state.ziffern.trim();
    if (!ort || !b || !z) {
        alert('Bitte konfigurieren Sie zuerst Ihr Kennzeichen.');
        document.getElementById('configurator').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    const btn = document.getElementById('checkoutBtn');
    const btnText = document.getElementById('checkoutBtnText');
    btn.disabled = true;
    btnText.textContent = 'Wird verarbeitet...';

    try {
        const payload = {
            plateText: buildPlateText(ort, b, z, state.suffix),
            plateFormat: `${state.size}_${state.material}`,
            material: state.material,
            size: state.size,
            addons: state.addons,
            totalAmount: calcTotal(),
            buyerName: name,
            buyerEmail: email,
            buyerPhone: phone,
            buyerAddress: `${street}, ${plz} ${city}`
        };

        const res = await fetch('/functions/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Checkout fehlgeschlagen');
        }

        const { url } = await res.json();
        window.location.href = url;

    } catch (err) {
        console.error('Checkout error:', err);
        alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns per WhatsApp.');
        btn.disabled = false;
        btnText.textContent = 'Jetzt kostenpflichtig bestellen';
    }
}

/* ─── FILE UPLOAD ─── */
function handleFileUpload(input) {
    if (input.files && input.files[0]) {
        document.getElementById('fileText').textContent = input.files[0].name;
    }
}

/* ─── FAQ ACCORDION ─── */
function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });
}

/* ─── SCROLL REVEAL ─── */
function initReveal() {
    const els = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('reveal', 'visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.08 });
    els.forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

/* ─── SUCCESS PAGE HANDLING ─── */
function checkSuccess() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
        document.getElementById('successOverlay').style.display = 'flex';
        window.history.replaceState({}, '', window.location.pathname);
    }
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
    // Set default input values
    document.getElementById('ort').value = state.ort;
    document.getElementById('buchstaben').value = state.buchstaben;
    document.getElementById('ziffern').value = state.ziffern;

    renderAllPlates();
    updateSummary();
    initFAQ();
    initReveal();
    checkSuccess();
});