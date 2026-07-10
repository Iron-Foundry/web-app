import { createRoute } from "@tanstack/react-router";
import { useState } from "react";
import { rootRoute } from "./__root";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TilemarkerMap } from "@/components/map/variants/TilemarkerMap";
import { PinMap } from "@/components/map/variants/PinMap";
import { AreaMap } from "@/components/map/variants/AreaMap";
import { AdminMap } from "@/components/map/variants/AdminMap";
import type { OsrsCoord } from "@/components/map/core/types";

export const mapTestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/map-test",
  component: MapTestPage,
});

const LUMBRIDGE: OsrsCoord = { x: 3233, y: 3222 };
const VARROCK: OsrsCoord = { x: 3211, y: 3424 };
const GE: OsrsCoord = { x: 3165, y: 3487 };
const EDGEVILLE: OsrsCoord = { x: 3088, y: 3501 };
const BARB_VILLAGE: OsrsCoord = { x: 3083, y: 3421 };
const FALADOR: OsrsCoord = { x: 2965, y: 3378 };

// Region 12889 = baseX 3200, baseY 5696, plane 0
// regionX_chunk = 12889 >> 8 = 50  → baseX = 50 * 64 = 3200
// regionY_chunk = 12889 & 0xFF = 89 → baseY = 89 * 64 = 5696
const R12889_BASE_X = 3200;
const R12889_BASE_Y = 5696;
const r = (rx: number, ry: number) => ({ x: R12889_BASE_X + rx, y: R12889_BASE_Y + ry, plane: 0 });

const ZULRAH_CENTER: OsrsCoord = { x: 3232, y: 5740, plane: 0 };

const WHITE = "rgb(255,255,255)";
const CYAN  = "rgb(45,227,255)";
const BLUE  = "rgb(0,221,255)";
const RED   = "rgb(255,4,4)";

function MapTestPage() {
  const [adminCoord, setAdminCoord] = useState<OsrsCoord | null>(null);

  return (
    <div className="mx-auto max-w-5xl py-6 space-y-10">
      <div>
        <h1 className="font-rs-bold text-3xl text-primary">Map Components</h1>
        <p className="text-muted-foreground mt-1">
          Test page for OSRS map component variants. Pan with drag, zoom with scroll.
        </p>
      </div>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-rs-bold text-xl text-primary">Tilemarker Map</h2>
        <p className="text-sm text-muted-foreground">
          Zulrah safe-spot tilemarkers (region 12889, plane 0). White = mage side tiles,
          cyan = melee-side rotation, blue = range-side rotation, red = flame skip.
        </p>
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <TilemarkerMap
              className="h-96"
              center={ZULRAH_CENTER}
              plane={0}
              zoom={3}
              markers={[
                { coord: r(37, 50), label: "6. Mage Side",      color: WHITE },
                { coord: r(28, 38), label: "6. Mage Side",      color: WHITE },
                { coord: r(28, 43), label: "1 Mid Skip",        color: CYAN  },
                { coord: r(28, 47), label: "2 Thumb",           color: CYAN  },
                { coord: r(28, 50), label: "3 Right Side",      color: CYAN  },
                { coord: r(37, 45), label: "1 Mid Skip",        color: BLUE  },
                { coord: r(37, 41), label: "2 Thumb",           color: BLUE  },
                { coord: r(37, 38), label: "3 Right Side",      color: BLUE  },
                { coord: r(29, 51), label: "Flame Skip (4:1)",  color: RED   },
                { coord: r(36, 36), label: "Flame Skip (4:1)",  color: RED   },
              ]}
            />
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-rs-bold text-xl text-primary">Pin Map</h2>
        <p className="text-sm text-muted-foreground">
          MapPin markers with per-pin colours. Use for event meetup spots, boss locations,
          or any named coordinate.
        </p>
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <PinMap
              className="h-80"
              center={LUMBRIDGE}
              zoom={2}
              pins={[
                {
                  coord: LUMBRIDGE,
                  label: "Lumbridge",
                  description: "Default spawn point for new players.",
                },
                {
                  coord: FALADOR,
                  label: "Falador",
                  description: "Home of the White Knights and the Mining Guild.",
                  color: "hsl(210 80% 60%)",
                },
                {
                  coord: VARROCK,
                  label: "Varrock",
                  description: "Features the Grand Exchange and Varrock Palace.",
                  color: "hsl(0 70% 55%)",
                },
              ]}
            />
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-rs-bold text-xl text-primary">Area Map</h2>
        <p className="text-sm text-muted-foreground">
          SVG polygon overlays. Use for clan territory, competition zones, or bounded regions.
        </p>
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <AreaMap
              className="h-80"
              center={{ x: 3165, y: 3430 }}
              zoom={1}
              areas={[
                {
                  coords: [
                    { x: 3100, y: 3460 },
                    { x: 3230, y: 3460 },
                    { x: 3230, y: 3390 },
                    { x: 3100, y: 3390 },
                  ],
                  label: "Clan Patrol Zone",
                },
                {
                  coords: [
                    { x: 3145, y: 3510 },
                    { x: 3195, y: 3510 },
                    { x: 3195, y: 3480 },
                    { x: 3145, y: 3480 },
                  ],
                  fillColor: "hsl(210 80% 55% / 0.2)",
                  strokeColor: "hsl(210 80% 60% / 0.8)",
                  label: "Grand Exchange",
                },
              ]}
            />
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-rs-bold text-xl text-primary">Admin Map</h2>
        <p className="text-sm text-muted-foreground">
          Click anywhere on the map to select OSRS coordinates. Used by staff when creating
          content with location data.
        </p>
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <AdminMap
              className="h-80"
              center={LUMBRIDGE}
              zoom={2}
              onCoordSelect={setAdminCoord}
            />
          </CardContent>
        </Card>
        {adminCoord && (
          <p className="text-sm text-muted-foreground">
            Selected:{" "}
            <span className="font-mono text-foreground">
              x={adminCoord.x}, y={adminCoord.y}
            </span>
          </p>
        )}
      </section>
    </div>
  );
}
