/* ─── STATE ─── */
const state = {
    ort: '', buchstaben: '', ziffern: '', suffix: '',
    size: 'standard', material: 'standard', plateType: 'standard',
    addons: { zulassung: false, plakette: false, versand: false }
};

const heroState = { ort: '', buchstaben: '', ziffern: '', suffix: '' };
const PRICES = { standard: 10, carbon: 20, zulassung: 20, plakette: 5, versand: 5 };

/* ─── PLATE RENDERING ─── */
function drawPlate(canvasId, ort, buchstaben, ziffern, suffix, material, plateType) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const s = W / 520;
    ctx.clearRect(0, 0, W, H);

    const pt = plateType || 'standard';
    const isCarbon = material === 'carbon';
    const hasSuffix = (pt === 'e' || pt === 'h' || pt === 'saisonal');
    const suffixW = hasSuffix ? W * 0.20 : 0;

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

    ctx.strokeStyle = isCarbon ? '#444' : '#aaaaaa';
    ctx.lineWidth = 2*s;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(1*s, 1*s, W-2*s, H-2*s, 4*s);
    else ctx.rect(1*s, 1*s, W-2*s, H-2*s);
    ctx.stroke();

    const bw = 42*s;
    ctx.fillStyle = '#003399';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(2*s, 2*s, bw, H-4*s, [4*s, 0, 0, 4*s]);
    else ctx.rect(2*s, 2*s, bw, H-4*s);
    ctx.fill();

    const cx = 2*s + bw/2;
    const starsTop = 5*s;
    const starsH = H * 0.60;
    const starR = starsH/2 * 0.44;
    for (let i = 0; i < 12; i++) {
        const a = (i/12)*Math.PI*2 - Math.PI/2;
        drawStar(ctx, cx + Math.cos(a)*starR, starsTop + starsH/2 + Math.sin(a)*starR, 2.1*s, '#FFD700');
    }

    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${10*s}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('D', cx, starsTop + starsH + 6*s);

    const textAreaEnd = W - suffixW;
    const isEmpty = !ort && !buchstaben && !ziffern;
    const displayOrt = isEmpty ? 'DN' : (ort||'').toUpperCase().trim();
    const displayBu  = isEmpty ? 'AB' : (buchstaben||'').toUpperCase().trim();
    const displayZi  = isEmpty ? '1234' : (ziffern||'').trim();
    const displaySuffix = hasSuffix ? '' : (suffix||'').toUpperCase().trim();
    const buziText = displayBu + (displayBu && displayZi ? ' ' : '') + displayZi + (displaySuffix ? ' ' + displaySuffix : '');

    const totalChars = displayOrt.length + displayBu.length + displayZi.length + displaySuffix.length;
    const fs = totalChars <= 5 ? 56*s : totalChars <= 7 ? 50*s : 44*s;

    ctx.font = `bold ${fs}px 'Arial Black', Arial, sans-serif`;
    ctx.textBaseline = 'middle';

    const ortWidth  = ctx.measureText(displayOrt).width;
    const buziWidth = buziText ? ctx.measureText(buziText).width : 0;
    const sealR   = H * 0.145;
    const sealGap = H * 0.05;
    const sealBlockW = sealR * 2 + 10*s;
    const textAreaStart = bw + 6*s;
    const textAreaWidth = textAreaEnd - textAreaStart - 6*s;
    const totalContentW = ortWidth + sealBlockW + buziWidth;
    const startX = textAreaStart + Math.max(0, (textAreaWidth - totalContentW) / 2);
    const textY  = H * 0.55;

    ctx.fillStyle = isCarbon ? '#e0e0e0' : '#111111';
    ctx.textAlign = 'left';
    ctx.fillText(displayOrt, startX, textY);

    const sealCX   = startX + ortWidth + sealBlockW / 2;
    const sealTopY = H / 2 - sealR - sealGap / 2;
    const sealBotY = H / 2 + sealR + sealGap / 2;
    ctx.strokeStyle = isCarbon ? '#888' : '#666';
    ctx.lineWidth = 1.5*s;
    ctx.beginPath(); ctx.arc(sealCX, sealTopY, sealR, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(sealCX, sealBotY, sealR, 0, Math.PI*2); ctx.stroke();

    if (buziText) {
        ctx.fillStyle = isCarbon ? '#e0e0e0' : '#111111';
        ctx.fillText(buziText, startX + ortWidth + sealBlockW, textY);
    }

    if (pt === 'e' || pt === 'h') {
        const divX = textAreaEnd;
        const letter = pt === 'e' ? 'E' : 'H';
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 1.5*s;
        ctx.beginPath(); ctx.moveTo(divX, 5*s); ctx.lineTo(divX, H - 5*s); ctx.stroke();
        ctx.fillStyle = isCarbon ? '#e0e0e0' : '#111111';
        ctx.font = `bold ${50*s}px 'Arial Black', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, divX + suffixW / 2, H * 0.55);
    } else if (pt === 'saisonal') {
        const boxX = textAreaEnd + 2*s;
        const boxW = suffixW - 4*s;
        ctx.fillStyle = '#003399';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(boxX, 2*s, boxW, H-4*s, [0, 4*s, 4*s, 0]);
        else ctx.rect(boxX, 2*s, boxW, H-4*s);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${14*s}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const boxCenterX = boxX + boxW / 2;
        ctx.fillText('04', boxCenterX, H * 0.30);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1*s;
        ctx.beginPath(); ctx.moveTo(boxX + 4*s, H / 2); ctx.lineTo(boxX + boxW - 4*s, H / 2); ctx.stroke();
        ctx.fillText('10', boxCenterX, H * 0.73);
    }
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
    if (!o && !bu && !zi) return 'DN AB 1234';
    let t = o;
    if (bu||zi) t += ' ';
    if (bu) t += bu + ' ';
    if (zi) t += zi;
    if (su) t += ' ' + su;
    return t;
}

function renderAllPlates() {
    const { ort, buchstaben, ziffern, suffix, material, plateType } = state;
    drawPlate('plateCanvas', ort, buchstaben, ziffern, suffix, material, plateType);
    drawPlate('summaryPlate', ort, buchstaben, ziffern, suffix, material, plateType);
}

function renderHeroPlate() {
    drawPlate('heroPlate', heroState.ort, heroState.buchstaben, heroState.ziffern, heroState.suffix, state.material);
}

/* ─── TYPEWRITER ─── */
function typewriterPlate() {
    const sequence = [
        {ort:'DN', b:'AB', z:'1234', s:''},
        {ort:'DN', b:'JH', z:'42',   s:''},
        {ort:'DN', b:'MX', z:'500',  s:'E'},
        {ort:'DN', b:'LB', z:'88',   s:'H'},
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
                heroState[field === 'b' ? 'buchstaben' : field === 'z' ? 'ziffern' : 'ort'] = target.slice(0, ci);
                renderHeroPlate();
                setTimeout(next, delays.type);
            } else if (fieldIdx < fields.length - 1) {
                field = fields[fieldIdx + 1]; ci = 0;
                setTimeout(next, delays.type);
            } else {
                heroState.suffix = cur.s;
                renderHeroPlate();
                phase = 'pause';
                setTimeout(next, delays.pause);
            }
        } else if (phase === 'pause') {
            phase = 'erase'; field = 'z'; ci = vals[2].length;
            setTimeout(next, delays.erase);
        } else if (phase === 'erase') {
            const target = vals[fields.indexOf(field)];
            if (ci > 0) {
                ci--;
                heroState[field === 'b' ? 'buchstaben' : field === 'z' ? 'ziffern' : 'ort'] = target.slice(0, ci);
                renderHeroPlate();
                setTimeout(next, delays.erase);
            } else {
                const fi = fields.indexOf(field);
                if (fi > 0) { field = fields[fi-1]; ci = vals[fi-1].length; setTimeout(next, delays.erase); }
                else {
                    si = (si+1) % sequence.length;
                    phase = 'type'; field = 'ort'; ci = 0;
                    heroState.ort=''; heroState.buchstaben=''; heroState.ziffern=''; heroState.suffix='';
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
    validatePlate(); renderAllPlates(); updateSummary(); updateProgress();
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
    renderAllPlates();
}

function setPlateType(btn, type) {
    document.querySelectorAll('.plate-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.plateType = type;
    renderAllPlates();
}

function setSize(btn, val) {
    state.size = val;
    document.getElementById('sizeStd').classList.toggle('active', val==='standard');
    document.getElementById('sizeKlein').classList.toggle('active', val==='klein');
}

function setMaterial(btn, val) {
    state.material = val;
    document.getElementById('matStd').classList.toggle('active', val==='standard');
    document.getElementById('matCarbon').classList.toggle('active', val==='carbon');
    renderAllPlates(); renderHeroPlate(); updateSummary();
}

/* ─── ADDONS ─── */
function toggleAddon(key) {
    state.addons[key] = !state.addons[key];
    const cardId = { zulassung:'addonZulassung', plakette:'addonPlakette', versand:'addonVersand' }[key];
    document.getElementById(cardId).classList.toggle('selected', state.addons[key]);
    document.getElementById('paketBanner').classList.toggle('visible', state.addons.zulassung && state.addons.plakette);
    updateSummary(); updateProgress();
}

/* ─── PRICING ─── */
function calcTotal() {
    const isKomplett = state.addons.zulassung && state.addons.plakette && state.material === 'standard';
    if (isKomplett) {
        let t = 30;
        if (state.addons.versand) t += PRICES.versand;
        return t;
    }
    let t = PRICES[state.material];
    if (state.addons.zulassung) t += PRICES.zulassung;
    if (state.addons.plakette) t += PRICES.plakette;
    if (state.addons.versand)  t += PRICES.versand;
    return t;
}

function updateSummary() {
    const lines = [{ name: `2 Kennzeichen (${state.material==='carbon'?'Carbon':'Standard'})`, price: PRICES[state.material] }];
    if (state.addons.zulassung) lines.push({ name:'KFZ Zulassung',   price: PRICES.zulassung });
    if (state.addons.plakette)  lines.push({ name:'Umweltplakette',  price: PRICES.plakette  });
    if (state.addons.versand)   lines.push({ name:'DHL Versand',     price: PRICES.versand   });
    const total = calcTotal();
    document.getElementById('checkoutLines').innerHTML = lines.map(l =>
        `<div class="checkout-line"><span class="cl-name">${l.name}</span><span class="cl-price">€${l.price}</span></div>`
    ).join('');
    document.getElementById('totalPrice').textContent = `€${total}`;
    const mob = document.getElementById('mobileTotalPrice');
    if (mob) mob.textContent = `€${total}`;
}

/* ─── PROGRESS ─── */
function initScrollProgress() {
    const addonsEl   = document.getElementById('addons');
    const checkoutEl = document.querySelector('.checkout-block');
    function update() {
        if (!addonsEl || !checkoutEl) return;
        const triggerY   = window.innerHeight * 0.55;
        const atAddons   = addonsEl.getBoundingClientRect().top   < triggerY;
        const atCheckout = checkoutEl.getBoundingClientRect().top < triggerY;
        const s1 = document.getElementById('step1');
        const s2 = document.getElementById('step2');
        const s3 = document.getElementById('step3');
        const l1 = document.getElementById('line1');
        const l2 = document.getElementById('line2');
        if (!s1||!s2||!s3) return;
        [s1,s2,s3].forEach(s => s.className = 'progress-step');
        [l1,l2].forEach(l => l.className = 'progress-line');
        if (atCheckout) {
            s1.classList.add('done'); s2.classList.add('done'); s3.classList.add('active');
            l1.classList.add('done'); l2.classList.add('done');
        } else if (atAddons) {
            s1.classList.add('done'); s2.classList.add('active'); l1.classList.add('done');
        } else {
            s1.classList.add('active');
        }
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
}

function updateProgress() {}

/* ─── CHECKOUT ─── */
async function handleCheckout() {
    const ort = state.ort.trim(), b = state.buchstaben.trim(), z = state.ziffern.trim();
    if (!ort || !b || !z) {
        alert('Bitte konfigurieren Sie zuerst Ihr Kennzeichen.');
        document.getElementById('configurator').scrollIntoView({ behavior:'smooth' });
        return;
    }
    openEmailModal();
}

/* ─── EMAIL MODAL ─── */
function openEmailModal() {
    const overlay = document.getElementById('emailModal');
    const input   = document.getElementById('emailInput');
    const errEl   = document.getElementById('emailError');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (errEl)  errEl.textContent = '';
    if (input)  { input.classList.remove('error'); input.value = ''; input.focus(); }
}

function closeEmailModal() {
    document.getElementById('emailModal').classList.remove('active');
    document.body.style.overflow = '';
}

function validateEmail(email) {
    return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

async function submitEmailAndCheckout() {
    const input   = document.getElementById('emailInput');
    const errEl   = document.getElementById('emailError');
    const btn     = document.getElementById('emailSubmitBtn');
    const btnText = document.getElementById('emailSubmitText');
    const email   = (input.value || '').trim();

    if (!email) { input.classList.add('error'); errEl.textContent = 'Bitte E-Mail eingeben.'; input.focus(); return; }
    if (!validateEmail(email)) { input.classList.add('error'); errEl.textContent = 'Ungültige E-Mail-Adresse.'; input.focus(); return; }

    input.classList.remove('error'); errEl.textContent = '';
    btn.disabled = true; btnText.textContent = 'Wird weitergeleitet...';

    try {
        const ort = state.ort.trim(), b = state.buchstaben.trim(), z = state.ziffern.trim();
        const typeSuffix = state.plateType==='e'?'E':state.plateType==='h'?'H':state.plateType==='saisonal'?'04-10':state.suffix;
        const res = await fetch('/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plateText: buildPlateText(ort,b,z,typeSuffix),
                plateFormat: `${state.size}_${state.material}`,
                material: state.material, size: state.size,
                addons: state.addons, totalAmount: calcTotal(), email
            })
        });
        if (!res.ok) throw new Error('Checkout failed');
        const { url } = await res.json();
        window.location.href = url;
    } catch (err) {
        console.error(err);
        errEl.textContent = 'Fehler. Bitte erneut versuchen.';
        btn.disabled = false; btnText.textContent = 'Weiter zur Zahlung';
    }
}

(function initEmailModal() {
    document.addEventListener('DOMContentLoaded', function() {
        const closeBtn  = document.getElementById('emailModalClose');
        const overlay   = document.getElementById('emailModal');
        const submitBtn = document.getElementById('emailSubmitBtn');
        const input     = document.getElementById('emailInput');
        const errEl     = document.getElementById('emailError');
        if (closeBtn)  closeBtn.addEventListener('click', closeEmailModal);
        if (overlay)   overlay.addEventListener('click', e => { if (e.target===overlay) closeEmailModal(); });
        if (submitBtn) submitBtn.addEventListener('click', submitEmailAndCheckout);
        if (input) {
            input.addEventListener('keydown', e => { if (e.key==='Enter') submitEmailAndCheckout(); });
            input.addEventListener('input', () => { input.classList.remove('error'); if (errEl) errEl.textContent=''; });
        }
        document.addEventListener('keydown', e => {
            if (e.key==='Escape' && overlay && overlay.classList.contains('active')) closeEmailModal();
        });
    });
})();

/* ─── ANCHOR BANNER ─── */
function initAnchorBanner() {
    const banner = document.querySelector('.anchor-banner');
    if (!banner) return;
    const messages = [
        '🏆 Komplettpaket nur €30 — Zulassung + 2 Kennzeichen + Umweltplakette',
        '⚡ Blitzschnelle Bearbeitung unter 24 Stunden',
        '🚗 DIN-zertifizierte Kennzeichen — gültig in ganz Deutschland',
        '📦 DHL-Versand deutschlandweit — nur €5',
        '✅ Niedrigster Preis im Umkreis — kein versteckter Aufpreis',
    ];
    banner.innerHTML = `<div class="anchor-ticker-wrap"><div class="anchor-ticker" id="anchorTicker"></div></div>`;
    document.getElementById('anchorTicker').innerHTML = [...messages,...messages].map(m =>
        `<span class="anchor-ticker-item">${m}</span>`).join('');
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

/* ─── SCROLL REVEAL — excludes hero and configurator ─── */
function initReveal() {
    const els = document.querySelectorAll('section:not(.hero):not(.configurator), .proof-strip');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('reveal','visible'); obs.unobserve(e.target); }
        });
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
    renderHeroPlate();
    updateSummary();
    initScrollProgress();
    initAnchorBanner();
    initFAQ();
    initReveal();
    checkSuccess();
    typewriterPlate();
});

/* ══════════════════════════════════════════════════════════════════════════
   CINEMATIC SCROLL ANIMATION
   - Hero is 500vh tall giving frames full room to breathe
   - Hero content stays FULLY VISIBLE until 600px of scroll
   - Crossfade starts at 600px, completes at 1200px
   - Hero text fades at 1000-1800px
   - Scene 1 plays frames 1-300 across first half of hero
   - Scene 2 plays frames 301-600 across second half
   - Frame 600 freezes as background behind configurator
   - Plate preview floats in centered at 68% viewport height
   ══════════════════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
    if (typeof gsap === "undefined") { console.error("GSAP not loaded"); return; }
    gsap.registerPlugin(ScrollTrigger);

    const S1_TOTAL = 300;
    const S2_TOTAL = 300;
    const s1src = i => `public/images/section1/${i}.jpg`;
    const s2src = i => `public/images/section2/${i + 300}.jpg`;

    const canvas    = document.getElementById("scroll-canvas");
    const staticImg = document.getElementById("hero-static-img");
    const loader    = document.getElementById("canvas-loader");
    const heroWrap  = document.getElementById("hero-content-wrap");
    const miniBar   = document.getElementById("hero-mini-bar");
    const scrollInd = document.getElementById("scrollIndicator");

    if (!canvas) { console.warn("scroll-canvas not found"); return; }

    const ctx = canvas.getContext("2d");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    const s1 = [];
    const s2 = [];

    function paint(bank, rawFrame, total) {
        const f   = Math.max(1, Math.min(Math.round(rawFrame), total));
        const img = bank[f];
        if (!img || !img.complete || !img.naturalWidth) return;
        const cW = canvas.width, cH = canvas.height;
        const iW = img.naturalWidth, iH = img.naturalHeight;
        const scale = Math.max(cW / iW, cH / iH);
        ctx.clearRect(0, 0, cW, cH);
        ctx.drawImage(img, (cW - iW*scale)/2, (cH - iH*scale)/2, iW*scale, iH*scale);
    }

    function preloadS1(cb) {
        for (let i = 1; i <= S1_TOTAL; i++) {
            const img = new Image();
            img.src = s1src(i);
            s1[i] = img;
            if (i === 1) {
                img.onload  = cb;
                img.onerror = () => console.error(`Scene 1 not found: ${s1src(1)}`);
            }
        }
    }

    function preloadS2() {
        for (let i = 1; i <= S2_TOTAL; i++) {
            const img = new Image();
            img.src = s2src(i);
            s2[i] = img;
            if (i === 1) img.onerror = () => console.error(`Scene 2 not found: ${s2src(1)}`);
        }
    }

    /* Scroll indicator fades when user starts scrolling */
    if (scrollInd) {
        window.addEventListener('scroll', () => {
            scrollInd.style.opacity = window.scrollY > 80 ? '0' : '1';
        }, { passive: true });
    }

    function initTriggers() {
        const heroSection  = document.getElementById("hero-section");
        const configBridge = document.querySelector(".config-bridge");
        const configBody   = document.querySelector(".config-body");

        /* Anchor banner hides at FAQ */
        const anchorBanner = document.querySelector('.anchor-banner');
        const faqSection   = document.querySelector('.faq');
        if (anchorBanner && faqSection) {
            ScrollTrigger.create({
                trigger: faqSection,
                start: "top bottom",
                onEnter()     { anchorBanner.classList.add('hidden'); },
                onLeaveBack() { anchorBanner.classList.remove('hidden'); }
            });
        }

        /* 1. Hero crossfade — STARTS at 600px, FINISHES at 1200px
              Hero is fully opaque until user has scrolled 600px     */
        gsap.to({ v: 0 }, {
            v: 1,
            ease: "none",
            scrollTrigger: {
                trigger: heroSection,
                start: "top top+=600",
                end:   "top top+=1200",
                scrub: true,
                onUpdate(self) {
                    const p = self.progress;
                    if (staticImg) staticImg.style.opacity = String(1 - p);
                    canvas.style.opacity = String(p);
                    if (p > 0.05 && loader) loader.style.opacity = "0";
                }
            }
        });

        /* 2. Hero text fades very late */
        if (heroWrap) {
            gsap.to(heroWrap, {
                opacity: 0, y: -40, ease: "none",
                scrollTrigger: {
                    trigger: heroSection,
                    start: "top top+=1000",
                    end:   "top top+=1800",
                    scrub: true,
                }
            });
        }

        /* 3. Mini-bar slides in */
        if (miniBar) {
            gsap.fromTo(miniBar,
                { opacity: 0, y: 40 },
                {
                    opacity: 1, y: 0, ease: "none",
                    scrollTrigger: {
                        trigger: heroSection,
                        start: "top top+=1600",
                        end:   "top top+=2200",
                        scrub: true,
                        onUpdate(self) {
                            if (miniBar) miniBar.style.pointerEvents = self.progress > 0.5 ? 'auto' : 'none';
                        }
                    }
                }
            );
        }

        /* 4. Scene 1: frames 1-300 */
        const p1 = { f: 1 };
        let usingScene2 = false;

        gsap.to(p1, {
            f: S1_TOTAL, ease: "none",
            scrollTrigger: {
                trigger: heroSection,
                start: "top top",
                end:   "50% bottom",
                scrub: 3.5,
            },
            onUpdate() { if (!usingScene2) paint(s1, p1.f, S1_TOTAL); }
        });

        /* 5. Scene 2: frames 301-600 */
        const p2 = { f: 1 };

        gsap.to(p2, {
            f: S2_TOTAL, ease: "none",
            scrollTrigger: {
                trigger: heroSection,
                start: "50% bottom",
                end:   "bottom bottom",
                scrub: 3.5,
                onEnter()     { usingScene2 = true; },
                onEnterBack() { usingScene2 = true; },
                onLeaveBack() { usingScene2 = false; },
                onLeave()     {
                    usingScene2 = true;
                    paint(s2, S2_TOTAL, S2_TOTAL);
                }
            },
            onUpdate() { if (usingScene2) paint(s2, p2.f, S2_TOTAL); }
        });

        /* 6. Plate preview float fades in — centered at car plate position */
        const plateFloat = document.getElementById("configPlateFloat");
        if (plateFloat && configBridge) {
            gsap.fromTo(plateFloat,
                { opacity: 0, scale: 0.93, y: 24 },
                {
                    opacity: 1, scale: 1, y: 0, ease: "power2.out",
                    scrollTrigger: {
                        trigger: configBridge,
                        start: "top 80%",
                        end:   "top 25%",
                        scrub: true,
                    }
                }
            );
        }

        /* 7. Canvas fades out as config-body covers it */
        if (configBody) {
            gsap.to(canvas, {
                opacity: 0, ease: "none",
                scrollTrigger: {
                    trigger: configBody,
                    start: "top 65%",
                    end:   "top 5%",
                    scrub: true,
                }
            });
            if (miniBar) {
                gsap.to(miniBar, {
                    opacity: 0, ease: "none",
                    scrollTrigger: {
                        trigger: configBody,
                        start: "top 90%",
                        end:   "top 60%",
                        scrub: true,
                    }
                });
            }
        }
    }

    preloadS1(() => {
        paint(s1, 1, S1_TOTAL);
        preloadS2();
        initTriggers();
        if (loader) loader.style.opacity = "0";
    });
});