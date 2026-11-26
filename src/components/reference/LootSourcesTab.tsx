import { useCallback, useState } from "react";
import { Search } from "lucide-react";
import type { LootCategory } from "@/api/osrsclans";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { useLootSources } from "@/hooks/useLootSources";
import { SourceDialog } from "./SourceDialog";
import { SourceList } from "./SourceList";

function useCanSetKillRates(): boolean {
  const { user } = useAuth();
  const roles = useEffectiveRoles(user?.effective_roles ?? []);
  const { hasPermission } = usePermissions();
  return hasPermission("frenzy.admin", "edit", roles);
}

/** One OSRSClans category: a search, its sources, and the dialog of the open one. */
export function LootSourcesTab({ category }: { category: LootCategory }): React.ReactElement {
  const [q, setQ] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const canEdit = useCanSetKillRates();
  const { data, isPending, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useLootSources(category, q.trim());
  const sources = data?.pages.flatMap((page) => page.items) ?? [];
  const openSource = sources.find((source) => source.source === openKey) ?? null;
  const fetchMore = useCallback(() => {
    if (!isFetchingNextPage) void fetchNextPage();
  }, [isFetchingNextPage, fetchNextPage]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <Input className="h-8 pl-8" placeholder="Search sources or items" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {isPending && <p className="text-sm text-muted-foreground">Loading sources...</p>}
      {isError && <p className="text-sm text-destructive">OSRSClans did not answer.</p>}
      {data && sources.length === 0 && <p className="text-sm text-muted-foreground">No sources match.</p>}
      {sources.length > 0 && (
        <SourceList
          sources={sources}
          hasMore={hasNextPage}
          onNearEnd={fetchMore}
          onOpen={(source) => setOpenKey(source.source)}
        />
      )}
      <SourceDialog source={openSource} canEdit={canEdit} onClose={() => setOpenKey(null)} />
    </div>
  );
}
