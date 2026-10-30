"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, CreditCard, ExternalLink, LayoutDashboard, LogOut, Mail, Menu, MessageCircle, Package, Search, Users, X } from "lucide-react";
import { supabase } from "../shared";
import LogoutButton from "../logout-button";
import PlansManager from "./plans-manager";
import { REQUEST_STATUSES } from "../requests";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const rupees = (amount) => `₹${amount.toLocaleString("en-IN")}`;
const displayName = (user) => user.name || user.email.split("@")[0];

const statusOf = (user) => (user.orders.some((order) => order.active) ? "active" : user.orders.length ? "expired" : "none");
const STATUS_LABEL = { active: "Active", expired: "Expired", none: "No plan" };
const FILTERS = [["all", "All"], ["active", "Active"], ["expired", "Expired"], ["none", "No plan"]];

const TABS = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "clients", label: "Clients", Icon: Users },
  { id: "payments", label: "Payments", Icon: CreditCard },
  { id: "requests", label: "Free sessions", Icon: CalendarCheck },
  { id: "plans", label: "Plans", Icon: Package },
];

function Pill({ status }) {
  return <span className={status === "active" ? "dash-pill" : "dash-pill dash-pill-muted"}>{STATUS_LABEL[status]}</span>;
}

// Phone comes from Razorpay checkout, so only clients who have paid have one; others get email.
function Contact({ user }) {
  const name = user.name ? user.name.split(" ")[0] : "there";
  const plan = user.orders[0]?.plan;
  const message = plan
    ? `Hi ${name}, this is The NutriPath team. Checking in on your ${plan} plan. How are things going?`
    : `Hi ${name}, this is The NutriPath team. Thanks for signing up! Can we help you find the right plan for your goals?`;
  const digits = user.phone.replace(/\D/g, "");
  if (digits) {
    return (
      <a className="admin-cta" href={`https://wa.me/${digits}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
        <MessageCircle size={15} /> WhatsApp
        <span className="admin-sub">{user.phone}</span>
      </a>
    );
  }
  return (
    <a className="admin-cta admin-cta-muted" href={`mailto:${user.email}?subject=${encodeURIComponent("Hello from The NutriPath")}&body=${encodeURIComponent(message)}`}>
      <Mail size={15} /> Email
      <span className="admin-sub">No phone yet</span>
    </a>
  );
}

// Fresh token per request: the admin page can stay open longer than one access token lasts.
async function adminFetch(path) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(path, { headers: { Authorization: `Bearer ${session?.access_token}` } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Could not load data");
  return body;
}

async function adminSend(path, method, data) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(path, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Could not save");
  return body;
}

const REQUEST_FILTERS = [["all", "All"], ["due", "Follow-up due"], ...REQUEST_STATUSES.map((status) => [status.value, status.label])];

// Status, call-back date and private note for one free session request; saves as soon as something changes.
function FollowUp({ request, today, onSaved }) {
  const [note, setNote] = useState(request.admin_note || "");
  const [error, setError] = useState("");
  const due = request.status === "call_later" && request.follow_up_on && request.follow_up_on <= today;

  async function save(changes) {
    setError("");
    try {
      onSaved((await adminSend("/api/admin/requests", "PATCH", { id: request.id, ...changes })).request);
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  return (
    <div className="follow-up">
      <select className={`status-select status-${request.status}`} value={request.status} aria-label={`Status for ${request.name}`} onChange={(e) => save({ status: e.target.value })}>
        {REQUEST_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
      </select>
      {request.status === "call_later" && (
        <label className={due ? "follow-date is-due" : "follow-date"}>
          <span>{due ? "Due" : "Call on"}</span>
          <input type="date" min={today} value={request.follow_up_on || ""} onChange={(e) => save({ follow_up_on: e.target.value })} />
        </label>
      )}
      <input className="follow-note" maxLength={500} placeholder="Add a note…" aria-label={`Note for ${request.name}`} value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (request.admin_note || "") && save({ admin_note: note })} />
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}

const Skeleton = ({ width = "100%", height = 14, round }) => <span className="skeleton" style={{ width, height, borderRadius: round ? 999 : undefined }} aria-hidden="true" />;

// Placeholder rows while a table page loads (they turn into cards on mobile like real rows).
function SkeletonRows({ columns }) {
  return Array.from({ length: 5 }, (_, row) => (
    <tr key={row} className="skeleton-row" aria-hidden="true">
      <td className="admin-sno"><Skeleton width={18} /></td>
      <td className="admin-cell-main"><Skeleton width={150} height={15} /><Skeleton width={110} height={11} /></td>
      {Array.from({ length: columns - 2 }, (_, cell) => <td key={cell}><Skeleton width={cell % 2 ? 70 : 100} /></td>)}
    </tr>
  ));
}

// First load: the whole admin layout in grey.
function PageSkeleton() {
  return (
    <div className="admin-shell" aria-busy="true" aria-label="Loading admin panel">
      <aside className="admin-side">
        <div className="admin-side-top"><span className="admin-logo"><span className="brand-logo"><Image src="/logo.png" alt="The NutriPath, Areeba Asad, Nutritionist" width={760} height={197} /></span><small>ADMIN PANEL</small></span></div>
        <div className="admin-nav skeleton-nav">{Array.from({ length: 5 }, (_, item) => <Skeleton key={item} height={38} />)}</div>
      </aside>
      <main className="admin-main">
        <Skeleton width={220} height={38} />
        <section className="admin-stats">{Array.from({ length: 4 }, (_, card) => <div className="admin-stat" key={card}><Skeleton width="60%" height={12} /><Skeleton width="45%" height={28} /></div>)}</section>
        <div className="admin-grid">
          {Array.from({ length: 2 }, (_, card) => (
            <section className="admin-card skeleton-card" key={card}>
              <Skeleton width={160} height={22} />
              {Array.from({ length: 4 }, (_, line) => <div className="skeleton-line" key={line}><Skeleton width={34} height={34} round /><div><Skeleton width="70%" /><Skeleton width="40%" height={11} /></div></div>)}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function Pagination({ page, total, pageSize, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const first = (page - 1) * pageSize + 1;
  return (
    <nav className="pager" aria-label="Pagination">
      <span className="admin-sub">Showing {first}–{Math.min(page * pageSize, total)} of {total}</span>
      <div className="pager-buttons">
        <button type="button" className="pager-button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /> Prev</button>
        <span className="pager-current">Page {page} of {pages}</span>
        <button type="button" className="pager-button" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">Next <ChevronRight size={16} /></button>
      </div>
    </nav>
  );
}

const LIST_TABS = ["clients", "payments", "requests"];

export default function Admin() {
  const [me, setMe] = useState(null);
  const [overview, setOverview] = useState(null);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState(""); // query, debounced
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [list, setList] = useState(null); // { view, items, total, page, pageSize, counts? }
  const [reload, setReload] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return window.location.replace("/login?next=/admin");
      const fromHash = window.location.hash.slice(1);
      if (TABS.some((item) => item.id === fromHash)) setTab(fromHash);
      setMe(session.user);
      try {
        const [summary, planList] = await Promise.all([adminFetch("/api/admin"), adminFetch("/api/admin/plans").catch(() => ({ plans: [] }))]);
        setPlans(planList.plans ?? []);
        setOverview(summary);
      } catch (loadError) {
        setError(loadError.message);
      }
    });
  }, []);

  // Wait for typing to pause before searching on the server.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!overview || !LIST_TABS.includes(tab)) return;
    let stale = false;
    const params = new URLSearchParams({ view: tab, page: String(page), q: search, filter });
    const key = params.toString();
    adminFetch(`/api/admin?${params}`)
      .then((body) => !stale && setList({ key, ...body }))
      .catch((loadError) => !stale && setList({ key, items: [], total: 0, page, pageSize: 10, error: loadError.message }));
    return () => { stale = true; };
  }, [overview, tab, page, search, filter, reload]);

  const openTab = (id) => {
    setTab(id);
    setMenuOpen(false);
    setQuery("");
    setSearch("");
    setFilter("all");
    setPage(1);
    window.history.replaceState(null, "", `#${id}`);
  };

  const chooseFilter = (value) => {
    setFilter(value);
    setPage(1);
  };

  if (error) {
    return (
      <main className="dash-loading">
        <div className="dash-empty">
          <h2>{error}</h2>
          <p>This page is only for NutriPath admins.</p>
          <Link className="button button-dark plan-buy" href="/">Back to home</Link>
        </div>
      </main>
    );
  }
  if (!overview) return <PageSkeleton />;

  const stats = [
    ["Total clients", overview.stats.clients],
    ["Active plans", overview.stats.activePlans],
    ["Revenue this month", rupees(overview.stats.revenueThisMonth)],
    ["Total revenue", rupees(overview.stats.revenueTotal)],
  ];
  const current = TABS.find((item) => item.id === tab);
  // Only show rows for the exact tab/page/search/filter on screen; anything else shows the skeleton.
  // (A silent refresh after saving keeps the same key, so it doesn't flash.)
  const listKey = new URLSearchParams({ view: tab, page: String(page), q: search, filter }).toString();
  const rows = list?.key === listKey ? list : null;
  const counts = list?.key?.startsWith(`view=${tab}&`) ? list.counts : null; // keep chip numbers while the next page loads
  const loadingRow = (columns) => !rows && <SkeletonRows columns={columns} />;
  const emptyRow = (columns, text) => rows && !rows.items.length && <tr><td colSpan={columns} className="admin-sub">{rows.error || text}</td></tr>;
  const serial = (index) => (rows.page - 1) * rows.pageSize + index + 1;
  const pager = rows && <Pagination page={rows.page} total={rows.total} pageSize={rows.pageSize} onPage={setPage} />;

  return (
    <div className="admin-shell">
      <aside className={menuOpen ? "admin-side is-open" : "admin-side"}>
        <div className="admin-side-top">
          <Link className="admin-logo" href="/" aria-label="The NutriPath home"><span className="brand-logo"><Image src="/logo.png" alt="The NutriPath, Areeba Asad, Nutritionist" width={760} height={197} /></span><small>ADMIN PANEL</small></Link>
          <button type="button" className="admin-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="admin-nav" aria-label="Admin">
          {TABS.map(({ id, label, Icon }) => (
            <button type="button" key={id} className={tab === id ? "admin-nav-item is-active" : "admin-nav-item"} onClick={() => openTab(id)}>
              <Icon size={18} /> {label}
            </button>
          ))}
          <div className="admin-nav-divider" />
          <Link className="admin-nav-item" href="/" target="_blank"><ExternalLink size={18} /> View website</Link>
        </nav>
        <div className="admin-side-user">
          <span className="dash-avatar" aria-hidden="true">{me.email[0].toUpperCase()}</span>
          <span className="admin-side-email">{me.email}</span>
          <LogoutButton className="admin-side-logout"><LogOut size={17} /></LogoutButton>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-head">
          <h1>{current.label}</h1>
          {LIST_TABS.includes(tab) && (
            <label className="admin-search"><Search size={16} /><input type="search" placeholder={tab === "clients" ? "Search name, email, phone or plan" : tab === "requests" ? "Search name, phone, email or goal" : "Search client, plan or payment ID"} value={query} onChange={(e) => setQuery(e.target.value)} /></label>
          )}
        </header>

        {tab === "overview" && (
          <>
            <section className="admin-stats">
              {stats.map(([label, value]) => <div className="admin-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
            </section>

            <div className="admin-grid">
              <section className="admin-card">
                <div className="admin-card-head"><h2>Recent payments</h2><button type="button" className="admin-link" onClick={() => openTab("payments")}>View all</button></div>
                {overview.recentPayments.length ? (
                  <ul className="admin-list">
                    {overview.recentPayments.map((order) => (
                      <li key={order.id}>
                        <span className="dash-avatar" aria-hidden="true">{displayName(order.user)[0].toUpperCase()}</span>
                        <span className="admin-list-main"><strong>{displayName(order.user)}</strong><span className="admin-sub">{order.plan} · {formatDate(order.paidAt)}</span></span>
                        <strong>{rupees(order.amount)}</strong>
                      </li>
                    ))}
                  </ul>
                ) : <p className="admin-sub">No payments yet.</p>}
              </section>

              <section className="admin-card">
                <div className="admin-card-head"><h2>Plans</h2></div>
                <table className="dash-table admin-table admin-plan-table">
                  <thead><tr><th>Plan</th><th>Active</th><th>Sold</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {overview.planBreakdown.map((plan) => (
                      <tr key={plan.title}><td className="admin-cell-main">{plan.title}</td><td data-label="Active">{plan.active}</td><td data-label="Sold">{plan.sold}</td><td data-label="Revenue">{rupees(plan.revenue)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          </>
        )}

        {tab === "clients" && (
          <section className="dash-section">
            <div className="admin-filters">
              {FILTERS.map(([value, label]) => (
                <button type="button" key={value} className={filter === value ? "admin-filter is-active" : "admin-filter"} onClick={() => chooseFilter(value)}>
                  {label} {counts && <span>{counts[value]}</span>}
                </button>
              ))}
            </div>
            <div className="dash-table-wrap">
              <table className="dash-table admin-table">
                <thead><tr><th className="admin-sno">S.No.</th><th>Client</th><th>Joined</th><th>Current plan</th><th>Paid on</th><th>Valid till</th><th>Status</th><th>Reach out</th></tr></thead>
                <tbody>
                  {rows?.items.map((user, index) => {
                    const latest = user.orders[0];
                    return (
                      <tr key={user.id}>
                        <td className="admin-sno">{serial(index)}</td>
                        <td className="admin-cell-main"><strong className="admin-name">{displayName(user)}</strong><span className="admin-sub">{user.email} · {user.provider === "google" ? "Google" : "Email"}</span></td>
                        <td data-label="Joined">{formatDate(user.joinedAt)}</td>
                        <td data-label="Current plan">{latest ? <span>{latest.plan}<span className="admin-sub">{rupees(latest.amount)}{user.orders.length > 1 ? ` · ${user.orders.length} purchases` : ""}</span></span> : "—"}</td>
                        <td data-label="Paid on">{formatDate(latest?.paidAt)}</td>
                        <td data-label="Valid till">{formatDate(latest?.validTill)}</td>
                        <td data-label="Status"><Pill status={statusOf(user)} /></td>
                        <td data-label="Reach out"><Contact user={user} /></td>
                      </tr>
                    );
                  })}
                  {loadingRow(8)}
                  {emptyRow(8, "No clients match.")}
                </tbody>
              </table>
            </div>
            {pager}
          </section>
        )}

        {tab === "requests" && (
          <section className="dash-section">
            <div className="admin-filters">
              {REQUEST_FILTERS.map(([value, label]) => (
                <button type="button" key={value} className={[filter === value ? "admin-filter is-active" : "admin-filter", value === "due" && counts?.due ? "is-alert" : ""].join(" ")} onClick={() => chooseFilter(value)}>
                  {label} {counts && <span>{counts[value] ?? 0}</span>}
                </button>
              ))}
            </div>
            <div className="dash-table-wrap">
              <table className="dash-table admin-table">
                <thead><tr><th className="admin-sno">S.No.</th><th>Name</th><th>Contact number</th><th>Follow-up</th><th>Requested</th><th>Goal</th><th>Best time</th><th>Message</th></tr></thead>
                <tbody>
                  {rows?.items.map((request, index) => (
                    <tr key={request.id}>
                      <td className="admin-sno">{serial(index)}</td>
                      <td className="admin-cell-main"><strong className="admin-name">{request.name}</strong><span className="admin-sub">{request.email || "No email"}</span></td>
                      <td data-label="Phone"><a className="admin-phone" href={`tel:${request.phone}`}>{request.phone.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2")}</a></td>
                      <td data-label="Follow-up" className="follow-cell">
                        <FollowUp
                          key={request.id + request.status + request.follow_up_on}
                          request={request}
                          today={rows.today}
                          onSaved={(updated) => {
                            setList((current) => ({ ...current, items: current.items.map((item) => (item.id === updated.id ? updated : item)) }));
                            setReload((count) => count + 1); // refresh chip counts
                          }}
                        />
                      </td>
                      <td data-label="Requested">{formatDate(request.created_at)}</td>
                      <td data-label="Goal">{request.goal || "Not sure yet"}</td>
                      <td data-label="Best time">{request.preferred_time || "Any time"}</td>
                      <td data-label="Message" className="admin-message">{request.message || <span className="admin-sub">—</span>}</td>
                    </tr>
                  ))}
                  {loadingRow(8)}
                  {emptyRow(8, search || filter !== "all" ? "No requests match." : "No free session requests yet.")}
                </tbody>
              </table>
            </div>
            {pager}
          </section>
        )}

        {tab === "plans" && <PlansManager plans={plans} setPlans={setPlans} />}

        {tab === "payments" && (
          <section className="dash-section">
            <div className="dash-table-wrap">
              <table className="dash-table admin-table">
                <thead><tr><th className="admin-sno">S.No.</th><th>Client</th><th>Plan</th><th>Amount</th><th>Paid on</th><th>Valid till</th><th>Payment ID</th><th>Status</th></tr></thead>
                <tbody>
                  {rows?.items.map((order, index) => (
                    <tr key={order.id}>
                      <td className="admin-sno">{serial(index)}</td>
                      <td className="admin-cell-main"><strong className="admin-name">{displayName(order.user)}</strong><span className="admin-sub">{order.user.email}</span></td>
                      <td data-label="Plan">{order.plan}</td>
                      <td data-label="Amount">{rupees(order.amount)}</td>
                      <td data-label="Paid on">{formatDate(order.paidAt)}</td>
                      <td data-label="Valid till">{formatDate(order.validTill)}</td>
                      <td data-label="Payment ID" className="dash-mono">{order.paymentId}</td>
                      <td data-label="Status"><Pill status={order.active ? "active" : "expired"} /></td>
                    </tr>
                  ))}
                  {loadingRow(8)}
                  {emptyRow(8, "No payments match.")}
                </tbody>
              </table>
            </div>
            {pager}
          </section>
        )}
      </main>
    </div>
  );
}
