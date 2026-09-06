# o-MATIC Studio — Changelog

## 1.3.0 — 2026-09-06

**The Claude adapter gap, and the checks that find it next time.**

Sibling release to agency 1.4.0 (task #586). Same defect class, same solution
shape.

### 1. Studio shipped no Claude adapter at all

`adapters/` held gemini, chatgpt, and copilot. There was no
`adapters/claude/agents/` directory, so Brandy, Carver, Monet, Jo, and Pixel had
no Claude L1/L2 artifact upstream of any host.

The consequence was measured rather than predicted. On 2026-09-06, session #216,
the operator authorized Brandy to work at L2 — "it would be nice if she could
just be there watching and jump in when needed" — and the artifact had to be
hand-written on the host at `~/.claude/agents/brandy.md`, where the next Studio
update erases it. A role deployed by operator ruling was living in a file the
packaging system does not know exists.

This release ships `adapters/claude/agents/` for all five roles. Brandy's is
derived from that hand-written host artifact rather than re-derived from her
skill description, so the governance it carried survives: Objective O4 and the
credibility economics behind it, halt-rule #254 and the four held claims,
decision #371, decision #411's publication boundary, and `brand_messaging` #73
on protecting the operator's own phrasing.

Three things in the host artifact were **not** upstreamed, and each is a defect
worth naming:

- It loaded the contract by an absolute, version-pinned plugin-cache path
  (`.../studio/1.2.2/contracts/...`). That path dies at the next version bump —
  the same failure mode as the mandated startup skill that could not resolve on
  any host and reported compliance it never had. The shipped adapter uses a
  relative path that the check below resolves.
- It stated "L1 AND L2 BOTH DEPLOYED" as file content. Shipped in a pack, that
  sentence grants L2 on every host by file, contradicting the contract clause
  requiring registration, allowlist, rollback, and passing evaluation.
  Deployment state is per host, is recorded in
  `factory.agent_runtime_contracts`, and the adapters now point there.
- It named KR9 and KR10 by key. Both exist and Brandy is a recorded owner on
  both — but a Key Result quoted out of a shipped file is precisely how a
  retired role kept getting work assigned to it (decision #416). The adapter
  points at `factory.key_results` and `public.v_okr_chart` instead.

### 2. Copilot needed a different delivery model, not a corrected path

`adapters/copilot/.github/agents/studio.agent.md` loaded
`../../../../contracts/STUDIO-RUNTIME-CONTRACT.md`. That path is worse than a
typo, because inside the pack it *does* resolve — four levels up from
`adapters/copilot/.github/agents/` is the pack root, and `contracts/` is there.
Any check that only scanned the pack would have passed it. It resolves nowhere
at the only moment that matters: INSTALL.md sends `.github/` into a different
workspace, where no path back into the pack resolves under any correction, and
the instruction to "keep Studio checked out alongside it" was the workaround for
that defect rather than a design.

`.github/` is now self-contained: `.github/omatic/` carries generated contract
copies loaded as `../omatic/<file>`, a path that resolves identically inside the
pack and inside the target workspace. Per-role Copilot agents ship alongside the
roster file. `scripts/sync-copilot-payload.mjs --check` fails on drift.

### 3. Nothing checked, so nothing was caught

`scripts/check-paths.mjs` resolves every relative file reference in the pack and
re-resolves the Copilot payload from a scratch workspace. Proven in both
directions at release: it exits 0 on the shipped tree, and exits 1 with
`BROKEN [copilot-installed] .github/agents/studio.agent.md` when the old
four-level path is restored — from the scratch-workspace scan, which is the only
scan that could ever have caught it.

### 4. Governance propagated from operator rulings this session

Every adapter, and the new `adapters/ROLE-CORE.md` they share, carries:

- **Decision #413** — Objectives, Key Results, KPIs, and key governance tools
  are operator decisions. Roles draft, recommend, measure, and report; they do
  not decide. Measuring is not deciding; changing a threshold, a commitment
  class, or a red condition is.
- **Decision #415** — database mutations are Data's, executed through the
  governed server path. Each role still writes its own records in its own lane.
  The test: does the write change what the database *enforces*, or only what it
  *remembers*? Owning mutations is an execution grant, never an authority grant.
- **The stop-and-route meta-rule** — a contract contradiction is a governance
  defect, not a tie for the role to break at runtime, and never license for the
  thing the stricter statement forbids.

### 5. Contract amended to 1.1.0; runtime state removed from it

`STUDIO-RUNTIME-CONTRACT.md` is `studio-runtime/1.1.0`. It gains the shared
non-negotiables above and a version-authority section: the document owns the
version string, the eval file and the database row follow it.

Its roster table said "L1 ready; L2 not deployed" for every role — on the day
Brandy's L2 was deployed by operator ruling. Rather than replace one stale value
with another, the deployment column is gone and the table points at
`factory.agent_runtime_contracts`. `migrations/2026-09-06-studio-runtime-1.1.0.sql`
carries the new digest for **Data** to apply, per #415, and deliberately touches
neither deployment state nor `evidence_status` — the 2026-09-04 migration set
`l2_deployment_state = 'not_deployed'` unconditionally, and reusing that shape
would have silently un-deployed Brandy.

### 6. Honesty about evidence

**No Studio role has a conformance eval that has ever been run.**
`evals/studio-role-conformance.yaml` exists, which is easy to mistake for
coverage; it is version 1 — five prose assertions, no runner in this pack, and
no mechanism by which any of them can fail. `evidence_status` for all five roles
is and stays `design_verified`. The boundaries in these adapters are designed,
not demonstrated, and every shipped file says so. Rebuilding the suite so it can
fail, the way `core-role-conformance.yaml` was rebuilt in agency 1.4.0, is owed
work.

### 7. Retired-role residue

`skills/carver-build/SKILL.md` still routed evidence scoring to Rimmer, retired
2026-09-04. Corrected to Smith per decision #416. That was the only occurrence in
this pack; the Tim reference in the same sentence was already historical and now
reads as such.

### Also

- Version parity restored. `.claude-plugin` read 1.2.2 and `.codex-plugin` read
  1.2.3 — a silent divergence — and the marketplace entry read 1.0.4, five
  releases behind. All three now read **1.3.0**.
- **Not changed, and reported instead:** `.claude-plugin/marketplace.json` still
  declares `"license": "MIT"` while both plugin manifests declare `BUSL-1.1`.
  That is a licensing claim, not a packaging mechanism, and it is the operator's
  to settle. The same mismatch exists in the agency and firm marketplaces.
