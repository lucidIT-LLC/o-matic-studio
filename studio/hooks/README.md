# Studio hooks

Installing the o-MATIC Studio plugin installs these hooks. Claude Code reads
`hooks.json` from the plugin and substitutes `${CLAUDE_PLUGIN_ROOT}` with the
installed version's directory, so nothing here is copied by hand, pinned to a
version, or tied to one machine (task #963). Plugin hooks and `settings.json`
hooks are not deduplicated: if the same command is also wired by hand in
`~/.claude/settings.json`, both run. Remove the hand wiring.

| Event | Command | Owner | What it does |
| --- | --- | --- | --- |
| `Stop` | `brand_claim_watch.py` | Brandy (rule), Carver (build) | Refuses an unhedged market superlative about o-MATIC in the final reply (Objective O4, halt-rule #254). Exit 2 sends the refusal back to the model. |
| `SessionStart` (`startup`) | `../scripts/verify-adapter-paths.mjs --hook` | Carver | Installs or updates this pack's Claude Code role adapters in `~/.claude/agents/` from the installed templates; reports a hand-edited copy instead of overwriting it (task #983). Silent when current. |

## Brand claim watch

The detector is two stages: a SCOPE test (the sentence must have a first-person
or product subject) and then the market-superlative PATTERN, with a hedge escape
("unverified", "held pending", "#254", ...). A claim the reply only CITES as
test material -- a complete claim inside "...", “...” or `...`, on a line carrying a
citation word (fixture, case, test string, expects exit, ...) -- is set aside first
(#1013). An attribution or endorsement on the line (says, customers, homepage,
true, agree, ...) overrides that: Brandy ruled a quoted claim we attribute or agree
with is a claim we make. Scare quotes around a superlative alone, a bare quoted
claim, and a quote framed by any other words still refuse. The three word sets are
closed and change only with Brandy's ruling.
Its module docstring records every ruling that shaped it (#620, #718, #818,
#1013) and its accepted false negatives.

Limits, stated so the control is not over-trusted: it runs only where this
plugin is installed and enabled; it sees only the assistant's own reply, not
published copy, commits, or database rows; it is pattern-matching, not
comprehension.

### Tests

```bash
python3 studio/hooks/brand_claim_watch_fixtures.py          # from the repo root
```

65 cases, both directions: engineering superlatives that must be ALLOWED and the
held claims that must be REFUSED. The suite drives the detector next to it.
CI runs it on every push. To prove the suite can fail, point it at a sabotaged
copy:

```bash
sed 's/if SUBJECT.search(sentence) is None:/if False:/' studio/hooks/brand_claim_watch.py > /tmp/sab.py
BRAND_CLAIM_WATCH_HOOK=/tmp/sab.py python3 studio/hooks/brand_claim_watch_fixtures.py   # must exit 1
```

The quote exemption is proven the same way, one sabotage per clause: bypass it
(`hits = scoped_hits(text)`) and the four quoted-citation cases fail; exempt every
quoted span unconditionally and nine abuse cases fail; accept any words as a frame
instead of a citation word and one fails; drop the attribution set and one fails;
drop the endorsement set and one fails; drop the frame-subject rule, the publication rule, or the "case in point" carve-out and one fails each.

Change the rule only with Brandy's ruling, and add the case that motivated the
change to the fixtures in the same commit.
