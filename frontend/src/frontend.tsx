import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

declare global {
  interface Window {
    __WILDBOOK_CONFIG__?: {
      publicEnv?: Record<string, string>;
    };
  }
}

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
