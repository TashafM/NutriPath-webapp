const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://thenutripath.in";

// Served at /robots.txt. Private and account pages are kept out of search results.
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/login", "/api/"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
