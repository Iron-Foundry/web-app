import { afterEach, describe, expect, test } from "bun:test";
import { buildSitemap } from "@/lib/sitemap";

const SITE = "https://ironfoundry.cc";
const API = "https://api.test";
const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

function mockCategories(byPageType: Record<string, unknown>): void {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    const match = url.match(/\/content\/(resource|plugin)\/categories$/);
    if (!match) return new Response("null", { status: 404 });
    return new Response(JSON.stringify(byPageType[match[1]!] ?? []), { status: 200 });
  }) as typeof fetch;
}

describe("buildSitemap", () => {
  test("emits lastmod (date-only) for entries that have updated_at", async () => {
    mockCategories({
      resource: [
        {
          entries: [{ slug: "vorkath-guide", updated_at: "2026-03-04T12:30:00Z" }],
          children: [{ entries: [{ slug: "nested", updated_at: "2026-01-01T00:00:00Z" }], children: [] }],
        },
      ],
      plugin: [],
    });

    const xml = await buildSitemap(SITE, API);
    expect(xml).toContain(
      "<loc>https://ironfoundry.cc/resources/vorkath-guide</loc><lastmod>2026-03-04</lastmod>",
    );
    expect(xml).toContain(
      "<loc>https://ironfoundry.cc/resources/nested</loc><lastmod>2026-01-01</lastmod>",
    );
  });

  test("omits lastmod when updated_at is missing or invalid", async () => {
    mockCategories({
      resource: [{ entries: [{ slug: "no-date" }, { slug: "bad-date", updated_at: "nope" }], children: [] }],
      plugin: [],
    });

    const xml = await buildSitemap(SITE, API);
    expect(xml).toContain("<url><loc>https://ironfoundry.cc/resources/no-date</loc></url>");
    expect(xml).toContain("<url><loc>https://ironfoundry.cc/resources/bad-date</loc></url>");
  });

  test("static paths are present with no lastmod and the root is bare", async () => {
    mockCategories({ resource: [], plugin: [] });
    const xml = await buildSitemap(SITE, API);
    expect(xml).toContain("<url><loc>https://ironfoundry.cc</loc></url>");
    expect(xml).toContain("<url><loc>https://ironfoundry.cc/about</loc></url>");
    expect(xml).not.toContain("<lastmod>");
  });

  test("keeps static paths when the API is unreachable", async () => {
    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    const xml = await buildSitemap(SITE, API);
    expect(xml).toContain("<url><loc>https://ironfoundry.cc/rules</loc></url>");
    expect(xml).toContain("<url><loc>https://ironfoundry.cc/resources</loc></url>");
  });
});
