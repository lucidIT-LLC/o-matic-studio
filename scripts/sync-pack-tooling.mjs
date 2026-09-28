#!/usr/bin/env node
// sync-pack-tooling.mjs — one canonical copy of the pack tooling, pushed into
// the sibling pack repositories. --check exits 1 if any copy drifted or is missing.
//
// Smith #1013 F12: verify-pack.mjs existed as four copies in three variants,
// spirit-gate-check.mjs as four copies, check-paths.mjs and
// sync-copilot-payload.mjs as three variants each, and verify-adapter-paths.mjs
// in two packs but not the third. Hand-kept copies drift; that is how the corpus
// forked in the first place (decision #359). o-matic-studio holds the source;
// o-matic-firm and o-matic-agency get byte-identical generated copies. Each
// script that needs to know which pack it is in reads that from its own
// location, so no copy is edited per pack.
//
// This runs on a maintainer's machine with the sibling repos checked out beside
// this one (a CI runner has only one repo). Run it, commit each repo.
//
// Usage: node scripts/sync-pack-tooling.mjs [--check] [--repos <dir>]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const check = args.includes("--check");
const ri = args.indexOf("--repos");
const reposDir = ri >= 0 ? resolve(args[ri + 1]) : resolve(here, "..");

// [path in o-matic-studio, path in target] — "<plugin>" is the target's plugin dir.
const FILES = [
  ["scripts/verify-pack.mjs", "scripts/verify-pack.mjs"],
  ["scripts/verify-identity-attestation.mjs", "scripts/verify-identity-attestation.mjs"],
  ["scripts/spirit-gate-check.mjs", "scripts/spirit-gate-check.mjs"],
  ["scripts/persona-attest-export.sql", "scripts/persona-attest-export.sql"],
  ["scripts/retired-kb.json", "scripts/retired-kb.json"],
  ["build-ollama-modelfile.mjs", "build-ollama-modelfile.mjs"],
  [".github/workflows/verify-pack.yml", ".github/workflows/verify-pack.yml"],
  ["studio/scripts/check-paths.mjs", "<plugin>/scripts/check-paths.mjs"],
  ["studio/scripts/sync-copilot-payload.mjs", "<plugin>/scripts/sync-copilot-payload.mjs"],
  ["studio/scripts/verify-adapter-paths.mjs", "<plugin>/scripts/verify-adapter-paths.mjs"],
  ["studio/scripts/verify-adapter-paths.test.mjs", "<plugin>/scripts/verify-adapter-paths.test.mjs"],
];
const TARGETS = [
  { repo: "o-matic-firm", plugin: "firm" },
  { repo: "o-matic-agency", plugin: "agency" },
];

let stale = 0, wrote = 0;
for (const t of TARGETS) {
  const troot = join(reposDir, t.repo);
  if (!existsSync(troot)) { console.log(`MISSING REPO: ${troot}`); stale++; continue; }
  for (const [src, dst] of FILES) {
    const body = readFileSync(join(here, src), "utf8");
    const out = join(troot, dst.replace("<plugin>", t.plugin));
    const cur = existsSync(out) ? readFileSync(out, "utf8") : null;
    const rel = `${t.repo}/${dst.replace("<plugin>", t.plugin)}`;
    if (cur === body) { console.log(`ok:    ${rel}`); continue; }
    stale++;
    if (check) console.log(`${cur === null ? "MISSING" : "STALE"}: ${rel}`);
    else { mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, body); wrote++; console.log(`sync:  ${rel}`); }
  }
}
if (check && stale) { console.log(`\n${stale} copy(ies) stale or missing — run without --check`); process.exit(1); }
console.log(check ? "\nall pack tooling in sync" : `\ndone — ${wrote} written`);
