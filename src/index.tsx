import { serve } from "bun";
import index from "./index.html";
import { join } from "path";

const API_URL = process.env.BUN_PUBLIC_API_URL ?? "http://localhost:8000";
await Bun.write(
  join(import.meta.dir, "dev-config.js"),
  `// Written by dev server — do not edit manually\nwindow.__API_URL__ = window.__API_URL__ || ${JSON.stringify(API_URL)};\n`,
);

const server = serve({
  routes: {
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
