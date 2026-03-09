// config.js — public config only, secrets stay in Cloudflare env vars
const CONFIG = {
    stripePublishableKey: typeof STRIPE_PUBLISHABLE_KEY !== 'undefined' ? STRIPE_PUBLISHABLE_KEY : '',
    supabaseUrl: typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '',
    supabaseAnonKey: typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : '',
};