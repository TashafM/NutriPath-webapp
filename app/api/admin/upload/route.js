import crypto from "crypto";
import { requireAdmin } from "../auth";

// Signs a direct browser-to-Cloudinary upload, so the API secret never leaves the server
// and big photos don't pass through our server. Cloudinary shrinks anything over 2000px on arrival.
export async function POST(req) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: secret } = process.env;
  if (!cloudName || !apiKey || !secret) return Response.json({ error: "Image upload is not set up yet (Cloudinary keys missing)" }, { status: 500 });

  const params = { folder: "nutripath/plans", timestamp: Math.floor(Date.now() / 1000), transformation: "c_limit,w_2000,h_2000" };
  const toSign = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join("&");
  const signature = crypto.createHash("sha1").update(toSign + secret).digest("hex");
  return Response.json({ ...params, signature, apiKey, cloudName });
}
