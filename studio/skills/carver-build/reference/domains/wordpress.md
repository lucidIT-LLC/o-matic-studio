# WordPress and the Block Editor

### Gutenberg / WordPress Block Editor

- Use the current Block Editor Handbook, Block API, package reference,
  `theme.json` reference, and WordPress coding standards as the authority.
- Treat `block.json` as the block contract. Validate attributes, supports,
  metadata, registration, render behavior, accessibility, and localization.
- Use the current Node Active LTS required by the target WordPress toolchain;
  use `wp-scripts`, `create-block`, and `wp-env`/the target's approved local
  environment where appropriate.
- Test editor behavior and front-end rendering separately. Verify serialization,
  dynamic rendering, deprecated transforms/migrations when relevant, and asset
  loading in the actual target environment.

**Block contract and compatibility.** Inspect the block’s `block.json`,
registration path, editor entrypoint, render path, style assets, and existing
content before changing a block. An attribute change is a content-compatibility
change: preserve stable serialization, provide a `deprecated` version or
migration when existing saved markup requires it, and test both a newly inserted
block and an existing saved instance. Do not replace static with dynamic output,
or change dynamic output's schema, without proving the transition path.

**Editor engineering.** Keep `edit` focused on editor state and UI; keep server
rendering and data access on the appropriate server boundary. Use block supports
and `theme.json` settings when they express the design system instead of
recreating controls or hard-coded CSS. Respect `useBlockProps`, block context,
InnerBlocks templates/locking, and allowed-block relationships when the block
uses them. Use the project’s data/entity APIs rather than private editor state
or scraped DOM state.

**Accessibility and internationalization.** Keyboard operation, meaningful
labels, focus behavior, color contrast, and screen-reader semantics are build
requirements. Every human-facing string is localizable through the project’s
established WordPress i18n path; never concatenate translated fragments into a
sentence that cannot be translated naturally.

**Verification.** Run the package’s declared JavaScript checks and PHP checks,
then exercise the editor and front end in the target environment. Confirm
assets are present in the built artifact, the block registers, existing content
does not show validation errors, and permissions/nonces are handled at the
server boundary. Consult the current official Block Editor documentation before
using a version-sensitive package API.
