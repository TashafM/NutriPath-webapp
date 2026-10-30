import { db } from "../razorpay/lib";

const text = (value, max) => String(value ?? "").trim().slice(0, max);
const MAX_PER_IP_PER_HOUR = 5;
const HOUR = 60 * 60 * 1000;

const count = async (column, value, since) => {
  const { count: total, error } = await db().from("session_requests").select("id", { count: "exact", head: true }).eq(column, value).gte("created_at", new Date(Date.now() - since).toISOString());
  if (error) throw error;
  return total;
};

// Public form: validate everything, quietly drop bots that fill the hidden "company" field,
// and rate limit by IP (5/hour) and by phone (one request per 24 hours).
// Limits are counted in the database so they hold across serverless instances.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (body.company) return Response.json({ ok: true });

  const request = {
    name: text(body.name, 80),
    // Indian mobiles only: store as +91 followed by 10 digits.
    phone: `+91${text(body.phone, 20).replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "")}`,
    email: text(body.email, 120) || null,
    goal: text(body.goal, 80) || null,
    preferred_time: text(body.preferred_time, 20) || null,
    message: text(body.message, 500) || null,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown",
  };
  if (!request.name) return Response.json({ error: "Please enter your name" }, { status: 400 });
  if (!/^\+91[6-9]\d{9}$/.test(request.phone)) return Response.json({ error: "Please enter a valid 10-digit mobile number" }, { status: 400 });
  if (request.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) return Response.json({ error: "Please enter a valid email" }, { status: 400 });

  try {
    if ((await count("ip", request.ip, HOUR)) >= MAX_PER_IP_PER_HOUR) {
      return Response.json({ error: "Too many requests. Please try again in an hour." }, { status: 429 });
    }
    // Same number already waiting for a call: say yes without saving a duplicate.
    if ((await count("phone", request.phone, 24 * HOUR)) > 0) return Response.json({ ok: true });

    const { error } = await db().from("session_requests").insert(request);
    if (error) throw error;
  } catch (error) {
    console.error("Could not save session request:", error.message);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
