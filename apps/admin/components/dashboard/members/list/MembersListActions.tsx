import { Download, Search } from "lucide-react";
import { Member } from "../member";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MembersListActionsProps {
  search: string;
  setSearch: (value: string) => void;
  members: Member[];
  exportCsv: () => void;
}
export function MembersListActions({
  search,
  setSearch,
  members,
  exportCsv,
}: MembersListActionsProps) {
  return (
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
      <Button variant="outline" onClick={exportCsv} disabled={!members.length}>
        <Download className="size-4" />
        Export CSV
      </Button>
    </div>
  );
}
