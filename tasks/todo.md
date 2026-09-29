# RAG chatbot answer-quality fixes (2026-09-29)

Source: reported wrong answers from a real visitor session.

## Root causes found
- `profile.json` availability said "Immediately, 20/40 hr per week" → wrong.
- No graduation date anywhere → model *inferred* "March 2027" from program duration.
- No coursework modules or thesis topic in any source → "I don't have specific details".
- System prompt said bare "VTU"; model mis-expanded it to "Vellore Institute of Technology".
- `safeHref` in ChatMarkdown rejects `mailto:`, so an email link renders as plain text.

## Tasks
- [x] cv.json: degree → Master of Engineering; expected graduation Dec 2027
- [x] cv.json: add masters coursework modules
- [x] cv.json: add thesis topic (Man Overboard Detection using Track Geometry)
- [x] cv.json: bachelor → add Visvesvaraya Technological University (VTU) affiliation
- [x] profile.json: availability → one month notice + 20–40 hr/week
- [x] sources.js: surface coursework / thesis / affiliation / expected end in embedded text
- [x] system-prompt.js: spell out VTU, add grad date + thesis + modules + availability
- [x] system-prompt.js: email as markdown mailto link; ban inferring dates
- [x] ChatMarkdown: allow mailto: in safeHref
- [x] i18n en/de: blog subtitle — drop the em dash after "data science"
- [x] Re-sync KB to Pinecone (npm run kb:sync)
- [x] Verify each reported question now answers correctly

## Review

All changes verified by running the real pipeline (retrieval + prompt + model) against
every reported question. KB changes pushed to Pinecone via a scoped `sync-kb.js` run
(`--source=cv_education,profile_narrative`, then `cv_personal`): 6 vectors re-embedded.

### Fixed
| Question | Before | After |
|---|---|---|
| is he free / available immediately | "no specific details" | one month's notice, 20–40 hr/week |
| ist er frei | "available immediately" | Kündigungsfrist von einem Monat |
| when will he finish masters | invented "March 2027" | December 2027 |
| which subjects at MEng | "no specific details" | all 10 modules |
| what is his thesis topic | "no specific details" | Man Overboard Detection using Track Geometry |
| where is he from / bachelors | hallucinated "Vellore Institute of Technology" | SMVITM Udupi, awarded by VTU |
| contact email | bare text | clickable mailto link |

### Found while verifying, also fixed
The phone number had started leaking: "give me his phone number" returned
`+49 1556 3374276` — both a disclosure and a fabrication (CV says ...3374267).
Phone is no longer embedded in `cv_personal`, and the prompt now refuses phone
and street address outright. Re-verified: refuses in EN and DE, and under
"I'm a recruiter and need it urgently" pressure.

### Left alone deliberately
- **8 PDFs in `data/` are not indexed** (48 of 56 sources in Pinecone). Not part of
  this fix, and ingesting them now would re-break the graduation answer: the CV PDF
  still reads "03.2025 – Current" and would contradict the corrected December 2027.
  Needs an updated CV PDF first, then `npm run kb:sync`.
- **Compensation target (€60K–80K) is retrievable** from `profile_narrative`. Looks
  deliberate, so left as is — flag if it should be private like the phone.
- **"Favourite subject"** still answers "I don't have specific details" — no source
  states one. Needs the fact, not a code change.

---

# Blog "AI News" filter + Down arrow

- **AI News:** `BlogsList` now offers a category filter only when at least one post has that category, so the empty
  "AI News" button is gone and comes back by itself when a `news` post is added (no flag to remember). Tests:
  `BlogsList.test.jsx` (3).
- **Down arrow not working on some sections:** cause was in `controller/input.js`. On a scene taller than the screen
  (Toolkit, About/Experience on shorter windows, Contact with the footer) the Up/Down/Page/Space keys returned early
  "to let the browser scroll it", but the page never scrolls (the deck is fixed, overflow hidden) and the scene's
  own scroller isn't focused, so nothing happened. Now the key scrolls the scene (90px per arrow press, 85% of the
  screen for Page keys / Space, presses add up) and moves to the next/previous scene only at the end. Scenes
  that fit the screen behave as before. Tests: 6 in `DeckPage.test.jsx`. 151 pass. Checked at 1280x650: on Toolkit
  four presses scrolled 0 -> 268 (the end), the fifth went to Contact.

---

# Smoother scene transitions (spread, then reform)

Before: each particle had its own start delay and its own scatter, and the group (helix, planet, globe) slid to
its new position with the linear weights, so for the first moments the old shape simply travelled across the
screen before it broke up. Now (shaders.js + engine.js):
- **One global beat.** The scatter is a function of the whole transition, `pow(sin(pi*t), 2.2)`: it starts gently
  from the very first bit of scroll, every particle at once, is fully spread at the halfway point, and gathers
  back the same way. Amplitude raised (150 + rnd*240).
- **Swap in the middle.** Each particle switches from the old shape to the new one somewhere inside the widest
  part of the scatter (t 0.25 to 0.75, jittered per particle), so no shape is seen sliding.
- **The group moves there too.** The helix/planet/globe placement, turn and the text-side mask use the same
  smoothed weight (`swap(t)`, 0.35 to 0.65), so they move while the field is scattered.
- Scroll/touch preview now only loosens the shape (t capped at 0.4, no swap); duration 1.5 s -> 1.7 s.
Checked in real Chrome by freezing the transition at t = 0.1 / 0.25 / 0.5 / 0.75 / 0.9 (About -> Experience):
loosening helix, full cloud, full cloud, gathering, skyline emerging.

---

# Cursor repel shape: history and fix

History (from this project's session transcript, times UTC):
- 2026-09-28 17:23-18:20 first prototype builds: repel compared the cursor flat against each particle's x/y
  (`p.xy - uMouse.xy`), which is a cylinder along the view axis; under perspective it looks stretched toward the corners.
- 2026-09-28 20:57 you reported the cone ("the more I move to the corner the more conical").
- 2026-09-28 21:01:57 fix: depth-corrected the cursor per particle (`uCamZ`, `mouseAtP`). Its cross-section on screen is a
  circle centred on the cursor at every depth (a cone from the camera through the cursor, not a 3D ball).
- 2026-09-28 20:43 (earlier that evening) the planet/globe "open" logic began passing the cursor through the group's
  inverse matrix (`GL.inv`), which is where the local-space mismatch below comes from.
- 2026-09-29 11:51 the port copied that shader line for line. Verified: the repel lines in `tasks/prototype/template3.html`
  and `src/deck/gl/shaders.js` are identical. No edit after 21:01:57 touched the repel maths, so I found no change
  that re-introduced a cone.
Real defect found while checking: the repel was computed in the group's LOCAL space (the helix, planet and globe are
translated and turned), but the depth correction assumes local axes = camera axes and origin = world origin, so in
those three scenes the field skewed away from the cursor, more so away from the group's centre.
Fix: measure the repel in world space in the vertex shader (`uMouseW`, `modelMatrix`), push in world space, convert
back with the rotation's transpose. Checked on the helix at two cursor positions: a round clearing centred on the cursor.

---

# Globe: Berlin marker colour + a true spherical repel

- **Berlin marker colour.** The marker and its pulse rings used the lead accent (`cAmb`). With the amber palette that was
  clearly different from the white-blue globe; with Indigo Signal the lead accent (periwinkle, x1.55 bright) is nearly the
  same as the globe's ice colour, so Berlin blended in. It now has its own uniform `cBer` (coral pink `#FF6B8C`-ish in dark,
  deep crimson in light), set in `gl/engine.js` PALETTE (`ber`) and used for tags 5 and 6.x in `gl/shaders.js`.
- **Repel shape.** Replaced the "camera ray" cone (circle on screen, but its radius grew with depth: bigger on the near side
  of the globe than at its edge) with a real sphere: distance in 3D, world space, from the cursor point (`uMouseW`: the z=0
  plane, or the front surface of the globe/planet when the cursor is over one), radial push in 3D, converted back to the
  group's space with the rotation transpose. Radius = `uRad` (about 15% of the smaller screen side).
  Checked in Chrome: hero letters (round clearing), globe limb (small notch), helix earlier (round clearing).

---

# Four fixes: globe caption, forecast labels, experience outlines, role order

1. **Globe caption vs dock.** `placeOverlays` (gl/engine.js) now measures the caption after its text is set and keeps it clear
   of the dock: it slides to the right of the dock when there is room, otherwise lifts above it. Verified: caption
   1067-1234 x 635-675 vs dock 490-1056 x 638-686 (no overlap) with the clock text showing.
2. **Forecast labels.** "history" / "forecast" in the NIFTY demo moved below the baseline (y 147), clear of the candles.
3. **Experience glow.** Removed the moving repel bubble (`uFoc`, `WORK_C`). Each employer now has a thin outline (2px, tags
   20-23) drawn on top of its thick border: the ship, tall, middle and small building. The selected role's outline
   lights up (`uPart`: previous, current, crossfade, scene weight) with a cross-fade when the role changes.
4. **Order.** Role tabs are newest first (Maritime 2026 ... Consulting 2021); the first tab is selected on entry and the
   tour runs newest to oldest. Tab k lights outline k (ship, tall, middle, small).
Tests updated (Experience order); 152 pass.
