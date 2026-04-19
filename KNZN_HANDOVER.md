# Zulassungsdienst Düren — KNZN Website

A complete license plate configuration, ordering, and registration service website for Zulassungsdienst Düren (Geier & Ayhan OHG), operating from Weierstraße 10, 52349 Düren.

Deployed on Cloudflare Pages. Built as a single-page application with vanilla HTML, CSS, and JavaScript. Backend via Cloudflare Pages Functions. Payment via Stripe. Customer data via Supabase. Email automation via Brevo. AI customer service via OpenRouter proxy.

---

## What the site does

A customer visits the site, configures their desired license plate (Wunschkennzeichen) through an interactive preview that renders in real time, chooses size and material (standard or carbon), adds optional services (registration at the Straßenverkehrsamt, environmental sticker, DHL shipping), and completes checkout via Stripe. The site handles email capture, order confirmation, legal compliance, and post-purchase confirmation — all end to end.

The entire customer journey is designed to replace a 45-minute in-person visit to the Straßenverkehrsamt with a 3-minute online configuration and a DHL delivery.

---

## Architecture overview

**Frontend**
- Single-page `index.html` with vanilla HTML, CSS, and JavaScript
- No framework. No build step. Deploys as static files to Cloudflare Pages edge network.
- Canvas-based live plate rendering (EU blue strip with 12 gold stars, D country code, German font matching DIN Mittelschrift, city code, seal positions, and optional suffix badges for Elektro/Oldtimer/Saisonal plates)
- GSAP ScrollTrigger used for the vertical step indicator and scroll-driven animations
- Lottie for service icons and DIN certification animation

**Backend**
- Cloudflare Pages Functions in `/functions/` directory
- `POST /create-checkout` — validates plate configuration, creates Stripe Checkout session, returns redirect URL
- `POST /stripe-webhook` — receives Stripe completion events, writes to Supabase orders table
- `POST /api/chat` — server-side proxy to OpenRouter for Klaus AI chatbot (keeps API key off the client)

**Data**
- Supabase — `leads` and `orders` tables with row-level security and service-role access
- Brevo — post-purchase email automation (customer confirmation)
- Cloudflare Pages environment variables — all API keys and secrets

**Third-party integrations**
- Stripe — EUR checkout, three product tiers reflecting plate-only, add-on combinations, and the Komplettpaket (€30 full service)
- OpenRouter — Klaus chatbot using Meta Llama 3.1 8B (free tier) with a $5/month spend cap for safety
- DHL — referenced in shipping copy, actual integration at the operations level
- Google Maps — embedded contact location iframe

---

## Key features

**Live plate configurator**
The canvas plate preview updates on every keystroke. Size (standard 520×110mm or klein 460×110mm), material (standard aluminum or carbon-look), and plate type (Standard, Elektro, Oldtimer, Saisonal) all reflect instantly in the preview. The preview is wrapped in a glassmorphic stage that gives the plate visual weight and brand presence.

**Animated hero and counters**
The hero features a static Audi image with subtle brightness and saturation tuning, a live typewriter animation cycling through plate examples (DN-AB-1234, DN-JH-42, DN-MX-500-E, DN-LB-88-H), and an animated €30 Komplettpaket mini-bar that slides in after page load. Bento statistics counters (450+ KFZ, 150+ customers, 2+ years, 100% reliable) animate from zero when the "Warum wir?" section enters the viewport.

**Klaus AI customer service**
A German-speaking chatbot embedded in the bottom right. Scoped to KFZ and Zulassung topics only. Refuses off-topic questions. Answers in ≤3 sentences. Calls `/api/chat` which proxies to OpenRouter with safety limits (40 messages max, 20,000 characters max per conversation) and the API key kept server-side.

**Vertical step indicator**
A scroll-driven three-step indicator (Konfigurieren → Extras → Bezahlen) appears on the right side once the user enters the configurator section. Lines between steps fill smoothly with gold as the user scrolls down and unfill when scrolling back up.

**Full legal compliance (German)**
Modal-based legal pages for Impressum, Datenschutz (DSGVO-compliant), AGB, Versand & Zahlung, FAQ, and Kontakt. All content owned by Zulassungsdienst Düren (Geier & Ayhan OHG). Accessible via footer links, keyboard-dismissible, scrollable.

**Premium Thank-You overlay**
Post-checkout, the user returns from Stripe with `?success=1` and sees a full-screen animated confirmation with a gold checkmark, success message, and a prominent call to action ("Noch ein Kennzeichen bestellen") that scrolls back to the configurator for multi-plate purchases.

**Owner portrait card**
The "Warum wir?" section features a large bento card with a portrait of Geier and Ayhan in business suits (half-body, neutral background) with their trust stats below. This leverages the power of a human face to build customer trust, especially in a traditionally bureaucratic industry.

**Wissen educational section**
Eight plate types explained with anatomical diagrams (Unterscheidungszeichen, Erkennungsnummer, Plaketten) and individual cards for Standard, Elektro, Oldtimer, Saisonal, Steuerbefreit, Sammler, Kurzzeit, Export plates — each with their own visual preview and German descriptions.

**Downloads section**
Real, functional PDFs for Vollmacht zur Zulassung and SEPA-Lastschriftmandat, downloadable with a subtle "Download gestartet" toast confirmation.

---

## Responsive design

Three breakpoints: 960px (tablet), 768px (large mobile), 480px (small mobile). All modals have 44px minimum tap targets, plate type cards reflow, hero mini-bar adjusts padding, options grid collapses to single column, and the vertical step indicator hides on mobile in favor of the mobile sticky checkout bar at the bottom.

---

## Security hardening

**Content Security**
- All XSS vectors closed. Klaus bot messages use `textContent` + `createElement` only. Zero `innerHTML` with user-controlled input.
- External links carry `rel="noopener noreferrer"`
- Sensitive console logs removed from production

**API key handling**
- OpenRouter key moved server-side to Cloudflare Pages environment variable (`OPENROUTER_API_KEY`)
- `/api/chat` function validates requests, caps conversation length, and forwards with the server-side key
- No API keys in client source

**Transport security**
- Lottie CDN script loads with SRI integrity hash (sha512) and crossorigin="anonymous"
- `_headers` file at repo root configures X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy for all responses
- HTTPS enforced by Cloudflare Pages

**Data handling**
- Stripe handles all payment data (PCI scope stays with Stripe)
- Supabase uses row-level security, only the service role (used by Cloudflare Functions) can write
- Customer emails captured optionally (skippable), used only for confirmations

---

## Technology stack summary

```
Frontend:     HTML / CSS / Vanilla JS / Canvas / GSAP / Lottie
Hosting:      Cloudflare Pages
Functions:    Cloudflare Pages Functions (Node runtime)
Payments:     Stripe Checkout
Database:     Supabase (Postgres)
Email:        Brevo (post-purchase automation)
AI chat:      OpenRouter → Meta Llama 3.1 8B, proxied server-side
Maps:         Google Maps embed
Analytics:    (ready for Plausible or similar)
```

---

## Environment variables required

Set in Cloudflare Pages dashboard under Settings → Environment Variables → Production:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
BREVO_API_KEY=xkeysib-...
OPENROUTER_API_KEY=sk-or-v1-...
```

Also set for Preview environment for staging deployments.

---

## Development

```bash
# Local static preview (no functions)
npx serve .

# Local with Cloudflare Functions support (for testing checkout, Klaus, webhooks)
npx wrangler pages dev .
```

---

## Future roadmap (post-handover opportunities)

**Phase 2 — operational enhancements**
- Admin dashboard for viewing orders, managing status, printing shipping labels
- Automated plate availability check against Wunschkennzeichen.de (currently manual)
- SMS notifications via Twilio for order status updates
- Customer portal for repeat customers with saved configurations

**Phase 3 — conversion enhancements**
- Cinematic scroll-scrub hero animation (hydraulic press plate stamping sequence, 600 frames, GSAP ScrollTrigger pinned canvas) — already prototyped, requires production deployment
- A/B testing framework on the Komplettpaket CTA and checkout flow
- Referral program integration
- Multi-language support (Turkish and Polish for Düren's demographic)

**Phase 4 — expansion**
- Multi-city rollout using the same architecture for other Zulassungsdienst operations
- Insurance cross-sell integration with Provinzial (the parent business)

---

## Handover notes

This site is built for long-term ownership by a non-technical operator. All customer-facing copy is editable directly in `index.html`. Legal content is centralized in `legal-content.js`. Pricing is in `app.js` at the top of the file in a clearly labeled constant. Color palette, typography, and spacing all live in CSS custom properties at the top of `style.css` for easy rebranding.

No build step. No framework lock-in. No vendor dependency beyond the standard Cloudflare Pages deployment. Any developer familiar with HTML/CSS/JavaScript can maintain this site.

Built April 2026.
