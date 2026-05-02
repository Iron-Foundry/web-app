import { useEffect, useRef, useState } from "react";
import { Film, ImageIcon, Trash2, Upload } from "lucide-react";
import { API_URL, getAuthHeaders } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  /** Called when user selects an asset. Provides full URL, suggested alt text, and content type. */
  onSelect: (url: string, alt: string, contentType: string) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);


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
                    onSelect(`${API_URL}${asset.url}`, asset.original_name.replace(/\.[^.]+$/, ""), asset.content_type);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onSelect(`${API_URL}${asset.url}`, asset.original_name.replace(/\.[^.]+$/, ""), asset.content_type);
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
