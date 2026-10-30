import { Children, cloneElement, isValidElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BUSINESS, POLICY_LINKS } from "./business";

const slug = (text) => String(text).toLowerCase().replace(/^\d+\.\s*/, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const textOf = (node) => (typeof node === "string" ? node : Children.toArray(node?.props?.children).map(textOf).join(""));

// Shared layout for the policy and contact pages. Every <h2> gets an id and a link in "On this page".
export default function LegalPage({ title, intro, path, showUpdated = true, children }) {
  const toc = [];
  const body = Children.map(children, (child) => {
    if (!isValidElement(child) || child.type !== "h2") return child;
    const label = textOf(child);
    const id = slug(label);
    toc.push({ id, label });
    return cloneElement(child, { id });
  });

  return (
    <div className="legal">
      <header className="legal-header">
        <div className="legal-container">
          <Link className="brand-logo" href="/" aria-label="The NutriPath home"><Image src="/logo.png" alt="The NutriPath, Areeba Asad, Nutritionist" width={760} height={197} /></Link>
          <Link className="legal-back" href="/"><ArrowLeft size={15} /> Back to website</Link>
        </div>
      </header>

      <section className="legal-hero">
        <div className="legal-container">
          <span className="legal-eyebrow">LEGAL · {BUSINESS.name.toUpperCase()}</span>
          <h1>{title}</h1>
          {intro && <p className="legal-intro">{intro}</p>}
          {showUpdated && <p className="legal-updated">Last updated: {BUSINESS.updated}</p>}
        </div>
      </section>

      <div className="legal-container legal-layout">
        <aside className="legal-aside">
          {toc.length > 0 && (
            <nav aria-label="On this page">
              <span className="legal-aside-title">On this page</span>
              <ol>{toc.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.label.replace(/^\d+\.\s*/, "")}</a></li>)}</ol>
            </nav>
          )}
          <nav aria-label="Policies">
            <span className="legal-aside-title">Policies</span>
            <ul>{POLICY_LINKS.map((link) => <li key={link.href}><Link className={link.href === path ? "is-current" : ""} href={link.href}>{link.label}</Link></li>)}</ul>
          </nav>
        </aside>
        <main className="legal-body">{body}</main>
      </div>

      <footer className="legal-footer">
        <div className="legal-container">
          <nav aria-label="Policies">{POLICY_LINKS.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
          <span>© {new Date().getFullYear()} {BUSINESS.name}</span>
        </div>
      </footer>
    </div>
  );
}
