import { describe, expect, it } from 'vitest';
import { buildAssistantResponseMeta } from '../openai.js';

describe('buildAssistantResponseMeta', () => {
  it('returns deterministic contract fields for general prompts', () => {
    const input = 'Help me improve my CV bullets for product manager roles.';
    const meta = buildAssistantResponseMeta(input);

    expect(meta.detectedIntent).toBe('improve_cv');
    expect(meta.suggestedActions.length).toBeGreaterThan(0);
    expect(meta.routeSuggestions.length).toBeGreaterThan(0);
    expect(meta.contextRefs.length).toBeGreaterThan(0);
    expect(meta.safetyNotes.length).toBeGreaterThan(0);
    expect(meta.nextBestStep).toBeTruthy();
    expect(Array.isArray(meta.complianceFlags)).toBe(true);
  });

  it('adds case-practice legal caution notes and flags', () => {
    const meta = buildAssistantResponseMeta(
      'I may need ACAS before an employment tribunal for discrimination.',
    );

    const noteTexts = meta.safetyNotes.map((note) => note.text);
    expect(noteTexts).toContain(
      'This Is Practice Support, Not Legal Advice Or Outcome Prediction.',
    );
    expect(noteTexts).toContain(
      'This May Raise A Formal Concern. Document Facts And Consider Qualified Advice.',
    );
    expect(meta.complianceFlags).toContain('Case Practice Legal Caution');
    expect(meta.complianceFlags).toContain('Sensitive Workplace Concern');
    expect(meta.routeSuggestions.some((route) => route.route === '/case-practice')).toBe(true);
  });

  it('adds urgent safeguarding behavior for high-risk prompts', () => {
    const meta = buildAssistantResponseMeta(
      'There is violence at work and I feel unsafe right now.',
    );

    expect(
      meta.safetyNotes.some(
        (note) =>
          note.level === 'block' &&
          note.text ===
            'If There Is Immediate Risk, Contact Emergency Or Human Support Now.',
      ),
    ).toBe(true);
    expect(meta.complianceFlags).toContain('Urgent Safeguarding');
  });
});
