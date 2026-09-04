# Install O-Matic Studio

Studio is one portable specialist roster. Configure the target host's O-Matic
Server MCP pairing; this repository stores no credential.

- **Codex:** install `studio/` as a plugin.
- **Claude / Claude Code:** install `studio/` as a plugin.
- **Copilot:** copy `adapters/copilot/.github/` into the target workspace and
  keep Studio checked out alongside it.
- **Gemini:** copy `adapters/gemini/GEMINI.md`, `contracts/`, and `skills/` into
  the custom-agent workspace.
- **ChatGPT:** use `adapters/chatgpt/GPT-INSTRUCTIONS.md` with `contracts/` and
  `skills/` as source files and attach the O-Matic Server MCP application.

All hosts use the same role skills and personality. Host capabilities are added
only after live discovery and evaluation.

