import { join } from "path";
import satori from "satori";
import type { ReactNode } from "react";

let _font: ArrayBuffer | null = null;

async function getFont(): Promise<ArrayBuffer> {
  if (_font) return _font;
  _font = await Bun.file(
    join(import.meta.dir, "../assets/fonts/RuneScape-Bold-12.otf")
  ).arrayBuffer();
  return _font;
}

export async function renderCard(node: ReactNode, width = 1200, height = 630): Promise<Buffer> {
  const font = await getFont();
  const svg = await satori(node as Parameters<typeof satori>[0], {
    width,
    height,
    fonts: [{ name: "RuneScape", data: font, weight: 700, style: "normal" }],
  });

  const { Resvg } = await import("@resvg/resvg-js");
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: width } });
  return Buffer.from(resvg.render().asPng());
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json() as Promise<T>;
}

interface CacheEntry {
  png: Buffer;
  expires: number;
}

const _cache = new Map<string, CacheEntry>();

export function getCached(key: string): Buffer | null {
  const entry = _cache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.png;
}

export function setCached(key: string, png: Buffer, ttlMs: number): void {
  _cache.set(key, { png, expires: Date.now() + ttlMs });
}
