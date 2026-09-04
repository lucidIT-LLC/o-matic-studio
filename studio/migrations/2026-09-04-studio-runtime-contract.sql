INSERT INTO factory.agent_runtime_contracts (
  tenant_id, agent_name, canonical_contract_version, execution_modes,
  l1_deployment_state, l2_deployment_state, platform_adapters,
  contract_digest, evidence_status
)
SELECT 'omatic', a.agent_name, 'studio-runtime/1.0.0', ARRAY['l1','l2'],
       'ready', 'not_deployed',
       '{"codex":{"status":"design_verified"},"claude":{"status":"design_verified"},"copilot":{"status":"design_verified"},"gemini":{"status":"design_verified"},"chatgpt":{"status":"design_verified"}}'::jsonb,
       'sha256:1d7cad8ca8d426632bcc790cf757ad19efa71118a4f31344211160df29fdefed', 'design_verified'
FROM factory.agent_state a
WHERE a.agent_name IN ('brandy','carver','jo','monet','pixel')
ON CONFLICT (tenant_id, agent_name) DO UPDATE SET
  canonical_contract_version = EXCLUDED.canonical_contract_version,
  execution_modes = EXCLUDED.execution_modes,
  l1_deployment_state = EXCLUDED.l1_deployment_state,
  l2_deployment_state = EXCLUDED.l2_deployment_state,
  platform_adapters = EXCLUDED.platform_adapters,
  contract_digest = EXCLUDED.contract_digest,
  evidence_status = EXCLUDED.evidence_status,
  updated_at = now();
