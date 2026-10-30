import { createClient } from "@supabase/supabase-js";
import Home from "./home";

// Cached page: rebuilt at most once an hour, and straight away whenever an admin
// changes a plan (see revalidatePath in app/api/admin/plans/route.js).
export const revalidate = 3600;

export default async function Page() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.from("plans").select("*").eq("published", true).order("sort").order("id");
  // Throwing keeps the last good cached page live (rather than caching a page with no plans);
  // the next visit after the error tries again.
  if (error) throw new Error(`Could not load plans: ${error.message}`);
  return <Home plans={data ?? []} />;
}
