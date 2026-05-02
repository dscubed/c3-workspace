import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[60px]">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto flex justify-center bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
