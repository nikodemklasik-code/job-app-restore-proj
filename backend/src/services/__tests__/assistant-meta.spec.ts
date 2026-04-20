import { describe, expect, it } from 'vitest';
import type { AssistantResponseMeta } from '../../../../shared/assistant.js';
import { buildAssistantResponseMeta } from '../openai.js';

describe('buildAssistantResponseMeta', () => {
  it('matches AssistantResponseMeta shape (shared contract for QC drift guard)', () => {
    const meta = buildAssistantResponseMeta({ userText: 'Help me prepare for a system design interview.' });
    const typed: AssistantResponseMeta = meta;
    expect(typed.detectedIntent).toBeTruthy();
    expect(Array.isArray(typed.suggestedActions)).toBe(true);
    expect(Array.isArray(typed.routeSuggestions)).toBe(true);
    expect(Array.isArray(typed.contextRefs)).toBe(true);
    expect(Array.isArray(typed.safetyNotes)).toBe(true);
    expect(typed.nextBestStep === undefined || typeof typed.nextBestStep === 'string').toBe(true);
    expect(typed.complianceFlags === undefined || Array.isArray(typed.complianceFlags)).toBe(true);
  });

  it('returns deterministic contract fields for general prompts', () => {
    const meta = buildAssistantResponseMeta({
      userText: 'Help me improve my cv bullets for product manager roles.',
    });

    expect(meta.detectedIntent).toBe('improve_cv');
    expect(meta.suggestedActions.length).toBeGreaterThan(0);
    expect(meta.routeSuggestions.length).toBeGreaterThan(0);
    expect(meta.contextRefs.length).toBeGreaterThan(0);
    expect(meta.safetyNotes.length).toBeGreaterThan(0);
    expect(meta.nextBestStep).toBeTruthy();
    expect(Array.isArray(meta.complianceFlags)).toBe(true);
  });

  it('adds case-practice legal caution notes and flags', () => {
    const meta = buildAssistantResponseMeta({
      userText: 'I may need ACAS before an employment tribunal for discrimination.',
    });

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

  it('prefers explicit client mode over vague text for intent', () => {
    const meta = buildAssistantResponseMeta({
      userText: 'What should I focus on next?',
      mode: 'interview',
    });
    expect(meta.detectedIntent).toBe('prepare_for_interview');
  });

  it('adds urgent safeguarding behavior for high-risk prompts', () => {
    const meta = buildAssistantResponseMeta({
      userText: 'There is violence at work and I feel unsafe right now.',
    });

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
