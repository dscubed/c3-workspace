import { Loader2 } from "lucide-react";
import { Member } from "../member";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface MembersTableProps {
  filtered: Member[];
  membersLoading: boolean;
  totalMembers: number;
}

export function MembersTable({
  filtered,
  membersLoading,
  totalMembers,
}: MembersTableProps) {
  return (
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
            </tr>
          </thead>
          <tbody>
            {membersLoading ? (
              // Show 5 skeleton rows while loading
              <>
                {[...Array(5)].map((_, i) => (
                  <MemberRowSkeleton key={i} />
                ))}
              </>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No members found.
                </td>
              </tr>
            ) : (
              filtered.map((m) => <MemberRow key={m.id} member={m} />)
            )}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">
        Displaying {filtered.length} of {totalMembers} members
      </p>
    </>
  );
}

function MemberRow({ member }: { member: Member }) {
  return (
    <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50">
      <td className="flex px-4 py-3 font-medium gap-2">
        <Avatar size="sm">
          <AvatarImage
            src={member.profile?.avatar_url || undefined}
            alt={
              member.profile
                ? `${member.profile.first_name} ${member.profile.last_name}`
                : "Avatar"
            }
          />
          <AvatarFallback>
            {[member.profile?.first_name, member.profile?.last_name]
              .filter(Boolean)
              .map((n) => n?.[0])
              .join("") || "—"}
          </AvatarFallback>
        </Avatar>
        {[member.profile?.first_name, member.profile?.last_name]
          .filter(Boolean)
          .join(" ") || "—"}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {member.verified_email}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {member.matched_product_name}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {member.verified_at
          ? new Date(member.verified_at).toLocaleDateString()
          : "—"}
      </td>
    </tr>
  );
}

function MemberRowSkeleton() {
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50">
      <td className="flex px-4 py-3 font-medium gap-2">
        <Skeleton className="size-8 rounded-full" />

        <Skeleton className="h-4 w-24 rounded" />
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <Skeleton className="h-4 w-32 rounded" />
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <Skeleton className="h-4 w-32 rounded" />
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <Skeleton className="h-4 w-24 rounded" />
      </td>
    </tr>
  );
}
