#!/usr/bin/env node
// build-m365-packages.mjs — zip each Microsoft 365 Copilot app into dist/m365/.
//
// dist/ is gitignored. The zip is not a deployment. Placeholders stay in the
// JSON. Canonical skills and a short m365-<role> host skill are copied into
// the zip because the declarative agent references them. --check performs the
// same build and exits 1 when a package is incomplete.
//
// Usage: node scripts/build-m365-packages.mjs [repo-root] [--check]
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const check = args.includes("--check");
const root = resolve(args.find((a) => !a.startsWith("--")) || ".");

const walk = (dir) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (name === ".git" || name === "node_modules" || name === "dist") return [];
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
};

const manifests = walk(root).filter((p) => /\/adapters\/m365\/[^/]+\/appPackage\/manifest\.json$/.test(p)).sort();
if (!manifests.length) {
  console.log("no Microsoft 365 app packages");
  process.exit(0);
}

const distDir = join(root, "dist", "m365");
mkdirSync(distDir, { recursive: true });
let fails = 0;
const FAIL = (m) => { console.log(`  FAIL  ${m}`); fails++; };

function zipDir(src, dest) {
  const py = `
import os, zipfile
src = os.environ["ZIP_SRC"]
dest = os.environ["ZIP_DEST"]
with zipfile.ZipFile(dest, "w", compression=zipfile.ZIP_DEFLATED) as z:
    for folder, dirs, files in os.walk(src):
        dirs.sort()
        for name in sorted(files):
            full = os.path.join(folder, name)
            rel = os.path.relpath(full, src).replace(os.sep, "/")
            z.write(full, rel)
`;
  const r = spawnSync("python3", ["-c", py], {
    encoding: "utf8",
    env: { ...process.env, ZIP_SRC: src, ZIP_DEST: dest },
  });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || "zip failed");
}

function zipNames(dest) {
  const py = `
import os, zipfile
print("\\n".join(sorted(zipfile.ZipFile(os.environ["ZIP_DEST"]).namelist())))
`;
  const r = spawnSync("python3", ["-c", py], {
    encoding: "utf8",
    env: { ...process.env, ZIP_DEST: dest },
  });
  if (r.status !== 0) throw new Error(r.stderr || "zip list failed");
  return r.stdout.split("\n").filter(Boolean);
}

for (const manifestPath of manifests) {
  const appDir = dirname(manifestPath);
  const role = appDir.split("/").at(-2);
  const pluginRoot = resolve(appDir, "../../../..");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const agent = JSON.parse(readFileSync(join(appDir, "declarativeAgent.json"), "utf8"));
  const version = manifest.version || "0.0.0";
  const stageParent = mkdtempSync(join(tmpdir(), "m365-pkg-"));
  const stage = join(stageParent, "app");
  mkdirSync(stage);
  for (const name of readdirSync(appDir)) {
    cpSync(join(appDir, name), join(stage, name), { recursive: true });
  }
  const instructions = existsSync(join(appDir, "instructions.txt"))
    ? readFileSync(join(appDir, "instructions.txt"), "utf8").trimEnd()
    : "";
  for (const skill of agent.agent_skills || []) {
    const folder = String(skill.folder || "").replace(/^\.\//, "");
    const dest = join(stage, folder);
    const skillName = folder.split("/").pop();
    mkdirSync(dest, { recursive: true });
    if (skillName.startsWith("m365-")) {
      writeFileSync(join(dest, "SKILL.md"), `---
name: ${skillName}
description: Microsoft 365 Copilot host notes for this role. Read-only on this host. The canonical role guide is the sibling skill.
---

${instructions}
`);
      continue;
    }
    const src = join(pluginRoot, "skills", skillName);
    if (!existsSync(src)) {
      FAIL(`${role}: skill folder ${skillName} is not in the pack`);
      continue;
    }
    cpSync(src, dest, { recursive: true });
  }
  const zipPath = join(distDir, `studio-${role}-${version}.zip`);
  try {
    zipDir(stage, zipPath);
    const names = zipNames(zipPath);
    if (!names.includes("manifest.json") || !names.includes("declarativeAgent.json") || !names.includes("instructions.txt")) {
      FAIL(`${role}: zip is missing a manifest file`);
    }
    for (const skill of agent.agent_skills || []) {
      const folder = String(skill.folder || "").replace(/^\.\//, "");
      if (!names.includes(`${folder}/SKILL.md`)) FAIL(`${role}: zip missing ${folder}/SKILL.md`);
    }
    if (existsSync(join(appDir, "ai-plugin.json")) && !names.includes("ai-plugin.json")) FAIL(`${role}: zip missing ai-plugin.json`);
    if (existsSync(join(appDir, "color.png")) && !names.includes("color.png")) FAIL(`${role}: zip missing color.png`);
    const sha = createHash("sha256").update(readFileSync(zipPath)).digest("hex");
    const pending = existsSync(join(appDir, "icon-pending.txt")) ? " icon-pending" : "";
    console.log(`zip: dist/m365/studio-${role}-${version}.zip  sha256 ${sha}${pending}`);
  } catch (e) {
    FAIL(`${role}: ${e.message}`);
  } finally {
    rmSync(stageParent, { recursive: true, force: true });
  }
}

console.log(fails ? `\nRESULT: FAIL — ${fails} package(s)` : `\nRESULT: PASS — ${manifests.length} package(s)${check ? " (check)" : ""}`);
process.exit(fails ? 1 : 0);
