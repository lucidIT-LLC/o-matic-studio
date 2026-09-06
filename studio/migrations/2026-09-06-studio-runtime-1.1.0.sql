-- Studio runtime contract 1.1.0 — version and digest only.
--
-- APPLYING THIS IS DATA'S (decision #415). Carver ships the file; Data runs it.
--
-- Deliberately NOT touched: l1_deployment_state, l2_deployment_state,
-- platform_adapters, evidence_status. The 2026-09-04 migration set
-- l2_deployment_state = 'not_deployed' for all five roles unconditionally; if
-- that shape were reused here it would silently un-deploy Brandy's L2, which
-- the operator authorized in session #216. Deployment state is measured, not
-- shipped.
--
-- evidence_status stays 'design_verified' for every Studio role. The Studio
-- conformance suite is version 1 prose with no runner and has never been
-- executed; nothing in this release raises the evidence bar and nothing in it
-- may imply that it did.
--
-- Digest is sha256 of studio/contracts/STUDIO-RUNTIME-CONTRACT.md at this
-- release. Verify before applying:
--   shasum -a 256 studio/contracts/STUDIO-RUNTIME-CONTRACT.md

UPDATE factory.agent_runtime_contracts
   SET canonical_contract_version = 'studio-runtime/1.1.0',
       contract_digest = 'sha256:8d6aff8165691eac4c4720f003eea33cbd3a768f82a660c5da7216dff8b780ca',
       updated_at = now()
 WHERE tenant_id = 'omatic'
   AND agent_name IN ('brandy','carver','jo','monet','pixel');

-- Readback:
-- SELECT agent_name, canonical_contract_version, contract_digest,
--        l2_deployment_state, evidence_status
--   FROM factory.agent_runtime_contracts
--  WHERE tenant_id = 'omatic'
--    AND agent_name IN ('brandy','carver','jo','monet','pixel')
--  ORDER BY agent_name;
