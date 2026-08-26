# Block Theme Reference

<!-- version: 1.0.0 | author: James Walker | package: O-Matic WordPress Factory -->

Working reference for building and repairing WordPress block themes (Full Site
Editing). Load this when the surface is a block theme rather than a page builder.

Every rule below cost a real debugging session. The ones marked **SILENT** produce
no error and look correct under casual testing, which is what makes them expensive.

---

## 1. The theme will not load your stylesheet

**SILENT.** Block themes do **not** enqueue `style.css` on the front end. Classic
themes do. `add_editor_style()` loads it in the *editor only*.

The failure mode: every registered block style renders perfectly in the editor and
is completely inert on the front end. You will change the CSS repeatedly, see no
effect, and conclude the selector is wrong. The selector is fine.

```php
add_action( 'wp_enqueue_scripts', static function () {
    wp_enqueue_style( 'my-theme', get_stylesheet_uri(), array(),
        wp_get_theme()->get( 'Version' ) );
} );
```

Check this **first** whenever front-end CSS appears to do nothing.

---

## 2. Constrained layout, and the three ways it traps content

WordPress constrained layout emits, roughly:

```css
.is-layout-constrained > :where(:not(.alignleft):not(.alignright):not(.alignfull)) {
  max-width: var(--wp--style--global--content-size);
  margin-left: auto !important;
  margin-right: auto !important;
}
```

Three consequences, all of which present as "the layout is broken" with no error.

### 2a. `wp:post-content` constrains the whole page
If the template has a bare `<!-- wp:post-content /-->` inside a constrained
`main`, every page's content is capped at `contentSize` no matter what the page's
own sections declare. Symptom: "the page doesn't fill the screen."

```html
<!-- wp:post-content {"align":"full","layout":{"type":"constrained"}} /-->
```

Diagnose by measuring: `main` at viewport width but `.entry-content` narrower with
large symmetric margins.

### 2b. `alignwide` inside a nested constrained group resolves to contentSize
Not `wideSize`. If a section needs to be wide, give that section its own
`contentSize` in its layout attributes rather than relying on `alignwide`.

### 2c. Auto margins compute to 0 on anything that is not block-level
**SILENT, and the worst of the three.** `margin-left: auto` does nothing on an
`inline-block`, `inline-flex`, or floated box. So a block style like:

```css
.is-style-underscored { display: inline-block; }   /* WRONG */
```

...causes that element to stay pinned at the left padding edge while every
block-level sibling centres. The offset is exactly `(container − contentSize) / 2`.

**It is invisible below the content size.** At 1280px with an 84rem (1344px)
contentSize there is no centring to break, so the bug does not appear. It only
shows on wide monitors. **Always test above your wideSize.**

If you need a box to hug its content, use `text-decoration`, a pseudo-element, or
a nested wrapper — never `display: inline-block` on a direct child of a
constrained layout.

---

## 3. Style variations are per-document; bands are not

`/styles/*.json` variations (a "Reverse"/dark variation, say) apply to the **whole
document**. A single dark band or dark card inside an otherwise light page still
has the **light** palette in scope.

**SILENT.** The band looks intentional. The text inside it can be at 1.9:1 and
nobody notices until someone tries to read it.

Check contrast for the *ground the text actually sits on*, not for the variation
you think is active. Correct it by scoping to the ground in the stylesheet:

```css
.has-ink-background-color .has-muted-color { color: #9A9A9A; }  /* 7.0:1 on ink */
.has-ink-background-color .has-accent-color { color: #FF4B47; } /* 5.26:1 on ink */
```

Scope it once in the theme, not hand-coded into each pattern — otherwise the next
dark band someone adds is broken again.

---

## 4. WordPress strips inline styles from `img` on save

`<img style="width:100%">` written into block markup **will not survive the save**.
kses removes it, and you get no warning.

This bites on SVG diagrams: an SVG with intrinsic `width`/`height` renders at its
natural size and sits narrower than its column, and the obvious inline-style fix
silently does nothing.

Register a block style instead — a class survives sanitisation:

```php
register_block_style( 'core/image', array( 'name' => 'diagram', 'label' => 'Diagram' ) );
```
```css
.wp-block-image.is-style-diagram img { width: 100%; height: auto; }
```

Confirm by reading back `img.getAttribute('style')` on the live page. `null` means
it was stripped.

---

## 5. theme.json

- Use `"version": 3` and the `$schema` URL. **Validate before shipping.**
- `settings.viewport`, `styles.@tablet`, `styles.@mobile` are **not** in the
  published schema and fail validation. Write those as media queries in the
  stylesheet until the schema catches up.
- `settings.color.defaultPalette: false` + `custom: false` locks the palette to
  the brand. This is usually what a client theme wants.
- Self-host fonts via `fontFace` → `file:./assets/fonts/*.woff2`. Hotlinking
  Google Fonts hands the visitor's IP to Google — ruled a GDPR breach in Germany
  in 2022. Ship the OFL text alongside the font.
- Pseudo-states (`:hover`, `:focus`) belong in theme.json under `elements`.

### Block styles vs section styles vs style variations

Three different things, routinely confused:

| Thing | Where | Scope |
|---|---|---|
| **Block style** | `register_block_style()` + CSS | one block, opt-in via `is-style-*` |
| **Section style** | `/styles/x.json` with `slug` + `blockTypes[]` | listed block types, opt-in |
| **Style variation** | `/styles/x.json`, no `blockTypes` | the whole document |

`register_block_style()` requires only `name` and `label`. The CSS can live in the
enqueued stylesheet — you do not need `inline_style`.

---

## 6. Migrating off a page builder

Builder residue outlives the plugin and actively blocks block work.

**`_wp_page_template: elementor_canvas`** with Elementor deactivated makes *every*
update to that post fail. The error is `Invalid page template` — it names no
field, no post, and no plugin, so it reads like a bug in your own code.

**`_elementor_data`** persists after deactivation. Reactivating the plugin
re-renders the old page *over* your block content.

Cleanup per post:

```
_wp_page_template   -> "default"
_elementor_data     -> delete
_elementor_edit_mode-> delete
```

Also expect scraped page chrome baked into `post_content` — duplicate site header,
duplicate nav, hardcoded font stacks, an old logo, a footer. Strip all of it: the
template supplies chrome, the post supplies only the article.

**Shortcodes for deactivated plugins render as literal text** on the page. Grep
content for `[shortcode` after any plugin removal.

---

## 7. Editing pages programmatically

There is no partial-block-update ability. Updates replace the whole `post_content`.
Retyping large markup by hand invites transcription errors.

Workflow: **pull to a local file → edit with a script that asserts on each match →
verify block nesting → push.**

Assert that every replacement matched exactly once. A silent zero-match is how you
ship a page that was never actually edited.

Verify nesting with a stack parser before pushing — treat `<!-- wp:x /-->` (void)
separately from `<!-- wp:x -->` / `<!-- /wp:x -->` pairs, or the counts lie.

---

## 8. Verification discipline

**Do not reason about layout from markup.** Markup that is structurally perfect
produces broken layout, because the breakage lives in inherited CSS.

Measure the live DOM:
- `getBoundingClientRect()` on the suspect element **and its siblings** — a
  misalignment is a difference in `left`, and you cannot see it without the
  comparison.
- Computed `display`, `margin-left/right`, `max-width` **up the ancestor chain**.
- `img.naturalWidth` and `complete` to separate "asset missing" from "asset
  mis-sized".
- Read back attributes after save to catch sanitisation.

**Test above the wideSize**, not just at laptop width. Constrained-layout bugs are
invisible at narrow viewports.

---

## 9. Abilities API — never guess parameter names

Call `get-ability-info` on the ability **before** calling it. The names are not
guessable and a wrong one fails in a way that looks like a permissions problem:

- `page_id`, not `id`
- `option_name`, not `key`
- `meta_key` / `meta_value`, not `key` / `value`

A theme can register its own read-only abilities so an agent asks the site for its
rules rather than inferring them from rendered CSS. Guard with
`function_exists( 'wp_register_ability' )` so the theme still runs where the API
is absent.

---

## 10. Forms without a page builder

Dropping a builder leaves forms homeless. Jetpack Forms is block-native. Verified
block names:

```
jetpack/contact-form
jetpack/field-name      jetpack/field-email    jetpack/field-text
jetpack/field-select    jetpack/field-url      jetpack/field-textarea
jetpack/button
```

Verify block names empirically — build one in the editor and read the markup back.
Guessing produces an "invalid block" notice on a live page.

---

## Pre-ship checklist

- [ ] `style.css` enqueued on `wp_enqueue_scripts`
- [ ] theme.json validates against the published schema, 0 errors
- [ ] `wp:post-content` is `align:full` in every page template
- [ ] No `display:inline-block` on a direct child of a constrained layout
- [ ] Rendered **above** wideSize, not only at 1280px
- [ ] Contrast checked on each dark ground, not on the variation
- [ ] Inline styles read back after save to confirm they survived
- [ ] Every template renders (archive templates are the ones people forget —
      check they are not a byte-copy of another template)
- [ ] No leftover builder meta or shortcodes on migrated posts
- [ ] Block nesting verified on every edited page
