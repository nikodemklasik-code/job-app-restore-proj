export type ConversationState =
  | 'idle'
  | 'listening'
  | 'speaking'
  | 'thinking'
  | 'transcribing'
  | 'interrupted'
  | 'ended'
  | 'error';
