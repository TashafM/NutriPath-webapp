import { db } from "../razorpay/lib";

export const adminEmails = () => (process.env.ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);

// Returns the admin user, or a Response to send back as-is.
export async function requireAdmin(req) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const { data } = await db().auth.getUser(token);
  if (!data?.user) return Response.json({ error: "Please log in" }, { status: 401 });
  if (!adminEmails().includes(data.user.email?.toLowerCase())) return Response.json({ error: "Not an admin" }, { status: 403 });
  return data.user;
}
