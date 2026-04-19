import { useRef, useState } from "react";
import { Tabs } from "radix-ui";
import { HelpCircle, ImageIcon, Video } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useContentContext } from "./ContentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MarkdownCheatsheet } from "./MarkdownCheatsheet";
import { AssetPickerDialog } from "./AssetPickerDialog";
import { hasMinRank } from "@/lib/ranks";

interface EntryEditorProps {
  initialBody: string;
  onSave: (body: string) => void;
  onCancel: () => void;
  saving: boolean;
  onBodyChange?: (body: string) => void;
}

const tabTrigger = cn(
  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
  "text-muted-foreground hover:text-foreground",
  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
);

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname === "youtube.com" || u.hostname === "www.youtube.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return m[1];
    }
  } catch {}
  return null;
}

export function EntryEditor({ initialBody, onSave, onCancel, saving, onBodyChange }: EntryEditorProps) {
  const [body, setBody] = useState(initialBody);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [embedUrlOpen, setEmbedUrlOpen] = useState(false);
  const [embedUrlValue, setEmbedUrlValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { pageId } = useContentContext();
  const effectiveRoles = user?.effective_roles ?? [];

  const canEdit = hasPermission(pageId, "edit", effectiveRoles);
  const canUpload = canEdit && hasMinRank(effectiveRoles, "Mentor");
  const canDeleteAny = hasMinRank(effectiveRoles, "Senior Moderator");

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) {
      setBody((b) => b + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = body.slice(0, start);
    const after = body.slice(end);
    const newBody = before + text + after;
    setBody(newBody);
    onBodyChange?.(newBody);
    // Restore cursor after insertion
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  }

  function handleAssetSelect(url: string, alt: string, contentType: string) {
    if (contentType.startsWith("video/")) {
      insertAtCursor(`\n<video src="${url}" controls></video>\n`);
    } else {
      insertAtCursor(`![${alt}](${url})`);
    }
  }

  function handleEmbedUrl() {
    const url = embedUrlValue.trim();
    if (!url) return;
    const ytId = extractYouTubeId(url);
    if (ytId) {
      insertAtCursor(
        `\n<iframe src="https://www.youtube-nocookie.com/embed/${ytId}" width="560" height="315" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>\n`,
      );
    } else {
      insertAtCursor(`[Watch](${url})`);
    }
    setEmbedUrlValue("");
    setEmbedUrlOpen(false);
  }

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left: editor */}
      <div className="flex flex-col flex-1 min-h-0 gap-1">
        {/* Toolbar */}
        <div className="flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setAssetPickerOpen(true)}
              title="Insert image or video asset"
              type="button"
            >
              <ImageIcon className="h-3.5 w-3.5 mr-1" />
              Internal Assets
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => setEmbedUrlOpen((v) => !v)}
              title="Embed YouTube or video URL"
              type="button"
            >
              <Video className="h-3.5 w-3.5 mr-1" />
              Embed Video
            </Button>
          </div>
          {embedUrlOpen && (
            <div className="flex items-center gap-1">
              <Input
                className="h-7 text-xs"
                placeholder="YouTube or video URL…"
                value={embedUrlValue}
                onChange={(e) => setEmbedUrlValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEmbedUrl();
                  if (e.key === "Escape") { setEmbedUrlOpen(false); setEmbedUrlValue(""); }
                }}
                autoFocus
              />
              <Button size="sm" className="h-7 text-xs shrink-0" onClick={handleEmbedUrl} type="button">
                Embed
              </Button>
            </div>
          )}
        </div>

        <textarea
          ref={textareaRef}
          className="flex-1 min-h-[400px] resize-none rounded-md border border-input bg-background p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          value={body}
          onChange={(e) => { setBody(e.target.value); onBodyChange?.(e.target.value); }}
          placeholder="Write markdown here…"
          spellCheck={false}
        />
      </div>

      {/* Right: preview / examples */}
      <div className="flex flex-col flex-1 min-h-0 rounded-md border border-border overflow-hidden">
        <Tabs.Root defaultValue="preview" className="flex flex-col flex-1 min-h-0">
          <Tabs.List className="flex items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5 shrink-0">
            <Tabs.Trigger value="preview" className={tabTrigger}>
              Preview
            </Tabs.Trigger>
            <Tabs.Trigger value="examples" className={tabTrigger}>
              <HelpCircle className="h-3.5 w-3.5" />
              Examples
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="preview" className="flex-1 min-h-0 overflow-auto p-4">
            <MarkdownRenderer body={body} />
          </Tabs.Content>

          <Tabs.Content value="examples" className="flex-1 min-h-0 overflow-auto">
            <MarkdownCheatsheet />
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 shrink-0">
        <Button onClick={() => onSave(body)} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>

      <AssetPickerDialog
        open={assetPickerOpen}
        onClose={() => setAssetPickerOpen(false)}
        onSelect={handleAssetSelect}
        canUpload={canUpload}
        canDeleteAny={canDeleteAny}
      />
    </div>
  );
}
