# Studio Host Adapters

Studio is one roster. `skills/` holds the canonical personalities and operating
rules; `contracts/` holds shared governance; these files are native host entry
points.

| Host | Entry point |
| --- | --- |
| Codex | `.codex-plugin` plus `skills/` |
| Claude / Claude Code | `.claude-plugin` plus `skills/` |
| Copilot | `copilot/.github/agents/studio.agent.md` |
| Gemini | `gemini/GEMINI.md` |
| ChatGPT | `chatgpt/GPT-INSTRUCTIONS.md` |

Install the whole Studio directory with its canonical `skills/`; adapters never
replace or abridge the role definitions.
