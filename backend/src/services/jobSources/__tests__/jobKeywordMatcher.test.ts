import { describe, it, expect } from 'vitest';
import { keywordScoreJob, keywordScoreJobs, expandQueryByKeywordRules } from '../jobKeywordMatcher.js';
import type { SourceJob } from '../types.js';

describe('jobKeywordMatcher - expanded rules', () => {
  const createJob = (overrides: Partial<SourceJob> = {}): SourceJob => ({
    externalId: 'job-1',
    source: 'test',
    title: 'Test Job',
    company: 'Test Co',
    location: 'London',
    description: '',
    applyUrl: 'https://example.com',
    salaryMin: null,
    salaryMax: null,
    workMode: null,
    requirements: [],
    postedAt: new Date().toISOString(),
    ...overrides,
  });

  describe('Software Engineer rule', () => {
    it('should match React Developer to software engineer rule', () => {
      const job = createJob({
        title: 'React Developer',
        description: 'We need a React and TypeScript expert',
        requirements: ['React', 'TypeScript', 'Node.js'],
      });

      const scored = keywordScoreJob(job, 'software engineer');
      expect(scored.fitScore).toBeGreaterThan(50);
    });

    it('should penalize waiter job for software engineer query', () => {
      const job = createJob({
        title: 'Waiter',
        description: 'Restaurant waiting staff needed',
      });

      const scored = keywordScoreJob(job, 'software engineer');
      expect(scored.fitScore).toBeLessThan(50);
    });
  });

  describe('Frontend Developer rule', () => {
    it('should match Vue.js job to frontend developer', () => {
      const job = createJob({
        title: 'Vue.js Developer',
        description: 'Looking for Vue and TypeScript developer',
        requirements: ['Vue', 'TypeScript', 'CSS'],
      });

      const scored = keywordScoreJob(job, 'frontend developer');
      expect(scored.fitScore).toBeGreaterThan(50);
    });
  });

  describe('Data Analyst rule', () => {
    it('should match SQL and Excel job to data analyst', () => {
      const job = createJob({
        title: 'Data Analyst',
        description: 'SQL, Excel, Power BI required',
        requirements: ['SQL', 'Excel', 'Power BI'],
      });

      const scored = keywordScoreJob(job, 'data analyst');
      expect(scored.fitScore).toBeGreaterThan(60);
    });
  });

  describe('Nurse rule', () => {
    it('should match nursing job to nurse query', () => {
      const job = createJob({
        title: 'Registered Nurse',
        description: 'Ward nursing position at NHS hospital',
        requirements: ['NMC registration', 'Clinical experience'],
      });

      const scored = keywordScoreJob(job, 'nurse');
      expect(scored.fitScore).toBeGreaterThan(50);
    });

    it('should penalize software job for nurse query', () => {
      const job = createJob({
        title: 'Software Engineer',
        description: 'React and Node.js developer',
      });

      const scored = keywordScoreJob(job, 'nurse');
      expect(scored.fitScore).toBeLessThan(50);
    });
  });

  describe('Sales rule', () => {
    it('should match sales job to sales query', () => {
      const job = createJob({
        title: 'Account Executive',
        description: 'B2B sales role with CRM and quota targets',
        requirements: ['Salesforce', 'Cold calling', 'Lead generation'],
      });

      const scored = keywordScoreJob(job, 'sales');
      expect(scored.fitScore).toBeGreaterThan(50);
    });
  });

  describe('expandQueryByKeywordRules', () => {
    it('should expand software engineer query', () => {
      const expanded = expandQueryByKeywordRules('software engineer');
      expect(expanded).toContain('software engineer');
      expect(expanded.length).toBeGreaterThan(1);
    });

    it('should expand frontend developer query', () => {
      const expanded = expandQueryByKeywordRules('frontend developer');
      expect(expanded).toContain('frontend developer');
      expect(expanded.some((q) => q.includes('react') || q.includes('vue'))).toBe(true);
    });

    it('should return original query if no rule matches', () => {
      const expanded = expandQueryByKeywordRules('obscure job title');
      expect(expanded).toEqual(['obscure job title']);
    });
  });

  describe('batch scoring', () => {
    it('should score multiple jobs', () => {
      const jobs = [
        createJob({ title: 'React Developer', description: 'React and TypeScript' }),
        createJob({ title: 'Waiter', description: 'Restaurant staff' }),
        createJob({ title: 'Data Analyst', description: 'SQL and Excel' }),
      ];

      const scored = keywordScoreJobs(jobs, 'software engineer');
      expect(scored[0].fitScore).toBeGreaterThan(scored[1].fitScore);
      expect(scored[2].fitScore).toBeLessThan(scored[0].fitScore);
    });
  });
});
