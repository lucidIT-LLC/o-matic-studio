# Public readiness

This file is a checklist. It is not shipped as a skill. CI checks the boxes it can. A person checks the rest before a public release.

- [ ] Public gate clean (`check-public-package.py --profile skills-pack` exits 0)
- [ ] No retired role names (hashed retired-role category = 0)
- [ ] No SSH, nginx or server-host commands in any instruction
- [ ] No `../` or dead links (`check-skills.mjs`)
- [ ] Privacy and terms: every manifest points at `https://www.o-matic.ai/privacy-policy/` and `https://www.o-matic.ai/terms-of-service/` (both HTTP 200 on 2026-11-03). **PLACEHOLDER: pending legal review** (P4).
- [ ] LICENSE identical in all three repos (BUSL-1.1, Licensor LucidIT, LLC, Change Date 2030-09-05, Change License Apache-2.0).
- [ ] README roster matches the shipped skills. Agency and Studio list Firm as "Smith, Jake" and are missing Jerry until the pack PR.
- [ ] Author fields are "LucidIT, LLC" with a company contact (P1). Today `.claude-plugin/marketplace.json` names a person and a personal email.
- [ ] Clean install verified on Cursor, Claude Code, Codex, Grok Bot and M365 (human step, §4.6)
- [ ] M365: icons final, SSO fields filled, package validated. Studio has no `ICON-PENDING.json`. SSO id is still a placeholder; no value was supplied.

PR 0 runs the public gate in report-only mode (`--warn`). The pack PR removes `--warn`.
