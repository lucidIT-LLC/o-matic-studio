#!/usr/bin/env node
// verify-m365.mjs — offline check for Microsoft 365 Copilot app sources.
//
// Validates each adapters/m365/<role>/appPackage manifest against the published
// schemas vendored in scripts/m365-schemas/ (declarative agent v1.9, plugin
// v2.4, Teams app manifest v1.30). Placeholders are filled with dummy values
// before validation. Missing icons warn (icon-pending). A present icon at the
// wrong size fails. Needs ajv-draft-04 and pngjs on NODE_PATH:
//   npm install --prefix /tmp/m365-ajv ajv@8.17.1 ajv-draft-04@1.0.0 pngjs@7.0.0
//   NODE_PATH=/tmp/m365-ajv/node_modules node scripts/verify-m365.mjs .
import { createRequire } from "node:module";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(process.argv[2] || ".");
const here = dirname(fileURLToPath(import.meta.url));
const schemaDir = join(here, "m365-schemas");

function loadPkg(pkg) {
  const bases = [
    join(root, "node_modules"),
    join(here, "node_modules"),
    ...String(process.env.NODE_PATH || "").split(":"),
    "/tmp/m365-ajv/node_modules",
  ].filter((base) => base && existsSync(join(base, pkg, "package.json")));
  if (!bases.length) {
    throw new Error(`missing ${pkg}. npm install --prefix /tmp/m365-ajv ajv@8.17.1 ajv-draft-04@1.0.0 pngjs@7.0.0`);
  }
  const req = createRequire(join(bases[0], pkg, "package.json"));
  const mod = req(pkg);
  return mod.default || mod;
}

let Ajv;
let PNG;
try {
  Ajv = loadPkg("ajv-draft-04");
  PNG = loadPkg("pngjs").PNG;
} catch (e) {
  console.error("verify-m365 needs ajv-draft-04 and pngjs.");
  console.error("npm install --prefix /tmp/m365-ajv ajv@8.17.1 ajv-draft-04@1.0.0 pngjs@7.0.0");
  console.error("NODE_PATH=/tmp/m365-ajv/node_modules node scripts/verify-m365.mjs .");
  console.error(e.message);
  process.exit(2);
}

const SUBST = {
  "${{TODO_OMATIC_PRIVACY_URL}}": "https://todo.example/privacy",
  "${{TODO_OMATIC_TERMS_URL}}": "https://todo.example/terms",
  "${{TODO_OMATIC_ENTRA_SSO_AUTH_ID}}": "00000000-0000-0000-0000-000000000001",
  "${{TEAMS_APP_ID}}": "00000000-0000-0000-0000-000000000000",
  "${{OMATIC_MCP_URL}}": "https://mcp.example/mcp",
};
const fill = (value) => {
  if (typeof value === "string") {
    let next = value;
    for (const [from, to] of Object.entries(SUBST)) next = next.split(from).join(to);
    return next;
  }
  if (Array.isArray(value)) return value.map(fill);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v)]));
  }
  return value;
};

const DENY = new Set([
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
const DENY_RE = /^(kernel_|factory_owner|factory_web_|work_claim_|module_install|module_uninstall)/;
const PRIVACY_URL = "https://www.o-matic.ai/privacy-policy/";
const TERMS_URL = "https://www.o-matic.ai/terms-of-service/";
const ALLOWED_HTTP = new Set([
  "https://o-matic.ai",
  PRIVACY_URL,
  TERMS_URL,
  "https://developer.microsoft.com/json-schemas/copilot/declarative-agent/v1.9/schema.json",
  "https://developer.microsoft.com/json-schemas/copilot/plugin/v2.4/schema.json",
  "https://developer.microsoft.com/json-schemas/teams/v1.30/MicrosoftTeams.schema.json",
]);

const ajv = new Ajv({ allErrors: true, strict: false, logger: false });
const compile = (name) => ajv.compile(JSON.parse(readFileSync(join(schemaDir, name), "utf8")));
const validators = {
  agent: compile("declarative-agent-1.9.json"),
  plugin: compile("plugin-2.4.json"),
  teams: compile("teams-1.30.json"),
};

let fails = 0;
let warns = 0;
const FAIL = (m) => { console.log(`  FAIL  ${m}`); fails++; };
const WARN = (m) => { console.log(`  WARN  ${m}`); warns++; };
const OK = (m) => console.log(`  ok    ${m}`);
const errorsOf = (validate) => (validate.errors || []).slice(0, 6).map((e) => `${e.instancePath || "/"} ${e.message}`).join("; ");

const walk = (dir) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (name === ".git" || name === "node_modules" || name === "dist") return [];
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
};

const manifests = walk(root).filter((p) => /\/adapters\/m365\/[^/]+\/appPackage\/manifest\.json$/.test(p)).sort();

console.log(`\n=== Microsoft 365 Copilot packages — ${root} ===\n`);
if (!manifests.length) {
  console.log("no Microsoft 365 app packages");
  process.exit(0);
}

let packAgents = [];
const packPath = join(root, "agent-pack.json");
if (existsSync(packPath)) packAgents = JSON.parse(readFileSync(packPath, "utf8")).agents || [];
const byId = new Map(packAgents.map((a) => [a.id, a]));

let pluginVersion = null;
const pluginFiles = walk(root).filter((p) => p.endsWith("/.claude-plugin/plugin.json") && !p.includes("/.claude-plugin/marketplace.json"));
for (const p of pluginFiles) {
  try {
    const parsed = JSON.parse(readFileSync(p, "utf8"));
    if (parsed.version) pluginVersion = parsed.version;
  } catch { /* a later verify-pack step reports invalid plugin JSON */ }
}

const iconPending = [];

for (const manifestPath of manifests) {
  const dir = dirname(manifestPath);
  const role = dir.split("/").at(-2);
  const label = `${role}`;
  const rawManifest = readFileSync(manifestPath, "utf8");
  const agentPath = join(dir, "declarativeAgent.json");
  const instructionsPath = join(dir, "instructions.txt");
  const pluginPath = join(dir, "ai-plugin.json");
  const toolsPath = join(dir, "mcp-tools.json");
  const pendingPath = join(dir, "icon-pending.txt");

  for (const [file, text] of [[manifestPath, rawManifest]]) {
    for (const match of text.matchAll(/https?:\/\/[^\s"'\\]+/g)) {
      const url = match[0].replace(/[$.,)]+$/, "");
      if (!ALLOWED_HTTP.has(url)) FAIL(`${label}: baked URL ${url}`);
    }
    if (/[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}/.test(text)) FAIL(`${label}: a GUID is baked into ${file}`);
  }

  let manifest;
  let agent;
  try { manifest = JSON.parse(rawManifest); }
  catch (e) { FAIL(`${label}: manifest.json ${e.message}`); continue; }
  if (!existsSync(agentPath)) { FAIL(`${label}: declarativeAgent.json missing`); continue; }
  try { agent = JSON.parse(readFileSync(agentPath, "utf8")); }
  catch (e) { FAIL(`${label}: declarativeAgent.json ${e.message}`); continue; }

  if (manifest.developer?.privacyUrl !== PRIVACY_URL || manifest.developer?.termsOfUseUrl !== TERMS_URL) {
    FAIL(`${label}: privacy and terms must be the public pages (pending legal review)`);
  }
  if (pluginVersion && manifest.version !== pluginVersion) {
    FAIL(`${label}: manifest version ${manifest.version} != plugin ${pluginVersion}`);
  }
  if (manifest.copilotAgents?.declarativeAgents?.length !== 1) FAIL(`${label}: an app must list exactly one declarative agent`);

  const filledManifest = fill(manifest);
  const dev = filledManifest.developer || {};
  for (const url of [dev.websiteUrl, dev.privacyUrl, dev.termsOfUseUrl]) {
    if (typeof url !== "string" || !/^https:\/\//.test(url)) FAIL(`${label}: developer URL is not https: ${url}`);
  }
  if (!validators.teams(filledManifest)) FAIL(`${label}: app manifest schema: ${errorsOf(validators.teams)}`);
  else OK(`${label}: app manifest v1.30`);

  if (!existsSync(instructionsPath)) FAIL(`${label}: instructions.txt missing`);
  else {
    const instructions = readFileSync(instructionsPath, "utf8");
    if (instructions.length > 8000) FAIL(`${label}: instructions ${instructions.length} > 8000`);
    else OK(`${label}: instructions ${instructions.length} characters`);
    const persona = byId.get(role);
    if (persona) {
      const voice = `Voice: ${persona.identity.tone_of_record} Begin every reply with "${persona.display_name}:". Write in US English.`;
      const opening = `You are ${persona.display_name}, ${persona.role} from o-MATIC. ${persona.one_liner}`;
      const drift = `Drift check: ${persona.identity.drift_anchor}`;
      if (!instructions.includes(opening) || !instructions.includes(voice) || !instructions.includes(drift)) {
        FAIL(`${label}: persona lines do not match the gold record`);
      } else OK(`${label}: persona lines match the gold record`);
    }
    const expanded = fill({ ...agent, instructions });
    if (!validators.agent(expanded)) FAIL(`${label}: declarative agent (instructions expanded): ${errorsOf(validators.agent)}`);
    else OK(`${label}: declarative agent v1.9`);
  }
  const filledAgent = fill(agent);
  if (!validators.agent(filledAgent)) FAIL(`${label}: declarative agent schema: ${errorsOf(validators.agent)}`);

  const starters = agent.conversation_starters || [];
  if (starters.length < 3 || starters.length > 6) FAIL(`${label}: ${starters.length} starters; store packages keep 3 to 6`);
  const texts = new Set();
  const titles = new Set();
  for (const starter of starters) {
    if (!starter.title) FAIL(`${label}: starter missing a title`);
    const textKey = String(starter.text || "").trim().toLowerCase();
    const titleKey = String(starter.title || "").trim().toLowerCase();
    if (texts.has(textKey)) FAIL(`${label}: duplicate starter text`);
    if (titleKey && titles.has(titleKey)) FAIL(`${label}: duplicate starter title`);
    texts.add(textKey);
    titles.add(titleKey);
  }

  if (manifest.name?.short !== agent.name) FAIL(`${label}: app short name and agent name differ`);
  if ((manifest.description?.full || "") !== agent.description) FAIL(`${label}: app full description and agent description differ`);

  const names = [];
  if (existsSync(pluginPath)) {
    const rawPlugin = readFileSync(pluginPath, "utf8");
    for (const match of rawPlugin.matchAll(/https?:\/\/[^\s"'\\]+/g)) {
      const url = match[0].replace(/[$.,)]+$/, "");
      if (!ALLOWED_HTTP.has(url)) FAIL(`${label}: baked URL ${url}`);
    }
    let plugin;
    try { plugin = JSON.parse(rawPlugin); }
    catch (e) { FAIL(`${label}: ai-plugin.json ${e.message}`); plugin = null; }
    if (plugin) {
      if (plugin.privacy_policy_url !== PRIVACY_URL || plugin.legal_info_url !== TERMS_URL) {
        FAIL(`${label}: plugin privacy and terms must be the public pages (pending legal review)`);
      }
      if (plugin.name_for_human !== agent.name) FAIL(`${label}: plugin name and agent name differ`);
      const runtime = (plugin.runtimes || [])[0] || {};
      const pinned = runtime.run_for_functions || [];
      const declared = (plugin.functions || []).map((fn) => fn.name);
      if (pinned.length > 8 || declared.length > 8) FAIL(`${label}: more than 8 tools`);
      if (pinned.join("|") !== declared.join("|")) FAIL(`${label}: run_for_functions does not match functions`);
      if (pinned.includes("*")) FAIL(`${label}: wildcard tool discovery is not allowed`);
      for (const name of pinned) {
        if (DENY.has(name) || DENY_RE.test(name)) FAIL(`${label}: denied tool ${name}`);
        names.push(name);
      }
      const url = runtime.spec?.url || "";
      if (!url.includes("OMATIC_MCP_URL")) FAIL(`${label}: MCP server URL must stay a placeholder`);
      const filledPlugin = fill(plugin);
      const filledUrl = filledPlugin.runtimes?.[0]?.spec?.url || "";
      if (!/^https:\/\//.test(filledUrl)) FAIL(`${label}: MCP URL placeholder does not resolve to https`);
      for (const policy of [filledPlugin.privacy_policy_url, filledPlugin.legal_info_url]) {
        if (typeof policy !== "string" || !/^https:\/\//.test(policy)) FAIL(`${label}: plugin policy URL is not https`);
      }
      if (!validators.plugin(filledPlugin)) FAIL(`${label}: plugin schema: ${errorsOf(validators.plugin)}`);
      else OK(`${label}: plugin pins ${pinned.length} read-only tools`);
      if (!existsSync(toolsPath)) FAIL(`${label}: mcp-tools.json missing`);
      else {
        const toolsDoc = JSON.parse(readFileSync(toolsPath, "utf8"));
        const listed = (toolsDoc.tools || []).map((t) => t.name);
        if (listed.join("|") !== pinned.join("|")) FAIL(`${label}: mcp-tools.json names do not match the plugin`);
      }
    }
  } else if ((agent.actions || []).length) {
    FAIL(`${label}: actions declared without ai-plugin.json`);
  } else OK(`${label}: chat-only, no tools`);

  const readIcon = (name) => {
    const p = join(dir, name);
    if (!existsSync(p)) return null;
    return PNG.sync.read(readFileSync(p));
  };
  const color = readIcon("color.png");
  const outline = readIcon("outline.png");
  const missing = [];
  if (!color) missing.push("color");
  else if (color.width !== 192 || color.height !== 192) FAIL(`${label}: color.png is ${color.width}x${color.height}, expected 192x192`);
  else OK(`${label}: color.png 192x192`);
  if (!outline) missing.push("outline");
  else if (outline.width !== 32 || outline.height !== 32) FAIL(`${label}: outline.png is ${outline.width}x${outline.height}, expected 32x32`);
  else {
    let opaque = 0;
    let bad = 0;
    const data = outline.data;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) continue;
      opaque++;
      const white = data[i] >= 250 && data[i + 1] >= 250 && data[i + 2] >= 250;
      if (!white) bad++;
    }
    if (bad || opaque === 0) FAIL(`${label}: outline.png must be white on transparent`);
    else OK(`${label}: outline.png 32x32 white on transparent`);
  }
  if (missing.length) {
    warns++;
    const line = `${label}: icon-pending (${missing.join(", ")} missing)`;
    console.log(`  WARN  ${line}`);
    iconPending.push(line);
    if (!existsSync(pendingPath)) FAIL(`${label}: missing icon has no icon-pending.txt marker`);
  } else if (existsSync(pendingPath)) {
    FAIL(`${label}: both icons are present; remove icon-pending.txt`);
  }
}

console.log(`\n${fails ? "RESULT: FAIL" : "RESULT: PASS"} — ${manifests.length} package(s), ${fails} fail, ${warns} warn`);
if (iconPending.length) {
  console.log("icon-pending:");
  for (const line of iconPending) console.log(`  - ${line}`);
}
console.log("");
process.exit(fails ? 1 : 0);
