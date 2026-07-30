import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import tailwindcss from "bun-plugin-tailwind";

const outdir = "./build";
const staticOutdir = join("..", "static");

function collectPublicEnv(): Record<string, string> {
  const publicEnv: Record<string, string> = {};

  for (const [key, rawValue] of Object.entries(process.env)) {
    if (!key.startsWith("BUN_PUBLIC_")) continue;
    if (key === "BUN_PUBLIC_BACKEND_ORIGIN") continue;
    const value = rawValue?.trim();
    if (value) {
      publicEnv[key] = value;
    }
  }

  const jsonConfig = process.env.BUN_PUBLIC_CONFIG_JSON?.trim();
  if (jsonConfig) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonConfig);
    } catch (error) {
      throw new Error(`BUN_PUBLIC_CONFIG_JSON is not valid JSON: ${String(error)}`);
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("BUN_PUBLIC_CONFIG_JSON must be a JSON object.");
    }

    for (const [key, value] of Object.entries(parsed)) {
      if (!key.startsWith("BUN_PUBLIC_")) continue;
      if (key === "BUN_PUBLIC_BACKEND_ORIGIN") continue;
      if (typeof value === "string" && value.trim()) {
        publicEnv[key] = value.trim();
      }
    }
  }

  return publicEnv;
}

console.log("Bundling SPA (this can take 30–90s on first run)…");
const result = await Bun.build({
  entrypoints: ["./src/index.html"],
  outdir,
  // External sourcemaps + minify make Windows builds very slow; keep minify only.
  sourcemap: "none",
  target: "browser",
  minify: true,
  // Absolute paths so deep links like /experts/:id still load /chunk-*.js
  publicPath: "/",
  plugins: [tailwindcss],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  env: "BUN_PUBLIC_*",
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}
console.log("Bundle done. Writing public-config…");

const publicConfig = {
  publicEnv: collectPublicEnv(),
};
await Bun.write(`${outdir}/public-config`, JSON.stringify(publicConfig));

// Bun sometimes still emits "./chunk-..." — force root-absolute asset URLs.
const indexPath = join(outdir, "index.html");
if (existsSync(indexPath)) {
  const html = await Bun.file(indexPath).text();
  const fixed = html
    .replaceAll('href="./', 'href="/')
    .replaceAll('src="./', 'src="/');
  await Bun.write(indexPath, fixed);
}

// Minified CSS drops quotes around font urls. Paths with spaces become invalid
// (e.g. url(/Cocogoose Pro Thin….ttf)) — quote + encode them.
function fixCssAssetUrls(css: string): string {
  return css.replace(/url\(([^)'"]+)\)/g, (_match, raw: string) => {
    const path = String(raw).trim();
    if (!path.includes(" ") && !path.includes("%20")) {
      return `url(${path})`;
    }
    const encoded = path
      .split("/")
      .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
      .join("/");
    return `url("${encoded}")`;
  });
}

for (const entry of readdirSync(outdir)) {
  if (!entry.endsWith(".css")) continue;
  const cssPath = join(outdir, entry);
  const css = await Bun.file(cssPath).text();
  await Bun.write(cssPath, fixCssAssetUrls(css));
}

console.log("Copying to ../static…");
if (!existsSync(staticOutdir)) {
  mkdirSync(staticOutdir, { recursive: true });
}
for (const entry of readdirSync(staticOutdir)) {
  rmSync(join(staticOutdir, entry), { recursive: true, force: true });
}
for (const entry of readdirSync(outdir)) {
  cpSync(join(outdir, entry), join(staticOutdir, entry), { recursive: true });
}
console.log(`Built SPA to ${outdir} and copied to ${staticOutdir}`);
