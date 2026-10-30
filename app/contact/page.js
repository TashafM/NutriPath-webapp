import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { BUSINESS } from "../business";
import LegalPage from "../legal";

export const metadata = { title: "Contact Us | The NutriPath" };

export default function Contact() {
  const items = [
    { Icon: Mail, label: "Email", value: BUSINESS.email, href: `mailto:${BUSINESS.email}` },
    { Icon: Phone, label: "Phone", value: BUSINESS.phone, href: BUSINESS.phoneHref },
    { Icon: Clock, label: "Hours", value: BUSINESS.hours },
    { Icon: MapPin, label: "Address", value: BUSINESS.address },
  ];
  return (
    <LegalPage path="/contact" showUpdated={false} title="Contact Us" intro="Questions about a plan, a payment or your account? We’re happy to help.">
      <ul className="contact-list">
        {items.map(({ Icon, label, value, href }) => (
          <li key={label}>
            <span className="contact-icon"><Icon size={20} /></span>
            <span><small>{label}</small>{href ? <a href={href}>{value}</a> : <strong>{value}</strong>}</span>
          </li>
        ))}
      </ul>
      <p>{BUSINESS.name} is run by {BUSINESS.owner}.</p>
    </LegalPage>
  );
}
