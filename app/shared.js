"use client";

import { createClient } from "@supabase/supabase-js";

// Public (anon) key only: access is limited by RLS policies in supabase.sql.
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
