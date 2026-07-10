import { addProtocol } from "maplibre-gl";
import type { GetResourceResponse, RequestParameters } from "maplibre-gl";

const OSRS_TILE_BASE = "https://maps.runescape.wiki/osrs";
let protocolRegistered = false;

function parseTileUrl(
  url: string
): { mapId: number; plane: number; z: number; x: number; y: number } | null {
  const match = url.match(/^osrs:\/\/(\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)$/);
  if (!match) return null;
  const mapId = Number(match[1]);
  const plane = Number(match[2]);
  const z = Number(match[3]);
  const x = Number(match[4]);
  const y = Number(match[5]);
  return { mapId, plane, z, x, y };
}

async function loadOsrsTile(
  params: RequestParameters,
  abortController: AbortController
): Promise<GetResourceResponse<ArrayBuffer>> {
  const parsed = parseTileUrl(params.url);
  if (!parsed) return { data: new ArrayBuffer(0) };

  const { mapId, plane, z, x, y } = parsed;
  const url = `${OSRS_TILE_BASE}/${mapId}/${z}/${plane}_${x}_${y}.png`;

  const res = await fetch(url, { signal: abortController.signal });
  if (!res.ok) return { data: new ArrayBuffer(0) };
  const data = await res.arrayBuffer();
  return { data };
}

/**
 * Registers the osrs:// custom tile protocol with MapLibre.
 * Must be called before the first Map instance is created.
 * Safe to call multiple times.
 */
export function registerOsrsProtocol(): void {
  if (protocolRegistered) return;
  protocolRegistered = true;
  addProtocol("osrs", loadOsrsTile);
}

/**
 * Returns the MapLibre tile URL template for a given OSRS mapId and plane.
 */
export function osrsTilesUrl(mapId: number, plane: number): string {
  return `osrs://${mapId}/${plane}/{z}/{x}/{y}`;
}
