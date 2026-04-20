/**
 * Realtime / voice — central model id + integration note.
 * Ephemeral session and WebSocket wiring stay in feature routes/services.
 * @see docs/squad/Agent_OpenAI_Models_And_Secrets_Spec.md
 */

import { getRealtimeModelId } from './model-registry.js';

export function getRealtimeVoiceModelId(): string {
  return getRealtimeModelId();
}

export const REALTIME_INTEGRATION_NOTE =
  'Use getRealtimeVoiceModelId() for the model id; keep transport/session logic out of UI screens.';
