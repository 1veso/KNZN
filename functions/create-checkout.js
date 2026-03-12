export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    // Content-Type check
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Invalid content type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { plateText, plateFormat, material, size, type, addons } = body;

    // Input validation
    if (typeof plateText !== 'string' || plateText.length > 20) {
      return new Response(JSON.stringify({ error: 'Invalid plate text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allowedMaterials = ['standard', 'carbon'];
    const allowedSizes = ['standard', 'klein'];
    if (!allowedMaterials.includes(material) || !allowedSizes.includes(size)) {
      return new Response(JSON.stringify({ error: 'Invalid material or size' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (typeof addons !== 'object' || addons === null) {
      return new Response(JSON.stringify({ error: 'Invalid addons' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const origin = new URL(request.url).origin;
    const params = new URLSearchParams();

    params.set('mode', 'payment');
    params.set('success_url', `${origin}/?success=1`);
    params.set('cancel_url', `${origin}/`);

    let i = 0;

    const kennzeichenPriceId = material === 'carbon'
        ? 'price_1T9RX4JlVSturRwqiugKPXuT'
        : 'price_1T9RWMJlVSturRwqU5Q3bqDu';

    const sizeLabel = size === 'klein' ? 'Klein' : 'Standard';
    const typeLabel = type === 'elektro' ? 'Elektro'
        : type === 'oldtimer' ? 'Oldtimer'
            : type === 'saisonal' ? 'Saisonal'
                : 'Standard';

    // Sanitize metadata values - strip any HTML/script tags and limit length
    const sanitize = (val, maxLen = 50) =>
      String(val || '').replace(/<[^>]*>/g, '').slice(0, maxLen);

    params.set(`line_items[${i}][price]`, kennzeichenPriceId);
    params.set(`line_items[${i}][quantity]`, '1');
    params.set(`metadata[kennzeichen_text]`, sanitize(plateText, 20));
    params.set(`metadata[groesse]`, sanitize(sizeLabel, 10));
    params.set(`metadata[typ]`, sanitize(typeLabel, 10));
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

    const isSonderangebot = material !== 'carbon' && addons.zulassung && addons.plakette;
    if (isSonderangebot) {
      params.set('discounts[0][coupon]', 'Zu15xPHh');
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
      return new Response(JSON.stringify({ error: session.error?.message || 'Stripe error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
