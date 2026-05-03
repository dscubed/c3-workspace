import { useState } from "react";
import { toast } from "sonner";
import { SetupAlert, MembersListActions, MembersTable } from "./list";
import { Member, ProductConfig } from "./member";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface MembersListProps {
  selectedClubId: string | null;
  product: ProductConfig | null;
  productLoading: boolean;
}

export function MembersList({
  selectedClubId,
  product,
  productLoading,
}: MembersListProps) {
  const { data: members, isLoading: membersLoading } = useSWR<Member[]>(
    selectedClubId ? `/api/clubs/${selectedClubId}/members` : null,
    fetcher,
    {
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to load members",
        ),
    },
  );

  const [search, setSearch] = useState("");

  const exportCsv = () => {
    if (!members?.length) return;
    const rows = [
      ["Name", "Receipt Email", "Product", "Date Verified"],
      ...members.map((m) => [
        [m.profile?.first_name, m.profile?.last_name]
          .filter(Boolean)
          .join(" ") || "—",
        m.verified_email,
        m.matched_product_name,
        m.verified_at ? new Date(m.verified_at).toLocaleDateString() : "—",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "members.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = members?.filter((m) => {
    const name = [m.profile?.first_name, m.profile?.last_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || m.verified_email.toLowerCase().includes(q);
  });

  return (
    <>
      {selectedClubId &&
        !productLoading &&
        (!product?.enabled || !product?.normalized_product_name) && (
          <SetupAlert />
        )}

      <MembersListActions
        search={search}
        setSearch={setSearch}
        members={members ?? []}
        exportCsv={exportCsv}
      />

      <MembersTable
        filtered={filtered ?? []}
        membersLoading={membersLoading}
        totalMembers={members?.length ?? 0}
      />
    </>
  );
}
