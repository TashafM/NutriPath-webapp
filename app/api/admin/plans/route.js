import { MAX_FEATURED, PLAN_ICONS } from "../../../plans";
import { db } from "../../razorpay/lib";
import { requireAdmin } from "../auth";

const text = (value) => String(value ?? "").trim();

// Admin input is still untrusted: normalise it and return an error string if it's unusable.
function cleanPlan(body) {
  const plan = {
    title: text(body.title),
    tag: text(body.tag).toUpperCase(),
    description: text(body.description),
    features: (Array.isArray(body.features) ? body.features : []).map(text).filter(Boolean),
    amount: Number(body.amount),
    original_amount: body.original_amount === "" || body.original_amount == null ? null : Number(body.original_amount),
    period: body.period === "session" ? "session" : "month",
    image: text(body.image),
    image_alt: text(body.image_alt),
    icon: PLAN_ICONS.includes(body.icon) ? body.icon : null,
    featured: Boolean(body.featured),
    popular: Boolean(body.popular),
    published: body.published !== false,
  };
  if (!plan.title) return "Plan name is required";
  if (!Number.isInteger(plan.amount) || plan.amount <= 0) return "Price must be a whole number above 0";
  if (plan.original_amount !== null && (!Number.isInteger(plan.original_amount) || plan.original_amount <= plan.amount)) return "Real price must be a whole number above the selling price (or leave it empty)";
  if (plan.image && !/^(https:\/\/|\/)/.test(plan.image)) return "Image must be an https:// link or a /path from the public folder";
  if (plan.featured && !plan.image) return "Starred plans need an image";
  return plan;
}

async function tooManyFeatured(excludeId) {
  let query = db().from("plans").select("id", { count: "exact", head: true }).eq("featured", true);
  if (excludeId) query = query.neq("id", excludeId);
  const { count, error } = await query;
  if (error) throw error;
  return count >= MAX_FEATURED;
}

const fail = (error) => Response.json({ error: error.code === "23505" ? "A plan with this name already exists" : error.message || error }, { status: 400 });

export async function GET(req) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const { data, error } = await db().from("plans").select("*").order("sort").order("id");
  if (error) throw error;
  return Response.json({ plans: data });
}

export async function POST(req) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const plan = cleanPlan(await req.json());
  if (typeof plan === "string") return fail(plan);
  if (plan.featured && (await tooManyFeatured())) return fail(`Only ${MAX_FEATURED} plans can be starred. Unstar one first.`);
  // New plans go to the end; admins drag to reorder.
  const { data: last } = await db().from("plans").select("sort").order("sort", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await db().from("plans").insert({ ...plan, sort: (last?.sort ?? 0) + 10 }).select().single();
  if (error) return fail(error);
  return Response.json({ plan: data });
}

export async function PUT(req) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const body = await req.json();
  const plan = cleanPlan(body);
  if (typeof plan === "string") return fail(plan);
  if (plan.featured && (await tooManyFeatured(body.id))) return fail(`Only ${MAX_FEATURED} plans can be starred. Unstar one first.`);
  const { data, error } = await db().from("plans").update(plan).eq("id", body.id).select().single();
  if (error) return fail(error);
  return Response.json({ plan: data });
}

// Body: [{ id, sort }, ...] from drag-to-reorder.
export async function PATCH(req) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const body = await req.json();
  if (!Array.isArray(body) || !body.every((item) => Number.isInteger(item?.id) && Number.isInteger(item?.sort))) return fail("Invalid order");
  // ponytail: one update per plan; fine for a few dozen plans, switch to an RPC if the list gets long.
  const results = await Promise.all(body.map(({ id, sort }) => db().from("plans").update({ sort }).eq("id", id)));
  const failed = results.find((result) => result.error);
  if (failed) return fail(failed.error);
  return Response.json({ ok: true });
}

export async function DELETE(req) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  const { error } = await db().from("plans").delete().eq("id", new URL(req.url).searchParams.get("id"));
  if (error) return fail(error);
  return Response.json({ ok: true });
}
