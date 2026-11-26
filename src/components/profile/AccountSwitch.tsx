import type { LinkedAccount } from "@/api/accounts";
import { cn } from "@/lib/utils";

interface Props {
  accounts: LinkedAccount[];
  selected: string;
  onSelect: (rsn: string) => void;
}

/** Underlined account names that pick which linked account a card shows. Hidden with one account. */
export function AccountSwitch({ accounts, selected, onSelect }: Props): React.ReactElement | null {
  if (accounts.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1" role="group" aria-label="Account">
      {accounts.map((a) => (
        <button
          key={a.rsn}
          type="button"
          aria-pressed={selected === a.rsn}
          onClick={() => onSelect(a.rsn)}
          className={cn(
            "border-b-2 pb-0.5 text-sm transition-colors",
            selected === a.rsn
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {a.rsn}
        </button>
      ))}
    </div>
  );
}
