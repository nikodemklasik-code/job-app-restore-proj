import { describe, it, expect } from 'vitest';
import { scoreJobFit } from '../aiPersonalizer.js';

describe('scoreJobFit - improved algorithm', () => {
  it('should score high for perfect skill match', async () => {
    const profile = {
      skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
      summary: 'Senior Frontend Developer',
    };
    const job = {
      title: 'Senior React Developer',
      company: 'TechCorp',
      description: 'Looking for React and TypeScript expert with Node.js backend knowledge',
      requirements: ['React', 'TypeScript', 'Node.js', 'AWS'],
    };

    const { score, reasons } = await scoreJobFit(profile, job);
    expect(score).toBeGreaterThan(75);
    expect(reasons.some((r) => r.includes('skills match'))).toBe(true);
  });

  it('should score low for no skill match', async () => {
    const profile = {
      skills: ['React', 'TypeScript'],
      summary: 'Frontend Developer',
    };
    const job = {
      title: 'Warehouse Worker',
      company: 'Logistics Inc',
      description: 'Looking for warehouse staff to manage inventory',
      requirements: ['Forklift license', 'Physical fitness'],
    };

    const { score, reasons } = await scoreJobFit(profile, job);
    expect(score).toBeLessThan(40);
    expect(reasons.some((r) => r.includes('No skill overlap'))).toBe(true);
  });

  it('should reward title alignment', async () => {
    const profile = {
      skills: ['Python', 'SQL'],
      summary: 'Data Analyst with 3 years experience',
    };
    const job = {
      title: 'Data Analyst',
      company: 'Analytics Co',
      description: 'Seeking data analyst for reporting and insights',
      requirements: ['SQL', 'Excel'],
    };

    const { score, reasons } = await scoreJobFit(profile, job);
    expect(score).toBeGreaterThan(60);
    expect(reasons.some((r) => r.includes('aligns'))).toBe(true);
  });

  it('should reward seniority match', async () => {
    const profile = {
      skills: ['Java', 'Spring'],
      summary: 'Senior Backend Engineer',
    };
    const job = {
      title: 'Senior Java Developer',
      company: 'Enterprise Corp',
      description: 'Senior role for experienced Java developer',
      requirements: ['Java', 'Spring Boot'],
    };

    const { score, reasons } = await scoreJobFit(profile, job);
    expect(reasons.some((r) => r.includes('Seniority'))).toBe(true);
  });

  it('should reward remote work preference match', async () => {
    const profile = {
      skills: ['React'],
      summary: 'Frontend developer looking for remote work',
    };
    const job = {
      title: 'React Developer',
      company: 'Remote First Co',
      description: 'Remote React position',
      requirements: ['React'],
      workMode: 'remote',
    };

    const { score, reasons } = await scoreJobFit(profile, job);
    expect(reasons.some((r) => r.includes('Remote'))).toBe(true);
  });

  it('should handle partial skill match', async () => {
    const profile = {
      skills: ['React', 'TypeScript', 'Python', 'AWS'],
      summary: 'Full stack developer',
    };
    const job = {
      title: 'React Developer',
      company: 'StartUp',
      description: 'React and TypeScript required',
      requirements: ['React', 'TypeScript'],
    };

    const { score, reasons } = await scoreJobFit(profile, job);
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(90);
    expect(reasons.some((r) => r.includes('skills match'))).toBe(true);
  });

  it('should cap score at 99', async () => {
    const profile = {
      skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'Kubernetes'],
      summary: 'Senior Full Stack Engineer with 10 years experience',
    };
    const job = {
      title: 'Senior Full Stack Engineer',
      company: 'TechCorp',
      description: 'React TypeScript Node.js AWS Docker Kubernetes',
      requirements: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'Kubernetes'],
    };

    const { score } = await scoreJobFit(profile, job);
    expect(score).toBeLessThanOrEqual(99);
  });

  it('should floor score at 10', async () => {
    const profile = {
      skills: [],
      summary: '',
    };
    const job = {
      title: 'Any Job',
      company: 'Any Company',
      description: '',
      requirements: [],
    };

    const { score } = await scoreJobFit(profile, job);
    expect(score).toBeGreaterThanOrEqual(10);
  });
});
