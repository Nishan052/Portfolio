# Weekly Incremental KB Sync Pipeline

Goal: keep the RAG knowledge base in sync with the repo as a new blog ships each week,
by reconciling Pinecone against the repo instead of guessing from git diffs.

## Tasks

- [x] `scripts/lib/sources.js` — single definition of every KB source + contentHash
- [x] `scripts/lib/vectorize.js` — embedText / processSource / upsertBatched engine
- [x] `scripts/lib/kb-diff.js` — pure diff logic (new/changed/adopt/orphan/stale/prune-cap)
- [x] `scripts/sync-kb.js` — reconciling orchestrator with dry-run + report
- [x] Refactor `scripts/ingest.js` to full-rebuild only, on shared libs (fixes PDF filter bug)
- [x] `scripts/lib/__tests__/kb-diff.test.js` — unit tests for the diff logic
- [x] `.github/workflows/kb-sync.yml` (weekly cron + push + dispatch); delete `ingest-new-content.yml`
- [x] `package.json` — kb:sync / kb:sync:dry / kb:status scripts

## Verification

- [x] Dry run reports exactly 2 new blogs, 47 adopt, 0 orphans
- [x] Unit tests pass
- [x] Real sync via Ollama: 528 -> ~555 vectors
- [x] Re-run is a no-op (idempotent)
- [x] Editing one blog marks exactly that source `changed`
- [x] Removing a blog file marks exactly that source for prune
- [~] `npm run test:quality-gate` — script is missing from the repo (pre-existing); verified retrieval directly instead

## Review

Built a reconciling sync that compares the repo against Pinecone directly rather than
reading git history, so a missed or failed run self-heals on the next pass.

**Outcome:** index went 528 -> 560 vectors. The two blogs that the old push-triggered
workflow had silently missed (`kmeans-centroids-convergence-rag-routing`,
`edgetpu-position-dominates`) are now indexed and retrieve as top matches
(0.887 and 0.694). The other 49 sources were adopted with a metadata-only hash
stamp — no re-embedding, no LLM calls, no cost.

**Verified end to end:** exact-match of generated source ids against the live index
(49/49, zero orphans); idempotent re-run (51 unchanged, zero writes); single-source
change detection; orphan detection; prune safety cap aborting with exit 1; filtered
scope disabling prune; live stale-chunk deletion on a shrinking post (8 -> 2 chunks,
chunks 2..7 removed and confirmed gone); retrieval of both new blogs.

**Bugs found and fixed along the way:**
- `deleteMany(ids)` with a bare array resolves successfully but deletes nothing.
  The SDK wants `deleteMany({ ids })`. Caught only because the live shrink test
  checked the index afterwards instead of trusting the log line.
- `upsertBatched` never cleared `lastErr` after a successful retry, so a batch that
  failed once then succeeded still threw.
- `--pdf-files` filtered on `metadata.file` while the loader set `metadata.filename`,
  so the flag silently skipped every PDF.
- Added a guard against embedding with a model other than bge-base-en-v1.5, which
  would produce correctly-sized but geometrically wrong vectors and silently
  degrade retrieval with nothing visible in logs.

**Pre-existing breakage found, left alone (out of scope, reported to user):**
- `__tests__/setup.js` breaks the entire root Jest suite (a `jest.mock` factory
  references `document`). Worked around with a separate node-env config for the
  script tests, which should not load a jsdom setup anyway.
- `tests/quality-gate.js` and the other `test:*` scripts reference files that do
  not exist in the repo.
- `scripts/debug-rag.js` embeds with `@cf/nomic-ai/nomic-embed-text-v1.5` — wrong
  model for this index, and a dead Cloudflare route.


---

# Port the particle "scene deck" prototype into the React site

Source of truth for the port: the Claude artifact prototype (v56). Its files live in the session
scratchpad (`proto/template3.html`, `proto/build3.py`); copy them into `tasks/prototype/` at the start
so the port does not depend on a temp folder. Prototype rules to preserve: scene deck + bottom dock
(NOT long-scroll), command palette (INDEX / Cmd+K), morphing WebGL particle field on desktop (>=1100px),
plain content on tablet/phone with a "Best on desktop" note, button charge -> 3 s -> open link.

## Decisions (defaults; change any before I start)

- **Rollout:** build at a temporary route `/deck` first; the old home stays untouched at `/` until the
  deck is verified. Then swap `/` and (separate step, needs approval) delete the old sections.
- **Theme (decided: dark AND light on the deck).** The deck follows the site's existing `isDark` state
  (`ThemeContext`), with the toggle in the INDEX palette and next to EN/DE. Light needs real design work,
  not a colour swap: the field is additive white-on-dark, which disappears on a light page. Light mode
  = its own CSS token set, `NormalBlending` with dark "ink" particle colours (deep indigo / slate /
  burnt orange), re-tuned point size + alpha (a dark blob reads far heavier than a glow), dark boot
  particles, a soft warm flash instead of white, ring/note/dock re-skinned. Shader gets a `uLight`
  switch; switching theme swaps blending + palette uniforms live (no reload).
- **Language:** EN/DE keeps working. All deck copy goes through i18n; new keys live under `deck.*`
  in en.json/de.json. `hero.role`, `experience.items`, `projects.items` are read by the chatbot KB
  (`scripts/lib/sources.js`) and are not touched. An EN/DE switch sits next to INDEX.
- **Chat:** the existing `ChatWidget` (already wired to `/api/chat`) stays as it is and floats over the
  deck; the deck's wheel/touch/key handlers ignore events inside it (`[data-no-deck]`).
- **Blogs:** `/blogs` and `/blogs/:slug` stay normal routes with the current Navbar/background; the
  deck's INDEX palette and Contact scene link to them. Blog restyle to the new type/colours is a later,
  optional phase.
- **Deep links:** `/#hero|about|experience|projects|contact` map to scenes; legacy `#skills` -> toolkit.
- **New dependency:** `gsap` (the prototype's timelines). Three is already installed (0.161; prototype
  used r128 - verify the look is unchanged). The whole deck + GL engine is a lazy chunk; below 1100px
  Three.js is never fetched.
- **Fonts:** add Unbounded, Geist, Geist Mono and the one-glyph Lexend `j` subset to `public/index.html`
  (Syne/DM Mono/Outfit stay for the blog pages).

## Phases

- [x] **P0 Baseline.** `react-scripts test` = 67/67 green (recorded). Record `npm run build` result and
      `node scripts/build-site-index.js --check` before touching anything. Copy prototype into
      `tasks/prototype/`.
- [x] **P1 Foundation.** `npm i gsap`; fonts; `src/deck/` skeleton (`DeckPage.jsx`, `deck.css`,
      `useDeckMode.js` = width < 1100 + reload on crossing); route `/deck`; i18n `deck.*` keys EN+DE.
- [x] **P2 Scenes as React (no GL).** Hello, About, Experience, Projects (carousel + 6 mini demos ported
      from `build3.py`), Toolkit (icon tiles, groups, certs), Contact. Reads existing `en.json` /
      `projects.json` / `experience.json` / `skills.json` / `site.js` exactly like the old sections.
      Deck navigation state (`cur`, `goScene`, `inert`, per-scene scroll), dock, INDEX palette, hash sync.
      Verify phone (375) and tablet (768) here - this is the whole simple mode.
- [x] **P3 GL engine.** Port shaders, `makeTarget` shapes (name, DNA, skyline+ship, wave field, planet +
      tool icons, Earth + Berlin), morph engine, frame loop, resize/rebuild, context-loss watchdog, as
      plain modules under `src/deck/gl/`, dynamically imported only at >= 1100px. React owns the canvas
      lifecycle (StrictMode-safe init + full dispose).
- [x] **P4 Interactions.** wheel/touch/key deck gestures, cursor repel + ripple, globe/planet "enter",
      Berlin clock, focus tour, boot loader (canvas particles -> name), charge FX with `data-href`
      deferral and 3 s open, visibility cancel, desktop note, reduced-motion paths.
- [x] **P4b Light theme.** Token sets (`[data-theme]` on the deck root), GL palette + blending swap,
      light boot loader, light versions of note/dock/palette/ring/flash. Compare every scene in both
      themes, desktop and phone.
- [x] **P5 Integrate.** ChatWidget + gesture exemption + dock offset; blogs links; legacy hash map;
      `<meta>` / OG unchanged; skip-link and `lang` sync kept.
- [x] **P6 Verify.** See below. `/` now serves the deck; the old home is kept at `/classic`.
- [ ] **P7 Clean-up (needs approval).** Delete the old home sections, their duplicate folder copies and
      their tests; update README and `tasks/lessons.md`.

## Verification (nothing is "done" until each is observed)

- [x] `react-scripts test` green; new tests: mode detection + reload-on-cross, hash <-> scene map,
      EN/DE `deck.*` key parity, charge FX (fake timers: no open before 3 s, exactly one open, repeat
      clicks ignored, cancelled when hidden), no `href` left on `[data-warp]` after mount.
- [x] `npm run build` succeeds; main bundle does not grow by three/gsap (lazy chunk); Three.js chunk not
      requested at 375px.
- [x] `node scripts/build-site-index.js --check` still up to date (KB inputs unchanged).
- [x] Desktop in real Chrome (tab active + rAF probe first, see memory `chrome-live-animation-testing`):
      boot -> name, every scene morph, cursor repel, globe hover clock, planet, DNA, button charge,
      chat open/scroll/send while on each scene, blog round trip, browser back/forward.
- [x] 375px and 768px via local server + built-in browser: no canvas, no Three request, note shown once,
      chat usable, blog links work.
- [x] EN <-> DE and dark <-> light on every scene (desktop + phone); reduced-motion; keyboard-only path (Tab, Enter, Esc, Cmd+K).

## Risks to watch

- Three r128 -> r161 (colour management, shader prefix): compare screenshots of each scene before/after.
- React StrictMode mounts effects twice: GL init must be idempotent and fully disposed.
- jsdom has no WebGL: engine code stays behind a dynamic import and is never imported by unit tests.
- Old and new fonts both loaded: fine for now, measure before removing Syne.
- Nothing is committed by me; every step leaves the working tree reviewable.

## Review (port to `/`, 2026-09-29)

What shipped: `/` is now the particle scene deck. `/deck` redirects to `/`, the old single-page home is
still reachable at `/classic` (nothing deleted; P7 is waiting for your go-ahead).

- **Structure.** `src/deck/`: `DeckPage.jsx` (shell + state), `Scenes.jsx`, `Palette.jsx`, `demos.jsx`,
  `controller.js` (gestures, cursor, charge FX, boot, bridge), `useDeckMode.js`, `deck.css`, and
  `gl/` (`engine.js`, `targets.js`, `shaders.js`, `landmask.js`). The GL engine is a dynamic import,
  requested only at >= 1100px: a 375px load fetches `main.js` alone (the old home also pulled the
  three.js background there).
- **Theme.** Follows the site theme (`ThemeContext`). Light = ink-coloured points with normal blending
  (`uLight`, `uAlphaK` in the shader), dark = the additive glow. The toggle is in the deck nav.
- **Language.** EN/DE via `deck.*` keys (parity test). Language switch and desktop<->simple mode remount
  the deck (the scene survives through the URL hash). German headings step down in size (long words).
- **Chat.** Floats over the deck. `data-no-deck="panel"` on the chat window keeps wheel/touch/keys
  inside it; the toggle button only keeps pointer gestures. On phones the chat button is lifted above
  the dock.
- **Links.** `#skills` -> toolkit, unknown hashes (e.g. `#main-content`) ignored. Blog pages link back
  with `/#<section>` (Navbar now navigates with a hash instead of scrolling).

Observed (built-in Chromium, production build served locally): every scene in dark and light at
1440px; boot -> name; INDEX palette (K, type, Enter); charge FX opens at 2984 ms after the click;
globe hover switches the caption to the Berlin clock; chat typing and wheel do not move the deck; blog
round trip keeps one canvas; 375px phone scenes (EN + DE); dev server (StrictMode) mounts cleanly with
no console errors. Tests: 80 passing (67 baseline + 13 new); `build-site-index.js --check` up to date;
tracked `build/` files untouched (builds used `BUILD_PATH`).

Not yet done / for you to look at: real-Chrome run of the 3 s charge with the OS tab actually opening
(logic verified with `HTMLAnchorElement.click` intercepted); reduced-motion and keyboard-only paths
are implemented but only unit-tested; tablet 768px was checked only through the same simple mode as phone.

---

# Make blog + chat match the deck, and bring the deck up to the repo's module rules

Why: `/blogs` and the chat still wear the old look (neon cyan, Syne, floating orbs, old navbar) next to
the amber/violet Lexend/Geist deck. And parts of `src/deck/` break conventions the rest of the repo follows.

## Findings (read, not guessed)

- Blog pages and chat are already token-driven (`--accent --surface --border --text --text-muted --bg`;
  ~54 hard-coded colours left, fonts hard-coded to Syne / DM Mono / Outfit). So one shared token layer
  fixes most of the mismatch; the rest is chrome (old Navbar + ThreeBackground + FloatingOrbs on `/blogs*`).
- Repo rules seen in existing code: folder per component (`X/X.jsx`, `X.css`, `X.test.jsx`, `index.js`);
  non-translatable values in `src/config/site.js` ("every value that would otherwise be hardcoded");
  visible text in `src/i18n` EN+DE; content in `src/data/*.json`; co-located tests; README structure.
- Deck gaps against those rules: `Scenes.jsx` (six scenes, 280 lines), `controller.js` (505 lines: nav,
  input, pointer, charge FX, boot), one 349-line `deck.css`; hard-coded strings/numbers (boot label,
  "LinkedIn", demo captions, `SIMPLE_MAX`, `NAV_DELAY`, note timings); planned tests not yet written
  (charge FX with fake timers, mode detection, per-scene render).
- Hazard: flat `X.jsx` and `X/X.jsx` copies of ~10 components coexist and the flat ones win resolution
  (I had to edit `ChatWidget.jsx` and `Navbar.jsx` flat copies). Removing the stale copies needs approval.

## Plan

- [x] **T1 Shared tokens (one source of truth).** `src/styles/tokens.css`: fonts + dark/light palette from the
      deck (`--font-display/body/mono`, `--bg --text --mute --line --amber --violet --cyan --glass-*`),
      keyed on `html[data-theme]`; legacy names (`--accent --surface --border --text-muted --accent2`)
      become aliases so blog, chat, `/classic` follow automatically. `App` sets `data-theme`;
      `THEMES` (JS consumers) updated to the same values. `deck.css` drops its duplicate token block.
- [x] **T2 Shared top bar.** Extract the deck nav into `components/layout/SiteBar/` (brand, language,
      theme, right-slot); deck passes Index/Blog, blog passes "Portfolio". Blog routes stop mounting the
      old Navbar/ThreeBackground/FloatingOrbs and get a quiet CSS-only backdrop.
- [x] **T3 Blog re-skin.** `BlogsList.css` / `BlogPost.css`: Lexend headings, Geist body, Geist Mono labels,
      amber accents, deck card/chip/rule language, light + dark; mermaid `--diagram-*` derived from tokens.
      No content or markdown-pipeline changes.
- [x] **T4 Chat re-skin.** `ChatWidget.css`: glass panel, amber FAB/send, mono labels, pill input; class
      names and behaviour unchanged (tests + `data-no-deck` stay). Move the phone dock-offset next to it.
- [x] **T5 Deck modularity.** `deck/scenes/{Hero,About,Experience,Projects,Toolkit,Contact}/` (jsx + css +
      index + test); `deck/controller/{index,navigation,input,pointer,chargeFX,boot}.js`;
      `deck/DeckChrome` pieces (dock, palette, note, boot) as folders; CSS split to match.
      Config -> `siteConfig.deck` (breakpoint, nav delay, note timings); strings -> `deck.*` EN+DE.
- [x] **T6 Tests.** charge FX (fake timers: no open before 3 s, exactly one open, repeats ignored, cancelled
      when hidden), `useDeckMode` crossing, per-scene render, SiteBar, tokens parity (THEMES vs css).
- [ ] **T7 Verify.** Dark + light, EN + DE, 1440 / 768 / 375, every scene + `/blogs` + one post + chat open;
      `react-scripts test`, eslint, `build-site-index --check`, build via `BUILD_PATH`.
- [x] **T8 Docs.** README structure, `tasks/lessons.md`, memory note. (No commits.)

Needs approval, not doing unasked: deleting the stale flat duplicates; removing `/classic` and old home sections.

## Review (blog + chat theme, module rules, 2026-09-29)

- **Duplicates.** The live code was the *flat* files, the folder copies were stale (older: e.g. no
  LCP fix in HeroSection, no `visibility` fix in the chat). I moved the live files into the
  folder-per-component layout (`X/X.jsx`, `X.css`, `X.test.jsx`, `index.js`), fixed their relative
  imports, deleted the flat copies, and moved `Panel` and `chatMarkdown` (now `ChatMarkdown`) into
  folders too. The existing tests now run against the code that actually ships (all still pass).
- **Tokens.** `src/styles/tokens.css` is the only place the palette and typefaces are defined
  (`--font-*`, dark/light keyed on `html[data-theme]`); legacy names (`--accent --surface --border
  --text-muted`) alias it. `THEMES` in `ThemeContext` is now just `{ name }`, `App` sets
  `data-theme`, and the theme choice is remembered in `localStorage` like the language.
  Blog, chat, Panel, mermaid palette and the older sections all follow. Guard test: no file may
  name Syne / DM Mono / Outfit again.
- **Blog.** New `SiteBar` (shared with the deck) + `SiteBackdrop` (CSS only, no canvas) replace the
  old navbar / 3D background / orbs on `/blogs*`. Cards, chips, headings, code, diagrams and video
  play control use the deck's language. Per-post neon colours are no longer applied (the data field
  stays).
- **Chat.** Glass panel, amber FAB and send button, mono labels, pill input; classes and behaviour
  unchanged.
- **Deck modularity.** `controller.js` (505 lines) -> `controller/{context,bridge,navigation,input,
  pointer,chargeFX,boot,constants,index}.js`; `Scenes.jsx` -> `scenes/{Hero,About,Experience,
  Projects,Toolkit,Contact}/` + `shared/`; `Dock`, `Palette`, `DeskNote`, `BootLoader`, `Overlays`,
  `ParticleLayer` components; `demos/`; the 349-line `deck.css` split into a 70-line shell + one CSS
  file per component. Hard-coded numbers -> `siteConfig.deck`; hard-coded strings (boot label,
  demo captions, "LinkedIn") -> `deck.*` i18n EN+DE; clipboard/open helpers -> `src/utils`.
- **Tests:** 80 -> 121 passing (charge effect with fake timers, `useDeckMode`, every scene, SiteBar,
  SiteBackdrop, tokens + font guard, utils, scene constants). ESLint: no new warnings.
- **Re-verified after the refactor** (pane visible again, 60 fps, 1280px): all six scene morphs by key,
  and the charge effect (opens once, 2998 ms after the click; anchor click intercepted so no tab opened).
  Blog, chat, deck dark + light and phone were checked on the built site earlier in the session.
- **Out of scope / left:** the blog posts' embedded videos in `public/videos` are pre-rendered with
  the old cyan look; `/classic` and the old home sections still exist (removal awaits approval).

## Follow-up: no charge effect on tablet/phone
`controller/chargeFX.js`: in simple mode (< `siteConfig.deck.simpleMax`) the warp buttons (Email me, GitHub,
LinkedIn) no longer fill, change label or wait 3 s — the link opens on tap (email still copies the address
and toasts). Desktop keeps the particle charge (and its CSS-fill fallback if WebGL is unavailable).
Test added; verified in the built site at phone width (opens at 1 ms, label unchanged).

---

# Tablet + phone: real header, bottom tab bar, footer (simple mode, < 1100px)

Decisions (you chose): bottom tab bar + menu sheet; solid header + compact site footer.

- [x] **M1** Header: in simple mode `SiteBar` is `solid` (brand, Blog >= 600px, Index/menu, language, theme).
- [x] **M2** `components/TabBar/`: fixed bottom bar, six tabs (icon + short label, `deck.tabs` EN/DE), active
      indicator, safe-area aware; labels beside icons from 700px. Replaces the dot dock in simple mode; Index
      (the existing palette) is the menu sheet, opened from the header.
- [x] **M3** `components/DeckFooter/`: links row (GitHub, LinkedIn, email, Blog) + (c) line from
      `siteConfig.footer.copyrightYear`, at the end of Contact; the desktop keeps its one-line foot.
- [x] **M4** Layout: scene padding from header/tab-bar heights; chat button, note and toast lifted clear of the
      bar at every simple width; palette inert list includes the tab bar.
- [x] **M5** Tests (TabBar, DeckFooter, DeckPage simple mode) + i18n parity; verify 360 / 375 / 768 / 1000,
      dark + light, EN + DE.

Result: simple mode now has a solid header (brand, Index, language, theme; Blog from 600px), a bottom tab bar
(`components/TabBar`, six tabs, icon over label on phones and beside it from 700px, safe-area aware, active
indicator) and a real footer in the Contact scene (`components/DeckFooter`: GitHub, LinkedIn, email, Blog + (c)
line from `siteConfig.footer.copyrightYear`; desktop keeps its single line). The dot dock is desktop-only. Scene
padding, chat button/window, note and toast are offset from `--tab-h`. 130 tests pass (+8); checked in the built
site at 375 (dark, EN) and 768 (light, DE) — tab bar, header, footer, Work/Projects/Contact scenes.

---

# Palette: option B "Indigo Signal" applied

Chosen from the palette research page. Only `src/styles/tokens.css` defines colour now, and its accent
tokens are renamed by role so the code no longer says "amber" for an indigo: `--brand` (lead accent),
`--support`, `--spare`, `--ink-on-brand` (all `-rgb` variants too). Old names (`--accent`, `--surface`,
`--border` ...) still alias them.
- Dark: bg `#0A0B14`, text `#F2F3FB`, brand `#8B93FF`, support (mint) `#4FE0B5`, spare (pink) `#FF8FB1`.
- Light: bg `#F5F6FD`, text `#0F1226`, brand `#4048D6`, support `#0B7A5B`, spare `#C02660`.
- Also moved to the palette: WebGL particle colours + funnel highlight (`gl/engine.js`, `gl/shaders.js`),
  mermaid diagram palette (the "bad" class is now pink instead of a green-ish accent), Panel palette,
  selection colour, blog backdrop, card/boot glows, `theme-color` meta and manifest.
- Contrast (WCAG): text 17+:1, muted 7.3-8.4, brand text 6.3 (light) / 7.2 (dark), button label 6.7 / 7.1.
- 130 tests pass; checked in the built site: all deck scenes (dark + light), chat, blog list.

Follow-up (light theme + contact): light background is now a warm paper `#F8F4EC` (panel `#FFFDF8`; all text/accent
contrast still passes: text 16.9, muted 7.1, brand 6.1, support 4.85, spare 5.2); diagram/figure/code surfaces
warmed to match. Light particles are bolder (point size 1.55, alpha x3.2, darker ink) with dust dimmed 55% via a
vertex-only `uDustDim` (a shared `uLight` uniform would clash on precision between shader stages). The footer link
row (GitHub, LinkedIn, Email, Blog) now shows on desktop too, not only on tablet/phone.

Follow-up (name vs description overlap): the particle name used fixed proportions of the viewport, so on wide,
short windows it ran into the description block. It is now fitted to the real layout: the controller measures
the free band between the hero's role line and its description block (`bridge.nameBox`, entrance offsets
ignored) and `fitName()` in `gl/targets.js` sizes and centres the name inside it (20px gaps, 36px floor); it
re-fits on every resize. Root cause of a second bug found while testing: the plain-content `dk-nogl` class was
still on while the engine measured, and it shows the hero h1 in the flow, shifting the layout; it is now
removed first. Tests: `gl/targets.test.js` sweeps 1100-3440 x 500-1600 viewports and asserts the name stays
inside the band. Also: dust points are smaller as well as dimmer on the light theme.

---

# Bug: cursor and content vanish when switching screen sizes

Causes found (three, all in how the deck restarts itself):
1. **System cursor hidden with nothing drawn.** CSS hid it for every `pointer: fine` page (`cursor: none`), but the
   custom cursor only appears after the first mouse move. After a remount (crossing 1100px, or a language switch)
   the new deck had seen no move yet, so there was no cursor at all until the mouse moved. Also `fine` was read once
   at mount: switching device emulation (touch <-> mouse) without crossing 1100px left the custom cursor disabled
   (`dk-touch`) while CSS still hid the real one, permanently. Now: `cursor: none` only under `.dk-has-ptr` (set by a
   real mouse move, removed by touch), the pointer type is read live (`matchMedia` change listener), and the custom
   cursor is wired whatever the pointer type at mount.
2. **Content replayed its intro.** Every remount re-ran the entrance (text from opacity 0, particles from a 3 s
   scatter), which looks like content disappearing, and freezes that way if frames stall mid-resize. Remounts after
   the first page load now start `instant` (no intro, particles fully formed).
3. **0x0 viewport during a switch.** Browsers briefly report a 0-size window; that flipped the deck to plain mode
   and could rebuild the particle field at size 0. Both the mode hook and the resize handler now ignore it.
Tests: `controller/pointer.test.js` (6), `useDeckMode` (+1). 142 pass. Checked: cursor is `auto` before any move;
1440 -> 900 -> 1450 keeps content at full opacity and the helix formed within 2 s.

Follow-up: light-theme particles made finer again (point size 1.55 -> 1.15, alpha gain 3.2 -> 2.6) so individual dots stay distinct instead of merging; name, helix and globe re-checked at 1440.

Pre-push review: removed the now-unused Syne / DM Mono / Outfit stylesheet from public/index.html (nothing references them; guarded by tokens.test.js). CI=true npm run build (prebuild + build) passes, npm ci --dry-run passes, tracked build/ files untouched.
