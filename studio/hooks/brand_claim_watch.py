#!/usr/bin/env python3
"""
BRAND CLAIM WATCH — Brandy, standing.

Operator instruction, session #216, 2026-09-06: "brandy should be the next one that
can work L2 - it would be nice if she could just be there watching and jump in when
needed."

An agent cannot watch; it is invoked. A HOOK watches. This is Brandy's standing
presence: it inspects the final assistant message of every turn and REFUSES the
narrow class of claim that o-MATIC has repeatedly made and cannot back.

WHAT IT ENFORCES. Objective O4 — "o-MATIC only claims what it can back" — and
halt-rule #254, which gates public capability claims. Four such claims are held
unresolved on this estate and all four share one shape: an unevidenced market
superlative. "first company aligning artificial organizations with OKRs" (#411),
"i am betting no one is doing this" (#412), the ChatGPT comparative (brand_messaging
#101), and the "gold standard" framing.

WHY IT BLOCKS ONLY SUPERLATIVES, and not claims generally. A gate that refused every
claim would be intolerable and would be worked around within a day — which the
approval gate's own source comment already learned the hard way. This one refuses
the single pattern with a measured history of being wrong here, and lets everything
else through.

THE HEDGE ESCAPE IS DELIBERATE. If the text already marks the claim as unverified,
held, or flags #254, the sentence is DOING Brandy's job and is allowed. The rule is
not "never say it" — it is "never say it as though it were established."

=== SCOPE TEST — added 2026-09-06, task #620, Brandy's ruling. ===

THE DEFECT THIS FIXES. The detector asserted on VOCABULARY, not BEHAVIOR. It fired on
the literal string "the only one" in any context and refused this sentence:

    "Smith proved the caveat is load-bearing by testing three extractions -- the only
     one that fails is the one that deletes it."

That is three test extractions. No product, no market, no public surface. Same defect
class Smith adjudicated the same hour in task #612 and roster_audit_log audit_id 18:
a control grading the words instead of the conduct.

WHY A FALSE POSITIVE IS THE EXPENSIVE FAILURE HERE, not the cheap one. This gate is
the only standing guard on O4, and four real claims are correctly HELD behind it. A
gate that refuses correct work teaches its users to route around it, and a gate people
route around stops protecting the cases that matter. Credibility is recovered at half
the rate it is lost; the same asymmetry applies to a control.

THE RULE NOW HAS TWO STAGES, and the scope test runs FIRST:

  1. SCOPE — is this sentence about o-MATIC, us, or a product at all? The superlative
     must co-occur, IN THE SAME SENTENCE, with a first-person or product subject
     (o-MATIC / we / our / the factory / a product name). A superlative whose subject
     is a test fixture, a query result, a row count or a code path is not a claim
     about anything anyone could buy, and is not this gate's business.
  2. PATTERN — the market-superlative shapes, as before.

SAME SENTENCE, deliberately, not a sliding window over neighbors. In a Brandy session
"o-MATIC" appears in nearly every paragraph; a window would re-admit the whole false-
positive class through the back door. This buys the false negative described below,
knowingly.

GENERIC SUPERLATIVES NO LONGER CARRY THE GATE. Bare "only one" is a pronoun, not a
market noun — it was the actual defect and it no longer fires by itself. It fires only
when followed by an offering predicate ("the only one doing this", "the only one that
can"), which is the form in which it IS a market claim. The market nouns — company,
firm, product, platform, vendor, solution — carry the gate now, which is what they
mean and what the pronoun never did.

LIMITS, stated because an unstated limit is how a control gets over-trusted:
  - Host-side only. It holds on a host where the o-MATIC Studio plugin is
    installed and enabled (hooks/hooks.json, task #963) and nowhere else.
  - It sees the assistant's own output. It cannot see published copy, a commit
    message, or anything written into the database. KR10's claims register is the
    instrument that would; it does not exist.
  - Pattern-matching, not comprehension. A superlative phrased in a way this regex
    does not know passes silently. That is a false negative and it is expected.
  - NEW false negative, accepted on purpose: a market claim whose subject sits in a
    PREVIOUS sentence ("o-MATIC does X. It is the only platform that does.") passes.
    Narrowing scope trades recall for trust, and trust is what this gate runs on.

=== SELF-SCOPING EXEMPTION REMOVED — 2026-09-25, task #718 (Carver; Brandy owns the rule). ===

THE DEFECT. A SELF_SCOPING set ("no one else", "nobody else", "nobody is doing",
"world's first", "industry-first", "we are the first") bypassed the scope test on
the premise that "else" names the speaker's position. It does not. It names a
SCOPE OF COMPARISON, not a SUBJECT. Measured 2026-09-12: the gate refused Probot's
sentence about the OPERATOR'S drone photograph -- "...nobody else has it from the
air at night" -- which compares one photographer against others and is about
nothing this factory sells. Same class as #620: an exemption list re-admitting the
over-broad match the two-stage rule was built to remove.

THE FIX. There is no exemption. Every superlative, these included, must co-occur in
the same sentence with a first-person or product subject (SUBJECT below). Every
true positive the exemption was written for already carries one -- "we built it",
"I am betting", "o-MATIC", "the factory", "artificial organization" -- so nothing
that refused before stops refusing; the fixture suite proves both directions.
"we are the first" is trivially in scope by its own "we".

ACCEPTED FALSE NEGATIVE, extending the one above: "This is the world's first X"
with no first-person or product noun in the sentence now passes. Same trade, same
reason.

=== QUOTED CLAIMS EXEMPTED — 2026-09-28, task #1013 (Carver; Brandy's ruling). ===

THE DEFECT. The gate refused a reply that only CITED a claim as a string: a
fixture sentence in quotation marks, named as a test case, is the reply talking
ABOUT a claim, not making one. Same class as #620 and #718 -- the detector graded
the words on the page, not the speaker's conduct -- and it fired hardest on the
work that maintains this gate, since every fixture here is a held claim.

THE FIX, NARROW ON PURPOSE. A quoted span -- straight "...", curly “...”, or
inline `code` -- is removed before the two-stage test ONLY when ALL hold:
  1. SELF-CONTAINED. The span, read alone, is a complete in-scope claim: its own
     subject AND its own superlative are inside the quotes. Scare quotes around
     the superlative alone ('We are "the only company" doing this') leave the
     subject outside, so the span is not self-contained and the reply is still
     the one making the claim. It refuses.
  2. CITED. The line holding the span carries a CITATION word marking it as test
     or detector material. A reply that is nothing but a quoted claim, or one
     framed by any other words, is delivering the claim, not citing it.
  3. NOT ATTRIBUTED, NOT ENDORSED. If the line carries an attribution or an
     endorsement marker, the span is judged as prose even when a citation word
     is also present. Attribution overrides citation.
  4. NO SUBJECT IN THE FRAME (structural, not a word list). If the text outside
     the quotes on that line has a first-person-plural or product subject (we,
     us, our, ours, o-MATIC, the detector's product nouns), the span is judged as
     prose: 'Per the fixture, "..." We are.' is an endorsement no list would
     enumerate. First-person singular is excluded on purpose, so "I added ...
     as a case" still cites.
  5. NOT PUBLICATION. If the line marks the span as copy we might ship
     (headline, tagline, copy, post, launch, draft, suggested, website, ...), it is judged
     as prose even with a citation word present. Drafting public copy is the one
     path O4 exists to gate; "test it" must not launder a headline.
"case in point" is an idiom that asserts the claim, and is not a citation.
Single quotes are not quote marks here: the apostrophe in "we're" and "world's"
would pair with anything.

THE WORD SETS AND BOTH STRUCTURAL RULES ARE CLOSED and change only with Brandy's
ruling (CITATION, ATTRIBUTION, ENDORSEMENT, FRAME_SUBJECT, PUBLICATION below). A plural or inflected form of a listed word
counts as that word; nothing else is added.

REJECTED, NOT ACCEPTED -- the approving quote. The first draft of this change
let 'our homepage says "o-MATIC is the only platform that does this", and it is
right' pass as an accepted false negative, and let 'Customers tell us "..."'
pass because any words counted as a frame. Brandy rejected both:

  "A quotation mark changes the punctuation, not the speaker: a held claim we
   cite as a test case is us talking about the claim, but a held claim we
   attribute to someone or agree with is us making it -- and when it is
   attributed, it is us inventing a witness. The gate may stop refusing
   fixtures; it may never start carrying endorsements, because credibility lost
   to a laundered quote takes twice as long to win back."
                                  -- Brandy, 2026-09-28, O4 / halt-rule #254

  "A citation word is a label, not a license: if we are the subject of the line
   or the line is drafting copy, the quote is ours."   -- Brandy, 2026-09-28

KNOWN GAP, not covered: an attributed quote with no superlative this detector
knows (the brand_messaging #100 shape, a user "said" something flattering)
passes. The hook does not cover it and nothing here implies it does.
KNOWN GAP, accepted by Brandy 2026-09-28: an endorsement with no subject and no
listed word ('Test case: "..." Honestly, yes.') passes. Closed lists always have
one more gap; she accepted this residual rather than growing them without end.
"""
import json, os, re, sys

# Stage 2 — the market-superlative shapes.
SUPERLATIVE = re.compile(
    r"(first (?:company|firm|product|platform|factory|vendor|solution)\b"
    r"|(?:the )?only (?:company|firm|product|platform|factory|vendor|solution)\b"
    r"|(?:the )?only one (?:doing|building|shipping|offering|selling"
    r"|who (?:does|can|offers)|that (?:does|can|offers|ships|builds|delivers))\b"
    r"|no ?one else\b|nobody else\b"
    r"|(?:nobody|no ?one) (?:is|has) (?:doing|done)\b"
    r"|no other (?:company|firm|product|platform|vendor)\b"
    r"|world'?s first\b|industry[- ]first\b"
    r"|never been done\b|unlike any (?:other )?\b"
    r"|we (?:are|were) the first\b)",
    re.I,
)

# Stage 1 — the SCOPE test. Is the sentence about us or a thing someone could buy?
SUBJECT = re.compile(
    r"(o-?matic\b|\bwe\b|\bwe'?(?:re|ve|ll)\b|\bour\b|\bours\b|\bi\b|\bmy\b"
    r"|the factory\b|this factory\b|the company\b|this company\b"
    r"|artificial organi[sz]ation\b|\bAo\b"
    r"|\bslate\b|\bconductor\b|factory pro\b)",
    re.I,
)

HEDGE = re.compile(
    r"(unverified|unevidenced|no evidence|#254|held[- ]pending|not cleared"
    r"|cannot back|can'?t back|would need evidence|competitive scan"
    r"|claim(?:s)? (?:is|are) held|do(?:es)? not have evidence)",
    re.I,
)

# ROUTING, task #818 (2026-09-28). A sentence that cites a factory record
# (#NNN task, decision or rule) and uses a ROLE-SCOPE superlative ("the only one
# who can", "nobody else", "no one else") is saying which role inside this factory
# may take a decision -- decision #413 REQUIRES the estate to write those
# sentences -- not claiming anything about a market. Exempted ONLY when no market
# noun (company, platform, product, vendor, firm, solution, category) and no
# product name is in the sentence, so "o-MATIC is the only platform that does #758"
# still refuses. The fixtures prove both directions.
RECORD_REF = re.compile(r"#\d{3,5}\b")
ROLE_SCOPE = re.compile(r"(only one (?:who|that) (?:can|may|does)|no ?one else|nobody else)", re.I)
MARKET = re.compile(r"(o-?matic\b|\b(?:company|companies|platform|product|vendor|firm|solution|category|market)\b"
                    r"|artificial organi[sz]ation|\bslate\b|factory pro\b)", re.I)


def is_routing(sentence, hit):
    return (RECORD_REF.search(sentence) is not None and ROLE_SCOPE.search(hit) is not None
            and MARKET.search(sentence) is None)


# Sentence boundaries: terminators and newlines. List bullets only at line start —
# a MID-SENTENCE spaced hyphen must NOT split, because the operator writes that way
# ("nobody else is doing this - we built it") and severing it hides the subject from
# the scope test, which is the false NEGATIVE mirror of the bug being fixed.
SPLIT = re.compile(r"(?<=[.!?;:])\s+|\n+|(?:(?<=\n)|\A)[-*\u2022]\s+")


# QUOTED CLAIMS, task #1013 (2026-09-28). See the docstring: a span is exempt only
# when it is a self-contained claim, CITED as test material, and neither
# attributed nor endorsed.
QUOTED = re.compile(r'"[^"\n]+"|\u201c[^\u201d\n]+\u201d|`[^`\n]+`')
# Closed sets, Brandy's ruling 2026-09-28. Change only with her ruling.
CITATION = re.compile(
    r"\b(?:fixtures?|cases?(?!\s+in\s+point)|tests?|strings?|examples?|inputs?|patterns?|detectors?"
    r"|hooks?|refuse[sd]?|expects?|exit)\b", re.I)
ATTRIBUTION = re.compile(
    r"\b(?:says|said|told|tell|tells|wrote|according to|customers?|users?|reviewers?"
    r"|homepage|site|press|analysts?)\b", re.I)
ENDORSEMENT = re.compile(
    r"\b(?:right|true|correct|accurate|agree[sd]?|stands)\b", re.I)
# Structural: SUBJECT without first-person singular ("I", "my"), plus "us".
FRAME_SUBJECT = re.compile(
    r"(o-?matic\b|\bwe\b|\bwe'?(?:re|ve|ll)\b|\bus\b|\bour\b|\bours\b"
    r"|the factory\b|this factory\b|the company\b|this company\b"
    r"|artificial organi[sz]ation\b|\bAo\b"
    r"|\bslate\b|\bconductor\b|factory pro\b)", re.I)
PUBLICATION = re.compile(
    r"\b(?:headlines?|taglines?|slogans?|copy|hero|posts?|launch(?:es|ed)?"
    r"|announcements?|pitch(?:es)?|ads?|publish(?:es|ed|ing)?|drafts?|drafted"
    r"|suggested|websites?|webpages?|landing pages?)\b", re.I)


def strip_quoted_claims(text):
    """Replace each quoted span that merely CITES a claim with a neutral marker.
    A span stays in the text -- and is judged like any prose -- when it is not a
    complete claim by itself (scare quotes), when its line does not cite it as
    test material, or when its line attributes, endorses, speaks as us, or
    drafts copy."""
    def cite(m):
        inner = m.group(0)[1:-1]
        if not scoped_hits(inner):
            return m.group(0)          # not self-contained: judge it as prose
        start = text.rfind("\n", 0, m.start()) + 1
        end = text.find("\n", m.end())
        line = text[start:(len(text) if end < 0 else end)]
        frame = QUOTED.sub(" ", line[:m.start() - start] + line[m.end() - start:])
        if ATTRIBUTION.search(frame) or ENDORSEMENT.search(frame):
            return m.group(0)          # attributed or endorsed: the reply is making it
        if FRAME_SUBJECT.search(frame):
            return m.group(0)          # we are the subject of the line: ours
        if PUBLICATION.search(frame):
            return m.group(0)          # drafting copy: ours
        if not CITATION.search(frame):
            return m.group(0)          # not cited as test material: delivered
        return "[quoted]"
    return QUOTED.sub(cite, text)


def scoped_hits(text):
    """Return superlatives that are IN SCOPE — same sentence as a first-person or
    product subject. Scope is tested first; an out-of-scope superlative is not a
    claim about anything anyone could buy."""
    found = []
    for sentence in SPLIT.split(text):
        if not sentence or not sentence.strip():
            continue
        # SCOPE TEST, run before any claim is counted. No exemptions: task #718
        # removed the self-scoping bypass, because "nobody else" names a scope of
        # comparison, not a subject.
        if SUBJECT.search(sentence) is None:
            continue
        for m in SUPERLATIVE.finditer(sentence):
            if is_routing(sentence, m.group(0)):
                continue
            found.append((m.group(0).strip(), sentence.strip()))
    return found


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if payload.get("stop_hook_active"):
        sys.exit(0)
    path = payload.get("transcript_path")
    if not path or not os.path.exists(path):
        sys.exit(0)
    try:
        with open(path, encoding="utf-8") as fh:
            lines = [json.loads(l) for l in fh if l.strip()]
    except Exception:
        sys.exit(0)

    turn = []
    for entry in reversed(lines):
        if entry.get("type") == "user":
            break
        turn.append(entry)

    final = ""
    for entry in reversed(turn):
        if entry.get("type") != "assistant":
            continue
        for block in entry.get("message", {}).get("content", []) or []:
            if isinstance(block, dict) and block.get("type") == "text":
                final = block.get("text", "")
        if final:
            break
    if not final.strip():
        sys.exit(0)

    text = re.sub(r"```.*?```", " ", final, flags=re.S)
    hits = scoped_hits(strip_quoted_claims(text))
    if not hits:
        sys.exit(0)

    # Whole-message hedge: if the reply is already flagging the claim, it is doing
    # Brandy's job rather than making the claim.
    if HEDGE.search(text):
        sys.exit(0)

    detail = "\n".join(
        "  - \"%s\"\n      in: %s" % (h, (s[:160] + ("..." if len(s) > 160 else "")))
        for h, s in hits[:5]
    )
    sys.stderr.write(
        "BRANDY — CLAIM WATCH (Objective O4, halt-rule #254). REFUSED.\n\n"
        "Your reply makes an unhedged market superlative about o-MATIC:\n"
        + detail + "\n\n"
        "O4: o-MATIC only claims what it can back. Four claims of exactly this shape are\n"
        "already HELD unresolved (#411, #412, brand_messaging #101, \"gold standard\") and all\n"
        "four need the same evidence: one dated competitive scan with a defined vendor set.\n"
        "None has it.\n\n"
        "Re-send with the claim withdrawn, or state plainly that it is unverified and what\n"
        "would clear it. Softening does not help: \"few companies\" is not safer than \"the only\n"
        "company\" - it is the same unverified claim wearing a hat.\n\n"
        "If the superlative is NOT about o-MATIC or a product, this is a false positive and\n"
        "the scope test has a gap - record it on the class, not on the one string.\n"
    )
    sys.exit(2)


if __name__ == "__main__":
    main()
