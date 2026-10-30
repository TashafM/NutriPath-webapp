import { BUSINESS } from "../business";
import LegalPage from "../legal";

export const metadata = { title: "Privacy Policy | The NutriPath" };

export default function Privacy() {
  return (
    <LegalPage path="/privacy" title="Privacy Policy" intro={`This policy explains what personal information ${BUSINESS.name} collects, why, and how we keep it safe. We collect only what we need to look after you.`}>
      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your email address, and your name if you log in with Google.</li>
        <li><strong>Free session requests:</strong> your name, phone number, and optionally your email, goal, best time to call and any message you write.</li>
        <li><strong>Payment details:</strong> the plan you bought, amount, date, payment ID, and the email and phone number you enter at checkout. Card, UPI and bank details are handled by Razorpay and never reach us.</li>
        <li><strong>Health information you share:</strong> such as medical history, weight, food preferences and routine, so we can personalise your plan.</li>
        <li><strong>Technical data:</strong> your IP address when you submit a form, used only to prevent spam and abuse.</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To create and deliver your personalised plan and follow-ups.</li>
        <li>To call you back about a free session you asked for.</li>
        <li>To process payments and keep records required by law.</li>
        <li>To send login codes and important messages about your plan.</li>
        <li>To keep the website secure and stop spam.</li>
      </ul>
      <p>We do not sell your information, and we do not use it for advertising.</p>

      <h2>3. Health information</h2>
      <p>Your health information is treated as sensitive. It is seen only by your nutritionist, {BUSINESS.owner}, and is used only to plan and support your nutrition. We do not share it with anyone else unless you ask us to, or the law requires it.</p>

      <h2>4. Service providers</h2>
      <p>We use trusted services to run the website. They process data only to provide their service to us:</p>
      <ul>
        <li><strong>Supabase</strong> – secure database and login.</li>
        <li><strong>Razorpay</strong> – payment processing.</li>
        <li><strong>Google</strong> – “Continue with Google” login, if you choose it.</li>
        <li><strong>Our email provider</strong> – sending login codes.</li>
        <li><strong>Our hosting provider</strong> – running the website.</li>
      </ul>

      <h2>5. Cookies and local storage</h2>
      <p>We use your browser’s storage only to keep you logged in. We do not use advertising or tracking cookies.</p>

      <h2>6. How long we keep it</h2>
      <p>We keep your account and plan records while your account is active, and payment records for as long as Indian tax law requires. Free session requests that do not lead to a plan are deleted when no longer needed. You can ask us to delete your data at any time (see below).</p>

      <h2>7. Security</h2>
      <p>Data is stored in a secured database with access limited to authorised people, and the website uses an encrypted (HTTPS) connection. No system is perfectly secure, but we take reasonable steps to protect your information.</p>

      <h2>8. Your rights</h2>
      <p>You can ask to see, correct or delete the personal information we hold about you, or withdraw your consent, by emailing <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>. We will respond within 30 days. Deleting your data may mean we can no longer provide your plan.</p>

      <h2>9. Children</h2>
      <p>Plans for children are arranged with, and paid for by, a parent or guardian, who provides the child’s information on their behalf.</p>

      <h2>10. Changes</h2>
      <p>We may update this policy. The “Last updated” date at the top shows the latest version.</p>

      <h2>11. Contact</h2>
      <p>For any privacy question, contact {BUSINESS.owner} at <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>, {BUSINESS.address}.</p>
    </LegalPage>
  );
}
