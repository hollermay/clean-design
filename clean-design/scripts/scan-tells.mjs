#!/usr/bin/env node
// clean-design tell scanner. Usage: node scan-tells.mjs <file-or-folder> [--json]
// Finds mechanical "AI look" tells in html, css, jsx, tsx, vue, svelte files. It cannot judge taste.
import fs from "node:fs";
import path from "node:path";

const target = process.argv[2];
const asJson = process.argv.includes("--json");
if (!target) { console.error("usage: node scan-tells.mjs <file-or-folder> [--json]"); process.exit(2); }

const EXT = new Set([".html", ".htm", ".css", ".jsx", ".tsx", ".js", ".ts", ".vue", ".svelte", ".astro", ".md", ".mdx"]);
const SKIP = new Set(["node_modules", ".git", "dist", "build", ".next", "out"]);
function walk(p, acc = []) {
  const st = fs.statSync(p);
  if (st.isFile()) { if (EXT.has(path.extname(p))) acc.push(p); return acc; }
  for (const n of fs.readdirSync(p)) { if (!SKIP.has(n)) walk(path.join(p, n), acc); }
  return acc;
}
const files = walk(target);

function hueOf(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d < 0.12) return null; // gray, not a color
  let hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hue = Math.round(hue * 60); if (hue < 0) hue += 360;
  return hue;
}
const isPurpleish = (hue) => hue !== null && hue >= 245 && hue <= 335;

const BANNED = /\b(supercharge[ds]?|seamless(ly)?|revolutioni[sz]e[ds]?|unlock the power|elevate your|streamline[ds]?|cutting[- ]edge|state[- ]of[- ]the[- ]art|game[- ]chang(er|ing)|next[- ]gen(eration)?|reimagine[ds]?|empower(s|ed|ing)?)\b/i;
const EMOJI = /\p{Extended_Pictographic}/u;
const SPARKLE = /(✨|🚀|⚡|🔥|💡)/u;

const tells = {
  "purple/pink gradient": [],
  "stock marketing words": [],
  "emoji in the page": [],
  "sparkle/rocket decoration": [],
  "glassmorphism (blur backdrop)": [],
  "everything rounded-2xl/3xl": [],
  "fake stats or logos": [],
  "row of identical cards": [],
  "too many accent colors": [],
  "centered everything": [],
};
const hexSeen = new Map();
const classRuns = new Map();
let roundedCount = 0, centerCount = 0;

for (const f of files) {
  const lines = fs.readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    const at = `${path.relative(process.cwd(), f)}:${i + 1}`;
    const L = line.trim().slice(0, 140);
    // 1. gradients
    if (/(linear|radial|conic)-gradient\(/i.test(line)) {
      const hexes = line.match(/#[0-9a-f]{3,8}\b/gi) || [];
      if (hexes.some((h) => isPurpleish(hueOf(h)))) tells["purple/pink gradient"].push(`${at}  ${L}`);
    }
    if (/\b(from|via|to)-(purple|violet|indigo|fuchsia|pink)-\d{2,3}\b/.test(line)) tells["purple/pink gradient"].push(`${at}  ${L}`);
    // 2. copy
    if (BANNED.test(line) && !/^\s*(\/\/|\*|<!--)/.test(line)) tells["stock marketing words"].push(`${at}  ${L}`);
    // 3. emoji and sparkles
    if (SPARKLE.test(line)) tells["sparkle/rocket decoration"].push(`${at}  ${L}`);
    else if (EMOJI.test(line) && /[<>]|["'`]/.test(line)) tells["emoji in the page"].push(`${at}  ${L}`);
    // 4. glass
    if (/backdrop-filter\s*:\s*blur|backdrop-blur/.test(line)) tells["glassmorphism (blur backdrop)"].push(`${at}  ${L}`);
    // 5. rounded
    roundedCount += (line.match(/rounded-(2xl|3xl)|border-radius\s*:\s*(1[6-9]|[2-9]\d)px/g) || []).length;
    // 6. fake social proof
    if (/\b\d{1,3}(,\d{3})*\+?\s+(happy\s+)?(users|customers|teams|developers|companies)\b/i.test(line) || /trusted by/i.test(line)) tells["fake stats or logos"].push(`${at}  ${L}`);
    // 7. cards: repeated identical class strings
    const cm = line.match(/class(Name)?=["'`]([^"'`]*card[^"'`]*)["'`]/i);
    if (cm) { const k = `${f}|${cm[2].trim()}`; const a = classRuns.get(k) || []; a.push(at); classRuns.set(k, a); }
    // 8. colors
    for (const h of line.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) || []) {
      const hue = hueOf(h); if (hue === null) continue;
      const bucket = Math.round(hue / 30) * 30 % 360;
      if (!hexSeen.has(bucket)) hexSeen.set(bucket, at);
    }
    // 9. centered
    centerCount += (line.match(/text-center|text-align\s*:\s*center|justify-center|items-center/g) || []).length;
  });
}
if (roundedCount > 5) tells["everything rounded-2xl/3xl"].push(`${roundedCount} large-radius uses (limit 5; pick one radius)`);
for (const [k, at] of classRuns) if (at.length >= 3) tells["row of identical cards"].push(`${at.length} identical "${k.split("|")[1].slice(0, 60)}" at ${at.slice(0, 3).join(", ")}`);
if (hexSeen.size > 3) tells["too many accent colors"].push(`${hexSeen.size} hue families found (limit: 1 accent): hues ${[...hexSeen.keys()].sort((a, b) => a - b).join(", ")}`);
if (centerCount > 12) tells["centered everything"].push(`${centerCount} centering utilities (left-align body text and most blocks)`);

const hit = Object.entries(tells).filter(([, v]) => v.length);
const score = hit.length;
if (asJson) {
  console.log(JSON.stringify({ files: files.length, score, of: Object.keys(tells).length, tells: Object.fromEntries(hit) }, null, 2));
} else {
  console.log(`clean-design scan: ${files.length} file(s)`);
  for (const [k, v] of hit) {
    console.log(`\n[TELL] ${k} (${v.length})`);
    v.slice(0, 5).forEach((x) => console.log("  " + x));
    if (v.length > 5) console.log(`  ... +${v.length - 5} more`);
  }
  console.log(`\nAI TELLS: ${score} of ${Object.keys(tells).length}`);
  console.log("Note: mechanical tells only. A score of 0 does not mean the design is good.");
}
process.exit(score ? 1 : 0);
