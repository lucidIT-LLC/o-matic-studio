# Install o-MATIC Studio

Studio is one portable specialist roster. Configure the target host's o-MATIC
Server MCP pairing; this repository stores no credential.

- **Claude / Claude Code:** install `studio/` as a plugin. For named subagents,
  point the host at `adapters/claude/agents/`. Each file loads the shared
  adapter core and the Studio runtime contract by relative path, which resolves
  while the directory stays in place inside the pack. A host that requires
  agents at a fixed location outside the pack must rewrite those two references
  on deployment — and must not pin a version-numbered plugin-cache path, which
  the next update breaks silently.
- **Codex:** install `studio/` as a plugin.
- **Copilot:** copy `adapters/copilot/.github/` into the target workspace. It is
  self-contained — its contract copies travel with it under `.github/omatic/` —
  so Studio does **not** need to be checked out alongside. Install `skills/`
  alongside as well if you want full canonical role depth rather than the
  governance boundary alone.
- **Gemini:** copy `adapters/gemini/GEMINI.md`, `contracts/`, and `skills/` into
  the custom-agent workspace.
- **ChatGPT:** use `adapters/chatgpt/GPT-INSTRUCTIONS.md` with `contracts/` and
  `skills/` as source files and attach the o-MATIC Server MCP application.

All hosts use the same role skills and personality. Host capabilities are added
only after live discovery and evaluation. L2 is off until
`factory.agent_runtime_contracts` records a registered, evaluated deployment;
no file in this pack grants it.

## Verify before you ship a change

```
node scripts/check-paths.mjs              # every relative reference resolves
node scripts/sync-copilot-payload.mjs --check   # vendored Copilot copies not drifted
claude plugin validate .
```
