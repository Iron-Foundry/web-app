import { useEffect, useRef, useState } from "react";
import { Film, ImageIcon, Trash2, Upload } from "lucide-react";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { assetThumbnailUrl } from "@/lib/assetUrl";
import { ASSET_SIZE_PRESETS } from "@/lib/guideAssets";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types/assets";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

interface AssetPickerDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called when user selects an asset. Provides full URL, suggested alt text, content type, and chosen width (px, null = full). */
  onSelect: (url: string, alt: string, contentType: string, width: number | null) => void;
  /** Whether the current user can upload (Mentor+). */
  canUpload: boolean;
  /** Whether the current user can delete others' assets (Senior Mod+). */
  canDeleteAny: boolean;
}

export function AssetPickerDialog({
  open,
  onClose,
  onSelect,
  canUpload,
  canDeleteAny,
}: AssetPickerDialogProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sizeKey, setSizeKey] = useState("full");
  const [customWidth, setCustomWidth] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function selectedWidth(): number | null {
    if (sizeKey === "custom") {
      const px = Number(customWidth);
      return Number.isFinite(px) && px > 0 ? px : null;
    }
    return ASSET_SIZE_PRESETS.find((p) => p.key === sizeKey)?.width ?? null;
  }


  async function loadAssets() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/assets`, { headers: getAuthHeaders() });
      if (res.ok) setAssets(await res.json());
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setSearch("");
      setSizeKey("full");
      setCustomWidth("");
      setUploadError(null);
      loadAssets();
    }
  }, [open]);

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
        setUploadError(data.detail ?? "Upload failed.");
        return;
      }
      await loadAssets();
    } catch {
      setUploadError("Network error.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(asset: Asset, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${asset.original_name}"? This cannot be undone.`)) return;
    await fetch(`${API_URL}/assets/${asset.id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
  }

  const filtered = search.trim()
    ? assets.filter((a) => a.original_name.toLowerCase().includes(search.toLowerCase()))
    : assets;

  const isImage = (a: Asset) => a.content_type.startsWith("image/");
  const isVideo = (a: Asset) => a.content_type.startsWith("video/");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Asset Library</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 pb-1">
          <Input
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
          {canUpload && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="shrink-0"
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
          <p className="text-xs text-destructive -mt-1">{uploadError}</p>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Insert size:</span>
          {ASSET_SIZE_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => setSizeKey(preset.key)}
              className={cn(
                "text-xs px-2.5 py-1 rounded border transition-colors",
                sizeKey === preset.key
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-foreground/40",
              )}
            >
              {preset.label}
            </button>
          ))}
          <Input
            type="number"
            min={1}
            value={customWidth}
            onFocus={() => setSizeKey("custom")}
            onChange={(e) => {
              setCustomWidth(e.target.value);
              setSizeKey("custom");
            }}
            placeholder="px"
            className={cn("h-7 w-20 text-xs", sizeKey === "custom" && "border-primary")}
          />
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Applied on insert. You can edit <code className="font-mono">width</code> in the text afterwards.
        </p>

        <div className="h-105 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {assets.length === 0 ? "No assets uploaded yet." : "No results."}
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-1">
              {filtered.map((asset) => (
                <div
                  key={asset.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelect(`${API_URL}${asset.url}`, asset.original_name.replace(/\.[^.]+$/, ""), asset.content_type, selectedWidth());
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onSelect(`${API_URL}${asset.url}`, asset.original_name.replace(/\.[^.]+$/, ""), asset.content_type, selectedWidth());
                      onClose();
                    }
                  }}
                  className={cn(
                    "group relative rounded-md border border-border bg-muted/30 overflow-hidden text-left cursor-pointer",
                    "hover:border-primary hover:bg-muted transition-colors",
                  )}
                >
                  <div className="flex items-center justify-center h-24 bg-muted/50">
                    {isImage(asset) ? (
                      <img
                        src={assetThumbnailUrl(asset.url, asset.content_type, 256)}
                        alt={asset.original_name}
                        loading="lazy"
                        decoding="async"
                        className="max-h-24 max-w-full object-contain"
                      />
                    ) : isVideo(asset) ? (
                      <Film className="h-8 w-8 text-muted-foreground/40" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>

                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium truncate text-foreground">
                      {asset.original_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatBytes(asset.size_bytes)}</p>
                  </div>

                  {canDeleteAny && (
                    <button
                      onClick={(e) => handleDelete(asset, e)}
                      className="absolute top-1 right-1 p-0.5 rounded bg-background/80 text-primary/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
