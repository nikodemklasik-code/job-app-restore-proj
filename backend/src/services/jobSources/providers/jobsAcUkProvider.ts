/**
 * jobs.ac.uk Provider
 * Leader for academic, research and university administration roles
 * Method: RSS Feeds (public, documented)
 * Documentation: https://www.jobs.ac.uk/feeds/subject-areas
 */

import Parser from 'rss-parser';
import type { JobSourceProvider, ProviderContext, SourceJob } from '../types.js';

interface JobsAcUkRssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  categories?: string[];
}

export class JobsAcUkProvider implements JobSourceProvider {
  name = 'jobs-ac-uk' as const;
  requiresSession = false;
  private parser: Parser<any, JobsAcUkRssItem>;

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: ['content', 'contentSnippet', 'guid'],
      },
    });
  }

  async search(ctx: ProviderContext): Promise<SourceJob[]> {
    try {
      // jobs.ac.uk provides RSS feeds by subject area and location
      // Example: https://www.jobs.ac.uk/feeds/subject-areas
      const feedUrl = this.buildFeedUrl(ctx);
      
      const feed = await this.parser.parseURL(feedUrl);
      
      if (!feed.items || feed.items.length === 0) {
        return [];
      }

      return feed.items.slice(0, ctx.limit || 20).map((item) => this.transformItem(item));
    } catch (error) {
      console.error('[JobsAcUkProvider] RSS parse error:', error);
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const feed = await this.parser.parseURL('https://www.jobs.ac.uk/feeds/subject-areas');
      return feed.items && feed.items.length > 0;
    } catch (error) {
      console.error('[JobsAcUkProvider] Health check failed:', error);
      return false;
    }
  }

  private buildFeedUrl(ctx: ProviderContext): string {
    // Base RSS feed URL
    let url = 'https://www.jobs.ac.uk/feeds/subject-areas';
    
    // jobs.ac.uk supports filtering by:
    // - Subject area (e.g., /computing)
    // - Location (e.g., /london)
    // - Job type (e.g., /research)
    
    // For now, use general feed
    // TODO: Add query parameter mapping for subject areas
    
    return url;
  }

  private transformItem(item: JobsAcUkRssItem): SourceJob {
    // Extract location from title or content
    const location = this.extractLocation(item.title || '', item.contentSnippet || '');
    
    // Extract salary from content
    const salary = this.extractSalary(item.contentSnippet || '');

    return {
      id: item.guid || item.link || `jobs-ac-uk-${Date.now()}`,
      source: this.name,
      title: item.title || 'Academic Position',
      company: this.extractCompany(item.title || '', item.contentSnippet || ''),
      location,
      description: item.contentSnippet || item.content || '',
      url: item.link || '',
      postedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      salary,
      tags: item.categories || [],
    };
  }

  private extractLocation(title: string, content: string): string {
    // Common UK university locations
    const ukCities = [
      'London', 'Oxford', 'Cambridge', 'Edinburgh', 'Manchester', 'Birmingham',
      'Bristol', 'Leeds', 'Glasgow', 'Liverpool', 'Newcastle', 'Nottingham',
      'Sheffield', 'Southampton', 'Cardiff', 'Belfast', 'Durham', 'York',
    ];

    for (const city of ukCities) {
      if (title.includes(city) || content.includes(city)) {
        return city;
      }
    }

    return 'UK';
  }

  private extractCompany(title: string, content: string): string {
    // Try to extract university name from title
    // Format often: "Job Title at University Name"
    const atMatch = title.match(/at\s+(.+?)(?:\s*[-–—]|$)/i);
    if (atMatch) {
      return atMatch[1].trim();
    }

    // Try to extract from content
    const universityMatch = content.match(/University of ([A-Z][a-z]+)/);
    if (universityMatch) {
      return `University of ${universityMatch[1]}`;
    }

    return 'Academic Institution';
  }

  private extractSalary(content: string): string | undefined {
    // Look for salary patterns like "£35,000 - £45,000" or "Grade 7"
    const salaryMatch = content.match(/£[\d,]+(?:\s*-\s*£[\d,]+)?/);
    if (salaryMatch) {
      return salaryMatch[0];
    }

    const gradeMatch = content.match(/Grade\s+\d+/i);
    if (gradeMatch) {
      return gradeMatch[0];
    }

    return undefined;
  }
}
