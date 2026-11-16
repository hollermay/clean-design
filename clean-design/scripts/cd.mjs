#!/usr/bin/env node
// clean-design toolbox. One command, thirteen tools.
// Usage: node cd.mjs <tool> <args>   (run with no args for the list)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXT = new Set([".html", ".htm", ".css", ".jsx", ".tsx", ".js", ".ts", ".vue", ".svelte", ".astro", ".md", ".mdx"]);
const SKIP = new Set(["node_modules", ".git", "dist", "build", ".next", "out"]);
const read = (f) => fs.readFileSync(f, "utf8");
const rel = (f) => path.relative(process.cwd(), f) || f;
function walk(p, acc = []) {
  const st = fs.statSync(p);
  if (st.isFile()) { if (EXT.has(path.extname(p))) acc.push(p); return acc; }
  for (const n of fs.readdirSync(p)) if (!SKIP.has(n)) walk(path.join(p, n), acc);
  return acc;
}
const lineOf = (text, idx) => text.slice(0, idx).split("\n").length;

/* ---------- color helpers ---------- */
function hexToRgb(h) {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function lum([r, g, b]) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
const firstHex = (s) => { const m = s && s.match(/#[0-9a-fA-F]{3,6}\b/); return m ? hexToRgb(m[0]) : null; };

function cssVars(text) { const v = {}; for (const m of text.matchAll(/--([\w-]+)\s*:\s*([^;}]+)/g)) v[m[1]] = m[2].trim(); return v; }
function resolveVars(val, v) { let s = val; for (let i = 0; i < 4; i++) s = s.replace(/var\(--([\w-]+)(?:,[^)]*)?\)/g, (_, n) => v[n] ?? ""); return s.trim(); }

/* ---------- tools: each returns { issues: [string] } ---------- */
function tScan(p) {
  const r = spawnSync("node", [path.join(HERE, "scan-tells.mjs"), p, "--json"], { encoding: "utf8" });
  let j; try { j = JSON.parse(r.stdout); } catch { return { issues: ["scan failed: " + (r.stderr || "no output")], tells: 0 }; }
  const issues = [];
  for (const [k, v] of Object.entries(j.tells)) issues.push(`${k}: ${v.length} hit(s), e.g. ${v[0]}`);
  return { issues, tells: j.score };
}

function tContrast(p) {
  const issues = [];
  for (const f of walk(p).filter((x) => /\.(css|html?|vue|svelte|astro)$/.test(x))) {
    const text = read(f), vars = cssVars(text);
    let bodyBg = null;
    const blocks = [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim().split("\n").pop().trim(), body: m[2], idx: m.index }));
    for (const b of blocks) {
      if (/(^|,)\s*(body|html|:root)\b/.test(b.sel)) {
        const bg = (b.body.match(/background(?:-color)?\s*:\s*([^;]+)/) || [])[1];
        const c = firstHex(bg && !/gradient/.test(bg) ? resolveVars(bg, vars) : null);
        if (c) bodyBg = c;
      }
    }
    for (const b of blocks) {
      const cm = b.body.match(/(?:^|;|\s)color\s*:\s*([^;]+)/);
      if (!cm) continue;
      const fg = firstHex(resolveVars(cm[1], vars));
      const bgm = b.body.match(/background(?:-color)?\s*:\s*([^;]+)/);
      const bg = bgm && !/gradient/.test(bgm[1]) ? firstHex(resolveVars(bgm[1], vars)) : bodyBg;
      if (!fg || !bg) continue;
      const r = ratio(fg, bg);
      if (r < 4.5) issues.push(`${rel(f)}:${lineOf(text, b.idx)}  "${b.sel.slice(0, 40)}" contrast ${r.toFixed(2)}:1 (need 4.5:1)`);
    }
  }
  return { issues };
}

const SCALES = { "minor-second": 1.067, "major-second": 1.125, "minor-third": 1.2, "major-third": 1.25, "perfect-fourth": 1.333, "golden": 1.618 };
function typeScale(base, rat, steps = 5) {
  const r = SCALES[rat] || parseFloat(rat) || 1.25;
  const names = ["sm", "base", "lg", "xl", "2xl", "3xl", "4xl"];
  const out = [];
  for (let i = 0; i < steps; i++) out.push([names[i], Math.round(base * r ** (i - 1) * 10) / 10]);
  return out;
}

const PRESETS = {
  editorial: { bg: "#FAF8F4", surface: "#FAF8F4", text: "#1B1B1B", muted: "#6B6B6B", accent: "#B4442B", head: "Fraunces, Georgia, serif", body: '"Source Serif 4", Georgia, serif', mono: "ui-monospace, monospace", base: 18, ratio: 1.25, radius: "2px", shadow: "none", measure: "640px" },
  utility: { bg: "#0F1115", surface: "#171A21", text: "#E6E8EE", muted: "#8B93A5", accent: "#4DA3FF", head: '"IBM Plex Sans", system-ui, sans-serif', body: '"IBM Plex Sans", system-ui, sans-serif', mono: '"IBM Plex Mono", ui-monospace, monospace', base: 16, ratio: 1.2, radius: "4px", shadow: "none", measure: "1100px" },
  warm: { bg: "#FFFFFF", surface: "#F5F1EA", text: "#222222", muted: "#6F6A60", accent: "#1F7A5A", head: '"DM Sans", system-ui, sans-serif', body: '"DM Sans", system-ui, sans-serif', mono: "ui-monospace, monospace", base: 17, ratio: 1.25, radius: "12px", shadow: "0 1px 3px rgba(0,0,0,.08)", measure: "960px" },
};
function tTokens(name, accent) {
  const p = { ...(PRESETS[name] || PRESETS.editorial) };
  if (accent) p.accent = accent;
  const sc = typeScale(p.base, p.ratio, 5).map(([n, v]) => `  --text-${n}: ${v}px;`).join("\n");
  const css = `:root {\n  --bg: ${p.bg};\n  --surface: ${p.surface};\n  --text: ${p.text};\n  --muted: ${p.muted};\n  --accent: ${p.accent};\n  --font-heading: ${p.head};\n  --font-body: ${p.body};\n  --font-mono: ${p.mono};\n${sc}\n  --space-1: 4px; --space-2: 8px; --space-3: 16px; --space-4: 24px; --space-5: 40px; --space-6: 64px;\n  --radius: ${p.radius};\n  --shadow: ${p.shadow};\n  --measure: ${p.measure};\n}\n`;
  const warn = [];
  const a = hexToRgb(p.accent), bg = hexToRgb(p.bg);
  if (a && bg) {
    const onBtn = ratio(a, [255, 255, 255]);
    if (onBtn < 4.5) warn.push(`white text on the accent is ${onBtn.toFixed(2)}:1 (need 4.5:1); darken the accent or use dark button text`);
    const onBg = ratio(a, bg);
    if (onBg < 3) warn.push(`accent on the background is ${onBg.toFixed(2)}:1; it will be hard to see as a link or border`);
  }
  return { css, warn };
}

const SWAPS = [
  [/supercharge[ds]?/i, "say the job: what gets faster, by how much, for whom"],
  [/seamless(ly)?/i, "name the two things it connects"],
  [/revolutioni[sz]e[ds]?|reimagine[ds]?/i, "delete"],
  [/unlock the power of/i, '"Use X to ..."'],
  [/elevate your/i, "what changes for the customer"],
  [/streamline[ds]?/i, "name the step that goes away"],
  [/cutting[- ]edge|state[- ]of[- ]the[- ]art/i, "delete, or give the spec"],
  [/game[- ]chang(er|ing)/i, "delete"],
  [/trusted by/i, "a real number with its source, or delete"],
  [/get started( in seconds)?/i, 'the real first step: "Paste your repo URL"'],
  [/made with (✨|love|ai)/iu, 'plain "(c) 2026 Name"'],
  [/lightning[- ]fast|blazing[- ]fast/i, "give the real time: \"loads in 0.8 s\""],
  [/ai[- ]powered/i, "say what the AI does for the user"],
];
function tCopy(p) {
  const issues = [];
  for (const f of walk(p)) {
    const text = read(f);
    text.split("\n").forEach((line, i) => {
      if (/^\s*(\/\/|\*|<!--)/.test(line)) return;
      for (const [re, tip] of SWAPS) { const m = line.match(re); if (m) issues.push(`${rel(f)}:${i + 1}  "${m[0]}"  ->  ${tip}`); }
    });
  }
  return { issues };
}

function tSpacing(p) {
  const issues = [];
  for (const f of walk(p).filter((x) => /\.(css|html?|vue|svelte|astro)$/.test(x))) {
    const text = read(f);
    for (const m of text.matchAll(/(margin|padding|gap|top|bottom|left|right)[-a-z]*\s*:\s*([^;}{]+)/g)) {
      for (const n of m[2].matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
        const v = Math.abs(parseFloat(n[1]));
        if (v !== 0 && v !== 1 && v !== 2 && v % 4 !== 0) issues.push(`${rel(f)}:${lineOf(text, m.index)}  ${m[1]} ${n[0]} is off the 4 px scale`);
      }
    }
  }
  return { issues };
}

function tA11y(p) {
  const issues = [];
  for (const f of walk(p).filter((x) => /\.(html?|vue|svelte|astro)$/.test(x))) {
    const t = read(f);
    if (/<html\b/i.test(t) && !/<html[^>]*\blang=/i.test(t)) issues.push(`${rel(f)}  <html> has no lang attribute`);
    for (const m of t.matchAll(/<img\b[^>]*>/gi)) if (!/\balt=/i.test(m[0])) issues.push(`${rel(f)}:${lineOf(t, m.index)}  <img> without alt`);
    for (const m of t.matchAll(/<(button|a)\b[^>]*>\s*<\/\1>/gi)) if (!/aria-label/i.test(m[0])) issues.push(`${rel(f)}:${lineOf(t, m.index)}  empty <${m[1]}> with no aria-label`);
    for (const m of t.matchAll(/<input\b[^>]*>/gi)) if (!/type=["']?(hidden|submit|button)/i.test(m[0]) && !/aria-label|\bid=/i.test(m[0])) issues.push(`${rel(f)}:${lineOf(t, m.index)}  <input> with no id/label link or aria-label`);
    const h1 = (t.match(/<h1\b/gi) || []).length;
    if (h1 > 1) issues.push(`${rel(f)}  ${h1} <h1> elements (use one)`);
    const levels = [...t.matchAll(/<h([1-6])\b/gi)].map((m) => +m[1]);
    for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) { issues.push(`${rel(f)}  heading jumps from h${levels[i - 1]} to h${levels[i]}`); break; }
  }
  return { issues };
}

const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+|inherit|initial|-apple-system|blinkmacsystemfont|segoe ui|helvetica|arial|georgia)$/i;
function tFonts(p) {
  const fams = new Map();
  for (const f of walk(p).filter((x) => /\.(css|html?|vue|svelte|astro)$/.test(x))) {
    const text = read(f), vars = cssVars(text);
    const add = (raw, idx) => {
      const first = resolveVars(raw, vars).split(",")[0].replace(/["']/g, "").trim();
      if (!first || /^var\(/.test(first)) return;
      if (!fams.has(first.toLowerCase())) fams.set(first.toLowerCase(), `${rel(f)}:${lineOf(text, idx)} ${first}`);
    };
    for (const m of text.matchAll(/font-family\s*:\s*([^;}]+)/gi)) add(m[1], m.index);
    for (const m of text.matchAll(/font\s*:\s*[^;}]*?\d+(?:px|rem|em)(?:\/[\d.]+)?\s+([^;}]+)/gi)) add(m[1], m.index);
  }
  const issues = [];
  if (fams.size > 2) issues.push(`${fams.size} font families (limit 2): ${[...fams.values()].join("; ")}`);
  return { issues, families: [...fams.values()] };
}

function tPlaceholders(p) {
  const issues = [];
  const pats = [[/lorem ipsum|dolor sit amet/i, "lorem ipsum"], [/your (text|title|headline|content|name) here/i, "placeholder text"], [/via\.placeholder\.com|placehold\.co|picsum\.photos|source\.unsplash\.com\/random|dummyimage/i, "placeholder image URL"], [/john doe|jane doe|acme (inc|corp)/i, "dummy name"], [/@example\.com|example\.com/i, "example.com address"]];
  for (const f of walk(p)) {
    const t = read(f);
    t.split("\n").forEach((line, i) => { for (const [re, what] of pats) if (re.test(line)) issues.push(`${rel(f)}:${i + 1}  ${what}`); });
  }
  return { issues };
}

function tResponsive(p) {
  const issues = [];
  for (const f of walk(p).filter((x) => /\.(html?|vue|svelte|astro)$/.test(x))) {
    const t = read(f);
    if (/<html\b/i.test(t) && !/name=["']viewport["']/i.test(t)) issues.push(`${rel(f)}  no <meta name="viewport"> (the page will not scale on phones)`);
    for (const m of t.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const w = m[2].match(/(?:^|;|\s)width\s*:\s*(\d+)px/);
      if (w && +w[1] > 480 && !/max-width/.test(m[2])) issues.push(`${rel(f)}:${lineOf(t, m.index)}  fixed width ${w[1]}px with no max-width on "${m[1].trim().split("\n").pop().slice(0, 30)}"`);
    }
  }
  return { issues };
}

function findChrome() {
  const c = [process.env.CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "google-chrome", "chromium", "chrome"].filter(Boolean);
  for (const x of c) { if (x.includes("/") ? fs.existsSync(x) : spawnSync("which", [x]).status === 0) return x; }
  return null;
}
function tShot(file, out, w = 1280, h = 1100) {
  const chrome = findChrome();
  if (!chrome) return { error: "Chrome not found. Set CHROME=/path/to/chrome" };
  const url = /^https?:/.test(file) ? file : "file://" + path.resolve(file);
  spawnSync(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${w},${h}`, "--virtual-time-budget=6000", `--screenshot=${path.resolve(out)}`, url], { stdio: "ignore" });
  return fs.existsSync(out) ? { out } : { error: "screenshot failed" };
}

const PENALTY = { tells: [6, 60], contrast: [5, 20], a11y: [3, 15], spacing: [1, 10], fonts: [5, 10], placeholders: [4, 12], responsive: [5, 10] };
function tReport(p) {
  const res = { tells: tScan(p), contrast: tContrast(p), a11y: tA11y(p), spacing: tSpacing(p), fonts: tFonts(p), placeholders: tPlaceholders(p), responsive: tResponsive(p) };
  let deduct = 0; const lines = [];
  for (const [k, r] of Object.entries(res)) {
    const n = k === "tells" ? r.tells : k === "fonts" ? Math.max(0, (r.families || []).length - 2) : r.issues.length;
    const [each, cap] = PENALTY[k]; const d = Math.min(cap, n * each); deduct += d;
    lines.push({ k, n, d, issues: r.issues });
  }
  const copy = tCopy(p).issues;
  return { score: Math.max(0, 100 - deduct), lines, copy };
}
function reportMd(p, rep) {
  let s = `# Clean score: ${rep.score} / 100\n\nTarget: \`${p}\`\n\n| Check | Found | Points lost |\n|---|---|---|\n`;
  for (const l of rep.lines) s += `| ${l.k} | ${l.n} | ${l.d} |\n`;
  s += `\nScoring: 100 minus (AI tells x6, cap 60) (contrast x5, cap 20) (accessibility x3, cap 15) (off-scale spacing x1, cap 10) (extra font families x5, cap 10) (placeholders x4, cap 12) (responsive x5, cap 10). Copy swaps are advisory and not scored.\n`;
  for (const l of rep.lines) if (l.issues.length) { s += `\n## ${l.k}\n`; l.issues.slice(0, 8).forEach((i) => (s += `- ${i}\n`)); if (l.issues.length > 8) s += `- ... +${l.issues.length - 8} more\n`; }
  if (rep.copy.length) { s += `\n## copy swaps (advisory)\n`; rep.copy.slice(0, 8).forEach((i) => (s += `- ${i}\n`)); }
  s += `\nA high score means the known mechanical problems are gone. It does not measure taste, hierarchy or photo quality: run the fresh-eyes audit for that.\n`;
  return s;
}

function tPack(p, briefFile, outDir = "fresh-eyes-pack") {
  fs.mkdirSync(outDir, { recursive: true });
  const files = walk(p).filter((f) => /\.(html?|css|jsx|tsx|vue|svelte)$/.test(f)).slice(0, 20);
  for (const f of files) fs.copyFileSync(f, path.join(outDir, path.basename(f)));
  let prompt = read(path.join(HERE, "..", "references", "audit-prompt.md"));
  const brief = briefFile && fs.existsSync(briefFile) ? read(briefFile) : "(no brief file given: ask the user for the six brief lines)";
  fs.writeFileSync(path.join(outDir, "PROMPT.md"), `${prompt}\n\n## The brief\n\n${brief}\n\n## Files in this pack\n${files.map((f) => "- " + path.basename(f)).join("\n")}\n\nOpen a NEW session, attach these files, paste PROMPT.md. Do not share the build conversation.\n`);
  return { outDir, files: files.length };
}

/* ---------- CLI ---------- */
const [, , cmd, a1, a2, a3] = process.argv;
const LIST = `clean-design toolbox (node cd.mjs <tool> ...)
  scan <path>                 AI tells, scored 0 to 10
  contrast <path>             text/background pairs under 4.5:1
  scale <base> <ratio> [n]    type scale (ratio: 1.25, major-third, perfect-fourth ...)
  tokens <preset> [#accent]   tokens.css from a preset: editorial | utility | warm
  copy <path>                 stock phrases with a better way to say each
  spacing <path>              margins/padding off the 4 px scale
  a11y <path>                 lang, alt text, labels, heading order
  fonts <path>                more than 2 font families
  placeholders <path>         lorem ipsum, dummy names, placeholder images
  responsive <path>           viewport meta, fixed widths
  shot <page> <out.png>       headless screenshot (for before/after)
  report <path> [out.md]      all checks, one Clean score 0 to 100
  pack <path> [brief.md]      fresh-eyes review bundle`;
function show(name, r) {
  if (!r.issues.length) { console.log(`${name}: no issues`); return 0; }
  console.log(`${name}: ${r.issues.length} issue(s)`); r.issues.slice(0, 12).forEach((i) => console.log("  " + i));
  if (r.issues.length > 12) console.log(`  ... +${r.issues.length - 12} more`);
  return 1;
}
const need = (x) => { if (!x) { console.error(LIST); process.exit(2); } };
let code = 0;
switch (cmd) {
  case "scan": need(a1); { const r = tScan(a1); show("scan", r); console.log(`AI TELLS: ${r.tells} of 10`); code = r.tells ? 1 : 0; } break;
  case "contrast": need(a1); code = show("contrast", tContrast(a1)); break;
  case "scale": need(a1); typeScale(parseFloat(a1), a2 || "1.25", parseInt(a3 || "5", 10)).forEach(([n, v]) => console.log(`--text-${n}: ${v}px;`)); break;
  case "tokens": need(a1); { const { css, warn } = tTokens(a1, a2); process.stdout.write(css); warn.forEach((w) => console.error("WARN: " + w)); } break;
  case "copy": need(a1); code = show("copy", tCopy(a1)); break;
  case "spacing": need(a1); code = show("spacing", tSpacing(a1)); break;
  case "a11y": need(a1); code = show("a11y", tA11y(a1)); break;
  case "fonts": need(a1); { const r = tFonts(a1); console.log(`families found: ${r.families.join("; ") || "none"}`); code = show("fonts", r); } break;
  case "placeholders": need(a1); code = show("placeholders", tPlaceholders(a1)); break;
  case "responsive": need(a1); code = show("responsive", tResponsive(a1)); break;
  case "shot": need(a1 && a2); { const r = tShot(a1, a2); console.log(r.error || `saved ${r.out}`); code = r.error ? 1 : 0; } break;
  case "report": need(a1); { const rep = tReport(a1); const md = reportMd(a1, rep); if (a2) { fs.writeFileSync(a2, md); console.log(`Clean score: ${rep.score} / 100 (written to ${a2})`); } else console.log(md); code = rep.score < 100 ? 1 : 0; } break;
  case "pack": need(a1); { const r = tPack(a1, a2, a3); console.log(`fresh-eyes pack: ${r.files} file(s) in ${r.outDir}/ (open PROMPT.md)`); } break;
  default: console.log(LIST);
}
process.exit(code);
