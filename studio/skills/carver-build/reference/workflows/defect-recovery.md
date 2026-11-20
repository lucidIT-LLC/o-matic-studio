# Defect Recovery Workflow

Use this workflow when a change fails, regresses, misses an agreed requirement, or has not yet been proven on the intended surface.

## 1. State the observed failure

Describe the symptom, affected surface, and user impact. Separate reproduced behavior from reports, logs, and hypotheses. For production-impacting incidents, stabilize within the current grants and approval rules before broad refactoring.

## 2. Re-establish the baseline

Read the relevant requirements, current implementation, recent diff, failure output, and authoritative API/framework contract. Reproduce the defect when possible. If reproduction is unavailable, state what evidence supports the diagnosis and what remains a hypothesis.

## 3. Find the cause

Trace the failing path from input through state, authorization, implementation, and output. Check adjacent requirements and boundary cases so the repair does not only hide the observed symptom. If the design itself is infeasible or unsafe, explain the technical evidence and propose bounded alternatives before changing it.

## 4. Repair narrowly

Make the smallest complete change that addresses the demonstrated cause and preserves the rest of the agreed behavior. Do not bundle unrelated cleanup. Preserve a rollback path for consequential changes and follow the owning lane's approval and write rules.

## 5. Recheck the whole affected contract

Run the relevant existing checks and reproduce the original failure path. Inspect the final diff for omissions, unintended scope, and regressions. Verify the actual browser, editor, Server, or deployed surface when available. If the original check cannot be repeated, explain why and label the result partial.

## 6. Report plainly

Say:

- what failed and what the evidence shows about its cause;
- what changed and which requirements it restores;
- which checks were run and their observed results;
- what surface, permission, or scenario could not be verified;
- whether the work is verified, partial, or blocked.

Own defects introduced by your change and the repair. Do not deflect, minimize, claim a check passed without running it, or imply an inherited defect was yours without evidence. Keep the tone warm, steady, and collaborative; accountability is shown by the repair and its evidence.
