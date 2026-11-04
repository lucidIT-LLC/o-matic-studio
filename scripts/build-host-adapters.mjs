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
//   M365 Copilot agent     adapters/m365/<role>/appPackage/, declarative agent
//                          schema v1.9 and Teams app manifest v1.30. Name <= 100,
//                          short name <= 30, description <= 1,000, short
//                          description <= 80, instructions <= 8,000, starters
//                          <= 6 with unique titles. Tool pins, when present,
//                          come from adapters/m365/role-sources.json and stay
//                          read-only (at most 8). The server URL is a placeholder.
//   ChatGPT custom GPT     adapters/chatgpt/<role>/instructions.md <= 8,000 chars,
//                          knowledge = the role's SKILL.md (<= 20 files per GPT)
//   Grok custom agent      adapters/grok/<role>.md, instructions <= 4,000 chars
//                          (grok.com chat). Grok Bot is a different host.
//   Grok Bot               adapters/grok-bot/<role>.md paste descriptions, plus
//                          hand-authored skills/grok-<role>/SKILL.md when this
//                          pack ships one. The paste card must not call that host
//                          undefined.
//   Cursor 4.7             adapters/cursor/<role>.md + .cursor-plugin skills path;
//                          prompt substitutes for missing Claude hooks (Studio 1.11.0).
//                          Cursor is not a Grok Bot binding.
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
function condensed(a, { knowledgeFile, limit, omitServerLine = false }) {
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
  if (!omitServerLine) {
    L.push("- Work from what is in the conversation and what the host gives you. If this host has an o-MATIC Server connection configured, use it for factory memory, rules and records; if it does not, say so plainly and continue on your own. Never search for, guess, or ask for a server address.");
  }
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

// Microsoft 365 pins tools by name. These never belong on a Copilot principal:
// factory_query runs arbitrary SQL, startup writes a kernel session, and the
// rest change factory state. The server must also refuse writes; the pin is
// not the only boundary.
const M365_DENY_SET = new Set([
  "factory_query", "factory_owner_ddl", "startup",
  "kernel_session_open", "kernel_plan_update", "kernel_session_get", "kernel_delegate", "kernel_return",
  "module_install", "module_uninstall", "mom_signal_append", "retrieval_tune",
  "factory_web_publish", "factory_web_rollback", "factory_web_status",
  "proposal_vault_put", "proposal_vault_append", "proposal_vault_delete",
  "proposal_vault_upload_start", "proposal_vault_upload_chunk", "proposal_vault_upload_commit",
  "proposal_vault_organize", "proposal_vault_ingest", "proposal_vault_stage",
  "proposal_vault_transfer_batch", "proposal_vault_restore", "proposal_vault_purge",
  "slate_revision_commit", "slate_revision_restore", "slate_asset_put", "slate_canvas_create",
  "slate_proposal_create", "slate_proposal_approve", "slate_proposal_reject",
  "work_claim_acquire", "work_claim_release", "ocr_folder_process",
]);
const M365_DENY_RE = /^(kernel_|factory_owner|factory_web_|work_claim_|module_install|module_uninstall)/;
const M365_TOOL_DESC = {
  connections_list: "List the factory connections the signed-in user is allowed to read.",
  omatic_guide: "Read the on-demand guide for one named o-MATIC topic.",
  search: "Search factory records the signed-in user is allowed to read.",
  task_relationships: "Read relationships between factory tasks the signed-in user can see.",
  task_duplicate_check: "Report whether a similar factory task already exists.",
  slate_entity_search: "Search Slate entities the signed-in user is allowed to read.",
  slate_entity_verify: "Read a Slate entity and report whether it matches the claim.",
  slate_canvas_open: "Open a Slate canvas the signed-in user is allowed to read.",
  slate_scene_observe: "Read the scene on a Slate canvas the signed-in user can see.",
  slate_asset_get: "Read one Slate asset the signed-in user is allowed to read.",
  module_status: "Report which add-on modules are installed.",
  proposal_vault_list: "List files in a file-vault folder the signed-in user can read.",
  proposal_vault_get: "Read one file-vault record the signed-in user is allowed to see.",
  ocr_result_get: "Read extracted text for a file the signed-in user is allowed to see.",
  db_health_snapshot: "Return a read-only health snapshot of a factory database.",
};
const starterKey = (text) => String(text || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[.?!]+$/, "");
const titledStarters = (a) => {
  const y = join(dirname(join(root, a.canonical_skill)), "agents", "openai.yaml");
  const raw = [];
  if (existsSync(y)) {
    const m = readFileSync(y, "utf8").match(/default_prompt:\s*"([^"]+)"/);
    if (m) raw.push(m[1]);
  }
  for (const t of a.triggers) {
    if (/^[A-Z][a-z]+$/.test(t)) continue;
    raw.push(`${a.display_name}, ${t}.`);
  }
  const seen = new Set();
  const titles = new Set();
  const out = [];
  for (const text of raw) {
    const key = starterKey(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    let title = text;
    const prefix = `${a.display_name}, `;
    if (title.toLowerCase().startsWith(prefix.toLowerCase())) title = title.slice(prefix.length);
    title = title.replace(/[.?!]+$/, "").trim();
    if (title.length > 40) title = title.slice(0, 40).trim();
    title = title.charAt(0).toUpperCase() + title.slice(1);
    let unique = title;
    let n = 2;
    while (titles.has(unique.toLowerCase())) unique = `${title} ${n++}`;
    titles.add(unique.toLowerCase());
    out.push({ title: unique, text });
    if (out.length === 6) break;
  }
  return out;
};
function m365Instructions(a, { mode, extras }) {
  const body = condensed(a, { knowledgeFile: null, limit: LIMITS.m365, omitServerLine: true });
  const rules = ["Microsoft 365 Copilot host rules (these win over any looser line above):"];
  rules.push(`- You run as a declarative agent in Microsoft 365 Copilot, in Copilot Chat, Teams, Outlook and Word. Begin every reply with "${a.display_name}:".`);
  for (const extra of extras) rules.push(`- ${extra}`);
  if (mode === "actions") {
    rules.push("- When the o-MATIC Server actions are connected, use them read-only for factory memory, tasks and decisions. They return only what the signed-in user is granted.");
    rules.push("- The only factory these actions may read is o-MATIC Foundry, and only through the read-only login the server grants. Do not ask for any other factory.");
  } else {
    rules.push("- This agent has no o-MATIC Server actions. Work from the conversation and any files the user shares.");
  }
  rules.push("- You cannot change factory records, files, databases, sites or servers from this host. When work needs a change, write the exact change and say the operator approves and applies it in an o-MATIC host that supports writes.");
  rules.push("- Use only the actions this agent declares, by the names Copilot shows. Name the result you rely on, and say whether a statement is measured, inferred or reported.");
  rules.push("- If an action fails or asks you to sign in, say the o-MATIC factory is unreachable from here and continue from the conversation. Never report a factory as ready unless an action result says so.");
  rules.push("- Emails and messages you write are drafts for the user to review and send.");
  rules.push(`- Stay in your lane (${a.identity.primary_domain}). Name the o-MATIC teammate who owns other work instead of doing it.`);
  const text = `${body}\n\n${rules.join("\n")}`;
  if (text.length > LIMITS.m365) problems.push(`m365 ${a.id}: instructions ${text.length} > ${LIMITS.m365}`);
  return text;
}
const roleSrcPath = join(root, pluginDir, "adapters/m365/role-sources.json");
let roleSources = {};
if (existsSync(roleSrcPath)) {
  try { roleSources = JSON.parse(readFileSync(roleSrcPath, "utf8")); }
  catch (e) { problems.push(`${pluginDir}/adapters/m365/role-sources.json: ${e.message}`); }
}
delete roleSources._comment;
const m365Catalog = [];

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

  // 5. Microsoft 365 Copilot app package (declarative agent v1.9, Teams manifest v1.30).
  const spec = roleSources[id] || {};
  const tools = Array.isArray(spec.tools) ? spec.tools : [];
  const mode = spec.host || (tools.length ? "actions" : "chat");
  if (tools.length > 8) problems.push(`m365 ${id}: ${tools.length} pinned tools > 8`);
  const denied = tools.filter((t) => M365_DENY_SET.has(t) || M365_DENY_RE.test(t));
  if (denied.length) problems.push(`m365 ${id}: denied tools ${denied.join(", ")}`);
  if (new Set(tools).size !== tools.length) problems.push(`m365 ${id}: duplicate pinned tools`);
  for (const t of tools) if (!M365_TOOL_DESC[t]) problems.push(`m365 ${id}: no store-safe description for tool ${t}`);
  const starterList = Array.isArray(spec.starters) && spec.starters.length
    ? spec.starters.map((s) => ({ title: s.title, text: s.text }))
    : titledStarters(a);
  const seenStarter = new Set();
  const seenTitle = new Set();
  for (const s of starterList) {
    const key = starterKey(s.text);
    if (!s.title) problems.push(`m365 ${id}: a conversation starter has no title`);
    if (seenStarter.has(key)) problems.push(`m365 ${id}: duplicate starter "${s.text}"`);
    if (s.title && seenTitle.has(String(s.title).toLowerCase())) problems.push(`m365 ${id}: duplicate starter title "${s.title}"`);
    seenStarter.add(key);
    if (s.title) seenTitle.add(String(s.title).toLowerCase());
  }
  if (starterList.length > 6) problems.push(`m365 ${id}: more than 6 starters`);
  const m365 = m365Instructions(a, { mode, extras: Array.isArray(spec.hostExtra) ? spec.hostExtra : [] });
  const agentName = `${a.display_name} (o-MATIC)`;
  const agentDesc = shortDesc(a).slice(0, LIMITS.m365_desc);
  const shortApp = String(spec.shortDescription || a.role).slice(0, 80);
  const fullName = `${a.display_name}, ${a.role} from o-MATIC`;
  if (agentName.length > 30) problems.push(`m365 ${id}: short name ${agentName.length} > 30`);
  if (agentName.length > LIMITS.m365_name) problems.push(`m365 ${id}: agent name > ${LIMITS.m365_name}`);
  if (fullName.length > 100) problems.push(`m365 ${id}: full name > 100`);
  const da = {
    $schema: "https://developer.microsoft.com/json-schemas/copilot/declarative-agent/v1.9/schema.json",
    version: "v1.9",
    name: agentName.slice(0, LIMITS.m365_name),
    description: agentDesc,
    instructions: "$[file('instructions.txt')]",
    conversation_starters: starterList.slice(0, 6).map((s) => ({ title: s.title, text: s.text })),
    agent_skills: [
      { folder: `./skills/m365-${id}` },
      { folder: `./skills/${s.name}` },
    ],
  };
  const caps = Array.isArray(spec.capabilities) ? spec.capabilities : [];
  for (const c of caps) if (c !== "CodeInterpreter") problems.push(`m365 ${id}: capability ${c} is not allowed`);
  if (caps.length) da.capabilities = caps.map((name) => ({ name }));
  if (tools.length) da.actions = [{ id: "omaticServer", file: "ai-plugin.json" }];
  const pkg = `${pluginDir}/adapters/m365/${id}/appPackage`;
  put(`${pkg}/instructions.txt`, m365);
  put(`${pkg}/declarativeAgent.json`, JSON.stringify(da, null, 2));
  put(`${pkg}/manifest.json`, JSON.stringify({
    $schema: "https://developer.microsoft.com/json-schemas/teams/v1.30/MicrosoftTeams.schema.json",
    manifestVersion: "1.30",
    version: plugin.version,
    id: "${{TEAMS_APP_ID}}",
    developer: {
      name: "lucidIT, LLC (o-MATIC)",
      websiteUrl: "https://o-matic.ai",
      privacyUrl: "${{TODO_OMATIC_PRIVACY_URL}}",
      termsOfUseUrl: "${{TODO_OMATIC_TERMS_URL}}",
    },
    icons: { color: "color.png", outline: "outline.png" },
    name: { short: agentName.slice(0, 30), full: fullName.slice(0, 100) },
    description: { short: shortApp, full: agentDesc },
    accentColor: "#00B5AD",
    copilotAgents: { declarativeAgents: [{ id: `${id}Agent`, file: "declarativeAgent.json" }] },
    permissions: ["identity"],
    validDomains: [],
  }, null, 2));
  if (tools.length) {
    put(`${pkg}/ai-plugin.json`, JSON.stringify({
      $schema: "https://developer.microsoft.com/json-schemas/copilot/plugin/v2.4/schema.json",
      schema_version: "v2.4",
      name_for_human: agentName.slice(0, LIMITS.m365_name),
      description_for_human: `Read-only o-MATIC Server tools for ${a.display_name}.`,
      namespace: `omatic${id}`,
      functions: tools.map((name) => ({ name, capabilities: { confirmation: { type: "None" } } })),
      runtimes: [{
        type: "RemoteMCPServer",
        auth: { type: "OAuthPluginVault", reference_id: "${{TODO_OMATIC_ENTRA_SSO_AUTH_ID}}" },
        run_for_functions: tools,
        spec: { url: "${{OMATIC_MCP_URL}}", mcp_tool_description: { file: "mcp-tools.json" } },
      }],
      privacy_policy_url: "${{TODO_OMATIC_PRIVACY_URL}}",
      legal_info_url: "${{TODO_OMATIC_TERMS_URL}}",
    }, null, 2));
    put(`${pkg}/mcp-tools.json`, JSON.stringify({
      tools: tools.map((name) => ({
        name,
        description: M365_TOOL_DESC[name] || name,
        inputSchema: { type: "object", additionalProperties: true },
      })),
    }, null, 2));
  }
  const colorOn = existsSync(join(root, pkg, "color.png"));
  const outlineOn = existsSync(join(root, pkg, "outline.png"));
  if (!colorOn || !outlineOn) {
    put(`${pkg}/icon-pending.txt`, [
      "icon-pending",
      `color: ${colorOn ? "present" : "missing"}`,
      `outline: ${outlineOn ? "present" : "missing"}`,
      "Real art is a follow-up. This file marks the gap. Do not invent a stand-in.",
    ].join("\n"));
  }
  m365Catalog.push({ id, display: a.display_name, tools, mode, colorOn, outlineOn, note: spec.note || "", wave: spec.wave || "" });

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
${titledStarters(a).map((t) => `   - ${t.text}`).join("\n")}
`);

  // 7. Grok (grok.com) custom agent — gold-record voice plus specialist ritual
  // inside the 4k paste limit. Grok Bot is a different host; this paste only
  // points at it. The Bot ritual lives in skills/grok-* and adapters/grok-bot/.
  const grokName = `grok-${id}`;
  const grokShips = existsSync(join(root, pluginDir, "skills", grokName, "SKILL.md"));
  const grokPointer = grokShips ? ` Paste \`adapters/grok-bot/${id}.md\` and load \`${grokName}\` by name.` : "";
  const grokRitual = `

## MCP startup (when this host has o-MATIC Server)

- First call, when o-MATIC Server is configured: \`startup(connection=…, conversation_key=…)\` with Probot's key when one is already in the conversation. Do not mint a key. Render the card; believe \`state\` — never invent READY/DEGRADED/BLOCKED. If no key is present, omit \`conversation_key\` and say the kernel was not joined.
- Copy Probot's \`conversation_key\` into every \`kernel_*\` call — never mint a second key. Probot owns the plan; join via \`kernel_delegate\` / \`kernel_return\` when scoped.
- Specialist limit: at most 3 specialists in flight for one operator turn; prefer the resident kernel trio before stacking overlays (a house limit; the connected factory may set its own).
- If \`session_tool_surface\` is UNVERIFIED or tools look stale: reconnect MCP multi-host — Grok Bot: reconnect the o-MATIC Server connector on this bot; Cursor: Settings → MCP / Reload Window; Codex: new session or reconnect MCP; Claude Code: \`/mcp\` then reconnect; generic: reconnect Streamable HTTP MCP. Never Claude-only.
- Call \`omatic_guide\` before claiming a factory capability when unsure.
- Discover live tools before naming them. Never invent Claude Code tool names.
- Grok Bot is a defined host, separate from this grok.com paste and from Cursor.${grokPointer} Writes wait for explicit approval of the exact content. Outgoing messages stay drafts. Do not reuse a Cursor binding or principal.
`;
  const grokBody = condensed(a, { knowledgeFile: null, limit: LIMITS.grok - grokRitual.length }) + grokRitual;
  put(`${pluginDir}/adapters/grok/${id}.md`, grokBody);

  // 7b. Grok Bot paste description. The host skill (skills/grok-<id>/) is
  // hand-authored; this card is the ready-to-paste Bot description and stays
  // inside the gold-record voice. Studio specialists join Probot's key,
  // except a bot whose standing key is recorded on its host skill.
  if (grokShips) {
    const grokBotAbout = {
      carver: "I turn approved intent into working software. A repo, database, or server change waits for your yes.",
    }[id] || `I am ${a.display_name} from o-MATIC. I stay in my lane and wait for your yes before I write.`;
    if ([...grokBotAbout].length > 140) problems.push(`grok-bot ${id}: About line ${[...grokBotAbout].length} > 140`);
    const grokBotLane = {
      carver: "You are the Carver bot. Probot owns the plan. Fred owns files. Data owns factory database mutations. You implement approved software and return evidence. A repo, database, or server-config write waits for the operator's own chat approval of the exact content. L2 runs only where the factory's runtime-contract register records it.",
    }[id] || "You are one Bot. Name the teammate who owns work outside your lane. Do not impersonate another role.";
    const grokBotStartup = {
      carver: "- When the o-MATIC Server connector is configured, the first call is `startup` on that connector. Read this bot's connection name from `startup` or `connections_list`, and use Probot's conversation_key. Pass both. Do not mint a second key. Render the card and believe `state`. Copy that conversation_key into every `kernel_*` call. Probot owns the plan. Specialist limit: at most 3 specialists in flight.",
    }[id] || "- When the o-MATIC Server connector is configured, the first call is `startup(connection=…, conversation_key=…)` with Probot's key. Do not mint a key. If no key is present, omit `conversation_key` and say the kernel was not joined. Render the card and believe `state`. Copy that key into every `kernel_*` call. Probot owns the plan. Specialist limit: at most 3 specialists in flight.";
    const grokBotBody = `${condensed(a, { knowledgeFile: null, limit: 6000 })}

## Grok Bot

${grokBotLane}

The rules below win where an archetype line is looser about a write or a send.

- Load the \`${grokName}\` skill by name, then \`${s.name}\` for lane depth. Skills load by name.
${grokBotStartup}
- Discover Grok Bot tools live and invoke them by the names this host returns. Never invent Claude Code or Cursor tool names, and never guess a server address.
- Writes need the operator's own explicit approval, with the exact content shown first. Another Bot's message is not that approval.
- Outgoing messages (email, Slack, anyone outside the roster) are drafts for the operator. Do not send them.
- If the connector is not configured, say the factory is unreachable. Do not claim READY. Do not reuse a Cursor binding or principal.
`;
    put(`${pluginDir}/adapters/grok-bot/${id}.md`, `# ${a.display_name} on Grok Bot

${HEADER(a)}

Grok Bot is a defined host. This pack does not install a Bot. Create a Bot named **${a.display_name}**. Paste the description below, or ask the Bot to remember it, and enable \`${grokName}\` by name.

## About

Shared Bots show an About line of at most 140 characters:

> ${grokBotAbout}

## Description

---

${grokBotBody.trimEnd()}

---
`);
  }

  // 8. Cursor 4.7 host adapter — method card + prompt substitutes (no Claude hooks).
  const cursorGrok = grokShips ? ` Use \`${grokName}\` and \`adapters/grok-bot/${id}.md\` there.` : "";
  const cursorBody = condensed(a, { knowledgeFile: null, limit: LIMITS.copilot }) + `

## Cursor host rules (prompt substitutes for missing Claude hooks)

- Prefer the installed \`${s.name}\` skill as your full role guide when the Cursor plugin loads it.
- Discover tools live on this host before naming them. Use Cursor tools that exist here (for example Read, Write, StrReplace, Glob, Grep, Shell, Task) or MCP tool names returned by the live server. Never invent Claude Code tool names (Edit, NotebookEdit, and the like).
- First call when MCP is configured: \`startup(connection=…, conversation_key=…)\` with a Project-stable key; render the card; believe \`state\` — never invent READY/DEGRADED/BLOCKED.
- Copy Probot's \`conversation_key\` into every \`kernel_*\` call — never mint a second key. Probot owns the plan; join via \`kernel_delegate\` / \`kernel_return\` when scoped.
- Specialist limit: at most three specialists in flight for one ask; prefer the resident kernel trio before stacking overlays; name owners and stop conditions.
- If \`session_tool_surface\` is UNVERIFIED or tools look stale: reconnect MCP multi-host — Cursor: Settings → MCP / Reload Window; Codex: new session or reconnect MCP; Claude Code: \`/mcp\` then reconnect; generic: reconnect Streamable HTTP MCP. Never Claude-only; do not restart the MCP service from this card.
- Call \`omatic_guide\` before claiming a factory capability when unsure.
- Grok Bot is a defined host, separate from this Cursor session.${cursorGrok} Do not reuse a Cursor principal as one.
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
  // chars and lanes belong to check-skills.mjs. A baseline refresh must not drop them.
  const preserved = {};
  if (budget?.chars) preserved.chars = budget.chars;
  if (budget?.lanes) preserved.lanes = budget.lanes;
  writeFileSync(budgetPath, JSON.stringify({
    _comment: "Per-role SKILL.md size baselines (task #1052). Estimated tokens = ceil(chars/4) of each canonical SKILL.md body. The build fails on growth past baseline plus slack; change it only with build-host-adapters.mjs --update-baseline, and justify any increase in review. chars and lanes are the check-skills.mjs body budget and are preserved by this refresh.",
    slack,
    roles,
    ...preserved,
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

// Host skills are hand-authored next to the canonical skills. The matrix and
// the install notes name the ones this pack actually ships (grok-<role>).
const grokShipped = pack.agents.filter((a) =>
  existsSync(join(root, pluginDir, "skills", `grok-${a.id}`, "SKILL.md")));
const grokNames = grokShipped
  .map((a) => `\`${a.display_name}\` (\`grok-${a.id}\`)`)
  .join(", ");
const grokCanonical = grokShipped
  .map((a) => {
    const parts = a.canonical_skill.split("/");
    return `\`${parts[parts.length - 2] || a.id}\``;
  })
  .join(", ");
const humanList = (items, conjunction) => {
  if (items.length <= 1) return items[0] || "the role";
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
};
const grokBotNames = grokShipped.map((a) => a.display_name);

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
| Microsoft 365 Copilot | app | \`adapters/m365/<role>/appPackage/\` (declarative agent v1.9) | \`node scripts/build-m365-packages.mjs\`. Sources only; unpublished until SSO and the read-only database login |
| ChatGPT | chat | \`adapters/chatgpt/<role>/\` instructions + SETUP | create a custom GPT; upload the role guide as knowledge |
| Grok (grok.com) | chat | \`adapters/grok/<role>.md\` | paste into a Custom Agent's instructions. This is not Grok Bot. |
| Cursor 4.7 | skills + method cards | \`.cursor-plugin\` + \`adapters/cursor/<role>.md\` | add this repo as a Cursor marketplace / install \`${plugin.name}\`; see \`adapters/cursor/INSTALL.md\`. Status: design verified until skill discovery is measured on the host. |
| Grok Bot | separate bots + host skills | \`skills/grok-<role>/\` + \`adapters/grok-bot/<role>.md\` when this pack ships one${grokShipped.length ? ` (${grokShipped.map((a) => a.display_name).join(", ")})` : ""} | create one Bot per role, paste the description, enable \`grok-<role>\` by name. See \`adapters/grok-bot/INSTALL.md\`. Grok Bot is a defined host. Factory READY only from \`startup\`. |

Limits enforced at build time: GPT and M365 instructions <= 8,000 characters,
Grok <= 4,000, Copilot <= 30,000, M365 name <= 100 and description <= 1,000,
M365 app short name <= 30 and short description <= 80. A Copilot plugin pins
at most 8 read-only tools. \`factory_query\`, \`startup\`, and write tools are refused.
`);

const iconCell = (row) => {
  if (row.colorOn && row.outlineOn) return "color and outline present";
  const parts = [];
  parts.push(row.colorOn ? "color present" : "color missing");
  parts.push(row.outlineOn ? "outline present" : "outline missing");
  return `icon-pending (${parts.join(", ")})`;
};
put(`${pluginDir}/adapters/m365/CATALOG.md`, `# Microsoft 365 Copilot packages

${HEADER({ canonical_skill: "each role's SKILL.md" })}

One app per role. These files are sources. Nothing in this directory is deployed.
Build the zip packages with \`node scripts/build-m365-packages.mjs\`. They stay
unpublished until Microsoft 365 SSO is live and the server has a read-only
database login for Copilot.

Tool-using agents may read one factory first: o-MATIC Foundry, read-only, and
only through the login the server grants. The package does not name a server
host. Privacy and terms URLs are \`\${{TODO_…}}\` placeholders.

| Role | Wave | Tools | Icons | Notes |
|---|---|---|---|---|
${m365Catalog.map((row) => `| ${row.display} | ${row.wave || "—"} | ${row.tools.length ? row.tools.join(", ") : "none"} | ${iconCell(row)} | ${row.note || (row.mode === "chat" ? "Chat-only." : "")} |`).join("\n")}
`);

put(`${pluginDir}/adapters/m365/INSTALL.md`, `# Microsoft 365 Copilot — ${packName}

${HEADER({ canonical_skill: "each role's SKILL.md" })}

Each role is its own Teams app. An app holds one declarative agent. The
packages in \`appPackage/\` are the source. They are not sideloaded, not in the
org catalog, and not in the Agent Store.

## Build

From the repository root:

\`\`\`
node scripts/verify-m365.mjs .
node scripts/build-m365-packages.mjs .
\`\`\`

Zips are written to \`dist/m365/\`, which is gitignored. \`verify-m365.mjs\` checks
the committed manifests against Microsoft's published JSON schemas and checks
icon sizes. A missing icon is \`icon-pending\` (a warning). A present icon at
the wrong size fails.

The zip copies each role's canonical skill and a short \`m365-<role>\` host
skill into \`skills/\` inside the package. Those copies are build output.

## What is still TODO before anyone installs a package

- Replace \`\${{TODO_OMATIC_PRIVACY_URL}}\` and \`\${{TODO_OMATIC_TERMS_URL}}\` with the public privacy and terms pages.
- Replace \`\${{TEAMS_APP_ID}}\` with the app registration id. Do not commit a tenant id.
- Replace \`\${{OMATIC_MCP_URL}}\` and \`\${{TODO_OMATIC_ENTRA_SSO_AUTH_ID}}\` when SSO is live. See \`./env/.env.sample\`.
- The 192×192 color icon and the 32×32 white outline ship in each \`appPackage/\`. They are sized from the locked role SVG. A later master can replace \`color.png\` and \`outline.png\`.
- Publish only after SSO and the read-only database login exist.

## Roles

${m365Catalog.map((row) => `- **${row.display}** — \`./${row.id}/appPackage/\`. ${row.note || row.mode}`).join("\n")}
`);

put(`${pluginDir}/adapters/m365/env/.env.sample`, `# Deploy-time values for the Microsoft 365 Copilot packages.
# Leave these blank in git. Do not put a secret, a tenant id, or a private host here.
# Privacy policy and terms of use are TODO until the public pages exist.
TODO_OMATIC_PRIVACY_URL=
TODO_OMATIC_TERMS_URL=
TODO_OMATIC_ENTRA_SSO_AUTH_ID=
TEAMS_APP_ID=
OMATIC_MCP_URL=
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

Every \`adapters/cursor/<role>.md\` card mandates: first-call \`startup\` + Project-stable \`conversation_key\`, believe card \`state\`, copy Probot's key into \`kernel_*\` (Probot owns plan; join via delegate/return), the specialist limit (≤3), multi-host MCP reconnect (Cursor / Codex / Claude \`/mcp\` / generic — never Claude-only), \`omatic_guide\` before unsure capability claims. Grok Bot is a defined host and a separate binding. Do not reuse a Cursor principal as one.

Every \`adapters/grok/<role>.md\` card mandates the same startup, state, kernel, specialist-limit, reconnect, and \`omatic_guide\` rules, and joins Probot's \`conversation_key\` instead of minting one. Grok Bot is a defined host. That card is the grok.com paste, not a Grok Bot binding. Writes wait for explicit approval of the exact content. Outgoing messages stay drafts.

## Grok Bot

Grok Bot is a defined host and a separate binding. Do not reuse a Cursor principal as one. Paste descriptions live in \`adapters/grok-bot/\`. Skills load by name.
${grokShipped.length ? `Host skills shipped here: ${grokNames}. Each is additive to that role's canonical skill.` : `No \`grok-<role>\` skill is present for the roles in this pack.`}
`);

// Grok Bot install note (regenerated with the matrix). The skill bodies are
// hand-authored; this file is the operator-facing paste path.
const grokBotTitle = grokBotNames.length ? humanList(grokBotNames, "and") : packName;
put(`${pluginDir}/adapters/grok-bot/INSTALL.md`, `# Grok Bot — ${grokBotTitle}

${HEADER({ canonical_skill: "each role's SKILL.md" })}

Grok Bot is a defined host. Each role is its own Bot. This pack does not install a Bot and does not ship a public Bot template. Load the host skill by name and paste the description.

## Per Bot

1. Create a Bot named ${grokBotNames.length ? humanList(grokBotNames, "or") : "the role"}. Do not add or replace robot avatar art from this pack.
2. Paste the Description block from \`adapters/grok-bot/<role>.md\`, or ask the Bot to remember it. A shared Bot also gets the About line (140 characters or fewer).
3. Enable the host skill by name${grokShipped.length ? `: ${grokShipped.map((a) => `\`grok-${a.id}\``).join(", ")}` : ""}. Enable the canonical skill beside it${grokShipped.length ? ` (${grokCanonical})` : ""} for lane depth.
4. When factory memory is needed, connect the o-MATIC Server connector on the Grok Bot account. This pack ships no MCP server and no credentials. Read the connection name from the live tool list.
5. Use the conversation_key recorded on that bot's host skill. Do not mint a second key. Writes wait for the operator's own explicit approval of the exact content. Outgoing messages stay drafts for the operator.

Chat-form Grok (grok.com) remains \`adapters/grok/<role>.md\` (4,000 characters). Cursor remains \`adapters/cursor/\`. Do not reuse a Cursor binding as Grok Bot.

Factory READY comes only from \`startup\`. Do not claim it because this host exists.
${grokShipped.length ? "" : "\nNo \`grok-<role>\` skill is present for the roles in this pack.\n"}`);

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

// Grok Bot is a defined host. Generated cards, the matrix, and the install note
// must say so. An "undefined" binding is a stale instruction, not a caution.
const staleHost = ["GrokBot is ", "Grok Bot is "].map((p) => p + "undefined");
for (const [rel, text] of out) {
  if (staleHost.some((s) => text.includes(s)))
    problems.push(`${rel}: Grok Bot is a defined host; this file still says it is undefined`);
  if (/grokbot-/.test(text))
    problems.push(`${rel}: host skill prefix is grok-<role>, not grokbot-`);
}
for (const a of pack.agents) {
  for (const rel of [`${pluginDir}/adapters/grok/${a.id}.md`, `${pluginDir}/adapters/cursor/${a.id}.md`]) {
    if (!/Grok Bot is a defined host/.test(out.get(rel) || ""))
      problems.push(`${rel}: must state that Grok Bot is a defined host`);
  }
  const hostSkill = existsSync(join(root, pluginDir, "skills", `grok-${a.id}`, "SKILL.md"));
  const card = `${pluginDir}/adapters/grok-bot/${a.id}.md`;
  if (hostSkill && !/Grok Bot is a defined host/.test(out.get(card) || ""))
    problems.push(`${card}: must state that Grok Bot is a defined host`);
  if (!hostSkill && out.has(card))
    problems.push(`${card}: generated without a grok-${a.id} skill`);
}
for (const rel of [`${pluginDir}/adapters/README.md`, `${pluginDir}/adapters/cursor/INSTALL.md`, `${pluginDir}/adapters/grok-bot/INSTALL.md`]) {
  if (!/Grok Bot is a defined host/.test(out.get(rel) || ""))
    problems.push(`${rel}: must state that Grok Bot is a defined host`);
}

// The v1.6 single-file declarative agent is replaced by appPackage/.
for (const a of pack.agents) {
  const rel = `${pluginDir}/adapters/m365/${a.id}/declarativeAgent.json`;
  const legacy = join(root, rel);
  if (!existsSync(legacy)) continue;
  if (check) problems.push(`${rel}: legacy v1.6 file; the package now lives in appPackage/`);
  else rmSync(legacy);
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
