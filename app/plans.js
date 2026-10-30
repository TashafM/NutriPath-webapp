// Plans live in the Supabase `plans` table (see supabase-plans.sql) and are edited from /admin > Plans.
// These helpers are shared by the browser and the server.

export const MAX_FEATURED = 4;

// Icons a "More programs" card can use; the names map to lucide-react icons in app/home.js.
export const PLAN_ICONS = ["Droplet", "Baby", "HeartHandshake", "HandHeart", "Sparkles", "Activity", "Leaf", "Weight", "Flower2", "Apple", "Brain", "Moon"];

// Strikethrough "real" price is shown only when it is above the price actually charged.
export const hasDiscount = (plan) => plan?.original_amount > plan?.amount;
export const discountPercent = (plan) => Math.round((1 - plan.amount / plan.original_amount) * 100);

export const periodLabel = (plan) => (plan?.period === "session" ? "Per Session" : "1 Month Plan");

// Every monthly plan lasts one calendar month from payment.
export function planEnd(paidAt) {
  const end = new Date(paidAt);
  end.setMonth(end.getMonth() + 1);
  return end;
}

// The plan an order was for: matched by plan_id, so renaming a plan keeps it linked.
// Older orders (before plan_id existed) fall back to the title they were bought under.
export const planOf = (plans, order) => plans.find((item) => (order.plan_id ? item.id === order.plan_id : item.title === order.plan));

// Sessions never block a repeat purchase, so only monthly plans count as "active".
// A plan deleted later falls back to "month".
export function isActivePlan(plans, order) {
  return planOf(plans, order)?.period !== "session" && planEnd(order.paid_at) > new Date();
}

// Options for the free session form (app/book-session.js).
export const SESSION_TIMES = ["Morning", "Afternoon", "Evening"];
