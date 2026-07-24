import { describe, expect, test } from "bun:test";
import {
  organizationLd,
  websiteLd,
  breadcrumbLd,
  articleLd,
  renderJsonLd,
} from "@/lib/structured-data";
import type { EntryDetail } from "@/types/content";

const SITE = "https://ironfoundry.cc";

function entry(overrides: Partial<EntryDetail> = {}): EntryDetail {
  return {
    id: "1",
    title: "Vorkath Guide",
    slug: "vorkath-guide",
    body: "body",
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-03-04T00:00:00Z",
    author: { discord_user_id: 1, discord_username: "zezima", rsn: "Zezima", avatar: null },
    collaborators: [],
    last_updated_by: null,
    reaction_count: 0,
    user_has_reacted: false,
    ...overrides,
  };
}

describe("organizationLd / websiteLd", () => {
  test("organization carries name, url, logo, alternateName and sameAs", () => {
    const org = organizationLd(SITE, `${SITE}/og-image.png`);
    expect(org["@type"]).toBe("Organization");
    expect(org.url).toBe(`${SITE}/`);
    expect(org.logo).toBe(`${SITE}/og-image.png`);
    expect(org.alternateName).toBe("Iron Foundry OSRS Clan");
    expect(org.sameAs).toEqual([
      "https://discord.gg/ironfoundry",
      "https://wiseoldman.net/groups/9403",
    ]);
    expect(String(org.description)).toContain("OSRS");
  });

  test("website carries name and url", () => {
    const site = websiteLd(SITE);
    expect(site["@type"]).toBe("WebSite");
    expect(site.url).toBe(`${SITE}/`);
  });
});

describe("breadcrumbLd", () => {
  test("returns null for the homepage", () => {
    expect(breadcrumbLd(SITE, "/")).toBeNull();
  });

  test("builds ordered crumbs with the root first", () => {
    const bc = breadcrumbLd(SITE, "/resources/vorkath-guide", "Vorkath Guide") as {
      itemListElement: Array<{ position: number; name: string; item: string }>;
    };
    const items = bc.itemListElement;
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ position: 1, name: "Iron Foundry", item: `${SITE}/` });
    expect(items[1]).toMatchObject({ position: 2, name: "Resources & Guides", item: `${SITE}/resources` });
    expect(items[2]).toMatchObject({
      position: 3,
      name: "Vorkath Guide",
      item: `${SITE}/resources/vorkath-guide`,
    });
  });

  test("falls back to a humanized segment when no leaf title", () => {
    const bc = breadcrumbLd(SITE, "/about") as {
      itemListElement: Array<{ name: string }>;
    };
    expect(bc.itemListElement[1]!.name).toBe("About");
  });
});

describe("articleLd", () => {
  test("maps entry dates and author", () => {
    const url = `${SITE}/resources/vorkath-guide`;
    const art = articleLd(url, `${SITE}/embed/x.png`, entry()) as Record<string, unknown>;
    expect(art["@type"]).toBe("Article");
    expect(art.headline).toBe("Vorkath Guide");
    expect(art.datePublished).toBe("2026-01-02T00:00:00Z");
    expect(art.dateModified).toBe("2026-03-04T00:00:00Z");
    expect(art.author).toMatchObject({ "@type": "Person", name: "Zezima" });
  });

  test("omits author and dates when absent", () => {
    const art = articleLd(
      `${SITE}/plugins/x`,
      `${SITE}/y.png`,
      entry({ author: null, created_at: null, updated_at: null }),
    ) as Record<string, unknown>;
    expect(art.author).toBeUndefined();
    expect(art.datePublished).toBeUndefined();
    expect(art.dateModified).toBeUndefined();
  });

  test("falls back to discord username when rsn missing", () => {
    const art = articleLd(
      `${SITE}/plugins/x`,
      `${SITE}/y.png`,
      entry({ author: { discord_user_id: 1, discord_username: "zezima", rsn: null, avatar: null } }),
    ) as Record<string, unknown>;
    expect(art.author).toMatchObject({ name: "zezima" });
  });
});

describe("renderJsonLd", () => {
  test("drops null nodes and wraps each in a nonce'd ld+json script", () => {
    const html = renderJsonLd([organizationLd(SITE, `${SITE}/og.png`), null], "abc123");
    expect(html).toContain('<script type="application/ld+json" nonce="abc123">');
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).toContain('"@type":"Organization"');
  });

  test("escapes angle brackets to prevent script breakout", () => {
    const html = renderJsonLd([{ "@type": "Thing", name: "</script><img>" }], "n");
    expect(html).not.toContain("</script><img>");
    expect(html).toContain("\\u003c/script\\u003e");
  });

  test("returns empty string when every node is null", () => {
    expect(renderJsonLd([null, null], "n")).toBe("");
  });
});
