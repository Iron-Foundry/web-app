export interface AssetSizePreset {
  key: string;
  label: string;
  width: number | null;
}

export const ASSET_SIZE_PRESETS: AssetSizePreset[] = [
  { key: "small", label: "Small", width: 160 },
  { key: "medium", label: "Medium", width: 320 },
  { key: "large", label: "Large", width: 512 },
  { key: "full", label: "Full", width: null },
];

export const INLINE_ICON_DEFAULT_WIDTH = 24;

export function isOsrsIcon(url: string): boolean {
  return url.includes("/osrs-cache/");
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;");
}

export function buildImageMarkup(opts: {
  url: string;
  alt: string;
  width: number | null;
  inline?: boolean;
}): string {
  const attrs = [`src="${opts.url}"`, `alt="${escapeAttr(opts.alt)}"`];
  if (opts.width != null) attrs.push(`width="${opts.width}"`);
  if (opts.inline) attrs.push(`data-inline="true"`);
  const tag = `<img ${attrs.join(" ")} />`;
  return opts.inline ? tag : `\n${tag}\n`;
}

export function buildVideoMarkup(url: string, width: number | null): string {
  const attrs = [`src="${url}"`, "controls"];
  if (width != null) attrs.push(`width="${width}"`);
  return `\n<video ${attrs.join(" ")}></video>\n`;
}
