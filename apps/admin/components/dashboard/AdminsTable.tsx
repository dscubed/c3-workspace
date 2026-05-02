"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@c3/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CheckCircle2, Clock, Loader2, Mail, Trash2, UserPlus, XCircle } from "lucide-react";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

interface ClubAdmin {
  id: string;
  club_id: string;
  user_id: string;
  role: string;
  status: string;
  invited_by: string | null;
  created_at: string;
  profiles: UserProfile | null;
}

interface AdminsTableProps {
  clubId: string;
}

export function AdminsTable({ clubId }: AdminsTableProps) {
  const { user } = useAuthStore();

  const [admins, setAdmins] = useState<ClubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const [removeConfirm, setRemoveConfirm] = useState<{
    open: boolean;
    userId: string;
    name: string;
  }>({ open: false, userId: "", name: "" });
  const [removing, setRemoving] = useState(false);

  const fetchAdmins = useCallback(async () => {
    if (!hasFetched.current) setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/admins`);
      if (res.ok) {
        const { data } = await res.json();
        setAdmins(data ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    } finally {
      hasFetched.current = true;
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    hasFetched.current = false;
    fetchAdmins();
  }, [fetchAdmins]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Invite sent");
        setEmail("");
        setShowInvite(false);
        fetchAdmins();
      } else {
        toast.error(json.error || "Failed to send invite");
      }
    } catch {
      toast.error("Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/admins`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: removeConfirm.userId }),
      });
      if (res.ok) {
        toast.success("Admin removed");
        setAdmins((prev) => prev.filter((a) => a.user_id !== removeConfirm.userId));
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to remove admin");
      }
    } catch {
      toast.error("Failed to remove admin");
    } finally {
      setRemoving(false);
      setRemoveConfirm({ open: false, userId: "", name: "" });
    }
  };

  const activeAdmins = admins.filter(
    (a) => a.status === "accepted" || a.status === "pending",
  );

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Club Admins</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeAdmins.length === 0
              ? "No admins yet"
              : `${activeAdmins.length} admin${activeAdmins.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button
          variant={showInvite ? "secondary" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => setShowInvite(!showInvite)}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Invite Admin
        </Button>
      </div>

      {/* Invite by email */}
      {showInvite && (
        <form onSubmit={handleInvite} className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              autoFocus
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={sending || !email.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invite"}
          </Button>
        </form>
      )}

      {/* Admins table */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : activeAdmins.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center">
          <p className="text-sm text-muted-foreground">No admins — invite someone above.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">
                  Member
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">
                  Role
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">
                  Added
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {activeAdmins.map((admin, i) => {
                const p = admin.profiles;
                const name = p
                  ? `${p.first_name}${p.last_name ? ` ${p.last_name}` : ""}`
                  : "Unknown";
                return (
                  <tr
                    key={admin.id}
                    className={`${i !== activeAdmins.length - 1 ? "border-b" : ""} hover:bg-muted/20 transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 shrink-0">
                          {p?.avatar_url && (
                            <AvatarImage src={p.avatar_url} alt={p.first_name} />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {p?.first_name?.charAt(0).toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      {admin.role}
                    </td>
                    <td className="px-4 py-3">
                      {admin.status === "accepted" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : admin.status === "pending" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <Clock className="h-3.5 w-3.5" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <XCircle className="h-3.5 w-3.5" />
                          {admin.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {fmtDate(admin.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {user && admin.user_id !== user.id && (
                        <button
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() =>
                            setRemoveConfirm({ open: true, userId: admin.user_id, name })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Remove confirmation */}
      <AlertDialog
        open={removeConfirm.open}
        onOpenChange={(open) => {
          if (!open) setRemoveConfirm({ open: false, userId: "", name: "" });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove admin</AlertDialogTitle>
            <AlertDialogDescription>
              Remove{" "}
              <span className="font-medium text-foreground">{removeConfirm.name}</span>{" "}
              as an admin? They&apos;ll lose access to manage this club&apos;s events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
