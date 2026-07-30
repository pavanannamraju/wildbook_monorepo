import { serve } from "bun";
import index from "./index.html";

function getBackendOrigin(): string {
  const backendOrigin = process.env.BACKEND_ORIGIN;
  if (!backendOrigin) {
    throw new Error(
      "BACKEND_ORIGIN is required (example: BACKEND_ORIGIN=http://localhost:8000).",
    );
  }
  return backendOrigin;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const port = Number(process.env.PORT) || 3000;

const server = serve({
  port,
  routes: {
    "/public-config": () => {
      const publicEnv: Record<string, string> = {};
      for (const [key, rawValue] of Object.entries(process.env)) {
        if (!key.startsWith("BUN_PUBLIC_")) continue;
        const value = rawValue?.trim();
        if (value) {
          publicEnv[key] = value;
        }
      }
      return Response.json({ publicEnv });
    },
    "/api/*": async (req) => {
      const url = new URL(req.url);
      const target = new URL(url.pathname + url.search, getBackendOrigin());

      return fetch(target, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        redirect: "manual",
      });
    },
    // Serve index.html for all unmatched routes.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,
    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
