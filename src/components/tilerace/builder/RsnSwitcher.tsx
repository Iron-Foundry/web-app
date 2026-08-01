import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Check, Loader2 } from "lucide-react";
import {
  usePatchRosterMember,
  useTileraceMemberAccounts,
} from "@/hooks/useTilerace";
import type { TileRaceSignup } from "@/types/tilerace";

interface Props {
  eventId: string;
  member: TileRaceSignup;
  disabled: boolean;
}

/**
 * Switch which of a member's linked RSNs they race under.
 *
 * A signup made on the wrong account is usually only noticed once the teams are
 * out, so this changes the RSN and its ranking score in place and never moves
 * the member off their team. A typed name is for staff-added members who have no
 * linked account; it drops the account link.
 */
export function RsnSwitcher({ eventId, member, disabled }: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const { data: accounts, isLoading } = useTileraceMemberAccounts(
    eventId,
    member.discord_user_id,
    open,
  );
  const { mutate: patch, isPending } = usePatchRosterMember();

  function switchTo(data: { account_id: number } | { rsn: string }): void {
    patch({ eventId, discordUserId: member.discord_user_id, data });
    setTyped("");
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled || isPending}
          title="Switch which RSN this member races under"
          className={`truncate text-left underline-offset-2 hover:underline disabled:no-underline ${
            member.is_captain ? "font-medium" : "text-muted-foreground"
          }`}
        >
          {member.rsn}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs">
          Race as
          {isLoading && <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />}
        </DropdownMenuLabel>
        {accounts?.length === 0 && (
          <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
            No linked accounts.
          </DropdownMenuLabel>
        )}
        {accounts?.map((account) => (
          <DropdownMenuItem
            key={account.id}
            disabled={account.in_use}
            onSelect={() => switchTo({ account_id: account.id })}
            className="text-xs"
          >
            {account.in_use ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <span className="w-3" />
            )}
            <span className="truncate">{account.rsn}</span>
            {account.is_primary && (
              <span className="ml-auto text-[10px] text-muted-foreground">
                main
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="p-1">
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && typed.trim()) {
                e.preventDefault();
                switchTo({ rsn: typed.trim() });
              }
              e.stopPropagation();
            }}
            placeholder="Or type an RSN"
            className="h-7 text-xs"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
