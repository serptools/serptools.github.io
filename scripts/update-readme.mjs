import { readFileSync, writeFileSync } from "node:fs";

const siteBase = "https://serptools.github.io/tools/";
const manifest = JSON.parse(readFileSync("lib/tools/manifest.json", "utf8"));

const enabled = manifest.filter(t => t.enabled !== false);
enabled.sort((a,b)=> a.slug.localeCompare(b.slug));

const lines = enabled.map(t => {
  const title = t.title || `${t.from?.toUpperCase?.()} to ${t.to?.toUpperCase?.()}`;
  return `- [${title}](${siteBase}${t.slug})`;
});

const blockStart = "<!-- TOOLS:START -->";
const blockEnd   = "<!-- TOOLS:END -->";
const newBlock = `${blockStart}\n\n${lines.join("\n")}\n\n${blockEnd}`;

let readme = "";
try { readme = readFileSync("README.md", "utf8"); } catch { /* no README yet */ }

if (!readme.includes(blockStart)) {
  // create a basic README if none exists or no block yet
  const base = `# SERP Tools\n\nA collection of fast, client-side converters.\n\n## Tools\n${newBlock}\n`;
  writeFileSync("README.md", base);
  console.log("README.md created/updated with tools list.");
} else {
  const updated = readme.replace(
    new RegExp(`${blockStart}[\\s\\S]*?${blockEnd}`, "m"),
    newBlock
  );
  writeFileSync("README.md", updated);
  console.log("README.md tools section updated.");
}
