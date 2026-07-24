import { GridTexture, CornerAccents, Divider } from "./shared";

export type ContentPageType = "resource" | "plugin";

export interface ContentEntryCardProps {
  pageType: ContentPageType;
  title: string | null;
  excerpt: string;
  authorName: string | null;
  updatedLabel: string | null;
}

const BASE_STYLE = {
  width: 1200,
  height: 630,
  background: "radial-gradient(ellipse at 25% 35%, #1c1710 0%, #111111 55%, #090909 100%)",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between" as const,
  padding: "60px 72px",
  fontFamily: "RuneScape",
  color: "#f5f0e8",
  position: "relative" as const,
};

const BRAND_LABEL = {
  alignSelf: "flex-start" as const,
  border: "1px solid rgba(198,164,75,0.4)",
  padding: "4px 12px",
  fontSize: 20,
  color: "#c6a44b",
  letterSpacing: 6,
  textTransform: "uppercase" as const,
};

const CLAMP = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
};

function sectionLabel(pageType: ContentPageType): string {
  return pageType === "plugin" ? "Iron Foundry · Plugins" : "Iron Foundry · Resources";
}

export function ContentEntryCard({
  pageType,
  title,
  excerpt,
  authorName,
  updatedLabel,
}: ContentEntryCardProps) {
  if (!title) {
    return (
      <div style={{ ...BASE_STYLE, justifyContent: "center", alignItems: "center", gap: 16 }}>
        <GridTexture />
        <CornerAccents />
        <div style={{ ...BRAND_LABEL, alignSelf: "center" }}>{sectionLabel(pageType)}</div>
        <div style={{ fontSize: 28, color: "#6b6452" }}>Entry not found</div>
        <div style={{ fontSize: 18, color: "#4a4035" }}>ironfoundry.cc</div>
      </div>
    );
  }

  const footerLeft = [
    authorName ? `by ${authorName}` : null,
    updatedLabel ? `Updated ${updatedLabel}` : null,
  ]
    .filter((s): s is string => s !== null)
    .join("   ·   ");

  return (
    <div style={BASE_STYLE}>
      <GridTexture />
      <CornerAccents />

      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={BRAND_LABEL}>{sectionLabel(pageType)}</div>
        <Divider />
      </div>

      {/* Title + excerpt */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 20 }}>
        <div style={{ ...CLAMP, fontSize: 64, color: "#f5f0e8", lineHeight: 1.1, WebkitLineClamp: 3 }}>
          {title}
        </div>
        {excerpt ? (
          <div style={{ ...CLAMP, fontSize: 27, color: "#8a7d65", lineHeight: 1.4, WebkitLineClamp: 2 }}>
            {excerpt}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 22, color: "#6b6452" }}>{footerLeft}</div>
        <div style={{ fontSize: 18, color: "#4a4035" }}>ironfoundry.cc</div>
      </div>
    </div>
  );
}
