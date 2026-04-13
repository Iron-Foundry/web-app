import { serve } from "bun";
import index from "./index.html";

const API_URL = process.env.BUN_PUBLIC_API_URL ?? "http://localhost:8000";

const server = serve({
  routes: {
    "/env.js": () =>
      new Response(`window.__API_URL__=${JSON.stringify(API_URL)};`, {
        headers: { "Content-Type": "application/javascript" },
      }),
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);