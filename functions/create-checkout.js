/**
 * KNZN – Cloudflare Pages Function
 * POST /functions/create-checkout
 *
 * ISSUE 5 — Stripe Checkout session creation
 * Reads STRIPE_SECRET_KEY from context.env (Cloudflare Pages pattern).
 */

export async function onRequestPost(context) {
  // 1. Read secret from Cloudflare Pages environment
  const stripeKey = context.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return new Response(
      JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Parse request body
  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { plateText, type, quantity, price } = body;
  if (!plateText || !price) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: plateText, price' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Derive URLs from request origin
  const origin = context.request.headers.get('origin') ?? '';

  // 4. Build Stripe checkout session via REST API
  const lineItems = [
    {
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Kennzeichen ${plateText}${type && type !== 'standard' ? ` (${type})` : ''}`,
        },
        // price is in EUR; Stripe expects integer cents
        unit_amount: Math.round(price * 100),
      },
      quantity: quantity || 1,
    },
  ];

  // Encode as application/x-www-form-urlencoded for the Stripe API
  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${origin}/?success=1`);
  params.append('cancel_url',  `${origin}/`);

  lineItems.forEach((item, i) => {
    params.append(`line_items[${i}][price_data][currency]`,                  item.price_data.currency);
    params.append(`line_items[${i}][price_data][product_data][name]`,        item.price_data.product_data.name);
    params.append(`line_items[${i}][price_data][unit_amount]`,               String(item.price_data.unit_amount));
    params.append(`line_items[${i}][quantity]`,                              String(item.quantity));
  });

  let stripeRes;
  try {
    stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Stripe request failed: ${err.message}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const session = await stripeRes.json();

  if (!stripeRes.ok) {
    return new Response(
      JSON.stringify({ error: session.error?.message ?? 'Stripe error' }),
      { status: stripeRes.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 5. Return the checkout URL to the client
  return new Response(
    JSON.stringify({ url: session.url }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
