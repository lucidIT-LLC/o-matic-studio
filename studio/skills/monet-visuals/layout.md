# Layout Discipline

<!-- version: 1.0.0 | author: James Walker | package: O-Matic WordPress Factory -->

Checkable layout rules. Load this for any page, deck, dashboard or multi-section
artifact.

These exist because "it has enough breathing room" is not a standard — nothing can
fail it. Every rule below can be **checked and failed**. If a rule cannot be
checked, it does not belong here.

---

## 1. Siblings are identical. Hierarchy is between levels, never within one.

Three cards in a row are **one level**. They get one heading size, one body size,
one spacing, one treatment. Varying the type size between siblings does not create
hierarchy — it reads as a font sample page, and it is the single most common way a
competent layout looks amateur.

If one sibling genuinely deserves emphasis, change its **ground** — background,
border, a mark — never its type size.

**Check:** list every heading in a sibling group. More than one size is a failure.

---

## 2. Use the scale. Never an in-between size.

Pick five steps and use only those. Ratio between steps ~1.25–1.33. A size that is
not on the scale is a mistake, not a judgement call.

**Check:** every font size in the artifact appears in the scale.

---

## 3. Measure: 45–75 characters per line

The most common readability failure is body text set too wide. Not "it looks a bit
wide" — measurably wrong.

- 45–75 characters is the comfortable range. ~65 is the target.
- At 17px that is roughly **54rem**. Not the full width of the container.
- Headings can run wider. Body cannot.

**Check:** count characters on a full line of body text. Over 75 is a failure,
regardless of how much room there is.

---

## 4. Spacing is proportional, not constant

The reader parses structure from *relative* gaps. If every gap is the same size,
there is no structure to see.

```
space within a group   <   space between groups   <   space between sections
```

Roughly double at each level. Related things must sit visibly closer to each other
than to anything else — this is the whole mechanism of grouping.

**Check:** measure three gaps at three levels. If any two are equal, the levels
have collapsed.

---

## 5. "Too much whitespace" almost always means undifferentiated whitespace

When someone says a layout is too empty, the instinct is to shrink every gap. That
is usually wrong and makes it worse.

Empty-feeling layouts are normally layouts where **all the gaps are the same**, so
the eye finds no grouping and reads the whole thing as scattered. The fix is to
**vary** the spacing — tighten within groups, keep the space between them — not to
reduce it uniformly.

Only after the levels are distinct should you judge the absolute amount.

---

## 6. A page is a sequence, not a stack

Compose the page, not just each section. The most common page-level failure is a
**metronome**: every section the same ground, the same density, the same block
count, the same height. Each section is fine. The page is boring.

Vary deliberately along at least one axis per section change:
- ground (light / surface / dark)
- containment (contained / full-bleed)
- form (prose / grid / image / quote / table)
- density (open / tight)

**Check:** list the sections in order with their ground and form. Three consecutive
identical rows is a failure. If a page is *about* speed, urgency or change and its
section list is uniform, the layout is contradicting the copy.

---

## 7. Value distribution — squint at the whole page

Dark and heavy elements accumulate wherever they happen to land. Check the page as
a single image, squinted, with the text unreadable.

- Heavy mass should not pool at one end. "Too dark at the bottom" is this failure.
- The eye should be able to travel the page. A solid dark block at the end reads as
  a wall and stops it.

**Check:** view the full-page render at thumbnail size. Where is the weight?

---

## 8. Optical beats mathematical

Equal numbers do not produce equal-looking results.

- Large type needs **negative** letter-spacing; small caps need positive.
- A circle must overshoot a square slightly to look the same size.
- Text centred in a box with a descender-heavy line sits low; trust the eye.
- Optical alignment: align the *glyph edge*, not the bounding box.

---

## 9. Density matches the job

- **Operational** (dashboard, table, tool): dense, scannable, restrained. Whitespace
  here is wasted screen.
- **Persuasive** (landing page, hero, deck): open, one idea at a time.

Applying the wrong one is why tools feel patronising and marketing pages feel like
spreadsheets.

---

## 10. Verify against the render, not the intent

You cannot review a layout you have not looked at. Design intent and rendered
output diverge constantly — inherited CSS, font fallback, real content length.

- Render it. Look at it. At **three widths**: mobile, laptop, and **wide**.
- Wide is the one that gets skipped, and it is where centring and max-width bugs
  live. A layout can be correct at 1280px and broken at 1600px.
- Check with **real content**, not placeholder. Real headlines are longer than the
  ones you imagined and they wrap.
- Where layout is suspect, **measure**: bounding rects of an element *and its
  siblings*. A misalignment is a difference in `left`, invisible without comparison.

---

## 11. The one-glance test

Before shipping: look at it for one second, then look away.

**What did you see first?** Is that the most important thing on the page? If not,
the hierarchy is wrong, no matter how well-made the individual parts are.

This catches what checklists miss.

---

## Anti-patterns

These read as "generated" rather than designed:

- A uniform three-card grid used as the default answer to every section
- Centred hero layout on an operational tool
- Everything set to the container max-width, so nothing has a shape
- Decorative gradients, blobs and glows carrying no information
- Over-rounded cards everywhere
- Every section the same height
- Type size used to fake hierarchy between siblings (see rule 1)
- A chart that flatters bad data — a defect, however handsome

---

## Pre-ship layout checklist

- [ ] Sibling groups share one type size and one treatment
- [ ] Every size is on the scale
- [ ] Body measure is 45–75 characters
- [ ] Three spacing levels are visibly different
- [ ] Section list varies in ground or form — no three identical in a row
- [ ] Squint test: weight is distributed, not pooled
- [ ] Rendered and reviewed at mobile, laptop **and wide**
- [ ] Real content, not placeholder
- [ ] One-glance test: the first thing seen is the most important thing
