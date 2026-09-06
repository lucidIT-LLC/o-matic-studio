#!/usr/bin/env node
// sync-copilot-payload.mjs — keep adapters/copilot/.github/omatic/ identical to
// the canonical Studio contracts. --check exits 1 if any vendored copy drifted.
//
// WHY THIS EXISTS. INSTALL.md tells the operator to copy
// `adapters/copilot/.github/` into a DIFFERENT workspace. Once copied, no
// relative path back into this pack resolves — under any correction. Studio's
// single Copilot agent file shipped `../../../../contracts/STUDIO-RUNTIME-CONTRACT.md`
// for exactly that reason, and it resolved nowhere: not in the pack, where it
// lands on `adapters/contracts/`, and not in the target workspace, where the
// pack is absent entirely. The old INSTALL.md instruction to "keep Studio
// checked out alongside it" was the workaround for a defect, not a design.
//
// The fix is the one agency 1.4.0 shipped: make `.github/` self-contained. The
// contracts it loads travel with it under `.github/omatic/`, referenced as
// `../omatic/<file>` — a path that resolves identically inside this pack and
// inside the target workspace. Vendored copies drift, so they are generated,
// not hand-written, and this script is the control.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pack = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(pack, "adapters/copilot/.github/omatic");
const check = process.argv.includes("--check");

// [source, vendored name, rewrites applied to the vendored copy]
const FILES = [
  ["adapters/ROLE-CORE.md", "ROLE-CORE.md", [
    ["`../contracts/STUDIO-RUNTIME-CONTRACT.md`", "`./STUDIO-RUNTIME-CONTRACT.md`"],
    ["`../evals/studio-role-conformance.yaml`", "`studio/evals/studio-role-conformance.yaml` in the Studio pack"],
  ]],
  ["contracts/STUDIO-RUNTIME-CONTRACT.md", "STUDIO-RUNTIME-CONTRACT.md", [
    ["`../skills/`", "the canonical Studio skills"],
    ["`../adapters/ROLE-CORE.md`", "`./ROLE-CORE.md`"],
    ["`../evals/studio-role-conformance.yaml`", "`studio/evals/studio-role-conformance.yaml` in the Studio pack"],
    ["`../migrations/`", "the Studio pack's `migrations/` directory"],
  ]],
];

const BANNER = (src) =>
  `<!-- GENERATED COPY — do not edit. Source: studio/${src}\n` +
  `     Regenerate with: node studio/scripts/sync-copilot-payload.mjs\n` +
  `     This copy exists so adapters/copilot/.github/ stays self-contained when\n` +
  `     it is copied into another workspace. -->\n\n`;

mkdirSync(dest, { recursive: true });
let stale = 0, wrote = 0;
for (const [src, name, rewrites] of FILES) {
  let body = readFileSync(join(pack, src), "utf8");
  for (const [from, to] of rewrites) {
    if (!body.includes(from)) {
      console.error(`SOURCE CHANGED: ${src} no longer contains ${from}`);
      process.exit(2);
    }
    body = body.split(from).join(to);
  }
  const next = BANNER(src) + body;
  const target = join(dest, name);
  const cur = existsSync(target) ? readFileSync(target, "utf8") : null;
  if (cur === next) { console.log(`ok:    ${name}`); continue; }
  stale++;
  if (check) console.log(`STALE: ${name}`);
  else { writeFileSync(target, next); wrote++; console.log(`sync:  ${name}`); }
}
if (check && stale) { console.log(`\n${stale} vendored copy(ies) stale — run without --check`); process.exit(1); }
console.log(check ? "\ncopilot payload in sync" : `\ndone — ${wrote} updated`);
