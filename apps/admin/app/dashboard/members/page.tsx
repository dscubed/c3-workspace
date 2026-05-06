"use client";

import { useState } from "react";
import useSWR from "swr";
import { Info, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useClubStore } from "@c3/auth";
import { fetcher } from "@/lib/fetcher";
import { MembersList } from "@/components/dashboard/members/MembersList";

interface ProductNameItem {
  id: string;
  product_name: string;
  created_at: string;
  updated_by: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export default function MembersPage() {
  const { activeClubId: selectedClubId } = useClubStore();

  const {
    data: products = [],
    isLoading: productLoading,
    mutate,
  } = useSWR<ProductNameItem[]>(
    selectedClubId ? `/api/clubs/${selectedClubId}/membership-products` : null,
    fetcher,
    {
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to load products",
        ),
    },
  );
  const maxProducts = 5;
  const canAddMore = products.length < maxProducts;

  const [productInput, setProductInput] = useState("");
  const [productSaving, setProductSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const addProduct = async () => {
    if (!selectedClubId || !productInput.trim()) return;
    setProductSaving(true);
    try {
      const res = await fetch(
        `/api/clubs/${selectedClubId}/membership-products`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_name: productInput.trim() }),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to add product");
      toast.success("Product added");
      setProductInput("");
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add product");
    } finally {
      setProductSaving(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!selectedClubId) return;
    setDeletingId(productId);
    try {
      const res = await fetch(
        `/api/clubs/${selectedClubId}/membership-products/${productId}`,
        { method: "DELETE" },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to delete");
      toast.success("Product removed");
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
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
            productLoading={productLoading}
          />
        </TabsContent>

        {/* Tab 2: DKIM Setup */}
        <TabsContent value="dkim" className="space-y-6 max-w-2xl">
          <div className="flex gap-3 p-4 rounded-lg border bg-blue-50 border-blue-200">
            <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Register UMSU product names so Connect3 can automatically verify
              student memberships from receipt emails. You can add up to 5
              product names.
            </p>
          </div>

          {productLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          ) : !selectedClubId ? (
            <p className="text-sm text-muted-foreground">
              Select a club to configure products.
            </p>
          ) : (
            <>
              {/* Add New Product */}
              {canAddMore && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="umsu-product">Add Product Name</Label>
                    {products.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {maxProducts - products.length} remaining
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="umsu-product"
                      placeholder="e.g. Data Science Students Society (DS Cubed) Student Membership"
                      value={productInput}
                      onChange={(e) => setProductInput(e.target.value)}
                      disabled={productSaving}
                    />
                    <Button
                      onClick={addProduct}
                      disabled={productSaving || !productInput.trim()}
                    >
                      {productSaving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {!canAddMore && (
                <div className="p-3 rounded-lg bg-slate-100 text-sm text-muted-foreground">
                  Maximum {maxProducts} products reached.
                </div>
              )}

              {/* Added Products List */}
              {products.length > 0 && (
                <div className="space-y-3 pt-6 border-t">
                  <Label>Added Products ({products.length}/{maxProducts})</Label>
                  <div className="space-y-2">
                    {products.map((p) => {
                      const addedBy =
                        p.updated_by?.first_name || p.updated_by?.last_name
                          ? `${p.updated_by?.first_name ?? ""} ${p.updated_by?.last_name ?? ""}`.trim()
                          : "Unknown";
                      const addedDate = new Date(p.created_at).toLocaleDateString();
                      return (
                        <div
                          key={p.id}
                          className="flex items-start justify-between gap-3 p-3 border rounded-lg bg-slate-50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground break-words">
                              {p.product_name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Added by {addedBy} on {addedDate}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            disabled={deletingId === p.id}
                            aria-label={`Delete product ${p.product_name}`}
                            className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 shrink-0"
                          >
                            {deletingId === p.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <X className="size-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg border border-yellow-300 bg-yellow-50">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Note:</span> Product names are
                  matched case-insensitively. Changes take effect immediately.
                </p>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
