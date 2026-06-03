import { serve } from "bun";
import index from "./index.html";
import { serveCompetitionTop5 } from "./embed/handlers";

const server = serve({
  routes: {
    "/embed/competition-top5.png": async (req: Request) => {
      const url = new URL(req.url);
      const id = url.searchParams.get("id") ?? "";
      const metrics = url.searchParams.getAll("metric");
      const label = url.searchParams.get("label") ?? undefined;
      if (!id || metrics.length === 0) return new Response("Missing id or metric", { status: 400 });
      try {
        const png = await serveCompetitionTop5(id, metrics, process.env.BUN_PUBLIC_API_URL ?? "http://localhost:8000", label);
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
