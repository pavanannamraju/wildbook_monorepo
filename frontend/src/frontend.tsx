import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

declare global {
  interface Window {
    __WILDBOOK_CONFIG__?: {
      publicEnv?: Record<string, string>;
    };
  }
}

/**
 * crypto.randomUUID is only guaranteed in secure contexts (HTTPS / localhost).
 * Deployments served over http://<ip>:port need a fallback or GlassCard crashes.
 */
function ensureRandomUUID(): void {
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  if (!cryptoObj || typeof cryptoObj.randomUUID === "function") return;

  Object.defineProperty(cryptoObj, "randomUUID", {
    configurable: true,
    writable: true,
    value: function randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
      const bytes = new Uint8Array(16);
      cryptoObj.getRandomValues(bytes);
      bytes[6] = (bytes[6]! & 0x0f) | 0x40;
      bytes[8] = (bytes[8]! & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as `${string}-${string}-${string}-${string}-${string}`;
    },
  });
}

ensureRandomUUID();

const elem = document.getElementById("root")!;

async function bootstrap() {
  const response = await fetch("/public-config");
  if (!response.ok) {
    throw new Error(`Failed to load public config (HTTP ${response.status}).`);
  }

  window.__WILDBOOK_CONFIG__ = (await response.json()) as {
    publicEnv?: Record<string, string>;
  };

  const [{ default: App }, { AuthProvider }] = await Promise.all([
    import("./App"),
    import("./auth/AuthProvider"),
  ]);

  const app = (
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );

  if (import.meta.hot) {
    const root = (import.meta.hot.data.root ??= createRoot(elem));
    root.render(app);
  } else {
    createRoot(elem).render(app);
  }
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to bootstrap frontend:", error);
});
