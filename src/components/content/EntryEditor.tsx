import { useState } from "react";
import { Tabs } from "radix-ui";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MarkdownCheatsheet } from "./MarkdownCheatsheet";

interface EntryEditorProps {
  initialBody: string;
  onSave: (body: string) => void;
  onCancel: () => void;
  saving: boolean;
}

const tabTrigger = cn(
  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
  "text-muted-foreground hover:text-foreground",
  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
);

export function EntryEditor({ initialBody, onSave, onCancel, saving }: EntryEditorProps) {
  const [body, setBody] = useState(initialBody);

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Raw markdown input */}
      <textarea
        className="flex-1 min-h-[400px] resize-none rounded-md border border-input bg-background p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write markdown here…"
        spellCheck={false}
      />

      {/* Tabbed right panel: Preview | Examples */}
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

          <Tabs.Content
            value="preview"
            className="flex-1 min-h-0 overflow-auto p-4"
          >
            <MarkdownRenderer body={body} />
          </Tabs.Content>

          <Tabs.Content
            value="examples"
            className="flex-1 min-h-0 overflow-auto"
          >
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
    </div>
  );
}
