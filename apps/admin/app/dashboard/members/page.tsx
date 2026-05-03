"use client";

import { useState } from "react";
import useSWR from "swr";
import { Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAdminClubSelector } from "@/lib/hooks/useAdminClubSelector";
import { fetcher } from "@/lib/fetcher";
import { ProductConfig } from "@/components/dashboard/members/member";
import { MembersList } from "@/components/dashboard/members/MembersList";

export default function MembersPage() {
  const { selectedClubId } = useAdminClubSelector();

  const {
    data: product,
    isLoading: productLoading,
    mutate,
  } = useSWR<ProductConfig | null>(
    selectedClubId ? `/api/clubs/${selectedClubId}/membership-product` : null,
    fetcher,
    {
      onSuccess: (data) => setProductInput(data?.product_name ?? ""),
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to load product config",
        ),
    },
  );

  const [productInput, setProductInput] = useState("");
  const [productSaving, setProductSaving] = useState(false);

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
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setProductSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl">
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
          <MembersList
            selectedClubId={selectedClubId}
            product={product ?? null}
            productLoading={productLoading}
          />
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
