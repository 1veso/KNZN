/* ─── STATE ─── */
const state = {
    ort: '', buchstaben: '', ziffern: '', suffix: '',
    size: 'standard', material: 'standard',
    addons: { zulassung: false, plakette: false, versand: false }
};

const PRICES = { standard: 10, carbon: 20, zulassung: 20, plakette: 5, versand: 5 };

/* ─── PLATE RENDERING ─── */
function drawPlate(canvasId, ort, buchstaben, ziffern, suffix, material) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const s = W / 520;
    ctx.clearRect(0, 0, W, H);

    const isCarbon = material === 'carbon';

    // Background
    if (isCarbon) {
        const pc = document.createElement('canvas');
        pc.width = 8; pc.height = 8;
        const px = pc.getContext('2d');
        px.fillStyle = '#222'; px.fillRect(0,0,8,8);
        px.fillStyle = '#2e2e2e'; px.fillRect(0,0,4,4); px.fillRect(4,4,4,4);
        ctx.fillStyle = ctx.createPattern(pc, 'repeat');
    } else {
        ctx.fillStyle = '#FFFFFF';
    }
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(0, 0, W, H, 5*s);
    else ctx.rect(0, 0, W, H);
    ctx.fill();

    // Border
    ctx.strokeStyle = isCarbon ? '#444' : '#aaaaaa';
    ctx.lineWidth = 2*s;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(1*s, 1*s, W-2*s, H-2*s, 4*s);
    else ctx.rect(1*s, 1*s, W-2*s, H-2*s);
    ctx.stroke();

    // EU band
    const bw = 38*s;
    ctx.fillStyle = '#003399';
    ctx.fillRect(2*s, 2*s, bw, H-4*s);

    // Stars
    const cx = 2*s + bw/2, starsTop = 6*s, starsH = H*0.52;
    for (let i = 0; i < 12; i++) {
        const a = (i/12)*Math.PI*2 - Math.PI/2;
        const r = starsH/2 * 0.48;
        drawStar(ctx, cx + Math.cos(a)*r*0.55, starsTop + starsH/2 + Math.sin(a)*r*0.55, 2.2*s, '#FFD700');
    }

    // D letter
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${11*s}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('D', cx, H - 7*s);

    // Plate text
    const plateText = buildPlateText(ort, buchstaben, ziffern, suffix);
    const textX = bw + 6*s + (W - bw - 8*s)/2;
    const textY = H/2 + 17*s;
    const len = plateText.replace(/[·\s]/g, '').length;
    const fs = len <= 6 ? 54*s : len <= 8 ? 48*s : 42*s;

    ctx.fillStyle = isCarbon ? '#e0e0e0' : '#000000';
    ctx.textAlign = 'center';
    ctx.font = `bold ${fs}px 'Arial Black', Arial, sans-serif`;
    ctx.fillText(plateText, textX, textY);
}

function drawStar(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const oa = (i*4*Math.PI)/5 - Math.PI/2;
        const ia = oa + (2*Math.PI)/10;
        i === 0 ? ctx.moveTo(cx + r*Math.cos(oa), cy + r*Math.sin(oa)) : ctx.lineTo(cx + r*Math.cos(oa), cy + r*Math.sin(oa));
        ctx.lineTo(cx + r*0.4*Math.cos(ia), cy + r*0.4*Math.sin(ia));
    }
    ctx.closePath();
    ctx.fill();
}

function buildPlateText(ort, b, z, suffix) {
    const o = (ort||'').toUpperCase().trim();
    const bu = (b||'').toUpperCase().trim();
    const zi = (z||'').trim();
    const su = (suffix||'').toUpperCase().trim();
    if (!o && !bu && !zi) return 'DÜ · AB 1234';
    let t = o;
    if (bu||zi) t += ' · ';
    if (bu) t += bu + ' ';
    if (zi) t += zi;
    if (su) t += ' ' + su;
    return t;
}

function renderAllPlates() {
    const { ort, buchstaben, ziffern, suffix, material } = state;
    drawPlate('plateCanvas', ort, buchstaben, ziffern, suffix, material);
    drawPlate('heroPlate', ort, buchstaben, ziffern, suffix, material);
    drawPlate('summaryPlate', ort, buchstaben, ziffern, suffix, material);
}

/* ─── TYPEWRITER HERO ANIMATION ─── */
function typewriterPlate() {
    const sequence = [
        {ort:'DÜ', b:'AB', z:'1234', s:''},
        {ort:'AC', b:'JH', z:'42', s:''},
        {ort:'K',  b:'MX', z:'500', s:'E'},
        {ort:'DN', b:'LB', z:'88', s:'H'},
    ];
    let si = 0, ci = 0, phase = 'type', field = 'ort';
    const fields = ['ort','b','z'];
    const delays = { type: 120, pause: 1800, erase: 60 };

    function next() {
        const cur = sequence[si];
        const vals = [cur.ort, cur.b, cur.z];
        const fieldIdx = fields.indexOf(field);

        if (phase === 'type') {
            const target = vals[fieldIdx];
            if (ci < target.length) {
                ci++;
                const partial = target.slice(0, ci);
                state[field === 'b' ? 'buchstaben' : field === 'z' ? 'ziffern' : 'ort'] = partial;
                renderAllPlates();
                setTimeout(next, delays.type);
            } else if (fieldIdx < fields.length - 1) {
                field = fields[fieldIdx + 1];
                ci = 0;
                setTimeout(next, delays.type);
            } else {
                state.suffix = cur.s;
                renderAllPlates();
                phase = 'pause';
                setTimeout(next, delays.pause);
            }
        } else if (phase === 'pause') {
            phase = 'erase';
            field = 'z'; ci = vals[2].length;
            setTimeout(next, delays.erase);
        } else if (phase === 'erase') {
            const target = vals[fields.indexOf(field)];
            if (ci > 0) {
                ci--;
                const partial = target.slice(0, ci);
                state[field === 'b' ? 'buchstaben' : field === 'z' ? 'ziffern' : 'ort'] = partial;
                renderAllPlates();
                setTimeout(next, delays.erase);
            } else {
                const fi = fields.indexOf(field);
                if (fi > 0) { field = fields[fi-1]; ci = vals[fi-1].length; setTimeout(next, delays.erase); }
                else {
                    si = (si+1) % sequence.length;
                    phase = 'type'; field = 'ort'; ci = 0;
                    state.ort=''; state.buchstaben=''; state.ziffern=''; state.suffix='';
                    setTimeout(next, 300);
                }
            }
        }
    }

    setTimeout(next, 600);
}

/* ─── INPUT HANDLERS ─── */
function updatePlate() {
    state.ort = document.getElementById('ort').value;
    state.buchstaben = document.getElementById('buchstaben').value;
    state.ziffern = document.getElementById('ziffern').value;
    validatePlate();
    renderAllPlates();
    updateSummary();
    updateProgress();
}

function validatePlate() {
    const o = state.ort.trim(), b = state.buchstaben.trim(), z = state.ziffern.trim();
    const el = document.getElementById('plateValidation');
    if (!o && !b && !z) { el.textContent=''; el.className='plate-validation'; return false; }
    const valid = /^[A-ZÄÖÜ]{1,3}$/.test(o.toUpperCase()) && /^[A-Z]{1,2}$/.test(b.toUpperCase()) && /^[0-9]{1,4}$/.test(z);
    if (valid) { el.textContent='✓ Gültiges Kennzeichenformat'; el.className='plate-validation valid'; }
    else { el.textContent='⚠ Ortskenzeichen · Buchstaben · Ziffern prüfen'; el.className='plate-validation invalid'; }
    return valid;
}

function setSuffix(btn, val) {
    state.suffix = val;
    document.querySelectorAll('.suffix-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Sync plate type strip
    const typeMap = { '': 'standard', 'H': 'h', 'E': 'e' };
    const typeBtn = document.querySelector(`.plate-type-btn[data-type="${typeMap[val] || 'standard'}"]`);
    if (typeBtn) {
        document.querySelectorAll('.plate-type-btn').forEach(b => b.classList.remove('active'));
        typeBtn.classList.add('active');
    }
    renderAllPlates();
}

function setPlateType(btn, type) {
    document.querySelectorAll('.plate-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Sync suffix buttons
    const suffixMap = { standard: '', h: 'H', e: 'E' };
    const suffix = suffixMap[type] || '';
    state.suffix = suffix;
    const suffixIdMap = { '': 'suffixNone', 'H': 'suffixH', 'E': 'suffixE' };
    document.querySelectorAll('.suffix-btn').forEach(b => b.classList.remove('active'));
    const sBtn = document.getElementById(suffixIdMap[suffix]);
    if (sBtn) sBtn.classList.add('active');
    renderAllPlates();
}

function setSize(btn, val) {
    state.size = val;
    document.querySelectorAll('.toggle-group').forEach(g => {});
    document.getElementById('sizeStd').classList.toggle('active', val==='standard');
    document.getElementById('sizeKlein').classList.toggle('active', val==='klein');
}

function setMaterial(btn, val) {
    state.material = val;
    document.getElementById('matStd').classList.toggle('active', val==='standard');
    document.getElementById('matCarbon').classList.toggle('active', val==='carbon');
    renderAllPlates();
    updateSummary();
}

/* ─── ADDONS ─── */
function toggleAddon(key) {
    state.addons[key] = !state.addons[key];
    const cardId = { zulassung:'addonZulassung', plakette:'addonPlakette', versand:'addonVersand' }[key];
    document.getElementById(cardId).classList.toggle('selected', state.addons[key]);
    const isKomplett = state.addons.zulassung && state.addons.plakette;
    document.getElementById('paketBanner').classList.toggle('visible', isKomplett);
    updateSummary();
    updateProgress();
}

/* ─── PRICING ─── */
function calcTotal() {
    let t = PRICES[state.material];
    if (state.addons.zulassung) t += PRICES.zulassung;
    if (state.addons.plakette) t += PRICES.plakette;
    if (state.addons.versand) t += PRICES.versand;
    return t;
}

function updateSummary() {
    const lines = [{ name: `2 Kennzeichen (${state.material==='carbon'?'Carbon':'Standard'})`, price: PRICES[state.material] }];
    if (state.addons.zulassung) lines.push({ name:'KFZ Zulassung', price:PRICES.zulassung });
    if (state.addons.plakette) lines.push({ name:'Umweltplakette', price:PRICES.plakette });
    if (state.addons.versand) lines.push({ name:'DHL Versand', price:PRICES.versand });
    const total = calcTotal();

    document.getElementById('checkoutLines').innerHTML = lines.map(l =>
        `<div class="checkout-line"><span class="cl-name">${l.name}</span><span class="cl-price">€${l.price}</span></div>`
    ).join('');
    document.getElementById('totalPrice').textContent = `€${total}`;
    const mob = document.getElementById('mobileTotalPrice');
    if (mob) mob.textContent = `€${total}`;
}

/* ─── PROGRESS ─── */
function updateProgress() {
    const hasPlate = state.ort && state.buchstaben && state.ziffern;
    const hasAddon = Object.values(state.addons).some(Boolean);

    document.getElementById('step1').className = 'progress-step' + (hasPlate ? ' done' : ' active');
    document.getElementById('line1').className = 'progress-line' + (hasPlate ? ' done' : '');
    document.getElementById('step2').className = 'progress-step' + (hasAddon ? ' done' : hasPlate ? ' active' : '');
    document.getElementById('line2').className = 'progress-line' + (hasAddon ? ' done' : '');
    document.getElementById('step3').className = 'progress-step' + (hasAddon ? ' active' : '');
}

/* ─── CHECKOUT ─── */
async function handleCheckout() {
    const ort = state.ort.trim(), b = state.buchstaben.trim(), z = state.ziffern.trim();
    if (!ort || !b || !z) {
        alert('Bitte konfigurieren Sie zuerst Ihr Kennzeichen (Ortskenzeichen, Buchstaben und Ziffern).');
        document.getElementById('configurator').scrollIntoView({ behavior:'smooth' });
        return;
    }

    const btn = document.getElementById('checkoutBtn');
    const btnText = document.getElementById('checkoutBtnText');
    btn.disabled = true;
    btnText.textContent = 'Wird weitergeleitet...';

    try {
        const res = await fetch('/functions/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plateText: buildPlateText(ort, b, z, state.suffix),
                plateFormat: `${state.size}_${state.material}`,
                material: state.material,
                size: state.size,
                addons: state.addons,
                totalAmount: calcTotal()
            })
        });

        if (!res.ok) throw new Error('Checkout failed');
        const { url } = await res.json();
        window.location.href = url;
    } catch (err) {
        console.error(err);
        alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns per WhatsApp.');
        btn.disabled = false;
        btnText.textContent = 'Jetzt kostenpflichtig bestellen';
    }
}

/* ─── SOCIAL PROOF ─── */
function initProofStrip() {
    const proofs = [
        { plate:'DÜ · MK 420', time:'vor 3 Min.', label:'gerade bestellt' },
        { plate:'AC · JH 7', time:'vor 8 Min.', label:'Komplettpaket' },
        { plate:'DN · AB 1234', time:'vor 12 Min.', label:'Carbon Schilder' },
        { plate:'BM · ST 99', time:'vor 19 Min.', label:'gerade bestellt' },
        { plate:'K · XY 500E', time:'vor 24 Min.', label:'Elektro Kennzeichen' },
        { plate:'BI · LM 33', time:'vor 31 Min.', label:'Komplettpaket' },
        { plate:'MS · WR 2024', time:'vor 45 Min.', label:'Standard Schilder' },
        { plate:'BO · FG 88H', time:'vor 52 Min.', label:'Oldtimer' },
    ];

    const track = document.getElementById('proofTrack');
    const items = [...proofs, ...proofs].map(p =>
        `<div class="proof-item">
      <span>🚗</span>
      <span class="proof-plate">${p.plate}</span>
      <span>${p.label}</span>
      <span class="proof-time">${p.time}</span>
    </div>`
    ).join('');
    track.innerHTML = items;
}

/* ─── FAQ ─── */
function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('click', () => {
            const open = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!open) item.classList.add('open');
        });
    });
}

/* ─── SCROLL REVEAL ─── */
function initReveal() {
    const els = document.querySelectorAll('section, .anchor-banner, .proof-strip');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('reveal','visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.07 });
    els.forEach(el => { el.classList.add('reveal'); obs.observe(el); });
}

/* ─── SUCCESS CHECK ─── */
function checkSuccess() {
    if (new URLSearchParams(window.location.search).get('success') === '1') {
        alert('✅ Bestellung erfolgreich! Sie erhalten in Kürze eine Bestätigungs-E-Mail.');
        window.history.replaceState({}, '', window.location.pathname);
    }
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
    renderAllPlates();
    updateSummary();
    updateProgress();
    initProofStrip();
    initFAQ();
    initReveal();
    checkSuccess();
    typewriterPlate();
});