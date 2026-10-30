import Link from "next/link";
import { BUSINESS } from "../business";
import LegalPage from "../legal";

export const metadata = { title: "Terms & Conditions | The NutriPath" };

export default function Terms() {
  return (
    <LegalPage path="/terms" title="Terms & Conditions" intro={`These terms apply when you use the website of ${BUSINESS.name} or buy any of our plans or consultations. By using the website or making a payment, you agree to them.`}>
      <h2>1. About us</h2>
      <p>{BUSINESS.name} is a nutrition and wellness practice run by {BUSINESS.owner}, based in {BUSINESS.address}. You can reach us at <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>.</p>

      <h2>2. Our services</h2>
      <p>We offer personalised nutrition plans, follow-up support, and consultations such as Hijama wellness and Prophetic Medicine guidance. What each plan includes, its price and its duration are shown on the website at the time you buy it.</p>
      <ul>
        <li>Monthly plans run for one calendar month from the date of payment.</li>
        <li>Session-based consultations are for one session each.</li>
        <li>Plans are personal to you and cannot be transferred to another person.</li>
      </ul>

      <h2>3. Not a substitute for medical care</h2>
      <p>Our guidance is about nutrition and lifestyle. It is not a medical diagnosis or treatment, and it does not replace advice from your doctor. Please tell us about any medical condition, medication, pregnancy or allergy before starting a plan, and keep following your doctor’s advice. Results depend on many personal factors, so we do not promise any specific outcome, such as a set amount of weight loss.</p>

      <h2>4. Your account</h2>
      <p>You log in with your email (one-time code) or Google account. Please give accurate details and keep access to your email and Google account secure. You are responsible for activity on your account.</p>

      <h2>5. Prices and payment</h2>
      <ul>
        <li>All prices are in Indian Rupees (INR).</li>
        <li>Payments are processed securely by Razorpay. We never see or store your full card or bank details.</li>
        <li>A plan starts once your payment is confirmed.</li>
        <li>We may change prices for future purchases. Changes do not affect a plan you have already paid for.</li>
      </ul>

      <h2>6. Refunds and cancellations</h2>
      <p>Payments are non-refundable. Session-based consultations can be rescheduled if you tell us at least one day before. See our <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link> for full details.</p>

      <h2>7. Free sessions</h2>
      <p>When you book a free session, we will call you on the number you give us to arrange a time. A free session is an introductory conversation and does not include a full personalised plan.</p>

      <h2>8. Your responsibilities</h2>
      <ul>
        <li>Share honest and complete information about your health and routine, so your plan is safe and suitable.</li>
        <li>Do not copy, resell or publish the plans and material we create for you.</li>
        <li>Do not misuse the website, for example by trying to access other people’s data or sending spam.</li>
      </ul>

      <h2>9. Intellectual property</h2>
      <p>The website content, design, logo and the plans we prepare belong to {BUSINESS.name}. You may use your plan for your own personal use only.</p>

      <h2>10. Limitation of liability</h2>
      <p>We take care to give safe, well-researched guidance. To the extent allowed by law, {BUSINESS.name} is not liable for any indirect loss, or for any harm caused by not following the plan as advised, by withholding health information, or by ignoring medical advice. Our total liability for any claim is limited to the amount you paid for the plan concerned.</p>

      <h2>11. Changes to these terms</h2>
      <p>We may update these terms from time to time. The “Last updated” date at the top shows when they last changed. Using the website after a change means you accept the updated terms.</p>

      <h2>12. Governing law</h2>
      <p>These terms are governed by the laws of India. Any dispute will be subject to the exclusive jurisdiction of the {BUSINESS.jurisdiction}.</p>

      <h2>13. Contact</h2>
      <p>Questions about these terms? Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or call <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>, {BUSINESS.hours}.</p>
    </LegalPage>
  );
}
