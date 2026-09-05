<p align="center">
  <img src=".github/brand/omatic-wordmark.png" width="240" alt="o-MATIC" />
</p>

<p align="center">
  Built by <a href="https://o-matic.ai">o-MATIC</a>, the AI research division of <a href="https://lucidit.io">lucidIT, LLC</a>.
</p>

# o-MATIC Studio

**Get it designed and built.**

Brief a studio and something gets made — brand, code, visuals, words,
pictures. This is the maker's door.

| Skill | Who | What they make |
|---|---|---|
| `studio:brandy-branding` | Brandy | Brand voice, naming, messaging, visual direction, claim discipline. Gates public copy. |
| `studio:carver-build` | Carver | Working software — polyglot builds, plugins, integrations, connectors, WordPress and Elementor. |
| `studio:monet-visuals` | Monet | Diagrams, charts, dashboards, maps, design systems, static visual artifacts. |
| `studio:jo-writing` | Jo | Writing coaching — critique, structure, style, voice development. |
| `studio:pixel-photo-coach` | Pixel | Photography coaching — exact edit recipes, scoring, darkroom notes. **Requires a vision-capable model.** |

**Pixel was recovered on 2026-08-24** from a disk reorg that trashed him on
2026-06-07. He is named in KB-0045 as roster and had been missing from the factory
for two and a half months.

## The other doors

You don't go to a hardware store for a marketing manager. Each o-MATIC
marketplace is named for the place you would really go:

- **o-MATIC Agency** — staff who *run* the factory: Probot, Fred, Data
- **o-MATIC Firm** — expertise you *retain*: Smith, Tim, Rimmer, Jake
- **o-MATIC Studio** — people who *design and build*: Brandy, Carver, Monet, Jo, Pixel
- **o-MATIC Supply** — *tools, not people*: the WordPress and Elementor connectors

## This pack ships no MCP server, on purpose

A plugin that declares an `mcpServers` block is **omitted** by hosted-marketplace
hosts — measured on two hosts and exactly reproducible. Shipping skills alone is
what lets them install on Cowork, Claude Code desktop, and any sandboxed host.

**Compatibility tier (rule #284):** on a host with the o-MATIC Server MCP surface
configured, these operate fully. On a **prompt-only host — including a local
Ollama model — they are behavior-only, with no factory database capability.**
Voice, lane discipline and judgement still work; the factory brain does not.

## Verifying a change

```bash
claude plugin validate .        # schema, sources, duplicate names
node sync-shared.mjs --check    # shared fragments have not forked
node ../verify-pack.mjs .       # no retired mechanism survives as an instruction
```

## Security and compliance

See `SECURITY.md` and `COMPLIANCE.md`. This repository is text: no credentials, no
connections, no compliance claim. The trust boundary is the o-MATIC Server.

## License

MIT. See `LICENSE`.
