import { useState } from "react";
import { registerPage } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { OsrsSpriteTab } from "@/components/assets/OsrsSpriteTab";
import { OsrsItemIconTab } from "@/components/assets/OsrsItemIconTab";
import { UploadedAssetsTab } from "@/components/assets/UploadedAssetsTab";

registerPage({
  id: "staff.assets",
  label: "Asset Library",
  description: "Upload and manage shared assets (images, videos) used across the site.",
});

type LibraryTab = "uploaded" | "osrs-sprites" | "osrs-item-icons";

const TABS: { id: LibraryTab; label: string }[] = [
  { id: "uploaded", label: "Uploaded Assets" },
  { id: "osrs-sprites", label: "OSRS Sprites" },
  { id: "osrs-item-icons", label: "OSRS Item Icons" },
];

export function AssetManagerPage(): React.JSX.Element {
  const [tab, setTab] = useState<LibraryTab>("uploaded");

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <div className="space-y-1">
        <h1 className="font-rs-bold text-4xl text-primary">Asset Library</h1>
        <p className="text-sm text-muted-foreground">
          Hover for preview, click to copy URL
        </p>
      </div>

      <div className="flex rounded-md border border-border overflow-hidden text-xs w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-3 py-1.5 transition-colors",
              tab === t.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "uploaded" && <UploadedAssetsTab />}
      {tab === "osrs-sprites" && <OsrsSpriteTab />}
      {tab === "osrs-item-icons" && <OsrsItemIconTab />}
    </div>
  );
}
