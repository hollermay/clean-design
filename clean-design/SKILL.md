---
name: clean-design
description: Use when building, restyling or rescuing a website, landing page or app screen with an AI agent and the result must not look generic or "vibe coded". Runs a design brief, builds with constraints, scans the output for AI tells with a script, and ends with a fresh-eyes audit. Also has a rescue mode for an existing site. Trigger words: "looks vibe coded", "AI slop", "make it look professional", "redesign", "landing page", "fix my design".
---

# clean-design

By Preflight Reels (@devvsclawd). Original work, free to use.

Why it exists: "make it look professional" gets you the average of the internet: the purple gradient, emoji icons, three identical cards, "Supercharge your workflow". The fix is constraints, plus a check that something other than the model's own taste does the grading.

Four modes. Pick from what the user asked; if unclear, ask one question.
- **brief**: write the design brief only.
- **build**: brief, then build a new page.
- **rescue**: the user has an existing site; scan it, fix the worst tells first.
- **audit**: scan and review only, change nothing.

## 1. Brief (always first)
Use `references/brief-template.md`. Six lines: audience and the one action, one accent color, fonts, real words, real image, one reference. Missing facts stay as a visible `TODO`; never invent a number, logo or testimonial. If the user has no taste yet, offer a preset from `references/presets.md` (three ready-made directions with color, type and spacing values) and fill the brief from it.

## 2. Build rules
- One accent color plus neutrals. No gradient hero.
- At most 5 type sizes, left-aligned text, body 16 to 18 px.
- One spacing scale (4, 8, 16, 24, 40, 64), one corner radius, one shadow level.
- One primary button per screen. Real icon set at one stroke width, or no icons. Never emoji as icons.
- Real copy only. Replace stock phrases using `references/copy-swaps.md`.
- Contrast: body text at least 4.5:1.
- Cards: no row of three identical cards unless the content is three parallel things.

## 3. Check with the toolbox (the part most design skills lack)
Twelve tools, one command: `node .claude/skills/clean-design/scripts/cd.mjs <tool> <args>`.

| Tool | What it does |
|---|---|
| `scan <path>` | AI tells scored 0 to 10, each hit with file and line |
| `contrast <path>` | text and background pairs under 4.5:1 (resolves CSS variables) |
| `scale <base> <ratio>` | a type scale as CSS variables (ratio: 1.25, major-third, perfect-fourth...) |
| `tokens <preset> [#accent]` | a `tokens.css` from a preset (editorial, utility, warm); warns if your accent fails contrast |
| `copy <path>` | stock phrases, each with a better way to say it |
| `spacing <path>` | margins and padding off the 4 px scale |
| `a11y <path>` | missing lang, alt text, labels, extra h1, skipped heading levels |
| `fonts <path>` | more than two font families |
| `placeholders <path>` | lorem ipsum, dummy names, placeholder image URLs |
| `responsive <path>` | missing viewport meta, fixed widths with no max-width |
| `shot <page> <out.png>` | headless screenshot, for before and after pairs |
| `report <path> [out.md]` | runs the checks and gives one Clean score 0 to 100 (formula printed in the report) |
| `pack <path> [brief.md]` | bundles the page, brief and audit prompt for a fresh-eyes session |

Run `report` after the build. Fix every hit or write one line saying why it stays, then re-run. `scan-tells.mjs` still works on its own. These tools find mechanical problems only; they cannot judge taste, so step 4 still matters. They read HTML, CSS and component files; styles that live only in utility classes (such as Tailwind) are not parsed by contrast, spacing or fonts.

## 4. Fresh-eyes audit
Use `references/audit-prompt.md`. Give a fresh session (or a different model) only the page and the brief. The agent that built a page does not see its own habits. Apply what it finds, then remove the three least useful elements on the page.

## Rescue mode order (existing site)
1. Run `report` and `shot` (save the "before" screenshot and score). 2. Fix by impact: copy, then color, then icons, then card rows, then effects. 3. Do not change the user's content or structure without asking. 4. Run `report` and `shot` again and show the before and after score and screenshots.

## Honesty rules
- Never fake proof (users, logos, reviews, speed claims).
- Say what the scanner cannot check (taste, hierarchy, photo quality).
- A passing scan does not mean good design; it means the known tells are gone.
