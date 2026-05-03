import { handleProfileFetch } from "@c3/supabase/profiles";

export async function GET(request: Request): Promise<Response> {
  return handleProfileFetch(request);
}
