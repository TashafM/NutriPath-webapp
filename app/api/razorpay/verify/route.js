import { markPaid, razorpay, validSignature } from "../lib";

export async function POST(req) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
  if (!validSignature(`${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature, process.env.RAZORPAY_KEY_SECRET)) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  await markPaid(razorpay_order_id, await razorpay(`payments/${razorpay_payment_id}`));
  return Response.json({ ok: true });
}
