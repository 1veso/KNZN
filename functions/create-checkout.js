export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const body = await request.json();
    const { plateText, plateFormat, material, size, type, addons } = body;

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

    params.set(`line_items[${i}][price]`, kennzeichenPriceId);
    params.set(`line_items[${i}][quantity]`, '1');
    params.set(`metadata[kennzeichen_text]`, plateText || '');
    params.set(`metadata[groesse]`, sizeLabel);
    params.set(`metadata[typ]`, typeLabel);
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
