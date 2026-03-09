// functions/stripe-webhook.js
// Handles Stripe webhook — saves completed orders to Supabase

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        // Verify webhook signature
        const isValid = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
        if (!isValid) {
            return new Response('Invalid signature', { status: 401 });
        }

        const event = JSON.parse(body);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const meta = session.metadata || {};

            // Save order to Supabase
            const supabaseRes = await fetch(`${env.SUPABASE_URL}/rest/v1/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    plate_text: meta.plateText || '',
                    plate_format: meta.plateFormat || '',
                    buyer_name: meta.buyerName || '',
                    buyer_email: session.customer_email || '',
                    buyer_phone: meta.buyerPhone || '',
                    buyer_address: meta.buyerAddress || '',
                    stripe_session_id: session.id,
                    payment_status: 'paid',
                    fulfilled: false
                })
            });

            if (!supabaseRes.ok) {
                const supaErr = await supabaseRes.text();
                console.error('Supabase insert error:', supaErr);
                return new Response('DB error', { status: 500 });
            }

            console.log('Order saved:', meta.plateText, session.customer_email);
        }

        return new Response('ok', { status: 200 });

    } catch (err) {
        console.error('Webhook error:', err);
        return new Response('Error', { status: 500 });
    }
}

// Stripe signature verification using Web Crypto API (available in Cloudflare Workers)
async function verifyStripeSignature(payload, signature, secret) {
    try {
        if (!signature || !secret) return false;

        const parts = signature.split(',').reduce((acc, part) => {
            const [key, val] = part.split('=');
            acc[key] = val;
            return acc;
        }, {});

        const timestamp = parts['t'];
        const sig = parts['v1'];
        if (!timestamp || !sig) return false;

        const signedPayload = `${timestamp}.${payload}`;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const msgData = encoder.encode(signedPayload);

        const cryptoKey = await crypto.subtle.importKey(
            'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );

        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
        const expectedSig = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return expectedSig === sig;
    } catch {
        return false;
    }
}