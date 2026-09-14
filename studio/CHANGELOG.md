# o-MATIC Studio — Changelog

## 1.10.1 — 2026-09-13

Packaging only. The Spec 12 origin reference landed upstream mid-rename and was
relocated from `skills/pixel-photo-coach/reference/` to
`skills/andy-photo-coach/reference/`. Version bumped because the installed cache
is semver-gated: 1.10.0 had already materialized at the earlier commit and a
same-version update silently no-ops.

## 1.10.0 — 2026-09-13

**Pixel is gone. The coach is Andy.**

Decision #538, operator ruling, verbatim: *"fix Andy / Pixel. Pixel is gone.
Fix andy."* #511 had renamed the roster record only and expressly held every
user-facing surface — the skill file, the plugin path, the published skill
name, the marketplace entry and the trigger phrases — for one bundled release;
#502 held the rename generally. Both holds are released.

The database had already finished moving. `factory.fn_rename_verdict('pixel')`
returns PASS with 0 blocking rows and 5 history columns preserved, and
`persona.callsign`, `persona_voice_contract.opening_convention`,
`agent_identity`, `agent_state`, `agent_runtime_contracts` and
`factory_agreements` all read andy. Every remaining Pixel was file-side. This
release is that half.

Renamed: `skills/pixel-photo-coach/` → `skills/andy-photo-coach/` and its
published skill name; `adapters/claude/agents/pixel.md` → `andy.md`;
`adapters/copilot/.github/agents/pixel.agent.md` → `andy.agent.md`; both plugin
manifests, both marketplace manifests, `agent-pack.json`, the runtime contract,
ROLE-CORE, the ChatGPT instructions and the role-conformance eval. The skill's
opening convention is now **"Andy:"**, matching `persona_voice_contract`, and
he/him throughout per #502.

**The logic did not move.** The 60-point six-dimension rubric and its 50–60 /
40–49 / 30–39 / below-30 bands, the Edit Recipe Format, Darkroom Notes,
Over-Edit Alert, Legal/IP Flags, IPTC Stock Mode, §4 ask-the-goal and §5
calibrate-don't-sweep diff to three lines against 2.5.0, all three of them the
name or a pronoun. Not one threshold was touched. History was not rewritten:
the changelog rows below, the §14 rows inside the skill, and the two applied
migrations keep the name they shipped under (#421 — retirement is a state, not
a delete).

**Two stale claims corrected in the same pass, both of which were actively
misinstructing sessions.**

§8.5 was pinned to `walk contract --expect 0.2.0` against a Walk that is now
**0.5.7** — so by the section's own rule the check was exiting 1 and telling
every session *"Walk is NEWER… do not proceed on it as written"* about its own
contents. That is the check working, and task #729 is it being heard. Re-pinned
to 0.5.7 with the capability table re-measured live from `walk_contract`: Walk
now ships as its own plugin with six `walk_*` MCP tools (#534), the video half
#495 measured is shipped, and `coach.stills` is named explicitly because **Walk
cannot judge a photograph** — four of the coach's seven selectors are undefined
for a still, and a hand-built still was banded NOT WORTH THE TROUBLE by a rule
reading a fabricated zero. Judging the photograph is the skill's own rubric.

§10 said *"Pixelmator Pro: NO… There is zero connector"* and *"Affinity is
Pixel's working surface today."* Decision #525 reverses the first half:
Pixelmator Pro Creator Studio is the **designated** photo backend, chosen for a
**reversible** probe loop the operator measured himself (undo restored the
neutral point 42148,42919,42148 byte-identically; Affinity's canvas undo is
one-way). MEASURED: `factory.mcp_registry` holds 26 rows and **zero Pixelmator
row**, so the honest statement is a designated backend with **no execution path
built** — a gap with an owner, not a refusal. Affinity is **narrowed to line
art**, keeps its connector, and remains the only surface that can actually be
driven today. #486's execute-and-verify grant is Affinity-specific and is not
extended to Pixelmator by inference (#413).


## 1.5.0 — 2026-09-12

**Pixel asks where the photograph is going before she grades it, and she
calibrates instead of guessing.**

Decision #491 (operator ruling, session #228) came out of a long live grading
run across four photographs. The work was good; the method was expensive.
Verbatim: *"she is jumping tools and trying things... the playing around thing
things costs tokens... i think there needs to be more of a plan, and i think
that starts with Pixel asking for clarification of where you want to go with the
photo, give the operator 3 options and a something else."*

### 1. The goal-first interview — the headline, and it is near the front

`skills/pixel-photo-coach/SKILL.md` gains **§4**, ahead of the reference
material. The sequence is now **look → measure → ASK → plan → execute →
re-measure**. Pixel opens the photograph, runs the instrument, and then puts
**three routes drawn from what she measured in that frame** in front of the
operator, plus a fourth "something else" — followed by intended use, how hard to
push, what must be preserved, and crop appetite.

**The routes must cite the measurement.** A fixed menu is theatre: offering
"repair" on a frame with no damage tells the operator you did not look. Two or
more questions go in the **question card** per Policy #336 clause 2 (Commons
KB-0462) — never an enumerated menu written into chat, which is the question form
implemented badly in the place it was meant to replace.

The section carries a **worked example on the storm frame's real numbers** so the
pattern is unmistakable, and it carries the justification: that frame was graded
for editorial and the operator afterwards asked why the houses were not simply
cropped out for a commercial license. Every minute of that grade optimized for a
destination nobody had chosen. Legal and IP flags moved into the interview for
the same reason — a licensing fork is a question before the first adjustment
layer, not a discovery after it.

### 2. Calibrate, don't sweep

New **§5**. Parameter sweeping is retired as the default method. The replacement
was already proven in the session that produced the ruling: apply **one probe at
a known magnitude**, measure the delta, compute the per-unit response, then
**solve** for the value. Two probes of about four seconds each replace a dozen
guesses, and unlike a swept value a solved one can explain itself.

Measured transfer functions ship as **examples of the method's output, explicitly
not as constants**: `magentaGreen` **109.26** a\* per unit globally on the storm
frame against **72.83** inside a sky mask; White Balance **70.36** b\* per unit;
and per-zone on the waterfall, shadows **-225.5** against midtones **-81.6** —
the same control, the same frame, **2.8× apart**. Probing zones together produced
contaminated derivatives that predicted +2.8 where the real move was +0.64, so
zones are probed one at a time.

Sweeping survives only as an explicit fallback — a write-locked control, a
non-monotonic response, a parameter with no measurable output — and it has to
announce itself when used.

### 3. Intuition, bounded — both halves stated

The operator asked for *"a tiny bit more healthy intuition."* A new block states
what that is and what it is not, because shipping only the first half is a
license to guess. It **is**: propose the likely route from the measurement rather
than asking open-ended; commit to a magnitude from the transfer function rather
than hedging; stop at good rather than hunting perfect. It is **not**: any
relaxation of measure → apply → re-measure, and never permission to assert a
number that was not measured.

### 4. The verified API, carried — and now also shipped as working code

All twelve items from #491's downstream effects are in the reorganized **§9**,
unsoftened: check the source before grading anything; settle reads; address by
`sessionUuid`; `Levels` as the range tool with **gamma inverse — above 1 darkens**
and `outputBlackLevel` the control that stops a stretch from crushing;
`Exposure` / `Contrast` / `ToneStretch` all wrong for a flat image with exactly
how each failed; `shadowsRadius` write-locked and **negative** `highlightsStrength`
recovering; the raster-selection mask recipe; crop with `render_spread` blind to
it; export with **three** arguments and the dark/purple bug narrowed to
`Document.load()`-ed documents only; the 8-bit banding budget;
`AddChildNodesCommandBuilder.create()` not `new`; and `executeCommand()`
returning undefined so the result is read off `target.children`.

**And §9.0 now points at four library instruments rather than asking her to
retype any of it.** Two new scripts join `Photo Measure` and `Photo Compare` in
the Affinity script library:

- **`Photo Grade — Calibrated Adjustment Toolkit`** — the whole verified write
  surface as helpers: `byUuid()`, `settle()`, the read-modify-reassign pattern
  including the two-level nested `values` and `masterParameters` cases,
  `addStack()`, `levels()`, the mask recipe, `crop()`, `exportFile()`,
  `frameBuffer()` with a scale guard, and a Lab calibration gate that blocks
  rather than degrades. `SELFTEST()` returned **12 pass, 0 fail** with no
  document and **15 pass, 0 fail** including the live half.
- **`Photo Calibrate — Transfer Function Probe`** — §5 as runnable code, with a
  zone guard that refuses multi-zone probes, a noise-floor check that refuses to
  solve from a probe too small to mean anything, range clamping that reports
  rather than truncating silently, and a `sweepFallback()` that will not run
  without a written reason. **13 pass, 0 fail** in Node, **11 pass, 0 fail**
  re-run inside the Affinity JS engine.

That is the carried/retrieved split done properly: the judgment stays in the
file where she needs it before deciding anything, the call signatures live as
proven code she loads.

### Two corrections measured while building it

- **A script crop is effectively one-way.** `setSpreadSizeWithAnchor` does
  register an undo entry ("Page Properties Changed") and `doc.undo()` does
  consume it — without restoring the size. Confirmed with a settle read and again
  from a fresh script context. An older SDK hint claims the opposite; both the
  skill and the hint pool now carry the correction, including the correction of
  an intermediate wrong version of this same finding.
- **`doc.close()` throws `NOT_IMPLEMENTED`.** A script cannot close a document it
  created, so a scratch document has to be closed by the operator.

`PixelReaderRGBA8` is upgraded from **untested** to **tested against real
content**; `Colour.createRGBA8(...).laba16` uses the same encoding as the 16-bit
path, neutral at 128.

### Version

**Minor, not patch.** This adds behavior — a new interview gate that changes how
every session opens, a new method that replaces the default one, and a new
reference surface — without removing or breaking anything a host already relies
on. No frontmatter contract, skill name, connector requirement, or compatibility
tier changed. Pack 1.4.0 → 1.5.0 across `plugin.json`, `.codex-plugin` and
`marketplace.json`; skill 2.1.0 → 2.2.0. Sections in the skill were renumbered to
put the interview and calibration ahead of the reference material, and §7's
measured content was extended and reorganized rather than discarded.


## 1.4.0 — 2026-09-11

**Pixel gets an instrument, and a lane that lets her use it.**

Decision #486 (operator ruling, session #227) widened Pixel's lane from
coaching-only to **execute and verify** on Affinity Photo: she measures the live
document, applies the adjustment, renders, and re-measures as proof. Her skill
file taught none of that — it said she coaches and the operator applies, which
was the recorded contract she had already worked past. Decision #489 carries the
measured instrument material from the build session, and this release is that
material written down where she reads it.

### What the skill now teaches, all measured

`skills/pixel-photo-coach/SKILL.md` gains §7, "The Affinity Instrument —
measured, not assumed":

- **The bulk read is the design.** `RasterObject.createCompatibleBuffer(true).buffer`
  returns a real `ArrayBuffer` — 36,578,304 pixels of an 8064×4536 16-bit
  document in **188 ms**, byte-identical to `readPixel`. A single `readPixel` is
  **~4.7 µs**, so a 400-point grid is ~2 ms. Grid sampling (default 160²) is the
  **fallback**. The prior briefing said the opposite and budgeted ~10 ms per
  read; #489 records the correction, and decision #487 is wrong on its Affinity
  half for the same reason.
- **Four silent-failure rules**, each of which returns plausible wrong data
  rather than an error: render `doc.currentSpread`; pass `doc.format` and
  nothing else (a mismatch silently returns a correctly sized all-zero alpha-0
  bitmap); use `createCompatibleBuffer`; never read an adjustment child node's
  `rasterInterface` — it is an M16 **mask** at the right dimensions.
- **Scales as they actually return**, including that `Colour.laba16` neutral is
  **128, not 0**, that `PixelReaderLABA16` a/b are signed with empty reads at
  -32768, and that `PixelReaderRGBA8` is **untested against real content** and is
  labeled as such.
- **Vendor parameter ranges** from `struct_ranges.min.json` — `Exposure` is
  **[-20, 20]**, not [-1, 1] — with a note that the advertised `adjustment_ranges`
  and `filter_ranges` doc topics both return "File not found."
- **Cast interpretation on the near-neutral line**, never the global mean, with
  thresholds, and the note that Colour Balance runs ~4–5× stronger per unit than
  it feels.
- **The sign-disagreement rule, given its own section**, because it is the
  mechanical explanation of the 2026-09-10 overcorrection: measured shadows a\*
  **+5.095** against midtones **-3.995** and highlights **-4.308**, with green
  concentrated in the top of the frame and the bottom already neutral-to-magenta.
  No global move can fix both — it must neutralize one and overshoot the other.
  She now checks for sign disagreement **before** proposing a global correction
  and reaches for masking when it appears.
- **Clipping is always exact, never sampled** — clipped regions cluster, and
  sampling undercounted crushed-black by 25%.
- **The SDK hint pool is data, not authority.** It asserted format 9 linear
  float, 0.7 µs/px and 15–20 s for 5 MP; measured reality is format 1 RGBA16,
  gamma 2.202, 4.7 µs/px, 36.6 MP in 188 ms. It reads like a confident answer
  and is other sessions' generated text.
- **Start at the script library.** The two verified read-only instruments —
  "Photo Measure — Tonal Distribution + Lab Cast Report" and "Photo Compare —
  Region Cast Map + A/B Across Open Documents" — are named so she loads them
  instead of rebuilding the instrument every session. Durability was the whole
  point of saving them.

### What it now refuses to claim

**Pixel cannot drive Pixelmator Pro.** Zero connectors exist; it would need an
MCP nobody has built. Decision #487 measured that it *qualifies* technically and
that is not the same as being reachable. **Apple Photos is excluded outright** as
an editing backend — its scripting vocabulary does not contain the concept of an
edit. Decision #488's Core Image destination is named as architectural direction
inside an unopened product, explicitly **not** as a capability she has. Writing
aspirational capability into a skill file is how a pack reports compliance it
never had.

### Adapters, because a pack must not contradict itself

`adapters/claude/agents/pixel.md` and `adapters/copilot/.github/agents/pixel.agent.md`
both still carried the retired lane — "modify or edit an actual image file" under
*does not*, "coaching only, the operator applies." Shipped alongside the new
skill that is a contract contradiction inside one pack, so both now state the
execute-and-verify lane, the re-measurement obligation, and what she cannot
drive. `agent-pack.json`'s Pixel block is corrected to US English.

### Spelling

British spellings in Pixel's file are corrected, with one deliberate exemption
written into the locale rule: `Colour`, `doc.colourProfile`, `ColourBalanceValues`,
`magentaGreen` and friends are **SDK identifiers**. "Correcting" one produces a
`ReferenceError` or a silent `undefined`. Write *color* in prose; write `Colour`
in the script.

### Verified

`node scripts/verify-pack.mjs .` PASS (9 units, 0 fail, 0 warn) ·
`node studio/scripts/check-paths.mjs` 42 pack + 15 copilot references resolve,
0 broken · `node studio/scripts/sync-copilot-payload.mjs --check` in sync.

**Minor, not patch:** this adds a capability surface — a new execution lane and a
new connector dependency — without removing or breaking anything a host already
relies on.

## 1.3.0 — 2026-09-06

**The Claude adapter gap, and the checks that find it next time.**

Sibling release to agency 1.4.0 (task #586). Same defect class, same solution
shape.

### 1. Studio shipped no Claude adapter at all

`adapters/` held gemini, chatgpt, and copilot. There was no
`adapters/claude/agents/` directory, so Brandy, Carver, Monet, Jo, and Pixel had
no Claude L1/L2 artifact upstream of any host.

The consequence was measured rather than predicted. On 2026-09-06, session #216,
the operator authorized Brandy to work at L2 — "it would be nice if she could
just be there watching and jump in when needed" — and the artifact had to be
hand-written on the host at `~/.claude/agents/brandy.md`, where the next Studio
update erases it. A role deployed by operator ruling was living in a file the
packaging system does not know exists.

This release ships `adapters/claude/agents/` for all five roles. Brandy's is
derived from that hand-written host artifact rather than re-derived from her
skill description, so the governance it carried survives: Objective O4 and the
credibility economics behind it, halt-rule #254 and the four held claims,
decision #371, decision #411's publication boundary, and `brand_messaging` #73
on protecting the operator's own phrasing.

Three things in the host artifact were **not** upstreamed, and each is a defect
worth naming:

- It loaded the contract by an absolute, version-pinned plugin-cache path
  (`.../studio/1.2.2/contracts/...`). That path dies at the next version bump —
  the same failure mode as the mandated startup skill that could not resolve on
  any host and reported compliance it never had. The shipped adapter uses a
  relative path that the check below resolves.
- It stated "L1 AND L2 BOTH DEPLOYED" as file content. Shipped in a pack, that
  sentence grants L2 on every host by file, contradicting the contract clause
  requiring registration, allowlist, rollback, and passing evaluation.
  Deployment state is per host, is recorded in
  `factory.agent_runtime_contracts`, and the adapters now point there.
- It named KR9 and KR10 by key. Both exist and Brandy is a recorded owner on
  both — but a Key Result quoted out of a shipped file is precisely how a
  retired role kept getting work assigned to it (decision #416). The adapter
  points at `factory.key_results` and `public.v_okr_chart` instead.

### 2. Copilot needed a different delivery model, not a corrected path

`adapters/copilot/.github/agents/studio.agent.md` loaded
`../../../../contracts/STUDIO-RUNTIME-CONTRACT.md`. That path is worse than a
typo, because inside the pack it *does* resolve — four levels up from
`adapters/copilot/.github/agents/` is the pack root, and `contracts/` is there.
Any check that only scanned the pack would have passed it. It resolves nowhere
at the only moment that matters: INSTALL.md sends `.github/` into a different
workspace, where no path back into the pack resolves under any correction, and
the instruction to "keep Studio checked out alongside it" was the workaround for
that defect rather than a design.

`.github/` is now self-contained: `.github/omatic/` carries generated contract
copies loaded as `../omatic/<file>`, a path that resolves identically inside the
pack and inside the target workspace. Per-role Copilot agents ship alongside the
roster file. `scripts/sync-copilot-payload.mjs --check` fails on drift.

### 3. Nothing checked, so nothing was caught

`scripts/check-paths.mjs` resolves every relative file reference in the pack and
re-resolves the Copilot payload from a scratch workspace. Proven in both
directions at release: it exits 0 on the shipped tree, and exits 1 with
`BROKEN [copilot-installed] .github/agents/studio.agent.md` when the old
four-level path is restored — from the scratch-workspace scan, which is the only
scan that could ever have caught it.

### 4. Governance propagated from operator rulings this session

Every adapter, and the new `adapters/ROLE-CORE.md` they share, carries:

- **Decision #413** — Objectives, Key Results, KPIs, and key governance tools
  are operator decisions. Roles draft, recommend, measure, and report; they do
  not decide. Measuring is not deciding; changing a threshold, a commitment
  class, or a red condition is.
- **Decision #415** — database mutations are Data's, executed through the
  governed server path. Each role still writes its own records in its own lane.
  The test: does the write change what the database *enforces*, or only what it
  *remembers*? Owning mutations is an execution grant, never an authority grant.
- **The stop-and-route meta-rule** — a contract contradiction is a governance
  defect, not a tie for the role to break at runtime, and never license for the
  thing the stricter statement forbids.

### 5. Contract amended to 1.1.0; runtime state removed from it

`STUDIO-RUNTIME-CONTRACT.md` is `studio-runtime/1.1.0`. It gains the shared
non-negotiables above and a version-authority section: the document owns the
version string, the eval file and the database row follow it.

Its roster table said "L1 ready; L2 not deployed" for every role — on the day
Brandy's L2 was deployed by operator ruling. Rather than replace one stale value
with another, the deployment column is gone and the table points at
`factory.agent_runtime_contracts`. `migrations/2026-09-06-studio-runtime-1.1.0.sql`
carries the new digest for **Data** to apply, per #415, and deliberately touches
neither deployment state nor `evidence_status` — the 2026-09-04 migration set
`l2_deployment_state = 'not_deployed'` unconditionally, and reusing that shape
would have silently un-deployed Brandy.

### 6. Honesty about evidence

**No Studio role has a conformance eval that has ever been run.**
`evals/studio-role-conformance.yaml` exists, which is easy to mistake for
coverage; it is version 1 — five prose assertions, no runner in this pack, and
no mechanism by which any of them can fail. `evidence_status` for all five roles
is and stays `design_verified`. The boundaries in these adapters are designed,
not demonstrated, and every shipped file says so. Rebuilding the suite so it can
fail, the way `core-role-conformance.yaml` was rebuilt in agency 1.4.0, is owed
work.

### 7. Retired-role residue

`skills/carver-build/SKILL.md` still routed evidence scoring to Rimmer, retired
2026-09-04. Corrected to Smith per decision #416. That was the only occurrence in
this pack; the Tim reference in the same sentence was already historical and now
reads as such.

### Also

- Version parity restored. `.claude-plugin` read 1.2.2 and `.codex-plugin` read
  1.2.3 — a silent divergence — and the marketplace entry read 1.0.4, five
  releases behind. All three now read **1.3.0**.
- **Not changed, and reported instead:** `.claude-plugin/marketplace.json` still
  declares `"license": "MIT"` while both plugin manifests declare `BUSL-1.1`.
  That is a licensing claim, not a packaging mechanism, and it is the operator's
  to settle. The same mismatch exists in the agency and firm marketplaces.
