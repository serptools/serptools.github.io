import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TOOLS_DIR = "app/tools";
const DEFAULT_ENABLED = new Set(["heic-to-jpg","webp-to-png","jpg-to-webp","pdf-to-jpg"]);

function readJSON(path, fallback) {
  try { return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback; }
  catch { return fallback; }
}
function toTitle(slug) {
  const [from, to] = slug.split("-to-");
  return `${(from||"").toUpperCase()} to ${(to||"").toUpperCase()}`;
}
const prev = readJSON("lib/tools/manifest.json", []);
const bySlug = new Map(prev.map(x => [x.slug, x]));

const entries = [];
for (const dirent of readdirSync(TOOLS_DIR, { withFileTypes: true })) {
  if (!dirent.isDirectory()) continue;
  const slug = dirent.name;
  if (["character-counter","csv-combiner","json-to-csv"].includes(slug)) continue;
  const toolDir = join(TOOLS_DIR, slug);
  const pageExists = existsSync(join(toolDir, "page.tsx")) || existsSync(join(toolDir, "page.jsx"));
  if (!pageExists) continue;
  const [from, to] = slug.split("-to-");
  if (!from || !to) continue;

  const prevMeta = bySlug.get(slug) || {};
  entries.push({
    slug, from, to,
    title: prevMeta.title || toTitle(slug),
    status: prevMeta.status || (DEFAULT_ENABLED.has(slug) ? "live" : "draft"),
    enabled: prevMeta.enabled ?? DEFAULT_ENABLED.has(slug),
    engine: prevMeta.engine || (() => {
      if (from === "pdf") return "pdfjs";
      if (from === "heic" || from === "heif") return "libheif";
      const ras = new Set(["png","jpg","jpeg","webp","gif","bmp","avif","ico"]);
      if (ras.has(from) && ras.has(to)) return "canvas";
      if (to === "svg") return "svg-converter";
      return "unknown";
    })(),
    kind: (() => {
      const img = new Set(["png","jpg","jpeg","webp","gif","svg","bmp","tif","tiff","heic","heif","avif","ico","dds"]);
      if (from === "pdf" || to === "pdf") return "document";
      if (img.has(from) || img.has(to)) return "image";
      return "other";
    })(),
    verified: prevMeta.verified ?? false,
    notes: prevMeta.notes || "",
    priority: prevMeta.priority ?? 0,
  });
}
entries.sort((a,b)=>a.slug.localeCompare(b.slug));
writeFileSync("lib/tools/manifest.json", JSON.stringify(entries, null, 2));
console.log(`Wrote lib/tools/manifest.json (${entries.length} tools)`);
