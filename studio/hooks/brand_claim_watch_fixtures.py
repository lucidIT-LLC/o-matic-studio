#!/usr/bin/env python3
"""
BRAND CLAIM WATCH — conformance fixtures. Brandy, task #620, 2026-09-06.

Run: python3 studio/hooks/brand_claim_watch_fixtures.py   (from the o-matic-studio repo)
     python3 "$CLAUDE_PLUGIN_ROOT/hooks/brand_claim_watch_fixtures.py"  (installed)

The suite drives the detector that sits NEXT TO THIS FILE, not a copy in a home
directory (task #963: the hook used to live only in ~/.claude/hooks on one Mac).
BRAND_CLAIM_WATCH_HOOK overrides the path -- that is how the suite is proven able
to fail: point it at a sabotaged copy and it must exit 1.

A gate that cannot refuse is worse than the false positive it removed, so this suite
asserts BOTH directions and is expected to be run after any edit to the detector:

  ALLOW  — engineering superlatives with no market subject (the #620 regression, plus
           the "next innocent string" the task warned about).
  REFUSE — the four HELD claims (#411, #412, brand_messaging #101, "gold standard"),
           in the shapes they are actually written in, plus softened variants.

If every case passes trivially after a change, check that the REFUSE half still fails
when the scope test is disabled - a suite that cannot fail proves nothing.
"""
import json, subprocess, os, sys, tempfile
HOOK = os.environ.get("BRAND_CLAIM_WATCH_HOOK") or os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "brand_claim_watch.py")
if not os.path.isfile(HOOK):
    print("RESULT: detector not found at", HOOK)
    raise SystemExit(1)

CASES = [
 # (expect_refuse, label, text)
 (False,"#818 first-person routing that cites a record",
  "We are the only one who can make that call on #758."),
 (False,"#818 routing: nobody else, with a decision cite",
  "I will not approve it; nobody else but you can, per decision #413."),
 (True,"#818 guard: a record cite does not launder a market claim",
  "o-MATIC is the only platform that does this, see #758."),
 (True,"#818 guard: market noun with a task cite still refuses",
  "We are the only company who can do this, per #412."),
 (False,"#620 the actual refused sentence",
  "Smith proved the caveat is load-bearing by testing three extractions -- the only one that fails is the one that deletes it."),
 (False,"the next innocent one (#620 warns about it)",
  "We ran the rule set against the corpus. The only rule that fires is #254."),
 (False,"engineering, first-person, generic pronoun",
  "We tested three query paths and the only one that returns rows is the schema-qualified one."),
 (False,"row counts",
  "Of the five o-MATIC audit rows, the only one that is still dirty is 54."),
 (False,"code path",
  "Our migration has three branches; the only one that can fail is the destructive branch."),
 (False,"no subject at all",
  "Of the four connectors, no other platform was tested."),

 (True,"held claim #411",
  "o-MATIC is the first company aligning artificial organizations with OKRs."),
 (True,"held claim #412",
  "Nobody else is doing this - we built the whole category."),
 (True,"held claim, brand_messaging #101 shape",
  "We are the only platform that reproduces the same result on three separate days."),
 (True,"gold standard framing, superlative form",
  "o-MATIC is the only vendor delivering governed artificial organizations."),
 (True,"hedged softening still refused",
  "We may be the only company doing this, more or less."),
 (True,"genuine 'only one' + offering predicate",
  "We are the only one doing this in the market."),
 (True,"world's first",
  "The factory is the world's first governed artificial organization."),

 (False,"HEDGE escape still works",
  "o-MATIC is the first company aligning artificial organizations with OKRs - that claim is UNVERIFIED and held pending a dated competitive scan."),
]


CASES += [
 (True,"#412 verbatim shape, spaced hyphen",
  "Nobody else is doing this - we built the whole category."),
 (True,"#412 operator verbatim",
  "i am betting no one is doing this"),
 (False,"self-scoping words absent, engineering dash",
  "Three extractions ran - the only one that fails is the one that deletes it."),
 (False,"markdown bullet list, engineering",
  "Audit results:\n- three rows dirty\n- the only one we cannot fix is the mcp_registry row"),
 (True,"world's first, no explicit subject",
  "This is the world's first governed artificial organization."),
 (False,"hedge on a self-scoping claim",
  "Nobody else is doing this - unverified, held pending a dated competitive scan."),
]



CASES += [
 (False,"engineering 'no one is doing', no subject",
  "The schema refresh is stalled because no one is doing the reindex."),
 (True,"gold standard, plain",
  "o-MATIC is the only solution that meets the gold standard."),
 (False,"Brandy narrating her own audit with o-MATIC in the sentence",
  "I checked the o-MATIC brand rows and the only one still dirty is 55."),
]

# === Task #718, 2026-09-25 (Carver; Brandy owns the rule). ===
# The SELF_SCOPING exemption let "nobody else" / "no one else" / "nobody is doing"
# bypass the subject test and refuse third-party comparisons. Third-party ALLOW
# cases below FAILED (were refused) before the fix; every REFUSE case carries a
# first-person or product subject in the same sentence and must keep refusing.
CASES += [
 (False,"#718 the operator's drone-photo sentence, verbatim",
  "the city, the chamber, realtors, developers, regional business press and local news all need this town, and nobody else has it from the air at night."),
 (False,"#718 third party, nobody else",
  "Nobody else has shot this town from the air at night."),
 (False,"#718 third party, no one else",
  "No one else in the stock libraries carries a night aerial of this town."),
 (False,"#718 third party, nobody is doing",
  "Nobody is doing night aerials of this town on the stock sites."),
 (False,"#718 third party reported speech",
  "The photographer says no one else has this shot."),
 (False,"#718 third party, world's first",
  "Boston Dynamics shipped the world's first commercial quadruped."),
 (False,"#718 third party, first company",
  "Apple was the first company to ship a 64-bit phone."),
 (True,"#718 named product comparator",
  "nobody else does this like o-MATIC"),
 (True,"#718 first person, we built it",
  "Nobody else is doing this - we built it."),
 (True,"#718 first person, our factory",
  "No one else has done this, our factory did."),
 (False,"#718 ACCEPTED FALSE NEGATIVE: subject split off by a semicolon (#620 same-sentence rule)",
  "No one else has done this; our factory did."),
 (False,"#718 ACCEPTED FALSE NEGATIVE (Brandy's ruling): world's first with no product noun SUBJECT knows",
  "This is the world's first governed factory-as-a-service."),
 (True,"#718 first person singular",
  "I am betting no one is doing this."),
 (True,"#718 we were the first",
  "We were the first to run an artificial organization on OKRs."),
 (True,"#718 product subject after the superlative",
  "Nobody else has it, and o-MATIC does."),
 (True,"#718 world's first with product subject",
  "Slate is the world's first governed canvas."),
]
fails=0
for expect, label, text in CASES:
    td = tempfile.mkdtemp()
    tp = os.path.join(td,"t.jsonl")
    with open(tp,"w") as f:
        f.write(json.dumps({"type":"user","message":{"role":"user","content":"go"}})+"\n")
        f.write(json.dumps({"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":text}]}})+"\n")
    p = subprocess.run([sys.executable,HOOK], input=json.dumps({"transcript_path":tp}),
                       capture_output=True, text=True)
    refused = p.returncode == 2
    ok = refused == expect
    fails += 0 if ok else 1
    print(("PASS" if ok else "**FAIL**"), "| expect", "REFUSE" if expect else "ALLOW ",
          "| got", "REFUSE" if refused else "ALLOW ", "|", label)
    if not ok and p.stderr:
        print("      stderr:", p.stderr.strip().splitlines()[2:4])
print()
print("RESULT:", "ALL PASS" if fails==0 else f"{fails} FAILED")
raise SystemExit(1 if fails else 0)
