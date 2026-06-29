import { Filter, LayoutGrid, LayoutList, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RankFilterPills } from "@/components/leaderboards/RankFilterPills";
import { cn } from "@/lib/utils";

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}): React.ReactElement {
  return (
    <div className="relative flex-1 min-w-0">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search..."}
        className="pl-8 h-8 text-sm w-full"
      />
    </div>
  );
}

export function FilterToolbar({
  search,
  onSearchChange,
  rankFilter,
  onRankFilterChange,
  compact,
  onCompactToggle,
  searchPlaceholder,
  rankCounts,
  showSearch = true,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  rankFilter: string | null;
  onRankFilterChange: (r: string | null) => void;
  compact: boolean;
  onCompactToggle: () => void;
  searchPlaceholder?: string;
  rankCounts?: Record<string, number>;
  showSearch?: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      {showSearch && (
        <SearchBar value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-1.5 h-8 shrink-0", rankFilter && "border-primary text-primary")}
          >
            <Filter className="h-3.5 w-3.5" />
            {rankFilter ? `Filter (${rankFilter})` : "Filter"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="end">
          <RankFilterPills active={rankFilter} onChange={onRankFilterChange} compact={false} counts={rankCounts} />
        </PopoverContent>
      </Popover>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCompactToggle}
        title={compact ? "Switch to comfortable view" : "Switch to compact view"}
        className="gap-1.5 text-muted-foreground hover:text-foreground h-8 shrink-0"
      >
        {compact ? <LayoutGrid className="h-4 w-4" /> : <LayoutList className="h-4 w-4" />}
        <span className="text-xs hidden sm:inline">{compact ? "Comfortable" : "Compact"}</span>
      </Button>
    </div>
  );
}
