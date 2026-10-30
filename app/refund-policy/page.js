import { BUSINESS } from "../business";
import LegalPage from "../legal";

export const metadata = { title: "Refund & Cancellation Policy | The NutriPath" };

export default function RefundPolicy() {
  return (
    <LegalPage path="/refund-policy" title="Refund & Cancellation Policy" intro="Please read this before you buy a plan or book a consultation.">
      <h2>1. No refunds</h2>
      <p>All payments to {BUSINESS.name} are final and <strong>non-refundable</strong>. This applies to monthly plans and to session-based consultations, including when a plan has started, a consultation has taken place, or a personalised plan has been shared. If you are unsure which plan is right for you, please book a free session first.</p>

      <h2>2. Monthly plans</h2>
      <ul>
        <li>A monthly plan runs for one calendar month from the date of payment.</li>
        <li>Plans cannot be cancelled for a refund, paused, or moved to another person.</li>
        <li>Unused days or follow-ups do not carry over after the plan ends.</li>
      </ul>

      <h2>3. Consultations and sessions</h2>
      <ul>
        <li>You can <strong>reschedule</strong> a session if you tell us <strong>at least one day (24 hours) before</strong> the booked time.</li>
        <li>Sessions missed, or cancelled with less than one day’s notice, are counted as used.</li>
        <li>If we need to cancel or move a session, we will offer you a new time.</li>
      </ul>

      <h2>4. Payment problems</h2>
      <p>If you were charged twice for the same order, or money was deducted but the payment failed, contact us with your payment ID. After checking with Razorpay we will return the extra or failed amount to your original payment method. Banks usually take 5–7 working days to show it in your account.</p>

      <h2>5. How to reach us</h2>
      <p>To reschedule a session or report a payment problem, email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or call <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>, {BUSINESS.hours}.</p>
    </LegalPage>
  );
}
