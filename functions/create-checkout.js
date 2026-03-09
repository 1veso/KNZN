// functions/create-checkout.js
// Cloudflare Pages Function — runs server-side, secrets are safe here

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const {
            plateText, plateFormat, material, size,
            addons, totalAmount,
            buyerName, buyerEmail, buyerPhone, buyerAddress
        } = body;

        // Build Stripe line items from order
        const lineItems = [];

        // Kennzeichen
        lineItems.push({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: `Kennzeichen ${plateText} (${material === 'carbon' ? 'Carbon' : 'Standard'}, ${size === 'klein' ? '460×110mm' : '520×110mm'})`,
                    description: '2 Schilder, DIN-zertifiziert'
                },
                unit_amount: material === 'carbon' ? 2000 : 1000,
            },
            quantity: 1,
        });

        // Add-ons
        if (addons.zulassung) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: { name: 'KFZ Zulassung', description: 'Anmeldung / Ummeldung / Abmeldung' },
                    unit_amount: 2000,
                },
                quantity: 1,
            });
        }

        if (addons.plakette) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: { name: 'Umweltplakette', description: 'Grüne Umweltplakette' },
                    unit_amount: 500,
                },
                quantity: 1,
            });
        }

        if (addons.versand) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: { name: 'DHL Versand', description: 'Deutschlandweiter Versand' },
                    unit_amount: 500,
                },
                quantity: 1,
            });
        }

        // Determine success URL base
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;

        // Create Stripe Checkout Session
        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'payment_method_types[]': 'card',
                'customer_email': buyerEmail,
                'mode': 'payment',
                'success_url': `${baseUrl}/?success=1&session_id={CHECKOUT_SESSION_ID}`,
                'cancel_url': `${baseUrl}/`,
                'metadata[plateText]': plateText,
                'metadata[plateFormat]': plateFormat,
                'metadata[buyerName]': buyerName,
                'metadata[buyerPhone]': buyerPhone,
                'metadata[buyerAddress]': buyerAddress,
                ...lineItems.reduce((acc, item, i) => {
                    acc[`line_items[${i}][price_data][currency]`] = item.price_data.currency;
                    acc[`line_items[${i}][price_data][product_data][name]`] = item.price_data.product_data.name;
                    if (item.price_data.product_data.description) {
                        acc[`line_items[${i}][price_data][product_data][description]`] = item.price_data.product_data.description;
                    }
                    acc[`line_items[${i}][price_data][unit_amount]`] = item.price_data.unit_amount;
                    acc[`line_items[${i}][quantity]`] = item.quantity;
                    return acc;
                }, {})
            }).toString()
        });

        if (!stripeRes.ok) {
            const stripeErr = await stripeRes.json();
            console.error('Stripe error:', stripeErr);
            return new Response(JSON.stringify({ error: 'Stripe-Fehler: ' + stripeErr.error?.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const session = await stripeRes.json();

        return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (err) {
        console.error('Checkout function error:', err);
        return new Response(JSON.stringify({ error: 'Interner Fehler' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}