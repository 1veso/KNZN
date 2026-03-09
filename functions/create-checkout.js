export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json();
  const { plateText, plateFormat, material, addons, totalAmount } = body;

  const lineItems = [];

  lineItems.push({
    price_data: {
      currency: 'eur',
      product_data: { name: `2 Kennzeichen (${material === 'carbon' ? 'Carbon' : 'Standard'}) — ${plateText}` },
      unit_amount: material === 'carbon' ? 2000 : 1000,
    },
    quantity: 1,
  });

  if (addons.zulassung) lineItems.push({
    price_data: { currency: 'eur', product_data: { name: 'KFZ Zulassung' }, unit_amount: 2000 },
    quantity: 1,
  });

  if (addons.plakette) lineItems.push({
    price_data: { currency: 'eur', product_data: { name: 'Umweltplakette' }, unit_amount: 500 },
    quantity: 1,
  });

  if (addons.versand) lineItems.push({
    price_data: { currency: 'eur', product_data: { name: 'DHL Versand' }, unit_amount: 500 },
    quantity: 1,
  });

  const origin = new URL(request.url).origin;

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      mode: 'payment',
      'line_items[0][price_data][currency]': 'eur',
      'success_url': `${origin}/?success=1`,
      'cancel_url': `${origin}/`,
      ...buildStripeParams(lineItems),
    }),
  });

  const session = await stripeRes.json();
  if (!stripeRes.ok) return new Response(JSON.stringify({ error: session.error?.message }), { status: 500 });
  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function buildStripeParams(lineItems) {
  const params = {};
  lineItems.forEach((item, i) => {
    params[`line_items[${i}][price_data][currency]`] = item.price_data.currency;
    params[`line_items[${i}][price_data][product_data][name]`] = item.price_data.product_data.name;
    params[`line_items[${i}][price_data][unit_amount]`] = item.price_data.unit_amount;
    params[`line_items[${i}][quantity]`] = item.quantity;
  });
  return params;
}
