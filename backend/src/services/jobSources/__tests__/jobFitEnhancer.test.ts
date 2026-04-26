import { describe, it, expect, vi } from 'vitest';
import { enhanceJobFitWithAI, enhanceJobsWithAI } from '../jobFitEnhancer.js';
import type { SourceJob } from '../types.js';

// Mock OpenAI client
vi.mock('../../lib/openai/openai.client.js', () => ({
  tryGetOpenAiClient: vi.fn(() => null), // Disabled for tests
}));

describe('jobFitEnhancer', () => {
  const mockProfile = {
    skills: ['React', 'TypeScript', 'Node.js'],
    summary: 'Senior frontend developer with 5 years experience',
    targetRole: 'Senior Frontend Developer',
    targetSeniority: 'Senior',
  };

  const mockJob: SourceJob = {
    externalId: 'job-123',
    source: 'indeed-browser',
    title: 'Senior React Developer',
    company: 'TechCorp',
    location: 'London',
    description: 'We are looking for a Senior React Developer with TypeScript experience',
    applyUrl: 'https://indeed.co.uk/viewjob?jk=123',
    salaryMin: 70000,
    salaryMax: 90000,
    workMode: 'remote',
    requirements: ['5+ years React experience', 'TypeScript proficiency', 'REST API design'],
    postedAt: new Date().toISOString(),
    fitScore: 50,
  };

  it('should return current fitScore when OpenAI is unavailable', async () => {
    const result = await enhanceJobFitWithAI(mockProfile, mockJob);
    expect(result.fitScore).toBe(50);
    expect(result.aiReasoning).toBeUndefined();
  });

  it('should batch enhance multiple jobs', async () => {
    const jobs = [mockJob, { ...mockJob, externalId: 'job-124', fitScore: 45 }];
    const result = await enhanceJobsWithAI(mockProfile, jobs, 2);
    expect(result).toHaveLength(2);
    expect(result[0].fitScore).toBe(50);
    expect(result[1].fitScore).toBe(45);
  });

  it('should limit batch to maxJobs parameter', async () => {
    const jobs = Array.from({ length: 10 }, (_, i) => ({
      ...mockJob,
      externalId: `job-${i}`,
    }));
    const result = await enhanceJobsWithAI(mockProfile, jobs, 3);
    expect(result).toHaveLength(10); // Returns all, but only enhances top 3
  });
});
