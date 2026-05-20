/**
 * NHS Jobs Provider
 * Official portal for all National Health Service roles (England & Wales)
 * Method: GOV.UK Open Data API
 * Documentation: https://api.apprenticeships.education.gov.uk
 */

import axios, { AxiosInstance } from 'axios';
import type { JobSourceProvider, ProviderContext, SourceJob } from '../types.js';

interface NHSJobListing {
  id: string;
  title: string;
  employerName: string;
  location: {
    town?: string;
    county?: string;
    postcode?: string;
  };
  description: string;
  closingDate: string;
  postedDate: string;
  salary?: {
    min?: number;
    max?: number;
    text?: string;
  };
  contractType?: string;
  workingPattern?: string;
  applyUrl: string;
}

export class NHSJobsProvider implements JobSourceProvider {
  name = 'nhs-jobs' as const;
  requiresSession = false;
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://www.jobs.nhs.uk/api',
      timeout: 10000,
      headers: {
        'User-Agent': 'MultivoHub-JobApp/1.0',
        'Accept': 'application/json',
      },
    });
  }

  async search(ctx: ProviderContext): Promise<SourceJob[]> {
    try {
      // NHS Jobs API endpoint (if available)
      // Note: Actual API may require authentication or have different structure
      // This is a placeholder implementation based on GOV.UK API patterns
      
      const params: Record<string, any> = {
        keyword: ctx.query || '',
        location: ctx.location || '',
        distance: ctx.radius || 25,
        pageSize: Math.min(ctx.limit || 20, 100),
        pageNumber: 1,
      };

      // For now, return empty array as NHS Jobs API requires specific credentials
      // Implementation would need:
      // 1. API key from NHS Jobs
      // 2. Proper endpoint documentation
      // 3. Authentication setup
      
      console.log('[NHSJobsProvider] API integration pending - requires NHS Jobs API credentials');
      return [];

      // Placeholder for actual implementation:
      /*
      const response = await this.client.get<{ results: NHSJobListing[] }>('/vacancies/search', {
        params,
      });

      return response.data.results.map((job) => this.transformJob(job));
      */
    } catch (error) {
      console.error('[NHSJobsProvider] Search error:', error);
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Health check would ping NHS Jobs API
      // For now, return true as placeholder
      return true;
    } catch (error) {
      console.error('[NHSJobsProvider] Health check failed:', error);
      return false;
    }
  }

  private transformJob(job: NHSJobListing): SourceJob {
    const location = [
      job.location.town,
      job.location.county,
      job.location.postcode,
    ]
      .filter(Boolean)
      .join(', ') || 'UK';

    let salary: string | undefined;
    if (job.salary) {
      if (job.salary.text) {
        salary = job.salary.text;
      } else if (job.salary.min && job.salary.max) {
        salary = `£${job.salary.min.toLocaleString()} - £${job.salary.max.toLocaleString()}`;
      } else if (job.salary.min) {
        salary = `£${job.salary.min.toLocaleString()}+`;
      }
    }

    return {
      id: `nhs-${job.id}`,
      source: this.name,
      title: job.title,
      company: job.employerName,
      location,
      description: job.description,
      url: job.applyUrl,
      postedAt: new Date(job.postedDate),
      salary,
      tags: [
        job.contractType,
        job.workingPattern,
        'Healthcare',
        'NHS',
      ].filter(Boolean) as string[],
    };
  }
}
