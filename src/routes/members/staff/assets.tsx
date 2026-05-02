import { useEffect, useRef, useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { membersLayoutRoute } from "../_layout";
import { API_URL, getAuthHeaders, useAuth } from "@/context/AuthContext";
import { useEffectiveRoles } from "@/context/ViewAsContext";
import { usePermissions } from "@/context/PermissionsContext";
import { StaffGuard } from "@/components/StaffGuard";
import { registerPage } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Copy, Download, Film, ImageIcon, Trash2, Upload } from "lucide-react";
import type { Asset } from "@/types/assets";

registerPage({
  id: "staff.assets",
  label: "Asset Library",
  description: "Upload and manage shared assets (images, videos) used across the site.",
  defaults: {
    read:   ["Foundry Mentors"],
    create: ["Foundry Mentors"],
    edit:   [],
    delete: ["Senior Moderator"],
  },
});


function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function AssetHoverPreview({ asset, x, y }: { asset: Asset; x: number; y: number }) {
  const isImage = asset.content_type.startsWith("image/");
  const isVideo = asset.content_type.startsWith("video/");
  const w = 280;
  const left = x + 16 + w > window.innerWidth ? x - w - 8 : x + 16;
  const top = Math.min(y - 8, window.innerHeight - 320);

  return (
    <div className="fixed z-50 pointer-events-none" style={{ left, top }}>
      <Card className="w-70 shadow-xl overflow-hidden">
        <div className="flex items-center justify-center h-44 bg-muted/60">
          {isImage ? (
            <img
              src={`${API_URL}${asset.url}`}
              alt={asset.original_name}
              className="max-h-44 max-w-full object-contain"
            />
          ) : isVideo ? (
            <video
              src={`${API_URL}${asset.url}`}
              className="max-h-44 max-w-full object-contain"
              muted autoPlay loop playsInline
            />
          ) : (
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          )}
        </div>
        <CardContent className="p-3 space-y-1.5">
          <p className="text-sm font-medium text-foreground break-all leading-snug">
            {asset.original_name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {asset.content_type}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatBytes(asset.size_bytes)}</span>
          </div>
          {asset.uploaded_by && (
            <p className="text-xs text-muted-foreground">
              by {asset.uploaded_by.rsn ?? asset.uploaded_by.discord_username}
            </p>
          )}
          {asset.created_at && (
            <p className="text-xs text-muted-foreground">{fmtDate(asset.created_at)}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const staffAssetsRoute = createRoute({
  getParentRoute: () => membersLayoutRoute,
  path: "/staff/assets",
  component: () => (
    <StaffGuard pageId="staff.home">
      <AssetManagerPage />
    </StaffGuard>
  ),
});

type TypeFilter = "all" | "image" | "video";

function AssetManagerPage() {
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
  const [preview, setPreview] = useState<{ asset: Asset; x: number; y: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  async function loadAssets() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/assets`, { headers: getAuthHeaders() });
      if (res.ok) setAssets(await res.json());
    } catch {
      /* network error — leave list as-is */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAssets(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/assets/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setUploadError((data as { detail?: string }).detail ?? "Upload failed.");
        return;
      }
      await loadAssets();
    } catch {
      setUploadError("Network error.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(asset: Asset) {
    if (!confirm(`Delete "${asset.original_name}"? This cannot be undone.`)) return;
    setPreview(null);
    await fetch(`${API_URL}/assets/${asset.id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
  }

  async function copyUrl(asset: Asset) {
    await navigator.clipboard.writeText(`${API_URL}${asset.url}`);
    setCopied(asset.id);
    setTimeout(() => setCopied(null), 2000);
  }

  const isOwn = (asset: Asset) =>
    asset.uploaded_by?.discord_user_id === Number(user?.discord_user_id);

  const filtered = assets.filter((a) => {
    if (search.trim() && !a.original_name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (typeFilter === "image" && !a.content_type.startsWith("image/")) return false;
    if (typeFilter === "video" && !a.content_type.startsWith("video/")) return false;
    return true;
  });

  const isImage = (a: Asset) => a.content_type.startsWith("image/");
  const isVideo = (a: Asset) => a.content_type.startsWith("video/");

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Asset Library</h1>
        <p className="text-sm text-muted-foreground">
          {assets.length} asset{assets.length !== 1 ? "s" : ""} — hover for preview, click to copy URL
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search assets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm w-56"
        />

        <div className="flex rounded-md border border-border overflow-hidden text-xs">
          {(["all", "image", "video"] as TypeFilter[]).map((t) => (
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
          {filtered.length} shown
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

      {uploadError && (
        <p className="text-xs text-destructive">{uploadError}</p>
      )}

      {/* Grid */}
      {loading ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          {assets.length === 0 ? "No assets uploaded yet." : "No results."}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className={cn(
                "group relative rounded-md border border-border bg-muted/30 overflow-hidden cursor-pointer",
                "hover:border-primary hover:bg-muted transition-colors",
              )}
              onMouseEnter={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setPreview({ asset, x: r.right, y: r.top });
              }}
              onMouseMove={(e) => setPreview((p) => p ? { ...p, x: e.clientX, y: e.clientY } : null)}
              onMouseLeave={() => setPreview(null)}
              onClick={() => copyUrl(asset)}
            >
              {/* Thumbnail */}
              <div className="flex items-center justify-center h-24 bg-muted/50">
                {isImage(asset) ? (
                  <img
                    src={`${API_URL}${asset.url}`}
                    alt={asset.original_name}
                    className="max-h-24 max-w-full object-contain"
                  />
                ) : isVideo(asset) ? (
                  <Film className="h-8 w-8 text-muted-foreground/40" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>

              {/* Name + size */}
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium truncate text-foreground">
                  {asset.original_name}
                </p>
                <p className="text-[10px] text-muted-foreground">{formatBytes(asset.size_bytes)}</p>
              </div>

              {/* Copy indicator (top-left) */}
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {copied === asset.id ? (
                  <span className="inline-flex items-center gap-0.5 rounded bg-green-500/90 px-1.5 py-0.5 text-[10px] text-white">
                    <Check className="h-2.5 w-2.5" /> Copied
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    <Copy className="h-2.5 w-2.5" /> Copy URL
                  </span>
                )}
              </div>

              {/* Actions (top-right) */}
              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={`${API_URL}${asset.url}`}
                  download={asset.original_name}
                  onClick={(e) => e.stopPropagation()}
                  className="p-0.5 rounded bg-background/80 text-muted-foreground hover:text-foreground"
                  title="Download"
                >
                  <Download className="h-3 w-3" />
                </a>
                {(canDeleteAny || isOwn(asset)) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(asset); }}
                    className="p-0.5 rounded bg-background/80 text-muted-foreground hover:text-destructive"
                    title="Delete asset"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hover preview */}
      {preview && (
        <AssetHoverPreview asset={preview.asset} x={preview.x} y={preview.y} />
      )}
    </div>
  );
}
