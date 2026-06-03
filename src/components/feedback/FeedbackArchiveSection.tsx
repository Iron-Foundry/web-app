import { useState } from "react";
import { Archive, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FeedbackCard, type FeedbackItem } from "./FeedbackCard";

interface FeedbackArchiveSectionProps {
  items: FeedbackItem[];
  label: string;
  onHeart: (id: number) => void;
  onEdit?: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  canHeart?: boolean;
  canReply?: boolean;
  canPin?: boolean;
  canEditStatus?: boolean;
}

type SearchMode = "title" | "user";

export function FeedbackArchiveSection({
  items,
  label,
  onHeart,
  onEdit,
  onStatusChange,
  canHeart = false,
  canReply = false,
  canPin = false,
  canEditStatus = false,
}: FeedbackArchiveSectionProps) {
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("title");

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (searchMode === "user") {
      return (item.author_name?.toLowerCase().includes(q) ?? false);
    }
    return item.title.toLowerCase().includes(q);
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Archive className="h-4 w-4" />
          {label}
          {items.length > 0 && (
            <span className="text-muted-foreground font-normal">({items.length})</span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            {label}
            <span className="text-sm font-normal text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b shrink-0 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={searchMode === "title" ? "Search by title..." : "Search by user..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="flex rounded-md border border-border overflow-hidden text-xs shrink-0">
            <button
              onClick={() => setSearchMode("title")}
              className={`px-3 py-1.5 transition-colors ${
                searchMode === "title"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              Title
            </button>
            <button
              onClick={() => setSearchMode("user")}
              className={`px-3 py-1.5 border-l border-border transition-colors ${
                searchMode === "user"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              User
            </button>
          </div>
        </div>

        {/* Scrollable card list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {search.trim() ? "No results found." : "Nothing here yet."}
            </p>
          )}
          {filtered.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              onHeart={onHeart}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
              canHeart={canHeart}
              canReply={canReply}
              canPin={canPin}
              canEditStatus={canEditStatus}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
