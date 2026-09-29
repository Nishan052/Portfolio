# Lessons

Durable gotchas learned while working on this repo. Read at session start.

## Never trust an SDK write call that logs success — verify the effect

`@pinecone-database/pinecone` v7 takes **options objects**, not bare arrays:

```js
index.deleteMany({ ids })   // correct
index.deleteMany(ids)       // resolves fine, deletes NOTHING, throws nothing
index.fetch({ ids })        // correct
index.fetch(ids)            // throws "Must pass in at least 1 recordID"
```

The `deleteMany` case is the dangerous one: it fails *silently*. A sync can log
"Removing 6 stale chunks", exit 0, and leave all 6 in the index still answering
queries. Found only by re-reading the index after the delete rather than trusting
the log line.

**Rule:** for any operation whose whole purpose is a side effect on a remote store,
assert the effect afterwards. Applies double to deletes.

## Pinecone reads are eventually consistent

A `fetch` immediately after a successful `deleteMany` can still return the deleted
records. Verification of a delete must poll with backoff before concluding failure —
otherwise the correctness check itself becomes a false-alarm generator.

## Embedding-model mismatch fails silently

This index is 768-dim `bge-base-en-v1.5` (matching `functions/api/lib/embed.js`).
Local Ollama has `nomic-embed-text`, also 768-dim. Indexing with the wrong one
produces vectors of the right *shape* and the wrong *geometry*: no error anywhere,
retrieval quality just quietly degrades. Dimension agreement is not model agreement.

**Rule:** locally, embed via `EMBED_PROVIDER=cloudflare` and only enrich via Ollama.

## Detecting "what changed" from git diffs is fragile

The old ingest workflow used `git diff --diff-filter=A HEAD~1 HEAD`. It missed edits
(only saw additions), missed squashed pushes (`fetch-depth: 2`), and had no way to
notice that a previous run had failed — one blog sat unindexed indefinitely.

**Rule:** prefer reconciling desired state against actual state. It is idempotent
and self-healing; a diff-based pipeline is neither.

## Verify extraction against ground truth before building on it

When lifting the source-loading logic out of `ingest.js`, the ids it generates had to
match the live index exactly or every source would have been re-ingested as "new".
Diffing generated ids against the real index (49/49, zero orphans) caught this before
any expensive or destructive work ran.

## Take principles from a reference, never its pixels

Asked for a portfolio "like" a reel video, the first design reused that video's palette, HUD
brackets and readouts, tile-pattern scene, shape morphs, easing rows and ghost-trail type. The
user rightly flagged it as too close to copy.

**Rule:** from any reference (video, site, shot) keep the *idea* (each section is a scene with
motion) and rebuild every visual element from the user's own content. Motion should illustrate what
the section is about (retrieval, forecasting, MQTT packets, quantisation), not decorate it.

## Canvas designs: the entry file does not animate, and unverified motion is not motion

In the Design canvas, `Main.dc.html` (the entry artboard) rendered with all CSS animation frozen.
Every other artboard animated. The hero sat in `Main` in two successive versions and looked
"static" both times; it only moved after another file held it.

**Rules:**
- Put a non-animated artboard (e.g. the design-system sheet) in `Main.dc.html`.
- Use CSS classes, not inline `style`, for animation on SVG children.
- Prove animation by comparing two zoomed frames a few seconds apart. Do not assume, and do not
  claim motion that was never observed. A motion spec pill that is not built is a false claim.

## Motion is observable: the tab must be the ACTIVE tab of an un-minimised Chrome window

For most of the particle-site session I reported "the tool can't show animation" and shipped motion
changes I had not seen. It was not the tool. In a hidden tab `document.hidden` is true and
`requestAnimationFrame` gets ~1 frame per 1.5 s, so GSAP/Three.js freeze. Measured: a tab created
with `tabs_create_mcp` (even `foreground:true`) followed by `navigate` stays hidden; the window's
active tab index does not change. A minimised window is hidden too. Window focus is irrelevant.

**Rules:**
- Before judging any animation screenshot, run the rAF probe (a counter over 1.5 s). Hidden =
  ~1 frame, fixed by `osascript -e 'tell application "Google Chrome" to set active tab index of
  window 1 to N'` and `set minimized of window 1 to false`. Full recipe, with the probe and the
  tab-listing command, is in memory: `chrome-live-animation-testing.md`.
- Sample a timed sequence by clicking, `wait`ing to the part you want, then taking back-to-back
  low-scale screenshots. Never claim motion you have not sampled.
- The artifact page is a cross-origin iframe: page tools cannot see in, screenshots can. Print
  state on screen (`glDiag`) for a test run and remove it afterwards.
- A user's screen recording is readable with OpenCV once it sits in the project folder (not in the
  macOS `NSIRD_screencaptureui` temp folder). Build timestamped contact sheets; see memory
  `screen-recording-frames.md`. The recording found two bugs live testing had never shown.

## Links inside a claude.ai artifact open at click time — lift the href

Three "the tab opens before the animation" fixes (`preventDefault`, ignoring repeat clicks, capture
phase on `window` with `stopImmediatePropagation`) all failed: the page's handler ran (a probe
proved it) and the tab still opened instantly. Anything with a real `href` is followed by the
browser or the artifact host before page code can hold it. Fix: move the `href` to `data-href` at
load and open the link yourself (`a.click()` on a temp anchor) when the animation ends. Keep the
delay under Chrome's ~5 s transient-activation window or the popup can be blocked. If the sequence
can be interrupted (tab hidden), cancel it; a hidden tab freezes GSAP and would otherwise fire the
open whenever the visitor returns.

## Displace in the space you measured in

The button "suction" measured particle positions in world space (after the model matrix) but added
the resulting offset to the local position. The contact scene rotates and shifts the whole group,
so particles converged on a point offset from the button and smeared into a slab. Convert a
world-space offset back with the transpose of the model matrix's rotation
(`dot(modelMatrix[i].xyz, v)`, valid for an unscaled group; `mat3(mat4)` is not allowed in GLSL ES 1.00)
before adding it to `position`.

## Test phone/tablet layouts in the built-in browser on a local server, not by resizing Chrome

The claude-in-chrome `resize_window` resizes the real window, the claude.ai artifact viewer squeezes
the page to ~110px at phone widths, and it can leave a stuck 768px emulation on a tab (outer ==
inner width). Reliable route: serve the built page (`python3 -m http.server 8765 --bind 127.0.0.1`
in the proto folder, stop it afterwards), open it with `mcp__Claude_Browser__preview_start` (this
makes the pane visible so animations run; plain `navigate` leaves it hidden and GSAP frozen), then
`resize_window` preset `mobile` (375x812) / `tablet` (768x1024) and reset to `desktop` afterwards.
Click in the screenshot's own coordinate frame (750x1624 for the phone preset). `zoom` regions are
not supported there, so enlarge the element in the page instead (e.g. set a big font-size).
A standalone page needs `<meta charset="utf-8">` and `<meta name="viewport" ...>`; the artifact
host adds them, a plain server does not (symptoms: mojibake, and a 980px layout on phones).

## Simple mode below 1100px

Tablets and phones get no WebGL at all (`html.simple`, `no-gl`): no canvas, no Three.js download
(`document.write` of the script tag only at >=1100px), no particle loader, scene deck + dock kept.
Crossing the threshold on resize reloads the page. A dismissible "Best on desktop" note shows once
per session. The hero content lives in a `.scene-in` like every other scene so it scrolls and the
swipe logic treats it uniformly.

## Porting the deck into the React app (2026-09-29)

- **Element resets must have zero specificity.** `.dk button{border:0}` (0,1,1) silently beat every
  `.dk-pill` / `.dk-copy` / `.dk-kick` class (0,1,0), so buttons lost borders and `<p>` lost margins.
  Use `:where(.dk) button` for resets; only rules that must beat `global.css` (bare `h1-h4`) get real
  specificity. Check any namespaced port for this before judging the visuals.
- **A keyboard exemption must not cover the trigger button.** Marking the whole chat widget
  `data-no-deck` swallowed shortcuts for as long as focus sat on the chat toggle after closing chat.
  Exempt only the panel where people type (`data-no-deck="panel"`).
- **A canvas whose context was force-lost cannot get a new one.** Create a fresh `<canvas>` per engine
  mount (StrictMode double-mounts effects, and route changes remount the deck).
- **The Browser pane's `scroll` action does not emit `wheel` events** (a capture listener saw none).
  Test wheel gestures by dispatching `WheelEvent`s at the scene, and say so.
- **Never leave a monkeypatch on a page you keep testing on** (I patched `HTMLAnchorElement.prototype.click`
  to catch link opens; it made every later `b.click()` look like an instant open). Reload after it.
- **Text that a script rewrites (`textContent`) must not be React-managed text.** Scramble / charge
  labels replace the text node, so React updates go to a detached node. Remounting the deck on
  language change keeps React and the DOM in agreement.

## Theme, blog and chat (2026-09-29)

- **Look for stale twins before editing.** Two copies of ten components existed (`X.jsx` and `X/X.jsx`);
  the flat one shipped and the folder one was older. Diff both, keep the newer, move it into the
  folder convention, delete the other. Never patch whichever file you found first.
- **One source for the palette.** Blog and chat were already token-driven, so changing values in one
  `tokens.css` (with old names as aliases) re-themed them without touching their rules. Do the token
  layer first, then only fix what hard-codes a colour or font.
- **`font: inherit` after a class that sets `font-size` silently cancels it.** Order the shorthand
  before the specific rule (SiteBar pill looked oversized).
- **CRA Jest resets mock implementations between tests** (`resetMocks`): set `mockResolvedValue` in
  `beforeEach`, not in the `jest.mock` factory.
- **A hidden Browser pane throttles rAF to ~3 fps** (main thread idle, `document.hidden` false).
  If `setTimeout(0)` lag is tiny but frames are few, say animation checks are blocked; do not read
  slow morphs or a "stuck" lock as a code bug.

## Cursor + resize (2026-09-29)

- **Never hide the system cursor on a promise.** `cursor: none` must be conditional on the replacement cursor
  having proven it is tracking (a class set by a real move), not on a media query evaluated once.
- **Read device capabilities live.** `matchMedia("(pointer: fine)")` can flip while the page is open (device
  emulation, docking); listen for `change` instead of caching the boolean at mount.
- **A remount is not a page load.** Anything that replays an intro (entrance tweens, reveal, loader) needs an
  `instant` path for remounts, or every resize looks like the content vanished and re-appeared.
- **Ignore 0x0 resizes.** Browsers report an empty viewport transiently while switching sizes.
