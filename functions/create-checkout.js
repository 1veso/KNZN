export async function onRequestPost(context) {
  const { env, request } = context;

  try {
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

    // --- Input allowlist validation ---
    const validMaterials = ['standard', 'carbon'];
    const validSizes = ['standard', 'klein'];
    const validTypes = ['standard', 'elektro', 'oldtimer', 'saisonal'];

    if (!validMaterials.includes(material)) {
      return new Response(JSON.stringify({ error: 'Invalid material' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!validSizes.includes(size)) {
      return new Response(JSON.stringify({ error: 'Invalid size' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!Array.isArray(addons) && typeof addons !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid addons' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // --- Sanitize email if provided ---
    let sanitizedEmail = null;
    if (emailDiscount && customerEmail) {
      // Basic email format check — no external calls, just format validation
      const emailRegex = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,255}\.[^\s@<>"']{2,}$/;
      if (emailRegex.test(customerEmail)) {
        sanitizedEmail = customerEmail.toLowerCase().trim().slice(0, 254);
      }
      // If email is malformed, silently skip discount — don't error out the checkout
    }

    const origin = new URL(request.url).origin;
    const params = new URLSearchParams();

    params.set('mode', 'payment');
    params.set('success_url', `${origin}/?success=1`);
    params.set('cancel_url', `${origin}/`);

    // Pre-fill Stripe checkout email field if we have it
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
    // Sonderangebot coupon takes priority (higher value).
    // Email discount only applies when Sonderangebot is NOT triggered.
    const isSonderangebot = material !== 'carbon' && addons.zulassung && addons.plakette;

    if (isSonderangebot) {
      params.set('discounts[0][coupon]', 'Zu15xPHh');
    } else if (sanitizedEmail && addons.versand) {
      // Email discount only makes sense when versand is selected (it's a shipping discount)
      params.set('discounts[0][coupon]', 'EMAIL5EUR');
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      return new Response(JSON.stringify({ error: 'Checkout session creation failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- Fire lead to Supabase + n8n (non-blocking, won't affect checkout if they fail) ---
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

      // Supabase insert
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
        }).catch(() => {}); // silent fail
      }

      // n8n webhook
      if (env.N8N_LEAD_WEBHOOK_URL) {
        fetch(env.N8N_LEAD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload),
        }).catch(() => {}); // silent fail
      }
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}