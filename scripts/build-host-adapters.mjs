#!/usr/bin/env node
// build-host-adapters.mjs — one role, every host, from the gold record (task #1024).
//
// Operator ruling 2026-09-30: the agents are AGENTS where the host can run one
// and skills or GPTs where it cannot, built "correctly" per each vendor's own
// documentation, and they "shouldn't be looking for any tailscale or private
// servers." Every file below is GENERATED from agent-pack.json (the gold-record
// export) plus the role's canonical SKILL.md. Nothing is hand-kept per host.
//
// Formats and limits, each read from the vendor's own page on 2026-09-30:
//   Claude Code subagent   <plugin>/agents/<role>.md  name + description frontmatter;
//                          plugin agents ignore hooks/mcpServers/permissionMode
//                          (code.claude.com/docs/en/sub-agents). Grok Build reads
//                          Claude Code plugins as-is (docs.x.ai/build/features/
//                          skills-plugins-marketplaces).
//   Codex custom agent     adapters/codex/agents/<role>.toml  name, description,
//                          developer_instructions (learn.chatgpt.com/docs/
//                          agent-configuration/subagents)
//   Gemini CLI extension   <repo>/gemini-extension.json, <repo>/skills/<n>/SKILL.md,
//                          <repo>/agents/<role>.md (geminicli.com/docs/extensions/
//                          reference, /docs/core/subagents); install is repo root only
//   GitHub Copilot agent   adapters/copilot/.github/agents/<role>.agent.md,
//                          description required, prompt <= 30,000 chars
//                          (docs.github.com custom-agents-configuration)
//   M365 Copilot agent     adapters/m365/<role>/declarativeAgent.json, schema v1.6:
//                          name <= 100, description <= 1,000, instructions <= 8,000,
//                          conversation_starters <= 6 (learn.microsoft.com
//                          declarative-agent-manifest-1.6)
//   ChatGPT custom GPT     adapters/chatgpt/<role>/instructions.md <= 8,000 chars,
//                          knowledge = the role's SKILL.md (<= 20 files per GPT)
//   Grok custom agent      adapters/grok/<role>.md, instructions <= 4,000 chars
//   Cursor 4.7             adapters/cursor/<role>.md + .cursor-plugin skills path;
//                          prompt substitutes for missing Claude hooks (Studio 1.11.0)
//
// Usage: node scripts/build-host-adapters.mjs <marketplace-root> [--check | --update-baseline]
// --check rebuilds in memory and exits 1 if any generated file differs or any
// limit is exceeded, including a role grown past its skill-budget.json baseline.
// --update-baseline rewrites skill-budget.json from the current skills (task #1052).
// CANONICAL SOURCE: o-matic-studio/scripts/.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, cpSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const root = resolve(process.argv[2] || ".");
const check = process.argv.includes("--check");
const pack = JSON.parse(readFileSync(join(root, "agent-pack.json"), "utf8"));
const mkt = JSON.parse(readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8"));
const pluginDir = mkt.plugins[0].source.replace(/^\.\//, "");
const plugin = JSON.parse(readFileSync(join(root, pluginDir, ".claude-plugin", "plugin.json"), "utf8"));
const packName = plugin.displayName || plugin.name;

const LIMITS = { gpt: 8000, m365: 8000, grok: 4000, copilot: 30000, m365_desc: 1000, m365_name: 100 };
const out = new Map();
const problems = [];

// Token ratchet (task #1052; origin: DataRobot agent-skills review 2026-10-09,
// whose CI gates each SKILL.md on an estimated token count, not on lines).
// 500 lines is Anthropic's rule, and every role passes it, but lines hide size:
// the same files run ~5k-9.6k estimated tokens. So each role carries a baseline in
// skill-budget.json (REPO ROOT, next to agent-pack.json: outside the plugin
// directory, so the Spirit Gate hash that covers `git ls-files <plugin>` is
// untouched). Growth past baseline + slack FAILS; shrinking never fails; the
// baseline moves only through an explicit --update-baseline that a reviewer sees
// in the diff. Above TOKEN_WARN is advisory. Estimate = ceil(chars / 4) of the
// canonical SKILL.md body, frontmatter excluded; it is a ratchet, not a measure.
// Host character limits stay hard failures; MARGIN_WARN prints how close each is.
const BUDGET_FILE = "skill-budget.json";
const TOKEN_WARN = 5000;
const MARGIN_WARN = 0.9;
const DEFAULT_SLACK = 0.02;
const updateBaseline = process.argv.includes("--update-baseline");
if (updateBaseline && check) {
  console.log("  FAIL  --update-baseline rewrites skill-budget.json; it cannot be combined with --check");
  process.exit(2);
}
const budgetPath = join(root, BUDGET_FILE);
const budget = existsSync(budgetPath) ? JSON.parse(readFileSync(budgetPath, "utf8")) : null;
const slack = budget?.slack ?? DEFAULT_SLACK;
const estTokens = (text) => Math.ceil(text.length / 4);
const measured = {};  // role id -> estimated tokens
const notes = [];     // advisory lines; never a failure
const report = [];    // one row per role
const put = (rel, text) => out.set(rel, text.endsWith("\n") ? text : text + "\n");

const parseArchetypes = (a) => {
  if (Array.isArray(a)) return a;
  try { return JSON.parse(String(a).replace(/'/g, '"')); } catch { return []; }
};
const frontmatter = (skillText) => {
  const m = skillText.match(/^---\n([\s\S]*?)\n---\n/);
  const fm = m ? m[1] : "";
  const name = (fm.match(/^name:\s*(.+)$/m) || [])[1]?.trim().replace(/^"|"$/g, "");
  return { name };
};

const HEADER = (a) => `GENERATED by scripts/build-host-adapters.mjs from agent-pack.json (gold record) and ${a.canonical_skill}. Do not hand-edit.`;

// The condensed identity every chat-only host gets. Built only from gold-record
// fields; the full role guide travels as a knowledge file where the host allows one.
function condensed(a, { knowledgeFile, limit }) {
  const L = [];
  const arche = parseArchetypes(a.archetypes);
  L.push(`You are ${a.display_name}, ${a.role} from o-MATIC. ${a.one_liner}`);
  L.push("");
  L.push(`Voice: ${a.identity.tone_of_record} Begin every reply with "${a.display_name}:". Write in US English.`);
  if (arche.length) {
    L.push("");
    L.push("Who you are, layer by layer:");
    for (const x of arche) L.push(`- ${x.name}: ${x.description}`);
  }
  L.push("");
  L.push(`People call on you with: ${a.triggers.join(", ")}.`);
  L.push("");
  L.push("How you work:");
  L.push(`- Stay in your lane (${a.identity.primary_domain}). Name the right teammate when a request belongs to someone else.`);
  L.push("- Work from what is in the conversation and what the host gives you. If this host has an o-MATIC Server connection configured, use it for factory memory, rules and records; if it does not, say so plainly and continue on your own. Never search for, guess, or ask for a server address.");
  L.push("- Be honest about capability. Never claim data, tools or results you do not have, and say whether a statement is measured, inferred or reported.");
  L.push(`- Drift check: ${a.identity.drift_anchor}`);
  if (knowledgeFile) {
    L.push("");
    L.push(`Your full role guide is the attached knowledge file ${knowledgeFile}. Follow its procedures; these instructions win where the two differ on identity or honesty.`);
  }
  let text = L.join("\n");
  if (text.length > limit) {
    // Drop archetype descriptions first, keeping the names; never truncate mid-rule.
    text = text.replace(/^- ([^:\n]+): .*$/gm, "- $1");
  }
  if (text.length > limit) problems.push(`${a.id}: condensed instructions ${text.length} > ${limit}`);
  return text;
}

// Every .md file in the skill folder, relative to it (SKILL.md plus its
// reference files), so hosts that take the whole skill get all of it.
const mdFiles = (dir, rel = "") => readdirSync(join(dir, rel), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? mdFiles(dir, join(rel, e.name)) : e.name.endsWith(".md") ? [join(rel, e.name)] : []).sort();

const skillOf = (a) => {
  const p = join(root, a.canonical_skill);
  const text = readFileSync(p, "utf8");
  const dir = dirname(p);
  const files = mdFiles(dir).map((rel) => ({ rel, text: readFileSync(join(dir, rel), "utf8") }));
  return { path: p, text, name: frontmatter(text).name, dir, files };
};

// Anthropic, "Skill authoring best practices" (platform.claude.com, read
// 2026-09-30): SKILL.md body under 500 lines; split detail into reference
// files linked ONE level deep from SKILL.md; a reference file over 100 lines
// starts with a table of contents. Enforced here so it is a gate, not advice.
const SKILL_BODY_MAX_LINES = 500;
const REF_TOC_OVER_LINES = 100;
const mdLinks = (text) => [...text.matchAll(/\]\(([^)#\s]+\.md)\)/g)].map((m) => m[1]).filter((l) => !/^[a-z]+:/i.test(l));
function skillRules(a, s) {
  const body = s.text.replace(/^---\n[\s\S]*?\n---\n/, "");
  const lines = body.split("\n").length;
  if (lines > SKILL_BODY_MAX_LINES) problems.push(`${a.canonical_skill}: body ${lines} lines > ${SKILL_BODY_MAX_LINES}`);
  const refs = s.files.filter((f) => f.rel !== "SKILL.md");
  const have = new Set(refs.map((f) => f.rel));
  for (const l of mdLinks(body)) if (!have.has(join(l))) problems.push(`${a.canonical_skill}: links ${l}, which does not exist`);
  const linked = new Set(mdLinks(body).map((l) => join(l)));
  for (const f of refs) {
    if (!linked.has(f.rel)) problems.push(`${a.canonical_skill}: ${f.rel} is not linked from SKILL.md`);
    const nested = mdLinks(f.text).filter((l) => have.has(join(dirname(f.rel), l)) || have.has(join(l)));
    if (nested.length) problems.push(`${a.canonical_skill}: ${f.rel} links ${nested.join(", ")} (references must be one level deep)`);
    if (f.text.split("\n").length > REF_TOC_OVER_LINES && !/^## Contents\b/m.test(f.text))
      problems.push(`${a.canonical_skill}: ${f.rel} is over ${REF_TOC_OVER_LINES} lines and has no "## Contents"`);
  }
}

// Token ratchet for one role (see the block at the top of the file).
function budgetRules(a, s) {
  const body = s.text.replace(/^---\n[\s\S]*?\n---\n/, "");
  const t = estTokens(body);
  measured[a.id] = t;
  if (t > TOKEN_WARN) notes.push(`${a.id}: SKILL.md body ~${t} tokens > ${TOKEN_WARN} (advisory; the baseline is the gate)`);
  if (updateBaseline || !budget) return;  // a missing file is reported once, after the loop
  const base = budget.roles?.[a.id];
  if (base === undefined) {
    problems.push(`${a.canonical_skill}: no baseline for role ${a.id} in ${BUDGET_FILE} (run --update-baseline and review the diff)`);
    return;
  }
  const ceiling = Math.ceil(base * (1 + slack));
  if (t > ceiling) problems.push(`${a.canonical_skill}: ~${t} tokens exceeds baseline ${base} (+${slack * 100}% slack = ${ceiling}); trim it, or run --update-baseline and justify the growth in review`);
  else if (t < base * 0.9) notes.push(`${a.id}: now ~${t} tokens against baseline ${base}; lower it with --update-baseline`);
}

const starters = (a) => {
  const y = join(dirname(join(root, a.canonical_skill)), "agents", "openai.yaml");
  const prompts = [];
  if (existsSync(y)) {
    const m = readFileSync(y, "utf8").match(/default_prompt:\s*"([^"]+)"/);
    if (m) prompts.push(m[1]);
  }
  for (const t of a.triggers.slice(0, 6)) if (prompts.length < 6 && !/^[A-Z][a-z]+$/.test(t)) prompts.push(`${a.display_name}, ${t}.`);
  return prompts.slice(0, 6);
};

const shortDesc = (a) => `${a.role} from o-MATIC. ${a.one_liner}`.slice(0, 1000);

for (const a of pack.agents) {
  const s = skillOf(a);
  skillRules(a, s);
  budgetRules(a, s);
  const id = a.id;

  // 1. Claude Code plugin subagent (also read by Grok Build).
  put(`${pluginDir}/agents/${id}.md`, `---
name: ${id}
description: ${JSON.stringify(shortDesc(a))}
skills:
  - ${s.name}
---

<!-- ${HEADER(a)} -->

You are ${a.display_name}, o-MATIC's ${a.role}. The \`${s.name}\` skill is preloaded: it is your full role guide, so follow it from your first token. Begin every reply with "${a.display_name}:".

If this host has an o-MATIC Server connection configured, use it for factory memory, rules and records. If it does not, say so plainly and work from the conversation. Never search for, guess, or ask for a server address.
`);

  // 2. Codex custom agent.
  const dev = condensed(a, { knowledgeFile: null, limit: LIMITS.copilot }) +
    `\n\nIf the \`${s.name}\` skill is installed (o-MATIC ${packName} plugin), load it as your full role guide.`;
  put(`${pluginDir}/adapters/codex/agents/${id}.toml`,
`# ${HEADER(a)}
# Install: copy to ~/.codex/agents/ (personal) or .codex/agents/ (project).
name = ${JSON.stringify(id)}
description = ${JSON.stringify(shortDesc(a))}
developer_instructions = """
${dev.replace(/"""/g, '\\"\\"\\"')}
"""
`);

  // 3. Gemini CLI extension (repository root; install is root-only).
  put(`agents/${id}.md`, `---
name: ${id}
description: ${JSON.stringify(shortDesc(a))}
---

<!-- ${HEADER(a)} -->

${condensed(a, { knowledgeFile: null, limit: LIMITS.copilot })}

Your full role guide is the \`${s.name}\` skill in this extension. Load it before substantive work.
`);
  for (const f of s.files) put(`skills/${s.name}/${f.rel}`, f.text);

  // 4. GitHub Copilot custom agent.
  const cop = condensed(a, { knowledgeFile: null, limit: LIMITS.copilot });
  put(`${pluginDir}/adapters/copilot/.github/agents/${id}.agent.md`, `---
name: ${id}
description: ${JSON.stringify(shortDesc(a))}
---

<!-- ${HEADER(a)} -->

${cop}
`);

  // 5. Microsoft 365 Copilot declarative agent (schema v1.6).
  const m365 = condensed(a, { knowledgeFile: null, limit: LIMITS.m365 });
  const da = {
    $schema: "https://developer.microsoft.com/json-schemas/copilot/declarative-agent/v1.6/schema.json",
    version: "v1.6",
    name: `${a.display_name} (o-MATIC)`.slice(0, LIMITS.m365_name),
    description: shortDesc(a).slice(0, LIMITS.m365_desc),
    instructions: m365,
    conversation_starters: starters(a).map((t) => ({ text: t })),
  };
  put(`${pluginDir}/adapters/m365/${id}/declarativeAgent.json`, JSON.stringify(da, null, 2));

  // 6. ChatGPT custom GPT.
  const gptKnowledge = `${s.name}.md`;
  const refs = s.files.filter((f) => f.rel !== "SKILL.md");
  if (refs.length + 1 > 20) problems.push(`${id}: ${refs.length + 1} knowledge files > 20 (custom GPT limit)`);
  const skillRel = a.canonical_skill.replace(/^[^/]+\//, "");
  const knowledgeStep = "Under Knowledge, upload the role guide: `" + skillRel + "`, renamed to `" + gptKnowledge + "`" +
    (refs.length ? ", and its " + refs.length + " reference file(s), each under its own name:\n" +
      refs.map((f) => "   - `" + dirname(skillRel) + "/" + f.rel + "`").join("\n") : ".");
  put(`${pluginDir}/adapters/chatgpt/${id}/instructions.md`, condensed(a, { knowledgeFile: gptKnowledge, limit: LIMITS.gpt }));
  put(`${pluginDir}/adapters/chatgpt/${id}/SETUP.md`, `# ${a.display_name} as a custom GPT

${HEADER(a)}

1. In ChatGPT, create a GPT. Name: **${a.display_name}**. Description: ${a.one_liner}
2. Paste \`instructions.md\` into Instructions (it is under OpenAI's 8,000-character limit).
3. ${knowledgeStep}
4. Conversation starters:
${starters(a).map((t) => `   - ${t}`).join("\n")}
`);

  // 7. Grok custom agent.
  put(`${pluginDir}/adapters/grok/${id}.md`, condensed(a, { knowledgeFile: null, limit: LIMITS.grok }));

  // 8. Cursor 4.7 host adapter — method card + prompt substitutes (no Claude hooks).
  // Skills load via studio/.cursor-plugin; these cards are the portable method
  // surface when the marketplace skill list is thin or for Project fallbacks.
  const cursorBody = condensed(a, { knowledgeFile: null, limit: LIMITS.copilot }) + `

## Cursor host rules (prompt substitutes for missing Claude hooks)

- Prefer the installed \`${s.name}\` skill as your full role guide when the Cursor plugin loads it.
- Discover tools live on this host before naming them. Use Cursor tools that exist here (for example Read, Write, StrReplace, Glob, Grep, Shell, Task) or MCP tool names returned by the live server. Never invent Claude Code tool names (Edit, NotebookEdit, and the like).
- Fan-out: at most three specialists in flight for one ask; name owners and stop conditions; do not spawn unbounded parallel work.
- If an o-MATIC Server MCP connection is configured: call \`startup\` with a stable \`conversation_key\` before factory claims; render the card's \`state\`; never invent READY, DEGRADED, or BLOCKED.
- GrokBot is a separate, undefined product surface in this pack — do not claim a GrokBot binding or runtime from these instructions.
`;
  put(`${pluginDir}/adapters/cursor/${id}.md`, cursorBody);

  // Limits, measured on what was generated.
  const lim = [
    [`${pluginDir}/adapters/chatgpt/${id}/instructions.md`, LIMITS.gpt],
    [`${pluginDir}/adapters/grok/${id}.md`, LIMITS.grok],
    [`${pluginDir}/adapters/copilot/.github/agents/${id}.agent.md`, LIMITS.copilot],
  ];
  for (const [rel, max] of lim) if (out.get(rel).length > max) problems.push(`${rel}: ${out.get(rel).length} > ${max}`);
  if (m365.length > LIMITS.m365) problems.push(`m365 ${id}: instructions ${m365.length} > ${LIMITS.m365}`);
  if (da.conversation_starters.length > 6) problems.push(`m365 ${id}: more than 6 starters`);

  // How close each host limit is. Over the limit already failed above; this
  // prints the distance so a role is seen approaching one before it breaks.
  const pct = {
    gpt: out.get(`${pluginDir}/adapters/chatgpt/${id}/instructions.md`).length / LIMITS.gpt,
    m365: m365.length / LIMITS.m365,
    grok: out.get(`${pluginDir}/adapters/grok/${id}.md`).length / LIMITS.grok,
    copilot: out.get(`${pluginDir}/adapters/copilot/.github/agents/${id}.agent.md`).length / LIMITS.copilot,
  };
  for (const [host, p] of Object.entries(pct)) {
    if (p >= MARGIN_WARN && p <= 1) notes.push(`${id}: ${host} instructions at ${Math.round(p * 100)}% of the ${LIMITS[host]}-character limit`);
  }
  report.push({ id, tokens: measured[id], base: budget?.roles?.[id], pct });
}

if (!budget && !updateBaseline) problems.push(`${BUDGET_FILE} is missing at the repo root (run --update-baseline and commit it)`);
if (budget && !updateBaseline) {
  const ids = new Set(pack.agents.map((x) => x.id));
  for (const k of Object.keys(budget.roles || {})) if (!ids.has(k)) notes.push(`${BUDGET_FILE} lists ${k}, which is not in agent-pack.json; remove it with --update-baseline`);
}
if (updateBaseline) {
  const roles = Object.fromEntries(pack.agents.map((x) => [x.id, measured[x.id]]));
  for (const [k, v] of Object.entries(roles)) {
    const was = budget?.roles?.[k];
    if (was === undefined) notes.push(`baseline set: ${k} = ${v}`);
    else if (v > was) notes.push(`baseline RAISED: ${k} ${was} -> ${v} (justify in review)`);
    else if (v < was) notes.push(`baseline lowered: ${k} ${was} -> ${v}`);
  }
  writeFileSync(budgetPath, JSON.stringify({
    _comment: "Per-role SKILL.md size baselines (task #1052). Estimated tokens = ceil(chars/4) of each canonical SKILL.md body. The build fails on growth past baseline plus slack; change it only with build-host-adapters.mjs --update-baseline, and justify any increase in review.",
    slack,
    roles,
  }, null, 2) + "\n");
}

// Gemini extension manifest + context at the repository root.
put("gemini-extension.json", JSON.stringify({
  name: plugin.name === "agency" || plugin.name === "firm" || plugin.name === "studio" ? `o-matic-${plugin.name}` : plugin.name,
  version: plugin.version,
  description: plugin.description,
  contextFileName: "GEMINI.md",
}, null, 2));
put("GEMINI.md", `# ${packName}

${HEADER({ canonical_skill: "each role's SKILL.md" })}

This extension adds the o-MATIC ${packName} crew: ${pack.agents.map((a) => `${a.display_name} (${a.role})`).join(", ")}. Each is a sub-agent in \`agents/\` with its full role guide as a skill in \`skills/\`.

Call a crew member by name. They work from the conversation on their own, and use an o-MATIC Server only if this host already has one configured. They never search for or ask for a server address.
`);

// Host matrix, stated honestly: an agent definition shipping is not an agent proven.
put(`${pluginDir}/adapters/README.md`, `# ${packName} on every host

${HEADER({ canonical_skill: "each role's SKILL.md" })}

Each role ships in the format each vendor documents. "Agent" below means the host
runs the role as its own agent; "chat" means a custom assistant (skill or GPT) in
a chat product. L2 status is claimed only after the role conformance eval passes
on that host, and is recorded in the o-MATIC factory, not in this file.

| Host | Form | What ships | Install |
|---|---|---|---|
| Claude Code | agent | \`${pluginDir}/agents/<role>.md\` + skills | \`/plugin marketplace add\` this repo, then \`/plugin install\` |
| Claude.ai, Desktop, Cowork | chat | the plugin's skills | install the plugin, or upload a skill folder as a zip under Settings |
| Grok Build | agent | reads the Claude Code plugin as-is | add this repo as a marketplace |
| Codex | agent | \`adapters/codex/agents/<role>.toml\` + plugin skills | install the plugin; copy the .toml files to \`~/.codex/agents/\` |
| Gemini CLI | agent | repo-root \`gemini-extension.json\`, \`agents/\`, \`skills/\` | \`gemini extensions install https://github.com/lucidIT-LLC/<this repo>\` |
| GitHub Copilot | agent | \`adapters/copilot/.github/agents/<role>.agent.md\` | copy into your repository's \`.github/agents/\` |
| Microsoft 365 Copilot | chat | \`adapters/m365/<role>/declarativeAgent.json\` | package with the Microsoft 365 Agents Toolkit |
| ChatGPT | chat | \`adapters/chatgpt/<role>/\` instructions + SETUP | create a custom GPT; upload the role guide as knowledge |
| Grok (grok.com) | chat | \`adapters/grok/<role>.md\` | paste into a Custom Agent's instructions |
| Cursor 4.7 | skills + method cards | \`.cursor-plugin\` + \`adapters/cursor/<role>.md\` | add this repo as a Cursor marketplace / install \`studio\`; see \`adapters/cursor/INSTALL.md\`. Status: design verified until skill discovery is measured on the host. |
| GrokBot | — | not shipped | Jimmy must define runtime + MCP principal first; do not overload Cursor or Grok stubs |

Limits enforced at build time: GPT and M365 instructions <= 8,000 characters,
Grok <= 4,000, Copilot <= 30,000, M365 name <= 100 and description <= 1,000.
`);

// Cursor install note (hand-maintained companion path; regenerated with the matrix).
put(`${pluginDir}/adapters/cursor/INSTALL.md`, `# Cursor 4.7 — install o-MATIC Studio

${HEADER({ canonical_skill: "each role's SKILL.md" })}

## Primary path (marketplace plugin)

1. Add this repository as a Cursor plugin marketplace (GitHub: \`lucidIT-LLC/o-matic-studio\`).
2. Install the \`studio\` plugin. It declares \`.cursor-plugin/plugin.json\` with \`"skills": "./skills/"\` and **no** \`mcpServers\` block (marketplace hosts omit MCP-declaring plugins).
3. Configure the host's o-MATIC Server MCP pairing separately if you need factory memory — this pack never ships credentials or an MCP server.
4. Invoke Brandy, Carver, Monet, Jo, or Andy by name / skill trigger. Prefer the installed skill; fall back to \`adapters/cursor/<role>.md\` for the condensed method card and Cursor host rules.

## Fallback if marketplace skills do not appear on the agent skill list

Measured gap on some Cursor 4.7 sessions: the marketplace cache can exist while \`studio:*\` skills still do not load into the agent skill surface.

1. Copy or symlink thin wrappers under the project \`.cursor/skills/<skill-name>/SKILL.md\` (or \`.agents/skills/\`) that point the agent to read the installed pack skill — prefer wrappers over forked skill bodies.
2. Optionally add \`.cursor/rules\` pointers for lane/voice only; rules are not a substitute for full SKILL.md depth.
3. Re-measure skill visibility after refresh; do not claim production_verified until measured.

## Prompt substitutes (Claude hooks are absent on Cursor)

Every \`adapters/cursor/<role>.md\` card repeats: discover tools live, never invent Claude tool names, fan-out ≤3 specialists, \`startup\` + \`conversation_key\` when MCP is present, GrokBot undefined.
`);

// Every skill's agents/openai.yaml names icons that exist (task #1024:
// jo-release-journal shipped "./assets/jo.svg" with no such file, so the
// OpenAI surfaces showed that skill without an icon).
const skillsRoot = join(root, pluginDir, "skills");
if (existsSync(skillsRoot)) {
  for (const d of readdirSync(skillsRoot, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const y = join(skillsRoot, d.name, "agents", "openai.yaml");
    if (!existsSync(y)) continue;
    for (const m of readFileSync(y, "utf8").matchAll(/^\s*icon_[a-z]+:\s*"?([^"\n]+?)"?\s*$/gm)) {
      if (!existsSync(join(skillsRoot, d.name, m[1])))
        problems.push(`${pluginDir}/skills/${d.name}/agents/openai.yaml: icon ${m[1]} does not exist`);
    }
  }
}

// Write or check.
let drift = 0;
for (const [rel, text] of out) {
  const p = join(root, rel);
  const cur = existsSync(p) ? readFileSync(p, "utf8") : null;
  if (cur !== text) {
    drift++;
    if (!check) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); }
  }
}
for (const x of problems) console.log(`  FAIL  ${x}`);
for (const x of notes) console.log(`  WARN  ${x}`);
const bar = (p) => `${String(Math.round(p * 100)).padStart(3)}%`;
console.log(`  ${"role".padEnd(12)}${"est.tokens".padStart(11)}${"baseline".padStart(10)}   gpt  m365  grok  copilot`);
for (const r of report) console.log(`  ${r.id.padEnd(12)}${String(r.tokens).padStart(11)}${String(r.base ?? "-").padStart(10)}  ${bar(r.pct.gpt)}  ${bar(r.pct.m365)}  ${bar(r.pct.grok)}  ${bar(r.pct.copilot)}`);
console.log(`${check ? "checked" : "wrote"} ${out.size} files for ${pack.agents.length} roles (${drift} ${check ? "out of date" : "changed"})`);
process.exit(problems.length || (check && drift) ? 1 : 0);
