import { useEffect, useRef, useState } from "react";
import { Tabs } from "radix-ui";
import {
  HelpCircle, ImageIcon, Video, Link2, Eraser,
  Bold, Italic, Strikethrough, Code, FileCode, Heading2, Heading3, Quote,
  Undo2, Redo2, BookMarked, MapPinned, Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useContentContext } from "./ContentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MarkdownCheatsheet } from "./MarkdownCheatsheet";
import { AssetPickerDialog } from "./AssetPickerDialog";
import { EntryRefPickerDialog } from "./EntryRefPickerDialog";
import { RuneLiteObjectPickerDialog } from "./RuneLiteObjectPickerDialog";
import { OsrsIconPickerDialog } from "./OsrsIconPickerDialog";
import { buildImageMarkup, buildVideoMarkup } from "@/lib/guideAssets";

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

const headerBar = "flex items-center gap-0.5 flex-wrap border-b border-border bg-muted/40 px-2 py-1.5 shrink-0";

function Sep({ vertical }: { vertical?: boolean }) {
  return vertical
    ? <div className="h-px w-4 bg-border my-1 self-center" />
    : <div className="w-px h-4 bg-border mx-1" />;
}

function ToolbarBtn({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center h-7 w-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0] ?? null;
    if (u.hostname === "youtube.com" || u.hostname === "www.youtube.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return m[1] ?? null;
    }
  } catch {}
  return null;
}

export function EntryEditor({ initialBody, onSave, onCancel, saving, onBodyChange }: EntryEditorProps) {
  const [body, setBody] = useState(initialBody);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [refPickerOpen, setRefPickerOpen] = useState(false);
  const [runelitePickerOpen, setRunelitePickerOpen] = useState(false);
  const [osrsIconPickerOpen, setOsrsIconPickerOpen] = useState(false);
  const [embedUrlOpen, setEmbedUrlOpen] = useState(false);
  const [embedUrlValue, setEmbedUrlValue] = useState("");
  const [embedAutoplay, setEmbedAutoplay] = useState(false);
  const [tocInsertOpen, setTocInsertOpen] = useState(false);
  const [tocTitle, setTocTitle] = useState("");
  const [tocIndent, setTocIndent] = useState(1);
  const [tocHidden, setTocHidden] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [toolbarStuck, setToolbarStuck] = useState(false);
  const toolbarSentinelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([initialBody]);
  const historyIndexRef = useRef(0);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [body]);

  useEffect(() => {
    const node = toolbarSentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setToolbarStuck(!(entry?.isIntersecting ?? true)),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { pageId } = useContentContext();
  const effectiveRoles = user?.effective_roles ?? [];
  const canEdit = hasPermission(pageId, "edit", effectiveRoles);
  const canUpload = canEdit && hasPermission(pageId, "create", effectiveRoles);
  const canDeleteAny = hasPermission(pageId, "delete", effectiveRoles);

  function pushHistory(newBody: string) {
    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    trimmed.push(newBody);
    if (trimmed.length > 500) trimmed.shift();
    historyRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }

  function updateBody(newBody: string) {
    pushHistory(newBody);
    setBody(newBody);
    onBodyChange?.(newBody);
  }

  function undo() {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const prev = historyRef.current[historyIndexRef.current]!;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(true);
    setBody(prev);
    onBodyChange?.(prev);
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const next = historyRef.current[historyIndexRef.current]!;
    setCanUndo(true);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    setBody(next);
    onBodyChange?.(next);
  }

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) { updateBody(body + text); return; }
    const s = el.selectionStart, e = el.selectionEnd;
    updateBody(body.slice(0, s) + text + body.slice(e));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + text.length, s + text.length); });
  }

  function wrapSelection(before: string, after = before) {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = body.slice(s, e);
    updateBody(body.slice(0, s) + before + sel + after + body.slice(e));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); });
  }

  function prefixLine(prefix: string) {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const ls = body.lastIndexOf("\n", s - 1) + 1;
    updateBody(body.slice(0, ls) + prefix + body.slice(ls));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + prefix.length, s + prefix.length); });
  }

  function stripWhitespace() {
    const stripped = body
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim();
    updateBody(stripped);
  }

  function insertCodeBlock() {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const sel = body.slice(s, e);
    const block = sel ? "```\n" + sel + "\n```" : "```\n\n```";
    updateBody(body.slice(0, s) + block + body.slice(e));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + 4, s + 4 + sel.length); });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = textareaRef.current;
      if (!el) return;
      const s = el.selectionStart, end = el.selectionEnd;
      updateBody(body.slice(0, s) + "    " + body.slice(end));
      requestAnimationFrame(() => el.setSelectionRange(s + 4, s + 4));
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (e.key === "z" &&  e.shiftKey) { e.preventDefault(); redo(); return; }
      if (e.key === "y")                { e.preventDefault(); redo(); return; }
      if (e.key === "b") { e.preventDefault(); wrapSelection("**"); }
      if (e.key === "i") { e.preventDefault(); wrapSelection("*"); }
    }
  }

  function openTocInsert() {
    const el = textareaRef.current;
    const sel = el ? body.slice(el.selectionStart, el.selectionEnd).trim() : "";
    setTocTitle(sel);
    setTocIndent(1);
    setTocHidden(false);
    setTocInsertOpen((v) => !v);
    setEmbedUrlOpen(false);
  }

  function handleInsertToc() {
    const title = tocTitle.trim();
    if (!title) return;
    insertAtCursor(`[toc]{indent=${tocIndent},title=${title},hidden=${tocHidden}}`);
    setTocInsertOpen(false);
    setTocTitle("");
  }

  function handleAssetSelect(url: string, alt: string, contentType: string, width: number | null) {
    insertAtCursor(contentType.startsWith("video/")
      ? buildVideoMarkup(url, width)
      : buildImageMarkup({ url, alt, width }));
  }

  function handleEmbedUrl() {
    const url = embedUrlValue.trim();
    if (!url) return;
    const ytId = extractYouTubeId(url);
    const query = embedAutoplay ? "?autoplay=1&mute=1" : "";
    insertAtCursor(ytId
      ? `\n<iframe src="https://www.youtube-nocookie.com/embed/${ytId}${query}" width="560" height="315" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>\n`
      : `[Watch](${url})`);
    setEmbedUrlValue("");
    setEmbedAutoplay(false);
    setEmbedUrlOpen(false);
  }

  function renderTools(vertical: boolean) {
    const labelCls = vertical ? "sr-only" : "";
    return (
      <>
        <ToolbarBtn title="Undo (Ctrl+Z)"       onClick={undo} disabled={!canUndo}><Undo2 className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}><Redo2 className="h-3.5 w-3.5" /></ToolbarBtn>
        <Sep vertical={vertical} />
        <ToolbarBtn title="Bold (Ctrl+B)"   onClick={() => wrapSelection("**")}><Bold          className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn title="Italic (Ctrl+I)" onClick={() => wrapSelection("*")} ><Italic        className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn title="Strikethrough"   onClick={() => wrapSelection("~~")}><Strikethrough  className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn title="Inline code"     onClick={() => wrapSelection("`")} ><Code          className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn title="Code block"      onClick={insertCodeBlock}          ><FileCode      className="h-3.5 w-3.5" /></ToolbarBtn>
        <Sep vertical={vertical} />
        <ToolbarBtn title="Heading 2"  onClick={() => prefixLine("## ")} ><Heading2 className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn title="Heading 3"  onClick={() => prefixLine("### ")}><Heading3 className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn title="Blockquote" onClick={() => prefixLine("> ")}  ><Quote    className="h-3.5 w-3.5" /></ToolbarBtn>
        <Sep vertical={vertical} />
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setAssetPickerOpen(true)} title="Insert image or video asset" type="button">
          <ImageIcon className="h-3.5 w-3.5 mr-1" /><span className={labelCls}>Assets</span>
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEmbedUrlOpen(v => !v)} title="Embed YouTube or video URL" type="button">
          <Video className="h-3.5 w-3.5 mr-1" /><span className={labelCls}>Embed</span>
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setRefPickerOpen(true)} title="Insert entry reference" type="button">
          <Link2 className="h-3.5 w-3.5 mr-1" /><span className={labelCls}>Reference</span>
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setRunelitePickerOpen(true)} title="Insert RuneLite object" type="button">
          <MapPinned className="h-3.5 w-3.5 mr-1" /><span className={labelCls}>RuneLite</span>
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setOsrsIconPickerOpen(true)} title="Insert OSRS item or sprite icon" type="button">
          <Sparkles className="h-3.5 w-3.5 mr-1" /><span className={labelCls}>OSRS Icon</span>
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={openTocInsert} title="Insert TOC anchor" type="button">
          <BookMarked className="h-3.5 w-3.5 mr-1" /><span className={labelCls}>TOC</span>
        </Button>
        <Sep vertical={vertical} />
        <ToolbarBtn title="Strip leading/trailing whitespace from all lines" onClick={stripWhitespace}>
          <Eraser className="h-3.5 w-3.5" />
        </ToolbarBtn>
      </>
    );
  }

  return (
    <div className="flex gap-4 items-start">

      {/* Floating vertical toolbar that follows the scroll once the main bar leaves view */}
      <div
        className={cn(
          "fixed left-3 top-1/2 z-40 -translate-y-1/2 flex flex-col items-center gap-0.5 rounded-md border border-border bg-background/95 p-1 shadow-lg backdrop-blur transition-all duration-300",
          toolbarStuck
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "-translate-x-6 opacity-0 pointer-events-none",
        )}
        aria-hidden={!toolbarStuck}
      >
        {renderTools(true)}
      </div>

      {/* ── Left: Editor panel ── */}
      <div className="flex flex-col flex-1 rounded-md border border-border overflow-hidden">
        <div className={headerBar}>
          {renderTools(false)}
        </div>
        <div ref={toolbarSentinelRef} className="h-px" />

        {tocInsertOpen && (
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border bg-muted/20 flex-wrap">
            <Input
              className="h-7 text-xs flex-1 min-w-32"
              placeholder="Title…"
              value={tocTitle}
              onChange={(e) => setTocTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInsertToc();
                if (e.key === "Escape") setTocInsertOpen(false);
              }}
              autoFocus
            />
            <select
              className="h-7 text-xs rounded-md border border-input bg-background px-2"
              value={tocIndent}
              onChange={(e) => setTocIndent(Number(e.target.value))}
            >
              <option value={1}>Indent 1</option>
              <option value={2}>Indent 2</option>
              <option value={3}>Indent 3</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground select-none cursor-pointer">
              <input
                type="checkbox"
                checked={tocHidden}
                onChange={(e) => setTocHidden(e.target.checked)}
                className="rounded"
              />
              Hidden
            </label>
            <Button size="sm" className="h-7 text-xs shrink-0" onClick={handleInsertToc} type="button">Insert</Button>
          </div>
        )}

        {embedUrlOpen && (
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-muted/20">
            <Input
              className="h-7 text-xs"
              placeholder="YouTube or video URL…"
              value={embedUrlValue}
              onChange={e => setEmbedUrlValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleEmbedUrl();
                if (e.key === "Escape") { setEmbedUrlOpen(false); setEmbedUrlValue(""); }
              }}
              autoFocus
            />
            <label
              className="flex items-center gap-1.5 text-xs text-muted-foreground select-none cursor-pointer shrink-0 whitespace-nowrap"
              title="YouTube only autoplays when muted, so this starts the video muted"
            >
              <input
                type="checkbox"
                checked={embedAutoplay}
                onChange={e => setEmbedAutoplay(e.target.checked)}
                className="rounded"
              />
              Autoplay (muted)
            </label>
            <Button size="sm" className="h-7 text-xs shrink-0" onClick={handleEmbedUrl} type="button">Embed</Button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          className="w-full resize-none bg-background p-3 font-mono text-sm leading-5 focus:outline-none min-h-128"
          value={body}
          onChange={e => updateBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write markdown here…"
          spellCheck={false}
        />
      </div>

      {/* ── Right: Preview panel ── */}
      <div className="flex flex-col flex-1 rounded-md border border-border overflow-hidden">
        <Tabs.Root defaultValue="preview" className="flex flex-col">
          <Tabs.List className="flex items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5 shrink-0">
            <Tabs.Trigger value="preview" className={tabTrigger}>Preview</Tabs.Trigger>
            <Tabs.Trigger value="examples" className={tabTrigger}>
              <HelpCircle className="h-3.5 w-3.5" />Examples
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="preview" className="p-4">
            <MarkdownRenderer body={body} />
          </Tabs.Content>
          <Tabs.Content value="examples">
            <MarkdownCheatsheet />
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* ── Save / Cancel ── */}
      <div className="flex flex-col gap-2 shrink-0">
        <Button onClick={() => onSave(body.trim())} disabled={saving}>
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

      <EntryRefPickerDialog
        open={refPickerOpen}
        onClose={() => setRefPickerOpen(false)}
        onSelect={insertAtCursor}
      />

      <RuneLiteObjectPickerDialog
        open={runelitePickerOpen}
        onClose={() => setRunelitePickerOpen(false)}
        onSelect={insertAtCursor}
      />

      <OsrsIconPickerDialog
        open={osrsIconPickerOpen}
        onClose={() => setOsrsIconPickerOpen(false)}
        onSelect={insertAtCursor}
      />
    </div>
  );
}
