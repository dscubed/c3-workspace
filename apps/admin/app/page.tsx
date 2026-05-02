import { redirect } from "next/navigation";
import { createClient } from "@c3/supabase/server";

const SSO_BASE_URL =
  process.env.NEXT_PUBLIC_SSO_BASE_URL ?? "http://localhost:3000/auth/sso";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`${SSO_BASE_URL}?redirect_to=${encodeURIComponent(SITE_URL + "/")}`);
  }

  redirect("/dashboard");
}
