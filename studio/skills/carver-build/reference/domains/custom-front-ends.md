# Custom Front-End Engineering

Treat the existing repository and deployed product as the source of truth. Read its package scripts, framework/runtime versions, design tokens, route structure, data contracts, and test setup before selecting an implementation pattern. Consult current official framework and browser-platform documentation for version-sensitive APIs.

## Scope and baseline

- Translate each approved requirement into a user-visible behavior and a check.
- Reproduce the current behavior at the relevant route, state, and viewport. Record screenshots or measurements when the host supports it.
- Identify loading, empty, error, permission-denied, and success states, not only the happy path.
- Confirm which decisions are fixed by the brief and which remain product or visual choices for the operator or Monet.

## Implementation

- Follow the repository's component, styling, routing, state, and data-fetching conventions unless there is evidence they cause the defect.
- Keep state ownership explicit. Avoid duplicating server state or inventing fallback content that can mislead users.
- Keep semantic HTML, focus order, labels, headings, landmarks, keyboard operation, and accessible status/error announcements intact.
- Validate user-controlled values at the boundary; encode output in the correct context; do not expose secrets in browser bundles or logs.
- Respect responsive layout and user preferences including zoom, reduced motion, and contrast. Prevent horizontal overflow and preserve useful behavior on narrow screens.
- Prefer small, reversible changes. Do not widen the visual or product scope without saying so.

## Verification

Run the repository-declared lint, type, unit, build, and integration checks relevant to the change. Inspect the actual output; a command that did not run or a skipped suite is not a pass.

Where a browser surface is available:

- Exercise the affected route at representative desktop and narrow/mobile widths.
- Test keyboard-only navigation, visible focus, control names, form validation, and the interaction's complete path.
- Inspect browser console errors, failed requests, and unexpected redirects.
- Compare the rendered result to the approved behavior and existing design system; ask Monet for visual-system review when it is material.
- Check a production build or staging artifact when development mode differs materially.

When a browser or device check is not available, name the exact gap. Do not describe a source-level inspection as a rendered-browser verification.
