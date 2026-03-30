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
    const stepsVertical = document.getElementById('checkoutStepsVertical');
    const configuratorEl2 = document.querySelector('#configurator, .config-body');
    const addonsEl = document.querySelector('.addons');
    const checkoutBlockEl = document.querySelector('.checkout-block');
    const footerEl2 = document.querySelector('.footer');

    if (!stepsVertical || !configuratorEl2 || !footerEl2) return;

    // Show steps when configurator is reached
    // Hide when footer is reached
    const stepsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.target === footerEl2 && entry.isIntersecting) {
                stepsVertical.classList.remove('visible');
            } else if (entry.target === configuratorEl2 && entry.isIntersecting) {
                stepsVertical.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    stepsObserver.observe(configuratorEl2);
    stepsObserver.observe(footerEl2);

    // Step activation based on scroll position
    const stepSections = [
        { el: configuratorEl2, step: 1 },
        { el: addonsEl, step: 2 },
        { el: checkoutBlockEl, step: 3 },
    ];

    const stepActivator = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const matched = stepSections.find(s => s.el === entry.target);
            if (!matched) return;
            const activeStep = matched.step;
            document.querySelectorAll('.csv-step').forEach((el, i) => {
                const stepNum = i + 1;
                el.classList.remove('active', 'done');
                if (stepNum < activeStep) el.classList.add('done');
                if (stepNum === activeStep) el.classList.add('active');
            });
        });
    }, { threshold: 0.3 });

    stepSections.forEach(s => { if (s.el) stepActivator.observe(s.el); });
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
    const btn     = document.getElementById('emailSubmitBtn');
    const btnText = document.getElementById('emailSubmitText');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (errEl)   errEl.textContent = '';
    if (btn)     { btn.disabled = false; }
    if (btnText) btnText.textContent = 'Weiter zur Zahlung';
    if (input)   { input.classList.remove('error'); input.value = ''; input.focus(); }
}

function closeEmailModal() {
    document.getElementById('emailModal').classList.remove('active');
    document.body.style.overflow = '';
}

function validateEmail(email) {
    return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

/* ─── CORE CHECKOUT FUNCTION ─── */
async function proceedToCheckout(email = null) {
    const overlay = document.getElementById('emailModal');
    const errEl   = document.getElementById('emailError');
    const btn     = document.getElementById('emailSubmitBtn');
    const btnText = document.getElementById('emailSubmitText');

    // Show loading state
    if (btn)     btn.disabled = true;
    if (btnText) btnText.textContent = 'Wird weitergeleitet...';

    try {
        const ort = state.ort.trim(), b = state.buchstaben.trim(), z = state.ziffern.trim();

        // Map internal plate type keys to the values the server validates
        const typeMap = { e: 'elektro', h: 'oldtimer', saisonal: 'saisonal', standard: 'standard' };
        const plateType = typeMap[state.plateType] || 'standard';

        // For the plate text suffix we still use the short display label
        const typeSuffix = state.plateType === 'e' ? 'E'
            : state.plateType === 'h' ? 'H'
            : state.plateType === 'saisonal' ? '04-10'
            : state.suffix;

        const requestBody = {
            plateText:   buildPlateText(ort, b, z, typeSuffix),
            plateFormat: `${state.size}_${state.material}`,
            material:    state.material,
            size:        state.size,
            type:        plateType,
            addons:      state.addons,
            totalAmount: calcTotal(),
        };

        // Only include email fields when an email was actually provided
        if (email) {
            requestBody.customerEmail = email;
            requestBody.emailDiscount = true;
        }

        console.log('[checkout] POST /create-checkout body:', JSON.stringify(requestBody, null, 2));

        const res = await fetch('/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error('[checkout] Server responded', res.status, errBody);
            throw new Error(`Checkout failed: ${res.status}`);
        }

        const { url } = await res.json();
        if (!url) throw new Error('No checkout URL returned');
        window.location.href = url;

    } catch (err) {
        console.error('[checkout] Error:', err);
        if (btn)     { btn.disabled = false; }
        if (btnText) btnText.textContent = 'Weiter zur Zahlung';

        // Show error inside modal if still open, otherwise alert
        if (overlay && overlay.classList.contains('active')) {
            if (errEl) errEl.textContent = 'Fehler. Bitte erneut versuchen.';
        } else {
            alert('Checkout-Fehler. Bitte Seite neu laden und erneut versuchen.');
        }
    }
}

/* ─── SUBMIT HANDLER (called by button click / Enter key) ─── */
function submitEmailAndCheckout() {
    const input = document.getElementById('emailInput');
    const errEl = document.getElementById('emailError');
    const email = (input ? input.value : '').trim();

    // If an email was typed, validate its format first
    if (email) {
        if (!validateEmail(email)) {
            input.classList.add('error');
            if (errEl) errEl.textContent = 'Ungültige E-Mail-Adresse.';
            input.focus();
            return;
        }
        input.classList.remove('error');
        if (errEl) errEl.textContent = '';
        proceedToCheckout(email);
    } else {
        // Empty email — skip straight to Stripe without storing email
        proceedToCheckout(null);
    }
}

(function initEmailModal() {
    document.addEventListener('DOMContentLoaded', function() {
        const closeBtn  = document.getElementById('emailModalClose');
        const overlay   = document.getElementById('emailModal');
        const submitBtn = document.getElementById('emailSubmitBtn');
        const input     = document.getElementById('emailInput');
        const errEl     = document.getElementById('emailError');

        // × button → skip email, go directly to checkout
        if (closeBtn) closeBtn.addEventListener('click', function() {
            closeEmailModal();
            proceedToCheckout(null);
        });

        // Backdrop click → skip email, go directly to checkout
        if (overlay) overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeEmailModal();
                proceedToCheckout(null);
            }
        });

        // Submit button → validate if email typed, else skip
        if (submitBtn) submitBtn.addEventListener('click', submitEmailAndCheckout);

        // Enter key in input → same as submit
        if (input) {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') submitEmailAndCheckout();
            });
            input.addEventListener('input', function() {
                input.classList.remove('error');
                if (errEl) errEl.textContent = '';
            });
        }

        // Escape key → skip email, go directly to checkout
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
                closeEmailModal();
                proceedToCheckout(null);
            }
        });
    });
})();

/* ─── ANCHOR BANNER ─── */
function initAnchorBanner() {
    const banner = document.querySelector('.anchor-banner');
    if (!banner) return;
    const messages = [
        '🏆 Komplettpaket nur €30, Zulassung + 2 Kennzeichen + Umweltplakette',
        '⚡ Blitzschnelle Bearbeitung unter 24 Stunden',
        '🚗 DIN-zertifizierte Kennzeichen, gültig in ganz Deutschland',
        '📦 DHL-Versand deutschlandweit, nur €5',
        '✅ Niedrigster Preis im Umkreis, kein versteckter Aufpreis',
    ];
    banner.innerHTML = `<div class="anchor-ticker-wrap"><div class="anchor-ticker" id="anchorTicker"></div></div>`;
    document.getElementById('anchorTicker').innerHTML = [...messages,...messages].map(m =>
        `<span class="anchor-ticker-item">${m}</span>`).join('');

    const configuratorEl = document.querySelector('#configurator, .config-body');
    if (configuratorEl) {
        const bannerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    banner.classList.add('hidden');
                } else {
                    const rect = configuratorEl.getBoundingClientRect();
                    if (rect.top > 0) {
                        banner.classList.remove('hidden');
                    }
                }
            });
        }, { threshold: 0.1 });
        bannerObserver.observe(configuratorEl);
    }
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
    initMobileSticky();
});

/* ─── MOBILE STICKY BAR ─── */
function initMobileSticky() {
    const stickyBar = document.querySelector('.mobile-sticky');
    const configuratorSection = document.querySelector('#configurator, .config-body');
    const footerEl = document.querySelector('.footer');

    if (!stickyBar || !configuratorSection || !footerEl) return;

    // Show when configurator enters viewport
    const stickyShowObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                stickyBar.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    // Hide only when footer enters viewport
    const stickyHideObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                stickyBar.classList.remove('visible');
            } else {
                // Footer left viewport going back up — restore bar
                // only if we are still in the checkout zone
                const confRect = configuratorSection.getBoundingClientRect();
                if (confRect.top < window.innerHeight) {
                    stickyBar.classList.add('visible');
                }
            }
        });
    }, { threshold: 0.1 });

    stickyShowObserver.observe(configuratorSection);
    stickyHideObserver.observe(footerEl);
}
