import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_URL, useAuth } from "@/context/AuthContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { usePermissions } from "@/context/PermissionsContext";
import { assetsApi } from "@/api/assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import type { Asset } from "@/types/assets";
import { AssetCard } from "@/components/assets/AssetCard";
import { AssetHoverPreview } from "@/components/assets/AssetHoverPreview";
import { useHoverPreview } from "@/components/assets/useHoverPreview";

type TypeFilter = "all" | "image" | "video";

const TYPE_FILTERS: TypeFilter[] = ["all", "image", "video"];

export function UploadedAssetsTab(): React.JSX.Element {
  const { user } = useAuth();
  const effectiveRoles = useEffectiveRoles(user?.effective_roles ?? []);
  const { hasPermission } = usePermissions();
  const canUpload = hasPermission("staff.assets", "create", effectiveRoles);
  const canDeleteAny = hasPermission("staff.assets", "delete", effectiveRoles);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preview = useHoverPreview<Asset>();

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      setAssets(await assetsApi.list());
    } catch {
      /* network error - leave list as-is */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setUploadError(null);
    try {
      await assetsApi.upload(file);
      await loadAssets();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const endPreview = preview.end;
  const handleDelete = useCallback(
    async (asset: Asset) => {
      if (!confirm(`Delete "${asset.original_name}"? This cannot be undone.`)) return;
      endPreview();
      await assetsApi.delete(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    },
    [endPreview],
  );

  const handleCopy = useCallback(async (asset: Asset) => {
    await navigator.clipboard.writeText(`${API_URL}${asset.url}`);
    setCopied(asset.id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assets.filter((a) => {
      if (term && !a.original_name.toLowerCase().includes(term)) return false;
      if (typeFilter === "image" && !a.content_type.startsWith("image/")) return false;
      if (typeFilter === "video" && !a.content_type.startsWith("video/")) return false;
      return true;
    });
  }, [assets, search, typeFilter]);

  const canDelete = (asset: Asset): boolean =>
    canDeleteAny || asset.uploaded_by?.discord_user_id === Number(user?.discord_user_id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search assets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm w-56"
        />

        <div className="flex rounded-md border border-border overflow-hidden text-xs">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1 capitalize transition-colors",
                typeFilter === t
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {assets.length} shown
        </span>

        {canUpload && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/avif,video/mp4,video/webm,video/ogg"
              className="hidden"
              onChange={handleUpload}
            />
          </>
        )}
      </div>

      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          {assets.length === 0 ? "No assets uploaded yet." : "No results."}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              copied={copied === asset.id}
              canDelete={canDelete(asset)}
              onCopy={handleCopy}
              onDelete={handleDelete}
              onHoverStart={preview.start}
              onHoverEnd={preview.end}
            />
          ))}
        </div>
      )}

      {preview.target && <AssetHoverPreview asset={preview.target} />}
    </div>
  );
}
