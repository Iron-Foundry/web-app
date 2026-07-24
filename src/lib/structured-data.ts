import type { EntryDetail } from "../types/content";

type JsonLd = Record<string, unknown>;

const ORG_NAME = "Iron Foundry";
const ORG_ALT_NAME = "Iron Foundry OSRS Clan";
const ORG_SAME_AS = [
  "https://discord.gg/ironfoundry",
  "https://wiseoldman.net/groups/9403",
];

function attrEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function serializeLd(node: JsonLd): string {
  return JSON.stringify(node)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function organizationLd(siteUrl: string, logo: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    alternateName: ORG_ALT_NAME,
    url: `${siteUrl}/`,
    logo,
    description:
      "Iron Foundry is a social OSRS Ironman clan - a mixed PvM Old School RuneScape " +
      "community for Ironmen and Ironwomen of all skill levels.",
    sameAs: ORG_SAME_AS,
  };
}

export function websiteLd(siteUrl: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORG_NAME,
    url: `${siteUrl}/`,
  };
}

function crumb(name: string, item: string, position: number): JsonLd {
  return { "@type": "ListItem", position, name, item };
}

const SEGMENT_NAMES: Record<string, string> = {
  about: "About",
  rules: "Clan Rules",
  staff: "Staff",
  events: "Events",
  competitions: "Competitions",
  leaderboards: "Leaderboards",
  resources: "Resources & Guides",
  plugins: "Plugins",
};

function segmentName(segment: string): string {
  return SEGMENT_NAMES[segment] ?? decodeURIComponent(segment);
}

export function breadcrumbLd(
  siteUrl: string,
  pathname: string,
  leafTitle?: string,
): JsonLd | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const items: JsonLd[] = [crumb(ORG_NAME, `${siteUrl}/`, 1)];
  let acc = "";
  segments.forEach((segment, index) => {
    acc += `/${segment}`;
    const isLeaf = index === segments.length - 1;
    const name = isLeaf && leafTitle ? leafTitle : segmentName(segment);
    items.push(crumb(name, `${siteUrl}${acc}`, index + 2));
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

export function articleLd(url: string, image: string, entry: EntryDetail): JsonLd {
  const author = entry.author;
  const authorName = author?.rsn ?? author?.discord_username ?? null;
  const node: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    mainEntityOfPage: url,
    image,
    publisher: { "@type": "Organization", name: ORG_NAME },
  };
  if (entry.created_at) node.datePublished = entry.created_at;
  if (entry.updated_at) node.dateModified = entry.updated_at;
  if (authorName) node.author = { "@type": "Person", name: authorName };
  return node;
}

export function renderJsonLd(nodes: Array<JsonLd | null>, nonce: string): string {
  const safeNonce = attrEscape(nonce);
  return nodes
    .filter((node): node is JsonLd => node !== null)
    .map(
      (node) =>
        `<script type="application/ld+json" nonce="${safeNonce}">${serializeLd(node)}</script>`,
    )
    .join("\n    ");
}
