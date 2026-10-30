import { REQUEST_STATUSES } from "../../../requests";
import { db } from "../../razorpay/lib";
import { requireAdmin } from "../auth";

const STATUS_VALUES = REQUEST_STATUSES.map((status) => status.value);

// Body: { id, status?, follow_up_on?, admin_note? } — only the fields sent are changed.
export async function PATCH(req) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id)) return Response.json({ error: "Invalid request" }, { status: 400 });

  const update = { updated_at: new Date().toISOString() };
  if ("status" in body) {
    if (!STATUS_VALUES.includes(body.status)) return Response.json({ error: "Invalid status" }, { status: 400 });
    update.status = body.status;
    if (body.status !== "call_later") update.follow_up_on = null;
  }
  if ("follow_up_on" in body) {
    if (body.follow_up_on && !/^\d{4}-\d{2}-\d{2}$/.test(body.follow_up_on)) return Response.json({ error: "Invalid date" }, { status: 400 });
    update.follow_up_on = body.follow_up_on || null;
  }
  if ("admin_note" in body) update.admin_note = String(body.admin_note ?? "").trim().slice(0, 500) || null;

  const { data, error } = await db().from("session_requests").update(update).eq("id", id)
    .select("id, name, phone, email, goal, preferred_time, message, created_at, status, follow_up_on, admin_note").single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ request: data });
}
