"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { discountPercent, hasDiscount, isActivePlan, periodLabel, planOf } from "./plans";
import { supabase } from "./shared";
import BookSessionDialog from "./book-session";
import { BUSINESS, POLICY_LINKS } from "./business";
import {
  Activity,
  Apple,
  ArrowRight,
  LogIn,
  Mail,
  MapPin,
  UserRound,
  Baby,
  Droplet,
  Facebook,
  HandHeart,
  HeartHandshake,
  Instagram,
  Smile,
  Sparkles,
  Users,
  Award,
  BadgeCheck,
  Brain,
  CalendarCheck,
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  CircleCheck,
  ChartNoAxesColumnIncreasing,
  Flower2,
  Leaf,
  LoaderCircle,
  Menu,
  Phone,
  Moon,
  Weight,
  X,
} from "lucide-react";

// One shared load: the background preload and a click never add the script twice.
let checkoutScript;
const loadCheckout = () => {
  checkoutScript ??= new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => {
      checkoutScript = null; // allow a retry
      reject();
    };
    document.body.appendChild(script);
  });
  return checkoutScript;
};

const postJson = (url, body, headers = {}) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

async function buyPlan(plan, setBuying) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return window.location.assign("/login?next=/%23services");
  setBuying(plan.id);
  try {
    // Load Razorpay's script and create the order at the same time.
    const [, res] = await Promise.all([loadCheckout(), postJson("/api/razorpay/order", { id: plan.id }, { Authorization: `Bearer ${session.access_token}` })]);
    if (res.status === 409) return window.location.assign("/dashboard"); // already has this plan active
    const order = await res.json();
    if (!res.ok) throw new Error(order.error);
    new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: "INR",
      name: "The NutriPath",
      description: `${plan.title} — ${periodLabel(plan)}`,
      prefill: { email: order.email },
      theme: { color: "#292d25" },
      handler: async (payment) => {
        const verified = await postJson("/api/razorpay/verify", payment);
        if (verified.ok) return window.location.assign("/dashboard");
        alert("Payment received, but we couldn't confirm it. Please contact us with your payment ID: " + payment.razorpay_payment_id);
      },
    }).open();
  } catch {
    alert("Could not start the payment. Please try again in a moment.");
  } finally {
    setBuying(null);
  }
}

const heroGoals = [
  { Icon: Weight, label: "Weight Loss" },
  { Icon: ChartNoAxesColumnIncreasing, label: "Weight Gain" },
  { Icon: Flower2, label: "PCOS Care" },
  { Icon: Activity, label: "Thyroid Care" },
];

const programIcons = { Droplet, Baby, HeartHandshake, HandHeart, Sparkles, Activity, Leaf, Weight, Flower2, Apple, Brain, Moon };

const credentials = ["Nutritionist", "Health Coach", "Hijama Practitioner", "Certified in Prophetic Medicine"];

const aboutStats = [
  { Icon: Users, value: "500+", label: "Happy Clients" },
  { Icon: ClipboardList, value: "1000+", label: "Plans Delivered" },
  { Icon: Award, value: "5+", label: "Years Experience" },
  { Icon: Smile, value: "95%", label: "Client Satisfaction" },
];

const steps = [
  { number: "01", title: "Start with your story", body: "We begin with your goals, routine, food preferences and what has—or hasn't—worked for you." },
  { number: "02", title: "Build your personal path", body: "Together, we shape practical nutrition steps around your life, rather than asking you to rebuild it overnight." },
  { number: "03", title: "Make progress, together", body: "Check-ins help you reflect, adjust and keep moving with support—not pressure or perfection." },
];

export default function Home({ plans }) {
  const featured = plans.filter((plan) => plan.featured);
  const more = plans.filter((plan) => !plan.featured);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePlans, setActivePlans] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [buying, setBuying] = useState(null); // plan id while its checkout is being prepared

  // Fetch Razorpay's checkout script in the background so "Enrol Now" opens faster.
  useEffect(() => {
    const idle = window.requestIdleCallback || ((callback) => setTimeout(callback, 1500));
    idle(() => loadCheckout().catch(() => {}));
  }, []);
  const bookingDialog = useRef(null);
  const openBooking = () => bookingDialog.current?.showModal();
  const [loggedIn, setLoggedIn] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setLoggedIn(true);
      // RLS returns only this user's rows.
      const { data } = await supabase.from("orders").select("plan, plan_id, paid_at").eq("status", "paid");
      setActivePlans((data ?? []).filter((order) => isActivePlan(plans, order)).map((order) => planOf(plans, order)?.id));
    });
  }, [plans]);

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#home" aria-label="The NutriPath home" onClick={closeMenu}>
          <Image className="nav-logo" src="/logo.png" alt="The NutriPath, Areeba Asad, Nutritionist" width={760} height={197} priority />
        </a>
        <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={menuOpen ? "main-nav nav-open" : "main-nav"} aria-label="Main navigation">
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#approach" onClick={closeMenu}>Our approach</a>
          <a href="#how-it-works" onClick={closeMenu}>How it works</a>
          <a href="/dashboard" onClick={closeMenu}>My plans</a>
          {loggedIn ? (
            <Link className="nav-cta" href="/dashboard"><UserRound size={18} /> My account <ArrowRight size={16} /></Link>
          ) : (
            <Link className="nav-cta" href="/login"><LogIn size={18} /> Login</Link>
          )}
        </nav>
      </header>

      <BookSessionDialog dialogRef={bookingDialog} plans={plans} />

      <section className="hero" id="home">
        <div className="hero-copy">
          <h1>A healthier,<br /><em>happier you.</em></h1>
          <span className="hero-rule" />
          <p className="hero-description">Personalised nutrition plans to help you manage weight, balance hormones and feel your best — without extreme diets.</p>
          <ul className="hero-goals">
            {heroGoals.map(({ Icon, label }) => <li key={label}><span className="hero-goal-icon"><Icon size={30} strokeWidth={1.4} /></span><span>{label.split(" ")[0]}<br />{label.split(" ").slice(1).join(" ")}</span></li>)}
          </ul>
          <div className="hero-actions">
            <a className="button button-dark hero-button" href="#services">Start My Plan <ArrowRight size={18} /></a>
            <button type="button" className="button hero-button hero-button-outline" onClick={openBooking}><CalendarCheck size={20} /> Book a Free Session</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image"><Image src="/hero.png" alt="Table of healthy meals: grain bowl with grilled chicken and avocado, avocado toast, berries, soup and a green smoothie" fill priority sizes="(max-width: 900px) 100vw, 40vw" /></div>
        </div>
      </section>

      <section className="manifesto section-pad" id="approach">
        <div className="manifesto-grid">
          <h2>Wellness isn’t<br />a finish line.<br /><em>It’s a relationship.</em></h2>
          <div className="manifesto-body">
            <p className="manifesto-lead">With food. With your body. With the life you’re living right now.</p>
            <p>We believe nutrition works best when it feels supportive, flexible and personal. No guilt-led rules or impossible routines—just thoughtful guidance that helps you make informed choices, one step at a time.</p>
            <a className="text-link" href="#services">Find your starting point <ArrowRight size={16} /></a>
          </div>
        </div>
        <div className="manifesto-bottom"><span className="manifesto-asterisk">✳</span><span>LESS PRESSURE. MORE UNDERSTANDING.<br /><strong>PROGRESS THAT FITS YOUR LIFE.</strong></span><div className="manifesto-rule" /></div>
      </section>

      <section className="services section-pad" id="services">
        <div className="services-heading"><h2>Your goals.<br /><em>Your kind of care.</em></h2><p>Different goals call for different kinds of support. Choose a plan that fits your needs and start your journey towards a healthier, happier you.</p></div>
        <div className="services-divider"><Leaf size={18} /></div>
        {!plans.length && (
          <p className="plans-unavailable">Our plans are being updated. <button type="button" className="text-link" onClick={openBooking}>Book a free session <ArrowRight size={16} /></button></p>
        )}
        <div className="plan-grid">
          {featured.map((service, index) => (
            <article className="plan-card" key={service.id} style={{ "--i": index }}>
              <div className="plan-media">
                {service.image && <img src={service.image} alt={service.image_alt || service.title} loading="lazy" />}
                <span className="plan-number">{String(index + 1).padStart(2, "0")}</span>
                {service.popular && <span className="plan-badge">MOST POPULAR</span>}
              </div>
              <div className="plan-body">
                <span className="service-tag">{service.tag}</span>
                <h3>{service.title}</h3>
                <p className="plan-description">{service.description}</p>
                <ul className="plan-features">
                  {service.features.map((feature) => <li key={feature}><CircleCheck size={17} />{feature}</li>)}
                </ul>
                <div className="plan-footer">
                  <div>{hasDiscount(service) && <span className="price-mrp"><s>₹{service.original_amount.toLocaleString("en-IN")}</s> <em>{discountPercent(service)}% off</em></span>}<strong>₹{service.amount.toLocaleString("en-IN")}</strong>{activePlans.includes(service.id) ? <span className="plan-active"><CircleCheck size={13} /> Active plan</span> : <span>{periodLabel(service)}</span>}</div>
                  {activePlans.includes(service.id) ? (
                    <Link className="button button-outline plan-buy" href="/dashboard">View plan <ArrowRight size={16} /></Link>
                  ) : (
                    <button type="button" className="button button-dark plan-buy" disabled={buying !== null} onClick={() => buyPlan(service, setBuying)}>{buying === service.id ? <><LoaderCircle size={16} className="spin" /> Opening…</> : <>Enrol Now <ArrowRight size={16} /></>}</button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
        {more.length > 0 && <div className="more-programs">
          <button type="button" className="button button-outline more-programs-toggle" aria-expanded={showMore} aria-controls="more-programs" onClick={() => setShowMore(!showMore)}>
            {showMore ? "Hide programs" : `More programs (${more.length})`} <ChevronDown size={17} className={showMore ? "chevron-up" : ""} />
          </button>
        </div>}
        {showMore && <div className="program-grid" id="more-programs">
          {more.map((service, index) => {
            const Icon = programIcons[service.icon] || Leaf;
            const active = activePlans.includes(service.id);
            return (
              <article className="program-card" key={service.id} style={{ "--i": index }}>
                <div className="program-head">
                  <span className="program-icon"><Icon size={24} strokeWidth={1.6} /></span>
                  <h4>{service.title}</h4>
                </div>
                <p className="program-price">{hasDiscount(service) && <s className="price-mrp-inline">₹{service.original_amount.toLocaleString("en-IN")}</s>}<strong>₹{service.amount.toLocaleString("en-IN")}</strong><span>/ {service.period === "session" ? "Session" : "Month"}</span>{hasDiscount(service) && <em className="price-off">{discountPercent(service)}% off</em>}</p>
                <p className="program-description">{service.description}</p>
                <ul className="plan-features program-features">{service.features.map((feature) => <li key={feature}><CircleCheck size={16} />{feature}</li>)}</ul>
                {active ? (
                  <Link className="button button-outline program-button" href="/dashboard"><CircleCheck size={15} /> Active · View plan</Link>
                ) : (
                  <button type="button" className="button button-dark program-button" disabled={buying !== null} onClick={() => buyPlan(service, setBuying)}>{buying === service.id ? <><LoaderCircle size={15} className="spin" /> Opening…</> : <>Enrol Now <ArrowRight size={15} /></>}</button>
                )}
              </article>
            );
          })}
        </div>}
        <p className="service-note"><Leaf size={14} />Your plan should reflect your individual needs. Nutrition support is not a substitute for medical diagnosis or treatment.</p>
      </section>

      <section className="quote-band">
        <div className="quote-image" role="img" aria-label="Fresh seasonal produce arranged in natural window light" />
        <div className="quote-content"><span className="quote-mark">“</span><blockquote>You don’t need to do everything differently. You just need a place to begin.</blockquote><span className="quote-caption">A SMALL STEP IS STILL A STEP.</span></div>
      </section>

      <section className="process section-pad" id="how-it-works">
        <div className="process-grid">
          <div className="process-intro"><h2>Small steps.<br /><em>Meaningful change.</em></h2><p>Nutrition should fit into your life—not become your whole life. Here’s how we make the process feel manageable.</p><button type="button" className="button about-cta" onClick={openBooking}><CalendarCheck size={17} /> Book a free session <ArrowRight size={16} /></button></div>
          <div className="steps-list">{steps.map((step) => <article className="step" key={step.number}><span className="step-number">{step.number}</span><div><h3>{step.title}</h3><p>{step.body}</p></div><Check className="step-check" size={18} /></article>)}</div>
        </div>
      </section>

      <section className="about section-pad" id="about">
        <div className="about-visual"><span className="about-frame" aria-hidden="true" /><div className="about-image"><Image src="/nutritionist.webp" alt="Nutritionist writing a weekly meal plan for a client, with a bowl of fresh fruit on the desk" fill sizes="(max-width: 900px) 100vw, 45vw" /></div><span className="about-image-label">A PERSONAL APPROACH, ALWAYS.</span><span className="about-orbit" aria-hidden="true"><Leaf size={26} strokeWidth={1.6} /></span></div>
        <div className="about-copy">
          <span className="service-tag">MEET YOUR NUTRITIONIST</span>
          <h2>Hi, I’m <em>Areeba Asad.</em></h2>
          <ul className="about-creds">{credentials.map((item) => <li key={item}><BadgeCheck size={17} />{item}</li>)}</ul>
          <p>Helping people of every age eat well and heal naturally, with plans built around your health, lifestyle and goals.</p>
          <div className="about-stats">{aboutStats.map(({ Icon, value, label }) => <div key={label}><Icon size={22} strokeWidth={1.5} /><strong>{value}</strong><span>{label}</span></div>)}</div>
          {/* <div className="about-signoff"><span className="signoff-line" /><span>Areeba Asad</span></div> */}
          <button type="button" className="button button-dark about-cta" onClick={openBooking}><CalendarCheck size={18} /> Free consultation <ArrowRight size={16} /></button>
        </div>
      </section>

      <section className="cta-section section-pad">
        <div className="cta-ornament">✳</div><span className="cta-eyebrow">YOUR NEXT CHAPTER CAN START SMALL</span><h2>Let’s find a path<br />that feels <em>like yours.</em></h2><p>Tell us what you’re working toward. We’ll help you understand the next step.</p><button type="button" className="button button-light" onClick={openBooking}><CalendarCheck size={17} /> Book a free session <ArrowRight size={17} /></button><span className="cta-footnote">NO PRESSURE. JUST A CONVERSATION.</span>
      </section>

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="footer-logo" href="#home" aria-label="The NutriPath home"><Image src="/logo.png" alt="The NutriPath, Areeba Asad, Nutritionist" width={760} height={197} /></a>

            <div className="footer-social">
              {[
                { label: "Instagram", Icon: Instagram, href: BUSINESS.instagram },
                { label: "Facebook", Icon: Facebook, href: BUSINESS.facebook },
                { label: "Email", Icon: Mail, href: `mailto:${BUSINESS.email}` },
              ].filter((item) => item.href).map(({ label, Icon, href }) => (
                <a key={label} href={href} aria-label={label} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"><Icon size={18} /></a>
              ))}
            </div>
          </div>
          <nav className="footer-col" aria-label="Explore">
            <h3>Explore</h3>
            <a href="#approach">Our approach</a>
            <a href="#services">Plans</a>
            <a href="#how-it-works">How it works</a>
            <a href="#about">About Areeba</a>
            <button type="button" className="footer-link-button" onClick={openBooking}>Book a free session</button>
          </nav>
          <nav className="footer-col" aria-label="Policies">
            <h3>Policies</h3>
            {POLICY_LINKS.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          </nav>
          <div className="footer-col footer-contact">
            <h3>Contact</h3>
            <a href={`mailto:${BUSINESS.email}`}><Mail size={16} />{BUSINESS.email}</a>
            <a href={BUSINESS.phoneHref}><Phone size={16} />{BUSINESS.phone}</a>
            <span><Clock size={16} />{BUSINESS.hours}</span>
            <span><MapPin size={16} />{BUSINESS.address}</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.</span>
          <a href="#home">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}
