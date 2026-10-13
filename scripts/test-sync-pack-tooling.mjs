#!/usr/bin/env node
// test-sync-pack-tooling.mjs — the sync script's own test (task #1052, decision
// #700 rule 2). STUDIO ONLY: sync-pack-tooling.mjs is not copied into the other
// packs, so this test is not either, and it is not a CI step (CI sees one repo).
//
// Syncs into three empty throwaway repos and proves:
//   1. firm and agency receive the full tooling set, including the builder;
//   2. o-matic-supply receives ONLY check-no-private-servers.mjs, and never
//      verify-pack.mjs, its CI workflow, spirit-gate-check.mjs or the builder;
//   3. after a sync, --check passes; after a tampered copy, --check fails.
// Run: node scripts/test-sync-pack-tooling.mjs
import { mkdtempSync, mkdirSync, existsSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SYNC = join(dirname(fileURLToPath(import.meta.url)), "sync-pack-tooling.mjs");
let failed = 0;
const check = (label, ok, detail = "") => {
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label}${ok || !detail ? "" : `\n        ${detail}`}`);
  if (!ok) failed++;
};
const run = (repos, ...args) => spawnSync(process.execPath, [SYNC, "--repos", repos, ...args], { encoding: "utf8" });
const files = (dir) => !existsSync(dir) ? [] : readdirSync(dir, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile()).map((e) => join(e.parentPath ?? e.path, e.name).slice(dir.length + 1)).sort();

const repos = mkdtempSync(join(tmpdir(), "syncpack-"));
for (const r of ["o-matic-firm", "o-matic-agency", "o-matic-supply"]) mkdirSync(join(repos, r));

let r = run(repos);
check("sync writes without error", r.status === 0, r.stdout + r.stderr);

const supply = files(join(repos, "o-matic-supply"));
check("supply receives exactly one file", supply.length === 1 && supply[0] === "scripts/check-no-private-servers.mjs", JSON.stringify(supply));
for (const banned of ["verify-pack", "spirit-gate", "build-host-adapters", "verify-identity"]) {
  check(`supply never receives ${banned}`, !supply.some((f) => f.includes(banned)), JSON.stringify(supply));
}
check("supply never receives a workflow", !existsSync(join(repos, "o-matic-supply/.github")));

for (const t of ["o-matic-firm", "o-matic-agency"]) {
  const got = files(join(repos, t));
  check(`${t} receives the builder, its test and verify-pack`,
    ["scripts/build-host-adapters.mjs", "scripts/test-build-host-adapters.mjs", "scripts/verify-pack.mjs"].every((f) => got.includes(f)), JSON.stringify(got));
}

check("--check passes after a sync", run(repos, "--check").status === 0);
writeFileSync(join(repos, "o-matic-supply/scripts/check-no-private-servers.mjs"), "// tampered\n");
r = run(repos, "--check");
check("--check fails on a tampered supply copy", r.status === 1 && /STALE: o-matic-supply\/scripts\/check-no-private-servers\.mjs/.test(r.stdout), r.stdout.slice(0, 300));

rmSync(repos, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
