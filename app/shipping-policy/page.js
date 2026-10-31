import Link from "next/link";
import { BUSINESS } from "../business";
import LegalPage from "../legal";

export const metadata = { title: "Shipping & Exchange Policy | The NutriPath" };

export default function ShippingPolicy() {
  return (
    <LegalPage path="/shipping-policy" title="Shipping & Exchange Policy" intro={`${BUSINESS.name} offers online nutrition plans and consultations. We do not sell or ship any physical products.`}>
      <h2>1. No physical shipping</h2>
      <p>All our plans and consultations are delivered digitally. Nothing is shipped to your address, so there are no shipping charges or delivery delays.</p>

      <h2>2. How your plan is delivered</h2>
      <ul>
        <li>Your plan starts as soon as your payment is confirmed. You can see it straight away under <strong>My plans</strong> after logging in to the website.</li>
        <li>Your personalised meal plan, guidance and follow-ups are shared with you online, by phone, email or WhatsApp, usually within 2 working days of payment.</li>
        <li>Consultations and sessions take place online or at a time agreed with you.</li>
      </ul>

      <h2>3. Exchange</h2>
      <p>Because our services are personalised and digital, a plan cannot be exchanged for another plan or transferred to another person once purchased. If you are unsure which plan suits you, please book a free session first.</p>

      <h2>4. Refunds and cancellations</h2>
      <p>Please see our <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link>.</p>

      <h2>5. Contact</h2>
      <p>If you have not received your plan details, email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or call <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>, {BUSINESS.hours}.</p>
    </LegalPage>
  );
}
