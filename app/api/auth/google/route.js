// Exchanges the one-time code from the "Sign in with Google" popup for Google's ID token.
// The client secret stays on the server; the browser then hands the ID token to Supabase.
export async function POST(req) {
  const { code } = await req.json().catch(() => ({}));
  if (typeof code !== "string" || !code || code.length > 512) return Response.json({ error: "Invalid sign-in code" }, { status: 400 });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: "postmessage", // required value for the popup flow
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.id_token) {
    console.error("Google code exchange failed:", data.error_description || data.error);
    return Response.json({ error: "Google sign-in failed. Please try again." }, { status: 400 });
  }
  return Response.json({ idToken: data.id_token });
}
