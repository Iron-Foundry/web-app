import { serve } from "bun";
import index from "./index.html";
import { join } from "path";
import { serveCompetitionTop5 } from "./embed/handlers";

const API_URL = process.env.BUN_PUBLIC_API_URL ?? "http://localhost:8000";
await Bun.write(
  join(import.meta.dir, "dev-config.js"),
  `// Written by dev server - do not edit manually\nwindow.__API_URL__ = window.__API_URL__ || ${JSON.stringify(API_URL)};\n`,
);

const server = serve({
  routes: {
    "/embed/competition-top5.png": async (req: Request) => {
      const url = new URL(req.url);
      const id = url.searchParams.get("id") ?? "";
      const metric = url.searchParams.get("metric") ?? "";
      if (!id || !metric) return new Response("Missing id or metric", { status: 400 });
      try {
        const png = await serveCompetitionTop5(id, metric, API_URL);
        return new Response(png as unknown as BodyInit, {
          headers: {
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="competition-top5.png"`,
            "Cache-Control": "no-store",
          },
        });
      } catch (err) {
        console.error("[embed] competition-top5 failed:", err);
        return new Response("Failed to render", { status: 500 });
      }
    },
    "/*": index,
  },
  development: process.env.NODE_ENV === "production" ? false : {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
