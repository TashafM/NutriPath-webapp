"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, CircleCheck, Clock, IndianRupee, Receipt, LogOut, MessageCircle, Sparkles, UserRound } from "lucide-react";
import { BUSINESS } from "../business";
import { isActivePlan, planEnd, planOf } from "../plans";
import LogoutButton from "../logout-button";
import { supabase } from "../shared";

const DAY = 24 * 60 * 60 * 1000;
const formatDate = (date) => date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const rupees = (amount) => `₹${amount.toLocaleString("en-IN")}`;

function planDates(plans, order) {
  const paidAt = order.paid_at;
  const start = new Date(paidAt);
  const end = planEnd(paidAt);
  const totalDays = Math.round((end - start) / DAY);
  const dayNumber = Math.min(totalDays, Math.max(1, Math.ceil((Date.now() - start) / DAY)));
  return { start, end, totalDays, dayNumber, daysLeft: totalDays - dayNumber, active: isActivePlan(plans, order) };
}

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
};

const Skeleton = ({ width = "100%", height = 14 }) => <span className="skeleton" style={{ width, height }} aria-hidden="true" />;

function Header({ user }) {
  const name = user?.user_metadata?.full_name || user?.email || "";
  return (
    <header className="ud-header">
      <div className="ud-container">
        <Link className="brand-logo" href="/" aria-label="The NutriPath home"><Image src="/logo.png" alt="The NutriPath, Areeba Asad, Nutritionist" width={760} height={197} /></Link>
        <nav className="ud-nav" aria-label="Account">
          <Link href="/#services">Plans</Link>
          <Link href="/contact">Help</Link>
        </nav>
        {user && (
          <div className="ud-user">
            <span className="dash-avatar" aria-hidden="true">{name[0]?.toUpperCase()}</span>
            <span className="ud-user-text"><strong>{user.user_metadata?.full_name || "My account"}</strong><small>{user.email}</small></span>
            <LogoutButton className="ud-logout"><LogOut size={17} /></LogoutButton>
          </div>
        )}
      </div>
    </header>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return window.location.replace("/login?next=/dashboard");
      // Admins don't have a client dashboard.
      const admin = await fetch("/api/admin?check", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (admin.ok) return window.location.replace("/admin");
      setUser(session.user);
      // RLS returns only this user's rows.
      const [{ data }, { data: planRows }] = await Promise.all([
        supabase.from("orders").select("*").eq("status", "paid").order("paid_at", { ascending: false }),
        supabase.from("plans").select("*"),
      ]);
      setPlans(planRows ?? []);
      setOrders(data ?? []);
    });
  }, []);

  if (!orders) {
    return (
      <div className="ud" aria-busy="true">
        <Header />
        <section className="ud-hero"><div className="ud-container"><Skeleton width={180} height={12} /><Skeleton width={320} height={40} /><Skeleton width={260} height={14} /></div></section>
        <div className="ud-container ud-layout"><div className="ud-card"><Skeleton height={220} /></div><div className="ud-card"><Skeleton height={160} /></div></div>
      </div>
    );
  }

  const firstName = user.user_metadata?.full_name?.split(" ")[0];
  const withDates = orders.map((order) => ({ order, plan: planOf(plans, order), ...planDates(plans, order) }));
  const activePlans = withDates.filter((item) => item.active);
  const stats = [
    { Icon: Sparkles, label: "Active plans", value: activePlans.length },
    { Icon: Receipt, label: "Payments", value: orders.length, hint: orders.length ? `${rupees(orders.reduce((sum, order) => sum + order.amount, 0))} in total` : null },
    { Icon: CalendarDays, label: "Member since", value: formatDate(new Date(user.created_at)) },
  ];

  return (
    <div className="ud">
      <Header user={user} />

      <section className="ud-hero">
        <div className="ud-container">
          <span className="ud-eyebrow">MY NUTRIPATH · {formatDate(new Date()).toUpperCase()}</span>
          <h1>{greeting()}{firstName ? `, ${firstName}` : ""}. <em>Here’s your path.</em></h1>
          <p>{activePlans.length ? "Everything about your plan, in one place." : "You don’t have an active plan right now. Pick one whenever you’re ready."}</p>
          <div className="ud-stats">
            {stats.map(({ Icon, label, value, hint }) => (
              <div className="ud-stat" key={label}>
                <span className="ud-stat-icon"><Icon size={18} /></span>
                <span><small>{label}</small><strong>{value}</strong>{hint && <em>{hint}</em>}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="ud-container ud-layout">
        <main className="ud-main">
          <div className="ud-section-head"><h2>Your plans</h2>{activePlans.length > 0 && <Link className="ud-link" href="/#services">Explore more <ArrowRight size={15} /></Link>}</div>

          {activePlans.map(({ order, plan, start, end, totalDays, dayNumber, daysLeft }) => (
            <article className="ud-plan" key={order.id}>
              {plan?.image && <img className="ud-plan-image" src={plan.image} alt={plan.image_alt || plan.title} />}
              <div className="ud-plan-body">
                <span className="ud-status"><span className="ud-dot" /> Active</span>
                <h3>{order.plan}</h3>
                <div className="ud-progress">
                  <div className="ud-progress-row"><strong>Day {dayNumber} <span>of {totalDays}</span></strong><span>{daysLeft} {daysLeft === 1 ? "day" : "days"} left</span></div>
                  <div className="dash-progress-track"><div style={{ width: `${(dayNumber / totalDays) * 100}%` }} /></div>
                </div>
                <div className="ud-chips">
                  <span><CalendarDays size={14} /> Started {formatDate(start)}</span>
                  <span><Clock size={14} /> Ends {formatDate(end)}</span>
                  <span><IndianRupee size={14} /> {rupees(order.amount)}</span>
                </div>
                {plan?.features?.length > 0 && (
                  <ul className="plan-features ud-features">{plan.features.map((feature) => <li key={feature}><CircleCheck size={16} />{feature}</li>)}</ul>
                )}
              </div>
            </article>
          ))}

          {!activePlans.length && (
            <section className="ud-card ud-empty">
              <span className="ud-empty-icon"><Sparkles size={26} /></span>
              <h3>Start your journey</h3>
              <p>Choose a plan that fits your goals. Personalised meal plans and regular follow-ups included.</p>
              <Link className="button button-dark plan-buy" href="/#services">Explore plans <ArrowRight size={16} /></Link>
            </section>
          )}

          {orders.length > 0 && (
            <section className="ud-history">
              <div className="ud-section-head"><h2>Payment history</h2></div>
              <div className="dash-table-wrap">
                <table className="dash-table admin-table">
                  <thead><tr><th>Plan</th><th>Paid on</th><th>Amount</th><th>Payment ID</th><th>Status</th></tr></thead>
                  <tbody>
                    {withDates.map(({ order, plan, active }) => (
                      <tr key={order.id}>
                        <td className="admin-cell-main">{order.plan}</td>
                        <td data-label="Paid on">{formatDate(new Date(order.paid_at))}</td>
                        <td data-label="Amount">{rupees(order.amount)}</td>
                        <td data-label="Payment ID" className="dash-mono">{order.payment_id}</td>
                        <td data-label="Status"><span className={active ? "dash-pill" : "dash-pill dash-pill-muted"}>{active ? "Active" : plan?.period === "session" ? "Session" : "Completed"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>

        <aside className="ud-aside">
          <section className="ud-card ud-coach">
            <span className="ud-eyebrow">YOUR NUTRITIONIST</span>
            <div className="ud-coach-head"><span className="dash-avatar ud-coach-avatar"><UserRound size={20} /></span><div><strong>{BUSINESS.owner}</strong><small>Nutritionist &amp; Health Coach</small></div></div>
            <a className="ud-whatsapp" href={`${BUSINESS.whatsapp}?text=${encodeURIComponent(`Hi ${BUSINESS.owner.split(" ")[0]}, I'm ${user.user_metadata?.full_name || user.email} and I have a question about my plan.`)}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Chat on WhatsApp</a>
          </section>
          <section className="ud-card ud-promo">
            <h3>Looking for something else?</h3>
            <p>PCOS, thyroid, pregnancy and more. Find the plan that fits your next goal.</p>
            <Link className="button ud-promo-button" href="/#services">Browse plans <ArrowRight size={16} /></Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
