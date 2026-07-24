import { serve } from "bun";
import index from "./index.html";
import { handleEmbedRoutes } from "./embed/routes";

const API_URL = process.env.BUN_PUBLIC_API_URL ?? "http://localhost:8000";

const server = serve({
  routes: {
    "/embed/*": async (req: Request) => {
      const res = await handleEmbedRoutes(req, API_URL);
      return res ?? new Response("Not Found", { status: 404 });
    },
    "/*": index,
  },
  development: process.env.NODE_ENV === "production" ? false : {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
