import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Service-role client: server only, bypasses RLS. Never import this from client code.
export const db = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function razorpay(path, body) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.description || "Razorpay request failed");
  return data;
}

export function validSignature(payload, signature, secret) {
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return typeof signature === "string" && signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// Idempotent: verify route and webhook may both mark the same order.
export async function markPaid(orderId, payment) {
  const { error } = await db()
    .from("orders")
    .update({ status: "paid", payment_id: payment.id, email: payment.email, contact: payment.contact, paid_at: new Date().toISOString() })
    .eq("razorpay_order_id", orderId);
  if (error) throw error;
}
