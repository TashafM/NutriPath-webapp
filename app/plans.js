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

// Sessions never block a repeat purchase, so only monthly plans count as "active".
// Orders store the plan title, so a plan renamed or deleted later falls back to "month".
export function isActivePlan(plans, planTitle, paidAt) {
  const plan = plans.find((item) => item.title === planTitle);
  return plan?.period !== "session" && planEnd(paidAt) > new Date();
}

// Options for the free session form (app/book-session.js).
export const SESSION_TIMES = ["Morning", "Afternoon", "Evening"];
