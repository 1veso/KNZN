// functions/stripe-webhook.js
// Handles Stripe webhook — saves completed orders to Supabase

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        // Basic rate limiting using Cloudflare KV (if available)
        const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';
        if (env.RATE_LIMIT_KV) {
            const key = `webhook_rl:${clientIP}`;
            const count = parseInt(await env.RATE_LIMIT_KV.get(key) || '0', 10);
            if (count >= 30) {
                return new Response('Rate limit exceeded', { status: 429 });
            }
            await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 60 });
        }

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

            // Sanitize metadata before inserting into database
            const sanitize = (val, maxLen = 255) =>
                String(val || '').replace(/<[^>]*>/g, '').slice(0, maxLen);

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
                    plate_text: sanitize(meta.plateText, 20),
                    plate_format: sanitize(meta.plateFormat, 30),
                    buyer_name: sanitize(meta.buyerName, 100),
                    buyer_email: sanitize(session.customer_email, 254),
                    buyer_phone: sanitize(meta.buyerPhone, 20),
                    buyer_address: sanitize(meta.buyerAddress, 255),
                    stripe_session_id: sanitize(session.id, 100),
                    payment_status: 'paid',
                    fulfilled: false
                })
            });

            if (!supabaseRes.ok) {
                const supaErr = await supabaseRes.text();
                console.error('Supabase insert error:', supaErr);
                return new Response('DB error', { status: 500 });
            }

            console.log('Order saved:', sanitize(meta.plateText, 20));
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

        // Reject signatures older than 5 minutes to prevent replay attacks
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

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

        // Timing-safe comparison to prevent timing attacks
        if (expectedSig.length !== sig.length) return false;
        let mismatch = 0;
        for (let i = 0; i < expectedSig.length; i++) {
            mismatch |= expectedSig.charCodeAt(i) ^ sig.charCodeAt(i);
        }
        return mismatch === 0;
    } catch {
        return false;
    }
}