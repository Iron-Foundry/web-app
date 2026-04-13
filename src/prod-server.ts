import { serve } from "bun";
import { join } from "path";

const API_URL = process.env.BUN_PUBLIC_API_URL ?? "http://localhost:8000";
const DIST = join(import.meta.dir, "..", "dist");

// Inject env at startup (once), not per request
const rawHtml = await Bun.file(join(DIST, "index.html")).text();
const html = rawHtml.replace(
  "<head>",
  `<head><script>window.__API_URL__=${JSON.stringify(API_URL)};</script>`,
);

serve({
  port: 3000,
  async fetch(req) {
    const { pathname } = new URL(req.url);

    if (pathname !== "/" && pathname.includes(".")) {
      const file = Bun.file(join(DIST, pathname));
      if (await file.exists()) {
        return new Response(file);
      }
    }

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`Production server running on :3000`);
