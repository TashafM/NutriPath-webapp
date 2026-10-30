import { isActivePlan, planEnd } from "../../plans";
import { REQUEST_STATUSES, todayIST } from "../../requests";
import { db } from "../razorpay/lib";
import { adminEmails, requireAdmin } from "./auth";

const PAGE_SIZE = 10;
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

const statusOf = (client) => (client.orders.some((order) => order.active) ? "active" : client.orders.length ? "expired" : "none");

async function loadClients() {
  // ponytail: single page of 1000 auth users, filtered in memory (Supabase can't search auth users);
  // paginate listUsers / move clients into a table once the user base grows past that.
  const [{ data: usersPage, error: usersError }, { data: orders, error: ordersError }, { data: plans, error: plansError }] = await Promise.all([
    db().auth.admin.listUsers({ perPage: 1000 }),
    db().from("orders").select("*").eq("status", "paid").order("paid_at", { ascending: false }),
    db().from("plans").select("title, period").order("sort"),
  ]);
  if (usersError) throw usersError;
  if (ordersError) throw ordersError;
  // Missing plans only affect plan labels here; still show the client list.
  if (plansError) console.error("Could not load plans:", plansError.message);

  const clients = usersPage.users.filter((user) => !adminEmails().includes(user.email?.toLowerCase())).map((user) => {
    const userOrders = orders.filter((order) => order.user_id === user.id);
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || "",
      provider: user.app_metadata?.provider || "email",
      joinedAt: user.created_at,
      phone: userOrders.find((order) => order.contact)?.contact || "",
      orders: userOrders.map((order) => ({
        id: order.id,
        plan: order.plan,
        amount: order.amount,
        paymentId: order.payment_id,
        paidAt: order.paid_at,
        validTill: plans?.find((plan) => plan.title === order.plan)?.period === "session" ? null : planEnd(order.paid_at),
        active: isActivePlan(plans ?? [], order.plan, order.paid_at),
      })),
    };
  });
  clients.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt)); // newest first
  const payments = clients
    .flatMap((client) => client.orders.map((order) => ({ ...order, user: { name: client.name, email: client.email } })))
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
  return { clients, payments, plans: plans ?? [] };
}

// GET /api/admin                     -> overview (stats, recent payments, plan breakdown)
// GET /api/admin?view=clients|payments|requests&page=1&q=&filter= -> { items, total, page, pageSize }
export async function GET(req) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const params = new URL(req.url).searchParams;
  if (params.has("check")) return Response.json({ admin: true });

  const view = params.get("view");
  const page = Math.max(1, Number.parseInt(params.get("page"), 10) || 1);
  const q = (params.get("q") || "").trim().toLowerCase().slice(0, 100);
  const from = (page - 1) * PAGE_SIZE;
  const paginate = (list) => ({ items: list.slice(from, from + PAGE_SIZE), total: list.length, page, pageSize: PAGE_SIZE });
  const matches = (...values) => !q || values.some((value) => value?.toLowerCase().includes(q));

  // Requests live in their own table, so the database does the paging and searching.
  if (view === "requests") {
    const filter = params.get("filter");
    const today = todayIST();
    let query = db().from("session_requests").select("id, name, phone, email, goal, preferred_time, message, created_at, status, follow_up_on, admin_note", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (filter === "due") query = query.eq("status", "call_later").lte("follow_up_on", today);
    else if (REQUEST_STATUSES.some((status) => status.value === filter)) query = query.eq("status", filter);
    if (q) {
      const like = `%${q.replace(/[%_,()*\\]/g, "")}%`;
      query = query.or(`name.ilike.${like},phone.ilike.${like},email.ilike.${like},goal.ilike.${like},message.ilike.${like},admin_note.ilike.${like}`);
    }
    // Chip counts: one light query over just the status columns.
    const [{ data, count, error }, { data: statuses }] = await Promise.all([query, db().from("session_requests").select("status, follow_up_on")]);
    if (error) {
      console.error("Could not load session requests:", error.message);
      return Response.json({ items: [], total: 0, page, pageSize: PAGE_SIZE });
    }
    const counts = { all: statuses?.length ?? 0, due: 0, new: 0, contacted: 0, call_later: 0, not_interested: 0 };
    statuses?.forEach((row) => {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
      if (row.status === "call_later" && row.follow_up_on && row.follow_up_on <= today) counts.due++;
    });
    return Response.json({ items: data, total: count ?? 0, page, pageSize: PAGE_SIZE, counts, today });
  }

  const { clients, payments, plans } = await loadClients();

  if (view === "clients") {
    const filter = ["active", "expired", "none"].includes(params.get("filter")) ? params.get("filter") : "all";
    const counts = { all: clients.length, active: 0, expired: 0, none: 0 };
    clients.forEach((client) => counts[statusOf(client)]++);
    const list = clients
      .filter((client) => filter === "all" || statusOf(client) === filter)
      .filter((client) => matches(client.email, client.name, client.phone, ...client.orders.map((order) => order.plan)));
    return Response.json({ ...paginate(list), counts });
  }

  if (view === "payments") {
    return Response.json(paginate(payments.filter((order) => matches(order.user.email, order.user.name, order.plan, order.paymentId))));
  }

  // "This month" in India time, whatever timezone the server runs in.
  const nowIst = new Date(Date.now() + IST_OFFSET);
  const monthStart = Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), 1) - IST_OFFSET;
  const sum = (list) => list.reduce((total, order) => total + order.amount, 0);
  return Response.json({
    stats: {
      clients: clients.length,
      activePlans: payments.filter((order) => order.active).length,
      revenueThisMonth: sum(payments.filter((order) => new Date(order.paidAt) >= monthStart)),
      revenueTotal: sum(payments),
    },
    recentPayments: payments.slice(0, 6),
    planBreakdown: plans.map((plan) => {
      const sold = payments.filter((order) => order.plan === plan.title);
      return { title: plan.title, active: sold.filter((order) => order.active).length, sold: sold.length, revenue: sum(sold) };
    }),
  });
}
