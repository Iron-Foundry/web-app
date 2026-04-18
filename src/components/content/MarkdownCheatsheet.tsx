import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

// ── Data ──────────────────────────────────────────────────────────────────────

interface Example {
  label: string;
  syntax: string;
}

interface Section {
  title: string;
  examples: Example[];
}

const SECTIONS: Section[] = [
  {
    title: "Headings",
    examples: [
      {
        label: "Four heading levels",
        syntax: "# Heading 1\n## Heading 2\n### Heading 3\n#### Heading 4",
      },
    ],
  },
  {
    title: "Text Formatting",
    examples: [
      { label: "Bold", syntax: "**Bold text**" },
      { label: "Italic", syntax: "*Italic text*" },
      { label: "Bold + italic", syntax: "***Bold italic***" },
      { label: "Strikethrough", syntax: "~~Strikethrough~~" },
      { label: "Inline code", syntax: "`inline code`" },
    ],
  },
  {
    title: "Links & Images",
    examples: [
      { label: "Hyperlink", syntax: "[Link text](https://runelite.net)" },
      {
        label: "Image",
        syntax: "![RuneLite logo](https://runelite.net/img/logo.png)",
      },
    ],
  },
  {
    title: "Lists",
    examples: [
      {
        label: "Bullet list with nesting",
        syntax: "- Item one\n- Item two\n  - Nested item\n  - Another nested",
      },
      {
        label: "Numbered list",
        syntax: "1. First step\n2. Second step\n3. Third step",
      },
    ],
  },
  {
    title: "Blockquote",
    examples: [
      {
        label: "Quote / callout",
        syntax:
          "> **Note:** This plugin requires a Plugin Hub install.\n> Restart RuneLite after enabling.",
      },
    ],
  },
  {
    title: "Code Blocks",
    examples: [
      {
        label: "Plain code block",
        syntax: "```\nSettings → Plugin Hub → Search \"Clan Chat\"\n```",
      },
      {
        label: "Syntax-highlighted block",
        syntax:
          '```json\n{\n  "plugin": "Discord",\n  "version": "1.4.2",\n  "enabled": true\n}\n```',
      },
    ],
  },
  {
    title: "Tables",
    examples: [
      {
        label: "Plugin comparison table",
        syntax:
          "| Plugin | Purpose | Required |\n| ------ | ------- | -------- |\n| GPU | Performance boost | No |\n| Discord | Clan chat relay | Yes |\n| RuneInfo | XP tracking | No |",
      },
    ],
  },
  {
    title: "Divider",
    examples: [{ label: "Horizontal rule", syntax: "---" }],
  },
  {
    title: "HTML — Coloured Text",
    examples: [
      {
        label: "Custom colour with <span>",
        syntax:
          'Use <span style="color: #c084fc">**purple**</span> or <span style="color: #4ade80">**green**</span> to highlight key info.',
      },
    ],
  },
  {
    title: "HTML — Callout Boxes",
    examples: [
      {
        label: "Tip box",
        syntax:
          '<div style="background:#1e3a2f;border-left:4px solid #4ade80;padding:12px;border-radius:4px;margin:8px 0">\n\n💡 **Tip:** Enable the GPU plugin for significantly better performance on most machines.\n\n</div>',
      },
      {
        label: "Warning box",
        syntax:
          '<div style="background:#3b1e1e;border-left:4px solid #f87171;padding:12px;border-radius:4px;margin:8px 0">\n\n⚠️ **Warning:** Disabling this plugin mid-raid may cause a client crash.\n\n</div>',
      },
      {
        label: "Info box",
        syntax:
          '<div style="background:#1e2a3b;border-left:4px solid #60a5fa;padding:12px;border-radius:4px;margin:8px 0">\n\nℹ️ **Info:** This setting is reset on each client restart.\n\n</div>',
      },
    ],
  },
  {
    title: "HTML — Keyboard Keys",
    examples: [
      {
        label: "Hotkey combination",
        syntax:
          "Open the inventory with <kbd>Esc</kbd> or press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>I</kbd> to open DevTools.",
      },
    ],
  },
  {
    title: "HTML — Collapsible Section",
    examples: [
      {
        label: "Expandable block",
        syntax:
          "<details>\n<summary>Full configuration reference (click to expand)</summary>\n\nAll available settings and their default values are listed here.\n\nYou can paste these directly into your `settings.properties` file.\n\n</details>",
      },
    ],
  },
];

// ── Example card ──────────────────────────────────────────────────────────────

function ExampleCard({ example }: { example: Example }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(example.syntax).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground/70">{example.label}</p>

      {/* Rendered output */}
      <div className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm min-h-[2rem]">
        <MarkdownRenderer body={example.syntax} />
      </div>

      {/* Raw syntax */}
      <div className="relative group">
        <pre className="rounded-md bg-muted px-3 py-2 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
          {example.syntax}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-1.5 right-1.5 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
          title="Copy syntax"
        >
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}

// ── Cheatsheet ────────────────────────────────────────────────────────────────

export function MarkdownCheatsheet() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Formatting reference</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          All features supported in this editor. Hover any syntax block to copy it.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 border-b border-border pb-1">
            {section.title}
          </p>
          <div className="space-y-4">
            {section.examples.map((ex) => (
              <ExampleCard key={ex.label} example={ex} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
