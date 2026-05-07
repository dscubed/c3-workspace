import { redirect } from "next/navigation";
import { createClient } from "@c3/supabase/server";
import { getAdminClubIds } from "@c3/supabase";
import { getLoginUrl } from "@c3/auth/sso";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

const CONNECT3_URL = process.env.NEXT_PUBLIC_CONNECT3_URL ?? "https://connect3.app";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://admin.connect3.app";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getLoginUrl(SITE_URL, "/dashboard"));
  }

  const clubIds = await getAdminClubIds(user.id);
  if (clubIds.length === 0) {
    redirect(CONNECT3_URL);
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-17 min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
