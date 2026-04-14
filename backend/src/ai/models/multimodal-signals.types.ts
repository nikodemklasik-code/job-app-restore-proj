export interface VoiceSignals {
  pacing?: 'slow' | 'balanced' | 'fast' | 'variable';
  hesitationLevel?: 'low' | 'medium' | 'high';
  vocalStability?: 'low' | 'medium' | 'high';
  fillerWordLevel?: 'low' | 'medium' | 'high';
}

export interface VisualSignals {
  eyeContact?: 'low' | 'medium' | 'high';
  facialComposure?: 'low' | 'medium' | 'high';
  postureStability?: 'low' | 'medium' | 'high';
}

export interface MultimodalSignals {
  voice?: VoiceSignals;
  visual?: VisualSignals;
}
