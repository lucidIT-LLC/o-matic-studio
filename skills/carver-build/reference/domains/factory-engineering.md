# o-MATIC Factory Software Engineering

This guide covers software changes to o-MATIC Server, MCP integrations, plugins, and factory-facing adapters. The live Server contract and the repository's current implementation are authoritative. Do not reconstruct them from memory or infer a capability from a persona, skill, or old release note.

## Contract discovery

Before changing a factory integration:

- Read the target repository's current docs, release contract, configuration examples, and relevant code paths.
- Discover the live Server tool surface and read its operating guide when connected. Inspect the exact tool schema, grants, refusal behavior, and startup/capability report for the intended factory.
- Trace the call from host configuration through authentication, Server routing, authority checks, the operation, audit/telemetry, and the returned result.
- Confirm the supported transport, endpoint, OAuth/SSO issuer and audience, callback/redirect requirements, token handling, and cloud/on-prem configuration from current source. Never bake credentials into a plugin or assume every host shares an authentication context.
- Treat startup and conversation continuity as explicit contracts. A plugin must not fabricate READY, reuse a stale state card, or silently create a second conversation/kernel identity.

## Change design

- Preserve the public API and compatibility guarantees unless a versioned change is approved. Make schema changes explicit and document defaults, nullability, errors, and migration behavior.
- Model success, denial, authentication expiry, unavailable optional capabilities, malformed input, timeout, and Server failure distinctly. A refusal is not an empty success.
- Keep authorization enforced by the Server's live grants and host controls. Agent role or plugin installation does not create permission.
- Make retries safe. Define idempotency, timeout, cancellation, and partial-completion behavior before adding automatic retries or orchestration.
- Keep factory database schemas, queries, migrations, and writes in Data's lane. Carver owns application and integration code; coordinate instead of writing the database directly.
- Make logs useful for diagnosis while excluding credentials, sensitive document content, and customer data. Use existing Server audit contracts.
- Check minimum supported Server versions, host/plugin API versions, and cloud versus on-prem endpoint selection. Reject unsupported combinations clearly rather than guessing.

## Verification

- Test the actual schema and protocol boundary, including success and refusal/error responses.
- Cover authentication success, expired or missing credentials, insufficient grants, unreachable Server, and unavailable optional modules where the harness permits.
- Check startup state and conversation key propagation across reconnects and parallel conversations when supported by the host.
- Verify compatibility against the documented minimum and target versions, or label the matrix incomplete.
- Read back deployment/configuration status through the intended live surface after writes. A successful build does not prove the Server accepted or exposed the change.
- Report the exact Server build, host, endpoint class (cloud/on-prem), tools and checks observed. Never disclose secret values.
