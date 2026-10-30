import { isActivePlan, planOf } from "../../../plans";
import { db, razorpay } from "../lib";

const STALE_AFTER = 2 * 24 * 60 * 60 * 1000; // 2 days

export async function POST(req) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const { data } = await db().auth.getUser(token);
  if (!data?.user) return Response.json({ error: "Please log in" }, { status: 401 });

  // Price always comes from the database, never from the browser.
  const { id } = await req.json();
  const { data: plan, error: planError } = await db().from("plans").select("*").eq("id", id).eq("published", true).maybeSingle();
  if (planError) throw planError;
  if (!plan) return Response.json({ error: "Unknown plan" }, { status: 400 });

  const { data: paid, error: paidError } = await db().from("orders").select("plan, plan_id, paid_at").eq("user_id", data.user.id).eq("status", "paid");
  if (paidError) throw paidError;
  if (paid.some((order) => planOf([plan], order) && isActivePlan([plan], order))) {
    return Response.json({ error: "You already have this plan active" }, { status: 409 });
  }

  const order = await razorpay("orders", { amount: plan.amount * 100, currency: "INR", notes: { plan: plan.title } });
  const { error } = await db().from("orders").insert({ razorpay_order_id: order.id, plan: plan.title, plan_id: plan.id, amount: plan.amount, user_id: data.user.id });
  if (error) throw error;

  // Housekeeping: every closed checkout leaves a "created" order behind. Remove ones older than
  // 2 days (a payment can't arrive that late), piggybacking on checkouts instead of running a cron job.
  const stale = new Date(Date.now() - STALE_AFTER).toISOString();
  const { error: cleanupError } = await db().from("orders").delete().eq("status", "created").lt("created_at", stale);
  if (cleanupError) console.error("Could not clean up old checkouts:", cleanupError.message);

  return Response.json({ orderId: order.id, amount: order.amount, keyId: process.env.RAZORPAY_KEY_ID, email: data.user.email });
}
