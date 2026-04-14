import { TranscriptTurn } from '../models/interview.types.js';

export function renderTranscript(turns: TranscriptTurn[]): string {
  return turns
    .map((turn, index) => {
      const n = index + 1;
      const label = turn.speaker.toUpperCase();
      return `[${n}] ${label}: ${turn.text}`;
    })
    .join('\n');
}
