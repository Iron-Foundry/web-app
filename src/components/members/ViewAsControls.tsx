import { Eye, UserSearch } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useViewAs } from "@/context/ViewAsContext";
import { usePermissions } from "@/context/PermissionsContext";
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const VIEW_AS_FIXED = [
  { value: "self", label: "Myself" },
  { value: "member", label: "Member (no perms)" },
];

export function ViewAsMenuItem({
  realRoles,
  onSelectUser,
}: {
  realRoles: string[];
  onSelectUser: () => void;
}) {
  const { viewAs, setViewAs, userOverride } = useViewAs();
  const { adminBypassRoles } = usePermissions();
  const { user } = useAuth();

  const isBypassUser = realRoles.some((r) => adminBypassRoles.includes(r));
  if (!isBypassUser) return null;

  const roleLabels = user?.role_labels ?? {};
  const dynamicOptions = Object.entries(roleLabels).map(([id, label]) => ({ value: id, label }));
  const allOptions = [...VIEW_AS_FIXED, ...dynamicOptions];

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Eye className="h-4 w-4" />
        View as
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={viewAs} onValueChange={setViewAs}>
          {allOptions.map(({ value, label }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSelectUser}>
          <UserSearch className="h-4 w-4" />
          {viewAs === "user" && userOverride ? `User: ${userOverride.label}` : "Specific user..."}
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export function ViewAsBanner() {
  const { viewAs, setViewAs, userOverride } = useViewAs();
  const { user } = useAuth();
  if (viewAs === "self") return null;
  const label =
    viewAs === "member"
      ? "Member (no perms)"
      : viewAs === "user"
        ? (userOverride?.label ?? "Member")
        : (user?.role_labels?.[viewAs] ?? viewAs);
  return (
    <div className="shrink-0 flex items-center justify-between gap-2 bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-600 dark:text-amber-400">
      <span className="flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" />
        Viewing as <strong>{label}</strong>
      </span>
      <button
        onClick={() => setViewAs("self")}
        className="underline underline-offset-2 hover:no-underline"
      >
        Exit
      </button>
    </div>
  );
}
