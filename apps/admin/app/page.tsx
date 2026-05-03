import { redirect } from "next/navigation";
import { createClient } from "@c3/supabase/server";
import { getLoginUrl } from "@c3/auth/sso";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getLoginUrl(SITE_URL, "/"));
  }

  redirect("/dashboard");
}
