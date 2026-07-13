import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Settings, LogOut, LayoutDashboard, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ControlPanel } from "@/components/members/ControlPanel";
import { hasControlPanelAccess } from "@/components/members/controlPanelPages";
import { ViewAsMenuItem } from "@/components/members/ViewAsControls";
import { ViewAsUserDialog } from "@/components/members/ViewAsUserDialog";
import { API_URL, getAuthToken, useAuth, type AuthUser } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { highestRoleDisplay, ROLE_BADGE_CLASS } from "@/lib/ranks";
import { cn } from "@/lib/utils";

function RoleBadge({ roles, roleLabels }: { roles: string[]; roleLabels: Record<string, string> }) {
  const top = highestRoleDisplay(roles, roleLabels);
  if (!top || !(top in ROLE_BADGE_CLASS)) return null;
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", ROLE_BADGE_CLASS[top])}>
      {top}
    </Badge>
  );
}

export function ProfileMenu({ user, logout }: { user: AuthUser; logout: () => void }) {
  const { hasPermission } = usePermissions();
  const { realRoles } = useAuth();
  const effectiveRoles = useEffectiveRoles(user.effective_roles);
  const [fetchedAvatarUrl, setFetchedAvatarUrl] = useState<string | null>(null);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const [viewAsUserOpen, setViewAsUserOpen] = useState(false);

  useEffect(() => {
    if (user.avatar) { setFetchedAvatarUrl(null); return; }
    const token = getAuthToken();
    if (!token) return;
    let cancelled = false;
    fetch(`${API_URL}/members/${user.discord_user_id}/avatar`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ avatar_url: string }>) : Promise.reject()))
      .then((data) => { if (!cancelled) setFetchedAvatarUrl(data.avatar_url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user.avatar, user.discord_user_id]);

  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=32`
    : fetchedAvatarUrl;

  const showControlPanel = hasControlPanelAccess(hasPermission, effectiveRoles);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1 outline-none transition-colors hover:bg-muted">
          {avatarUrl && <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full" />}
          <div className="flex flex-col items-start gap-0.5 leading-none">
            <span className="text-sm text-foreground">{user.rsn ?? user.username}</span>
            <RoleBadge roles={user.effective_roles} roleLabels={user.role_labels} />
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link to="/members">
              <LayoutDashboard className="h-4 w-4" />
              Members
            </Link>
          </DropdownMenuItem>
          {showControlPanel && (
            <DropdownMenuItem onSelect={() => setControlPanelOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" />
              Control Panel
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link to="/members/settings">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <ViewAsMenuItem realRoles={realRoles} onSelectUser={() => setViewAsUserOpen(true)} />
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={logout}>
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {showControlPanel && (
        <ControlPanel open={controlPanelOpen} onOpenChange={setControlPanelOpen} />
      )}
      <ViewAsUserDialog open={viewAsUserOpen} onOpenChange={setViewAsUserOpen} />
    </>
  );
}
