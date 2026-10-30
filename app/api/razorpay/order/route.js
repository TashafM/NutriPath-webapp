import { isActivePlan } from "../../../plans";
import { db, razorpay } from "../lib";

export async function POST(req) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const { data } = await db().auth.getUser(token);
  if (!data?.user) return Response.json({ error: "Please log in" }, { status: 401 });

  // Price always comes from the database, never from the browser.
  const { id } = await req.json();
  const { data: plan, error: planError } = await db().from("plans").select("*").eq("id", id).eq("published", true).maybeSingle();
  if (planError) throw planError;
  if (!plan) return Response.json({ error: "Unknown plan" }, { status: 400 });

  const { data: paid, error: paidError } = await db().from("orders").select("paid_at").eq("user_id", data.user.id).eq("plan", plan.title).eq("status", "paid");
  if (paidError) throw paidError;
  if (paid.some((order) => isActivePlan([plan], plan.title, order.paid_at))) {
    return Response.json({ error: "You already have this plan active" }, { status: 409 });
  }

  const order = await razorpay("orders", { amount: plan.amount * 100, currency: "INR", notes: { plan: plan.title } });
  const { error } = await db().from("orders").insert({ razorpay_order_id: order.id, plan: plan.title, amount: plan.amount, user_id: data.user.id });
  if (error) throw error;

  return Response.json({ orderId: order.id, amount: order.amount, keyId: process.env.RAZORPAY_KEY_ID, email: data.user.email });
}
