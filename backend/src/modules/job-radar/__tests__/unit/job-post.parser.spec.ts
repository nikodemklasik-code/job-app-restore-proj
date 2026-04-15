import { describe, it, expect } from 'vitest';
import { JobPostParser } from '../../infrastructure/parsers/job-post.parser.js';

describe('JobPostParser', () => {
  const parser = new JobPostParser();

  it('extracts salary, work mode and benefits', async () => {
    const html = `
      <html>
        <body>
          <h1>Product Designer</h1>
          <p>Hybrid role based in London</p>
          <p>Salary £70,000 - £85,000</p>
          <p>Benefits include private healthcare, training budget and bonus</p>
        </body>
      </html>
    `;

    const result = await parser.parse({
      sourceType: 'official_website',
      rawContent: html,
      metadata: {},
    });

    expect(result.containsOfferFields).toBe(true);
    expect(result.extractedFields.work_mode).toBe('Hybrid');
    expect(result.extractedFields.salary).toEqual({
      min: 70000,
      max: 85000,
      currency: 'GBP',
    });

    const keys = result.signals.map((s) => s.signalKey);
    expect(keys).toContain('salary_min');
    expect(keys).toContain('salary_max');
    expect(keys).toContain('benefit_private_healthcare');
    expect(keys).toContain('benefit_training_budget');
    expect(keys).toContain('benefit_bonus');
  });
});
