import { createClient } from "@supabase/supabase-js";
import Home from "./home";

// Plans are edited from /admin, so read them fresh on every request.
export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.from("plans").select("*").eq("published", true).order("sort").order("id");
  // Keep the rest of the site up if plans can't load; the plans section shows a fallback message instead.
  if (error) console.error("Could not load plans:", error.message);
  return <Home plans={data ?? []} />;
}
