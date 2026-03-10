export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const body = await request.json();
    const { plateText, plateFormat, material, addons } = body;

    const origin = new URL(request.url).origin;
    const params = new URLSearchParams();

    params.set('mode', 'payment');
    params.set('success_url', `${origin}/?success=1`);
    params.set('cancel_url', `${origin}/`);

    let i = 0;

    // Kennzeichen
    params.set(`line_items[${i}][price_data][currency]`, 'eur');
    params.set(`line_items[${i}][price_data][product_data][name]`, `2 Kennzeichen (${material === 'carbon' ? 'Carbon' : 'Standard'}) - ${plateText}`);
    params.set(`line_items[${i}][price_data][unit_amount]`, material === 'carbon' ? '2000' : '1000');
    params.set(`line_items[${i}][quantity]`, '1');
    i++;

    if (addons.zulassung) {
      params.set(`line_items[${i}][price_data][currency]`, 'eur');
      params.set(`line_items[${i}][price_data][product_data][name]`, 'KFZ Zulassung');
      params.set(`line_items[${i}][price_data][unit_amount]`, '2000');
      params.set(`line_items[${i}][quantity]`, '1');
      i++;
    }

    if (addons.plakette) {
      params.set(`line_items[${i}][price_data][currency]`, 'eur');
      params.set(`line_items[${i}][price_data][product_data][name]`, 'Umweltplakette');
      params.set(`line_items[${i}][price_data][unit_amount]`, '500');
      params.set(`line_items[${i}][quantity]`, '1');
      i++;
    }

    if (addons.versand) {
      params.set(`line_items[${i}][price_data][currency]`, 'eur');
      params.set(`line_items[${i}][price_data][product_data][name]`, 'DHL Versand');
      params.set(`line_items[${i}][price_data][unit_amount]`, '500');
      params.set(`line_items[${i}][quantity]`, '1');
      i++;
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
