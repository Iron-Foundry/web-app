import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["", "open", "closed"] as const;

interface TicketFiltersProps {
  search: string;
  onSearch: (v: string) => void;
  dateFrom: string;
  onDateFrom: (v: string) => void;
  dateTo: string;
  onDateTo: (v: string) => void;
  statusFilter: string;
  onStatusFilter: (v: string) => void;
}

export function TicketFilters({
  search, onSearch, dateFrom, onDateFrom, dateTo, onDateTo, statusFilter, onStatusFilter,
}: TicketFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Input
        placeholder="Search ticket ID, type or creator..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">From</span>
        <Input type="date" value={dateFrom} onChange={(e) => onDateFrom(e.target.value)} className="w-36 text-xs" />
        <span className="text-xs text-muted-foreground">To</span>
        <Input type="date" value={dateTo} onChange={(e) => onDateTo(e.target.value)} className="w-36 text-xs" />
      </div>
      <div className="flex gap-1">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s || "all"}
            onClick={() => onStatusFilter(s)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {s || "All"}
          </button>
        ))}
      </div>
    </div>
  );
}
