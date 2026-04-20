/**
 * Canonical entry for AI model IDs (re-exports registry).
 * @see docs/squad/Agent_OpenAI_Models_And_Secrets_Spec.md
 */
export {
  getDefaultTextModel,
  getPremiumTextModel,
  getRoutingModel,
  getRealtimeModelId,
  getLegalSearchModel,
  getLegalDeepModel,
  getModelRegistrySnapshot,
} from '../lib/openai/model-registry.js';
