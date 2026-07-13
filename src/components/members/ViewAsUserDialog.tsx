import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { staffApi } from "@/api/staff";
import { useViewAs } from "@/context/ViewAsContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ViewAsUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PickableMember {
  discord_user_id: string;
  username: string;
  rsn: string | null;
  discord_roles: string[];
}

export function ViewAsUserDialog({ open, onOpenChange }: ViewAsUserDialogProps) {
  const { viewAsUser } = useViewAs();
  const [search, setSearch] = useState("");

  const { data: members = [], isFetching } = useQuery({
    queryKey: ["staff", "members", "view-as", search],
    queryFn: () => staffApi.getMembers(search || undefined),
    enabled: open,
    staleTime: 1000 * 30,
  });

  function pick(member: PickableMember) {
    viewAsUser({
      id: member.discord_user_id,
      label: member.rsn ?? member.username,
      roles: member.discord_roles,
    });
    setSearch("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>View as member</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or RSN..."
            className="pl-9"
          />
        </div>
        <div className="-mx-1 max-h-80 overflow-y-auto px-1">
          {isFetching && members.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">Searching...</p>
          )}
          {!isFetching && members.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">No members found.</p>
          )}
          {members.map((member) => (
            <button
              key={member.discord_user_id}
              type="button"
              onClick={() => pick(member)}
              className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left transition-colors hover:bg-muted"
            >
              <span className="text-sm font-medium text-foreground">{member.rsn ?? member.username}</span>
              <span className="text-xs text-muted-foreground">
                {member.username} · {member.discord_roles.length} role{member.discord_roles.length !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
