import { createClient } from "@supabase/supabase-js";

// ONLY use in server-side code (API routes, server actions). Never expose to client.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);
