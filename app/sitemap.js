import { POLICY_LINKS } from "./business";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nutripath.in";

// Served at /sitemap.xml. Only public pages; login, dashboard and admin stay out.
export default function sitemap() {
  return [
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    ...POLICY_LINKS.map((link) => ({ url: `${SITE}${link.href}`, changeFrequency: "yearly", priority: 0.3 })),
  ];
}
