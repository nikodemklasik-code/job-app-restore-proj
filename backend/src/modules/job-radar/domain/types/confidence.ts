export const CONFIDENCE = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type Confidence = (typeof CONFIDENCE)[keyof typeof CONFIDENCE];
