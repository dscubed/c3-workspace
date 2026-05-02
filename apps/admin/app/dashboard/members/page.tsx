"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Search, Info, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAdminClubSelector } from "@/lib/hooks/useAdminClubSelector";

type Member = {
  id: string;
  matched_product_name: string;
  verified_email: string;
  verified_at: string | null;
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};

type ProductConfig = {
  product_name: string;
  normalized_product_name: string;
  enabled: boolean;
} | null;

export default function MembersPage() {
  const { selectedClubId } = useAdminClubSelector();

  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [product, setProduct] = useState<ProductConfig>(null);
  const [productInput, setProductInput] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [productSaving, setProductSaving] = useState(false);

  const loadMembers = useCallback(async (clubId: string) => {
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to load members");
      setMembers(body.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load members",
      );
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const loadProduct = useCallback(async (clubId: string) => {
    setProductLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/membership-product`);
      const body = await res.json();
      if (!res.ok)
        throw new Error(body.error ?? "Failed to load product config");
      setProduct(body.data ?? null);
      setProductInput(body.data?.product_name ?? "");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load product config",
      );
    } finally {
      setProductLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedClubId) return;
    loadMembers(selectedClubId);
    loadProduct(selectedClubId);
  }, [selectedClubId, loadMembers, loadProduct]);

  const saveProduct = async () => {
    if (!selectedClubId) return;
    setProductSaving(true);
    try {
      const res = await fetch(
        `/api/clubs/${selectedClubId}/membership-product`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_name: productInput }),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to save");
      toast.success("Product name saved");
      await loadProduct(selectedClubId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setProductSaving(false);
    }
  };

  const exportCsv = () => {
    if (!members.length) return;
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

  const filtered = members.filter((m) => {
    const name = [m.profile?.first_name, m.profile?.last_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || m.verified_email.toLowerCase().includes(q);
  });

  return (
    <div className="p-8 w-full max-w-6xl">
      <Tabs defaultValue="list">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Members</h1>
          <TabsList>
            <TabsTrigger value="list">Member List</TabsTrigger>
            <TabsTrigger value="dkim">DKIM Setup</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Member List */}
        <TabsContent value="list" className="space-y-4">
          {selectedClubId &&
            !productLoading &&
            (!product?.enabled || !product?.normalized_product_name) && (
              <div className="flex gap-3 p-4 rounded-lg border border-orange-300 bg-orange-50">
                <AlertCircle className="size-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">
                    No DKIM setup detected
                  </p>
                  <p className="text-sm text-orange-800 mt-1">
                    Your club doesn&apos;t have a membership configuration set
                    up yet. Configure your DKIM settings to enable students to
                    verify their memberships.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 border-orange-300 hover:bg-orange-100"
                    onClick={() => {
                      const trigger = document.querySelector(
                        '[value="dkim"]',
                      ) as HTMLButtonElement;
                      trigger?.click();
                    }}
                  >
                    Set Up DKIM
                  </Button>
                </div>
              </div>
            )}

          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={exportCsv}
              disabled={!members.length}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
          </div>

          {membersLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin" />
              Loading members…
            </div>
          ) : !selectedClubId ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Select a club to view members.
            </p>
          ) : (
            <>
              <div className="rounded-lg border bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Receipt Email
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Membership Product
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Date Verified
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          {search
                            ? "No members match your search."
                            : "No verified members yet."}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((m) => (
                        <tr
                          key={m.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-medium">
                            {[m.profile?.first_name, m.profile?.last_name]
                              .filter(Boolean)
                              .join(" ") || "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {m.verified_email}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {m.matched_product_name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {m.verified_at
                              ? new Date(m.verified_at).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Verified
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground">
                {filtered.length} of {members.length} members
              </p>
            </>
          )}
        </TabsContent>

        {/* Tab 2: DKIM Setup */}
        <TabsContent value="dkim" className="space-y-6 max-w-2xl">
          <div className="flex gap-3 p-4 rounded-lg border bg-blue-50 border-blue-200">
            <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Register your exact UMSU product name so Connect3 can
              automatically verify student memberships from their UMSU receipt
              emails.
            </p>
          </div>

          {productLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          ) : !selectedClubId ? (
            <p className="text-sm text-muted-foreground">
              Select a club to configure DKIM.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="umsu-product">UMSU Product Name</Label>
                <Input
                  id="umsu-product"
                  placeholder="e.g. Data Science Students Society (DS Cubed) Student Membership"
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                />
              </div>

              <Button
                onClick={saveProduct}
                disabled={productSaving || !productInput.trim()}
              >
                {productSaving ? (
                  <Loader2 className="size-4 animate-spin mr-1" />
                ) : null}
                Save Changes
              </Button>

              {product && (
                <p className="text-sm text-muted-foreground">
                  Current saved name:{" "}
                  <span className="font-medium text-foreground">
                    {product.product_name}
                  </span>
                  {" — "}
                  {members.length.toLocaleString()} verified member
                  {members.length !== 1 ? "s" : ""} against this product.
                </p>
              )}

              <div className="p-4 rounded-lg border border-yellow-300 bg-yellow-50">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Warning:</span> If UMSU
                  changes your product name, update it here. Existing
                  verifications will not be affected.
                </p>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
