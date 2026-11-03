# Andy — what Andy can and cannot drive

Reference file for this skill. SKILL.md is the role guide and says when to read this file.

## 10. What Andy Can And Cannot Drive — say this plainly

**Pixelmator Pro Creator Studio is the DESIGNATED photo backend. There is no
execution path to it yet. Both halves of that sentence are load-bearing.**

The recorded decision (operator, 2026-09-12) made Pixelmator Pro Creator Studio the
photo backend for the proving-ground lane, in his own words: *"let's wrap up
using creator studio this helps me a ton. i really was only using affinity
because we had it, creator studio - pitch affinity for photos, we use that for
lineart."* It narrows the earlier record, which had held Pixelmator merely *qualifies* while
Affinity stayed the reference backend for color-cast grading.

**Why it won, and it is one measured property, not a preference:** the probe
loop is **reversible** there. Measured by the operator on his own open document
IMG_2802 — measure → auto white balance → re-measure → undo restored the
neutral point 42148,42919,42148 **byte-identically**, and the red point
54998,12593,9509 likewise, layer count 2 → 2 → 2. On Affinity a canvas resize
is **one-way**: `doc.undo()` consumes the entry and does not restore the size.
A one-way undo means every probe is a commitment on the operator's real file.

**And the connector does not exist.** MEASURED: the factory's connector registry holds 26
rows and **zero Pixelmator row** — no tool surface, no `tool_prefix`, no probe
status. So the honest statement, and the one to give the operator if he asks,
is: *Pixelmator Pro is the backend this factory has chosen, and nothing has
been built to reach it.* **That is a gap with an owner, not a refusal.** Do not
say Pixelmator is rejected; the earlier record's technical qualification stands and the earlier record
promoted it. Do not say you can drive it either.

**Affinity is NARROWED, not removed — and it is still the only surface you can
actually drive.** Under the earlier record Affinity keeps its connector (in the factory's connector registry,
active, probe_status connected), its script library, its brand-asset lane and
its vector and print work, and its **designated** scope is now **line art**. It
lost the photo lane on paper before anything replaced it in practice. So §9
remains your working instrument today because it is the only one that exists —
say that it is the legacy photo path pending the Pixelmator connector, and do
not present it as the factory's chosen photo backend. Under the recorded decision
retirement is a state, never a delete; nothing about Affinity is removed here.

**One authority boundary, flagged and NOT assumed.** The earlier record granted execute-and-
verify authority **on the Affinity connector specifically**. That grant does
**not** extend to Pixelmator by inference from a backend choice. It needs the
operator's word, and the earlier record reserves that class of decision to him.

**The Lab question is open and must not be quietly dropped.** The earlier record's stated
upgrade was a Lab-sampling instrument built on Affinity's `PixelReaderLABA16`,
which literally exposes the green-magenta and blue-yellow axes. Pixelmator's
`pick color` is RGBA only and forces a host-side Lab conversion with an assumed
color space and an error term. Either that instrument ports with a measured
error term, or color-cast grading stays on Affinity and the split is by
**operation** rather than by file type. Nobody has decided, and nobody has taken
the measurement that would inform it.

**One thing measured about Pixelmator that any future connector must not
trust:** `pick color` returns **16 bits per channel, 0–65535**, not the 8-bit
its own sdef claims (the earlier record, live probe: flat RGB 128 grey read back as 32896).
Probe the bit depth at connect time rather than believing the dictionary.

**Apple Photos: excluded outright as an editing backend** (the earlier record, measured from
Apple's own shipped `Photos.sdef` and App Intents catalog, and **unaffected by
The earlier record**). There is no adjustment property, no filter command, no render command,
no pixel accessor — the vocabulary does not contain the concept of an edit. Its
single editing intent's own description reads "Opens the specified photo to
Edit." Photos is an asset **source and sink** only.

**Lightroom, Capture One, Luminar, Photomator:** coaching from a screenshot.
Exact recipe, named panel, exact number — the photographer applies it.

**Where this is going, for context only:** the recorded decision makes **Core Image**
the destination engine, with an app backend as the proving ground; the earlier record changes
**which** app that is and does not change what the proving ground is for. That
is an architectural direction inside an unopened product, not a capability you
have. **Do not write or speak aspirational capability.** A skill that reports
compliance it never had is the defect class this factory has been bitten by
repeatedly.

**And one thing the script cannot do to its own mess:** `doc.close()` throws
`NOT_IMPLEMENTED`. A script cannot close a document it created. If you ever
create a scratch document, **tell the operator which one to close.**
***
