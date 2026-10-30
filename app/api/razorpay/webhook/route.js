import { markPaid, validSignature } from "../lib";

// Backup for when the buyer closes the tab before /verify runs.
export async function POST(req) {
  const body = await req.text();
  if (!validSignature(body, req.headers.get("x-razorpay-signature"), process.env.RAZORPAY_WEBHOOK_SECRET)) {
    return new Response("Invalid signature", { status: 400 });
  }
  const event = JSON.parse(body);
  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    await markPaid(payment.order_id, payment);
  }
  return Response.json({ ok: true });
}
