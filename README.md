# The NutriPath — Premium Nutrition Landing Page

A bespoke, responsive editorial-luxury landing page for a nutrition and wellness practice, built with Next.js App Router, JavaScript, and Tailwind CSS v4 (with custom CSS for precise art direction).

## Included
- Responsive desktop, tablet, and mobile layouts
- Sticky header and accessible mobile navigation
- Editorial visual system: warm ivory, olive charcoal, terracotta, serif headlines
- Service sections for weight management, PCOS nutrition, healthy weight gain, and everyday nutrition
- WhatsApp inquiry links with prefilled message copy
- Process, philosophy, about, and conversion-focused CTA sections
- Metadata and reduced-motion support

## Run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Before launch
1. Replace `91XXXXXXXXXX` in `app/page.js` with the client's WhatsApp number, including country code and digits only.
2. Replace the generic about copy with the nutritionist's real bio, qualifications, and credentials.
3. Replace the portrait placeholder image with an approved portrait of the nutritionist.
4. Review all service descriptions with the nutritionist; do not imply medical outcomes or guaranteed results.
5. For production, download/host licensed images locally and load fonts locally or via the selected font provider.
6. Add a privacy notice and consent language if collecting any personal or health information later.

The current implementation is a polished frontend starter. It does not collect patient health data, process payments, or include a booking calendar/CMS.

## Payments (Razorpay + Supabase)
1. In Supabase, open SQL Editor and run `supabase.sql` to create the `orders` table.
2. Copy `.env.example` to `.env.local` and fill in the Razorpay keys (Dashboard > Account & Settings > API Keys) and Supabase URL + service role key (Project Settings > API).
3. In Razorpay Dashboard > Webhooks, add `https://<your-domain>/api/razorpay/webhook` with the `payment.captured` event, and use the same secret as `RAZORPAY_WEBHOOK_SECRET`.
4. Plan prices live in `app/plans.js`; the server charges the `amount` there, never a price sent by the browser.
5. Test with `rzp_test_` keys first, then switch to live keys.
