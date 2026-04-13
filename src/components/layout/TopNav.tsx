import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "./NavLinks";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <span className="text-sm font-semibold tracking-wide text-primary">
          Iron Foundry
        </span>

        <div className="hidden items-center gap-4 md:flex">
          <NavLinks orientation="horizontal" />
          {user && (
            <Link
              to="/members"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground",
                "transition-colors hover:bg-muted hover:text-foreground",
                "[&.active]:bg-muted [&.active]:text-primary"
              )}
            >
              Members
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              {user.avatar && (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.webp?size=32`}
                  alt=""
                  className="h-7 w-7 rounded-full"
                />
              )}
              <span className="text-sm text-foreground">{user.username}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate({ to: "/login" })}>
              Login
            </Button>
          )}
        </div>

        <div className="flex items-center md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {mobileOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-56 border-border bg-card pt-12">
              <NavLinks orientation="vertical" onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
