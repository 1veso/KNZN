export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    // --- Stripe key guard ---
    if (!env.STRIPE_SECRET_KEY) {
      console.error('[create-checkout] FATAL: STRIPE_SECRET_KEY env var is not set');
      return new Response(JSON.stringify({ error: 'Server misconfiguration: missing Stripe key' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- Content-Type guard ---
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Invalid content type' }), {
        status: 415,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { plateText, plateFormat, material, size, type, addons, emailDiscount, customerEmail } = body;

    console.log('[create-checkout] Received body:', JSON.stringify({
      plateText, plateFormat, material, size, type,
      addons, emailDiscount, customerEmail: customerEmail ? '***' : null
    }));

    // --- Input allowlist validation ---
    const validMaterials = ['standard', 'carbon'];
    const validSizes     = ['standard', 'klein'];
    const validTypes     = ['standard', 'elektro', 'oldtimer', 'saisonal'];

    if (!validMaterials.includes(material)) {
      console.error('[create-checkout] Invalid material:', material);
      return new Response(JSON.stringify({ error: 'Invalid material' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!validSizes.includes(size)) {
      console.error('[create-checkout] Invalid size:', size);
      return new Response(JSON.stringify({ error: 'Invalid size' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!validTypes.includes(type)) {
      console.error('[create-checkout] Invalid type:', type);
      return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!Array.isArray(addons) && typeof addons !== 'object') {
      console.error('[create-checkout] Invalid addons:', addons);
      return new Response(JSON.stringify({ error: 'Invalid addons' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // --- Sanitize email ---
    let sanitizedEmail = null;
    if (emailDiscount && customerEmail) {
      const emailRegex = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,255}\.[^\s@<>"']{2,}$/;
      if (emailRegex.test(customerEmail)) {
        sanitizedEmail = customerEmail.toLowerCase().trim().slice(0, 254);
      } else {
        console.warn('[create-checkout] Email failed regex, skipping:', customerEmail);
      }
    }

    // --- Build Stripe session params ---
    const origin = new URL(request.url).origin;
    const params = new URLSearchParams();

    params.set('mode', 'payment');
    params.set('success_url', `${origin}/?success=1`);
    params.set('cancel_url', `${origin}/`);

    console.log('[create-checkout] success_url:', `${origin}/?success=1`);
    console.log('[create-checkout] cancel_url:', `${origin}/`);

    // Pre-fill Stripe checkout email field
    if (sanitizedEmail) {
      params.set('customer_email', sanitizedEmail);
    }

    let i = 0;

    const kennzeichenPriceId = material === 'carbon'
      ? 'price_1T9RX4JlVSturRwqiugKPXuT'
      : 'price_1T9RWMJlVSturRwqU5Q3bqDu';

    const sizeLabel = size === 'klein' ? 'Klein' : 'Standard';
    const typeLabel = type === 'elektro' ? 'Elektro'
      : type === 'oldtimer' ? 'Oldtimer'
      : type === 'saisonal' ? 'Saisonal'
      : 'Standard';

    params.set(`line_items[${i}][price]`, kennzeichenPriceId);
    params.set(`line_items[${i}][quantity]`, '1');
    params.set(`metadata[kennzeichen_text]`, plateText || '');
    params.set(`metadata[groesse]`, sizeLabel);
    params.set(`metadata[typ]`, typeLabel);
    params.set(`metadata[email_discount_applied]`, sanitizedEmail ? 'true' : 'false');
    if (sanitizedEmail) {
      params.set(`metadata[lead_email]`, sanitizedEmail);
    }
    i++;

    if (addons.zulassung) {
      params.set(`line_items[${i}][price]`, 'price_1T9RXdJlVSturRwqIcTAFpni');
      params.set(`line_items[${i}][quantity]`, '1');
      i++;
    }

    if (addons.plakette) {
      params.set(`line_items[${i}][price]`, 'price_1T9RYBJlVSturRwqteAza4Tg');
      params.set(`line_items[${i}][quantity]`, '1');
      i++;
    }

    if (addons.versand) {
      params.set(`line_items[${i}][price]`, 'price_1T9RYeJlVSturRwqt1Es6dV4');
      params.set(`line_items[${i}][quantity]`, '1');
      i++;
    }

    // --- Discount logic ---
    // Stripe allows only ONE discount per session.
    // Sonderangebot coupon (Zu15xPHh) takes priority — €5 off Komplettpaket.
    // Email discount (EMAIL5EUR) only applies when versand is selected and Sonderangebot is NOT triggered.
    const isSonderangebot = material !== 'carbon' && addons.zulassung && addons.plakette;

    if (isSonderangebot) {
      params.set('discounts[0][coupon]', 'Zu15xPHh');
      console.log('[create-checkout] Applying Sonderangebot coupon');
    } else if (sanitizedEmail && addons.versand) {
      params.set('discounts[0][coupon]', 'EMAIL5EUR');
      console.log('[create-checkout] Applying email discount coupon');
    }

    console.log('[create-checkout] Stripe params:', params.toString());

    // --- Call Stripe ---
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    // Parse FIRST, check status after — so we can log the Stripe error body
    const stripeBody = await stripeRes.json();

    if (!stripeRes.ok) {
      // Surface the full Stripe error in logs so it's visible in Cloudflare dashboard
      console.error('[create-checkout] Stripe error status:', stripeRes.status);
      console.error('[create-checkout] Stripe error body:', JSON.stringify(stripeBody));

      const stripeMessage = stripeBody?.error?.message || 'Unknown Stripe error';
      const stripeType    = stripeBody?.error?.type    || 'unknown';
      const stripeCode    = stripeBody?.error?.code    || 'unknown';

      console.error(`[create-checkout] Stripe error.type=${stripeType} error.code=${stripeCode} message="${stripeMessage}"`);

      return new Response(JSON.stringify({
        error: 'Checkout session creation failed',
        stripe_error: stripeMessage,
        stripe_type:  stripeType,
        stripe_code:  stripeCode,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = stripeBody;
    console.log('[create-checkout] ✅ Session created — id:', session.id, '| url:', session.url);

    // --- Fire lead to Supabase + n8n (non-blocking) ---
    if (sanitizedEmail) {
      const leadPayload = {
        email: sanitizedEmail,
        plate_text: plateText || '',
        material,
        size: sizeLabel,
        type: typeLabel,
        versand: !!addons.versand,
        sonderangebot: isSonderangebot,
        discount_applied: isSonderangebot ? 'sonderangebot' : 'email5eur',
        stripe_session_id: session.id,
        created_at: new Date().toISOString(),
        source: 'knzn_checkout_modal',
      };

      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
        fetch(`${env.SUPABASE_URL}/rest/v1/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(leadPayload),
        }).catch(e => console.warn('[create-checkout] Supabase insert failed:', e.message));
      }

      if (env.N8N_LEAD_WEBHOOK_URL) {
        fetch(env.N8N_LEAD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload),
        }).catch(e => console.warn('[create-checkout] n8n webhook failed:', e.message));
      }
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[create-checkout] Unhandled exception:', err.message, err.stack);
    return new Response(JSON.stringify({ error: 'Internal server error', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}