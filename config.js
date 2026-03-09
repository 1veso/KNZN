// config.js
// Public config only — secrets live in Cloudflare environment variables
const CONFIG = {
    stripePublishableKey: window.STRIPE_PUBLISHABLE_KEY || '',
    supabaseUrl: window.SUPABASE_URL || '',
    supabaseAnonKey: window.SUPABASE_ANON_KEY || '',
};