# Elementor Engineering

Use the installed Elementor and WordPress versions, project conventions, and current official documentation as the authority. Confirm the actual editor mode, theme, active child theme, plugins, templates, and target page before changing anything.

## Before editing

- Identify whether the behavior belongs to a page, global widget, Theme Builder template, site setting, custom code area, or plugin. Check display conditions and template precedence.
- Record a baseline for the exact URL and viewport sizes involved. Preserve a restorable copy or work in the approved staging/editor revision.
- Prefer Elementor controls, global styles, reusable templates, and documented extension points when they meet the requirement. Use custom CSS/JS/PHP only where the project supports it, and keep code in the correct child theme or plugin rather than editing vendor files.
- Check responsive overrides at desktop, tablet, and mobile breakpoints. Elementor values can be independently overridden; inspect the active device state before changing them.

## Build and compatibility

- Keep content structure, design tokens, templates, and behavior consistent with existing site conventions.
- Verify theme/header/footer interactions, responsive visibility, container nesting, dynamic tags, query loops, forms, popups, and display conditions where relevant.
- For custom code, validate escaping, sanitization, capability checks, nonces, enqueue/dependency order, and the WordPress lifecycle as applicable.
- Avoid broad selectors that leak into unrelated Elementor pages. Scope styles to a stable widget/template class and check specificity against generated CSS.
- Do not edit Elementor, WordPress core, or third-party plugin files directly.

## Verification

- Verify the editor preview and the public rendered page separately; editor canvas appearance alone does not prove the visitor-facing result.
- Exercise the actual interaction: keyboard and pointer navigation, forms and validation, menus, popup open/close, dynamic content, and links as applicable.
- Inspect desktop/tablet/mobile layouts, zoom/reflow, focus visibility, labels and accessible names, color contrast, and reduced-motion behavior when animation exists.
- Check browser console and failed network requests. Verify assets load and avoid layout shifts or hidden overflow.
- If browser inspection or staging access is unavailable, state that limitation and report only the checks actually performed.
- Read the changed page/template back after saving and confirm the intended object and display conditions were changed.
