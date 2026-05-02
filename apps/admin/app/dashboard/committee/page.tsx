"use client";

import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";
import { useClubStore } from "@c3/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

interface AdminMember {
  id: string;
  user_id: string;
  club_id: string;
  role: string;
  status: string;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string | null;
    avatar_url: string | null;
    account_type: string;
  };
}

export default function CommitteePage() {
  const { activeClubId } = useClubStore();
  const [committee, setCommittee] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [open, setOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!activeClubId) {
      setLoading(false);
      return;
    }

    const fetchAdmins = async () => {
      try {
        const res = await fetch(`/api/clubs/${activeClubId}/admins`);
        if (!res.ok) throw new Error("Failed to fetch admins");
        const { data } = await res.json();
        setCommittee(data || []);
      } catch (error) {
        console.error("Error fetching admins:", error);
        setCommittee([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, [activeClubId]);

  const handleSendInvite = async () => {
    if (!inviteEmail || !activeClubId) return;

    setInviting(true);
    try {
      const res = await fetch(`/api/clubs/${activeClubId}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send invite");
      }

      setInviteEmail("");
      setInviteRole("admin");
      setOpen(false);

      const adminRes = await fetch(`/api/clubs/${activeClubId}/admins`);
      if (adminRes.ok) {
        const { data } = await adminRes.json();
        setCommittee(data || []);
      }
    } catch (error) {
      console.error("Error sending invite:", error);
      alert(error instanceof Error ? error.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Committee</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="size-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Committee Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendInvite}
                disabled={!inviteEmail || inviting}
              >
                {inviting ? "Sending..." : "Send Invite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Committee table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date Joined</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading admins...
                </td>
              </tr>
            ) : committee.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No admins found. Invite your first committee member!
                </td>
              </tr>
            ) : (
              committee.map((member) => {
                const fullName = [member.profiles.first_name, member.profiles.last_name]
                  .filter(Boolean)
                  .join(" ");
                const initials = [member.profiles.first_name?.[0], member.profiles.last_name?.[0]]
                  .filter(Boolean)
                  .join("")
                  .toUpperCase();

                return (
                  <tr
                    key={member.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          {member.profiles.avatar_url && (
                            <AvatarImage src={member.profiles.avatar_url} alt={fullName} />
                          )}
                          <AvatarFallback>{initials || "?"}</AvatarFallback>
                        </Avatar>
                        <span>{fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          member.role === "admin"
                            ? "bg-gray-900 text-white border-gray-900"
                            : ""
                        }
                        variant={member.role === "admin" ? "default" : "outline"}
                      >
                        {member.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={member.status === "accepted" ? "default" : "outline"}
                        className={
                          member.status === "accepted"
                            ? "bg-green-100 text-green-700 border-green-300"
                            : member.status === "pending"
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-red-100 text-red-700 border-red-300"
                        }
                      >
                        {member.status === "accepted"
                          ? "Accepted"
                          : member.status === "pending"
                          ? "Pending"
                          : "Declined"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* TODO */}}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
