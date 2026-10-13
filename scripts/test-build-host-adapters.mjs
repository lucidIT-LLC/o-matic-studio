#!/usr/bin/env node
// test-build-host-adapters.mjs — the adapter builder's own test (task #1024,
// decision #700 rule 2: a change ships with the test that proves it).
//
// CANONICAL SOURCE: o-matic-studio/scripts/test-build-host-adapters.mjs.
// Copied into o-matic-firm and o-matic-agency by scripts/sync-pack-tooling.mjs.
//
// Builds a throwaway one-role pack and runs the real builder against it:
//   1. a skill with a linked reference file builds clean, and the Gemini copy
//      and the ChatGPT setup both carry the reference file;
//   2. each of Anthropic's skill rules fails when broken (body over 500 lines,
//      an unlinked reference, a link to a missing file, a nested reference,
//      a long reference with no "## Contents");
//   3. --check fails on drift and passes when current.
// Run: node scripts/test-build-host-adapters.mjs
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BUILDER = join(dirname(fileURLToPath(import.meta.url)), "build-host-adapters.mjs");
let failed = 0;
const check = (label, ok, detail = "") => {
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label}${ok || !detail ? "" : `\n        ${detail}`}`);
  if (!ok) failed++;
};

// budget: undefined = a baseline equal to the skill's current size (the normal
// case); a number = that baseline; null = no skill-budget.json at all;
// "no-role" = a skill-budget.json that does not list the role.
const BODY_DEFAULT = "Role guide.\n\nSee [reference/detail.md](reference/detail.md).\n";
function pack({ body = BODY_DEFAULT, refs = { "reference/detail.md": "# Detail\n\nMore.\n" }, oneLiner = "Tests things.", budget, slack } = {}) {
  const root = mkdtempSync(join(tmpdir(), "hostadapters-"));
  const w = (rel, text) => { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), text); };
  if (budget !== null) {
    const roles = budget === "no-role" ? {} : { tess: budget ?? Math.ceil(body.length / 4) };
    w("skill-budget.json", JSON.stringify({ ...(slack === undefined ? {} : { slack }), roles }));
  }
  w(".claude-plugin/marketplace.json", JSON.stringify({ plugins: [{ source: "./demo" }] }));
  w("demo/.claude-plugin/plugin.json", JSON.stringify({ name: "demo", displayName: "Demo" }));
  w("agent-pack.json", JSON.stringify({ agents: [{
    id: "tess", display_name: "Tess", role: "Tester", one_liner: oneLiner,
    canonical_skill: "demo/skills/tess-testing/SKILL.md", triggers: ["test this"],
    archetypes: [], identity: { tone_of_record: "Plain.", primary_domain: "testing", drift_anchor: "Tests, never guesses." },
  }] }));
  w("demo/skills/tess-testing/SKILL.md", `---\nname: tess-testing\ndescription: Tests things. Use when asked to test.\n---\n${body}`);
  for (const [rel, text] of Object.entries(refs)) w(`demo/skills/tess-testing/${rel}`, text);
  return root;
}
const run = (root, ...args) => spawnSync(process.execPath, [BUILDER, root, ...args], { encoding: "utf8" });

// 1. Clean build carries reference files to every host that takes files.
{
  const root = pack();
  const r = run(root);
  check("a skill with a linked reference builds clean", r.status === 0, r.stdout + r.stderr);
  check("Gemini copy carries the reference file", existsSync(join(root, "skills/tess-testing/reference/detail.md")));
  const setup = existsSync(join(root, "demo/adapters/chatgpt/tess/SETUP.md")) ? readFileSync(join(root, "demo/adapters/chatgpt/tess/SETUP.md"), "utf8") : "";
  check("ChatGPT setup lists the reference file as knowledge", setup.includes("reference/detail.md"), setup.slice(0, 400));
  check("--check passes when current", run(root, "--check").status === 0);
  writeFileSync(join(root, "skills/tess-testing/SKILL.md"), "stale\n");
  check("--check fails on drift", run(root, "--check").status === 1);
  rmSync(root, { recursive: true, force: true });
}

// 2. Each vendor rule fails when broken.
const cases = [
  ["body over 500 lines", { body: "x\n".repeat(501) + "See [reference/detail.md](reference/detail.md).\n" }, /body \d+ lines > 500/],
  ["a reference not linked from SKILL.md", { body: "No links.\n" }, /is not linked from SKILL.md/],
  ["a link to a missing file", { body: "See [reference/gone.md](reference/gone.md) and [reference/detail.md](reference/detail.md).\n" }, /does not exist/],
  ["a nested reference", { refs: { "reference/detail.md": "# D\n\nSee [more.md](more.md).\n", "reference/more.md": "# M\n" },
    body: "See [reference/detail.md](reference/detail.md) and [reference/more.md](reference/more.md).\n" }, /one level deep/],
  ["a long reference with no Contents", { refs: { "reference/detail.md": "# D\n" + "line\n".repeat(120) } }, /has no "## Contents"/],
];
for (const [label, opts, want] of cases) {
  const root = pack(opts);
  const r = run(root);
  check(`rule fails: ${label}`, r.status === 1 && want.test(r.stdout), r.stdout.slice(0, 300));
  rmSync(root, { recursive: true, force: true });
}

// An openai.yaml icon that does not exist fails the build.
{
  const root = pack();
  const y = join(root, "demo/skills/tess-testing/agents/openai.yaml");
  mkdirSync(dirname(y), { recursive: true });
  writeFileSync(y, 'interface:\n  icon_small: "./assets/tess.svg"\n');
  const r = run(root);
  check("rule fails: an openai.yaml icon that does not exist", r.status === 1 && /icon \.\/assets\/tess\.svg does not exist/.test(r.stdout), r.stdout.slice(0, 300));
  mkdirSync(join(root, "demo/skills/tess-testing/assets"), { recursive: true });
  writeFileSync(join(root, "demo/skills/tess-testing/assets/tess.svg"), "<svg/>");
  check("the same skill passes once the icon exists", run(root).status === 0);
  rmSync(root, { recursive: true, force: true });
}

// 3. Token ratchet (task #1052). Body = 4,000 chars = 1,000 estimated tokens.
{
  const body4k = "x".repeat(3940) + "\nSee [reference/detail.md](reference/detail.md).\n";
  const tokens = Math.ceil(body4k.length / 4);
  const fails = (r, re) => r.status === 1 && re.test(r.stdout);
  // Build first so --check measures the ratchet, not "no files generated yet".
  const checked = (root) => { run(root); return run(root, "--check"); };

  let root = pack({ body: body4k, budget: null });
  let r = run(root, "--check");
  check("ratchet fails when skill-budget.json is missing", fails(r, /skill-budget\.json is missing/), r.stdout.slice(0, 300));
  r = run(root, "--update-baseline");
  check("--update-baseline creates it", r.status === 0 && existsSync(join(root, "skill-budget.json")), r.stdout.slice(0, 300));
  const made = JSON.parse(readFileSync(join(root, "skill-budget.json"), "utf8"));
  check("the baseline written equals the measured size", made.roles.tess === tokens, JSON.stringify(made));
  check("--check then passes", run(root, "--check").status === 0);
  rmSync(root, { recursive: true, force: true });

  root = pack({ body: body4k, budget: "no-role" });
  r = run(root, "--check");
  check("ratchet fails when a role has no baseline", fails(r, /no baseline for role tess/), r.stdout.slice(0, 300));
  rmSync(root, { recursive: true, force: true });

  root = pack({ body: body4k, budget: tokens - 30 });  // 970: ceiling ceil(970*1.02) = 990 < 1000
  r = run(root, "--check");
  check("ratchet fails on growth past baseline plus slack", fails(r, /exceeds baseline/), r.stdout.slice(0, 300));
  rmSync(root, { recursive: true, force: true });

  root = pack({ body: body4k, budget: tokens - 15 });  // 985: ceiling ceil(985*1.02) = 1005 >= 1000
  r = checked(root);
  check("growth within the slack passes (a hotfix is not blocked)", r.status === 0, r.stdout.slice(0, 300));
  rmSync(root, { recursive: true, force: true });

  root = pack({ body: body4k, budget: tokens + 200 });
  r = checked(root);
  check("shrinking never fails, and says the baseline can be lowered", r.status === 0 && /lower it with --update-baseline/.test(r.stdout), r.stdout.slice(0, 300));
  rmSync(root, { recursive: true, force: true });

  const body5k = "x".repeat(20100) + "\nSee [reference/detail.md](reference/detail.md).\n";
  root = pack({ body: body5k });
  r = checked(root);
  check("above 5,000 estimated tokens warns but does not fail", r.status === 0 && /> 5000 \(advisory/.test(r.stdout), r.stdout.slice(0, 300));
  rmSync(root, { recursive: true, force: true });

  root = pack();
  r = run(root, "--check", "--update-baseline");
  check("--update-baseline cannot be combined with --check", r.status === 2, r.stdout.slice(0, 300));
  rmSync(root, { recursive: true, force: true });

  // Host character margins. Grok is the tightest (4,000). Measure the base size,
  // then pad the one-liner to land at ~92% (warns), then over 100% (fails).
  root = pack();
  run(root);
  const base = readFileSync(join(root, "demo/adapters/grok/tess.md"), "utf8").length;
  rmSync(root, { recursive: true, force: true });
  root = pack({ oneLiner: "y".repeat(3700 - base + 13) });
  r = checked(root);
  check("a host limit at 90%+ warns but passes", r.status === 0 && /grok instructions at 9\d% of the 4000-character limit/.test(r.stdout), r.stdout.slice(0, 400));
  rmSync(root, { recursive: true, force: true });
  root = pack({ oneLiner: "y".repeat(4100) });
  r = run(root, "--check");
  check("a host limit exceeded fails", fails(r, /> 4000/), r.stdout.slice(0, 300));
  rmSync(root, { recursive: true, force: true });
}

console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
