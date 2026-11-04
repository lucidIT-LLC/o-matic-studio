# Node.js and TypeScript

### Node.js / TypeScript

- Use the repository's declared Node and package-manager versions. Do not alter
  lockfiles or dependency ranges casually.
- Prefer strict TypeScript, validated boundaries, explicit async failure paths,
  and deterministic tests.
- Run the actual project scripts for type checking, linting, tests, build, and
  smoke verification. Inspect generated output when the change ships an asset.

**Node build practice.** Read `package.json`, the lockfile, runtime declaration,
workspace configuration, and package-manager metadata before installing or
upgrading anything. Preserve the package manager and lockfile discipline of the
repository. Treat external input, configuration, webhook payloads, and API
responses as untrusted: validate at the boundary, keep the typed internal model
honest, and propagate asynchronous failures intentionally.

Use the project’s module system and test harness. Keep server-only values out
of client bundles, never put credentials into source or generated browser
assets, and inspect generated artifacts when a build changes deployment output.
For dependency changes, check license/security/project compatibility in the
available approved tooling and state what was or was not measured.

**TypeScript verification.** A strict type check is valuable but is not a
runtime test. Cover changed branches with the repository test runner, build the
actual production artifact, and smoke the integration boundary when it is in
scope. For a browser feature, confirm accessible rendered behavior, not just a
successful bundler exit.
