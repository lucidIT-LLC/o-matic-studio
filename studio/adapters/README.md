# Studio Host Adapters

Studio is one roster. `../skills/` holds the canonical personalities and
operating rules, `../contracts/STUDIO-RUNTIME-CONTRACT.md` holds shared
governance, and `ROLE-CORE.md` is the shared adapter core every host file loads.
These files are native host entry points; they never replace or abridge a role.

| Host | Entry point | L1 | L2 |
| --- | --- | --- | --- |
| Claude / Claude Code | `claude/agents/` plus `../skills/` | Skills/subagents | SDK or bounded subagent after evaluation |
| Codex | `../.codex-plugin` plus `../skills/` | Plugin skills | Host agent harness after evaluation |
| Copilot | `copilot/.github/agents/` | Custom agents | Host automation after evaluation |
| Gemini | `gemini/GEMINI.md` | Custom-agent instructions/skills | Managed/custom workflow after evaluation |
| ChatGPT | `chatgpt/GPT-INSTRUCTIONS.md` | Agent instructions | Manager/specialist workflow after evaluation |

Copy or import the host directory together with `../contracts/`, `../skills/`,
and `../evals/`. **The Copilot adapter is the exception:** `copilot/.github/` is
a self-contained payload and carries its own contract copies under
`copilot/.github/omatic/`, because `INSTALL.md` sends it into a different
workspace where no relative path back into this pack resolves. Those copies are
generated — regenerate with `node ../scripts/sync-copilot-payload.mjs`, and
`--check` fails on drift.

Configure the o-MATIC Server MCP connection in the target host; never copy
credentials or connection names into this repository.

`node ../scripts/check-paths.mjs` resolves every relative file reference in the
pack and re-resolves the Copilot payload from a scratch workspace. It exits
non-zero on a broken reference.

Every adapter is intentionally **not deployed** at L2 until that host has
discovered its real tool surface and passed `../evals/studio-role-conformance.yaml`
— a suite that, as shipped, is version 1 prose with no runner and has never been
executed. Deployment state is read from `factory.agent_runtime_contracts`, never
from a file here.
