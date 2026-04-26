import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  careerGoals,
  cvUploads,
  documentUploads,
  experiences,
  profiles,
  skills,
  users,
} from '../../db/schema.js';
import { generateJobQueries } from './aiQueryGenerator.js';
import type { DiscoveryInput, ProviderContext, SourceJob } from './types.js';
import type { ProviderName } from '../../../../shared/jobSources.js';

const DELEGATE_NAMES: ProviderName[] = [
  'reed',
  'adzuna',
  'jooble',
  'indeed-browser',
  'database',
  'manual',
  'company-targets',
];

function splitWorkValues(value: string | null | undefined): string[] {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function collectCvKeywordHints(input: {
  legacyParsedText?: string | null;
  documentText?: string | null;
  parsedData?: unknown;
  parsedStructure?: unknown;
}): string[] {
  const hints = new Set<string>();
  const raw = [
    input.legacyParsedText,
    input.documentText,
    JSON.stringify(input.parsedData ?? {}),
    JSON.stringify(input.parsedStructure ?? {}),
  ].join(' ');

  // Common tech/skill keywords to look for
  const commonKeywords = [
    // Languages
    'react', 'typescript', 'javascript', 'node', 'python', 'java', 'go', 'rust', 'c#', 'c++', 'php', 'ruby', 'kotlin',
    // Databases
    'sql', 'postgres', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb',
    // Cloud/DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'devops', 'ci/cd', 'jenkins', 'gitlab',
    // Frontend
    'vue', 'angular', 'next.js', 'nuxt', 'tailwind', 'figma', 'ui', 'ux', 'responsive',
    // Roles/Domains
    'frontend', 'backend', 'full stack', 'full-stack', 'project manager', 'product manager', 'data analyst',
    'customer support', 'sales', 'marketing', 'hr', 'finance', 'accounting', 'nurse', 'teacher',
    // Soft skills
    'leadership', 'communication', 'mentoring', 'agile', 'scrum', 'testing', 'automation',
    // Other
    'rest api', 'graphql', 'microservices', 'saas', 'b2b', 'b2c', 'crm', 'salesforce', 'hubspot',
  ];

  const rawLower = raw.toLowerCase();
  for (const keyword of commonKeywords) {
    if (rawLower.includes(keyword)) {
      hints.add(keyword);
    }
  }

  // Also extract capitalized words that might be skills (e.g., "React", "Python", "AWS")
  const capitalizedWords = raw.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) ?? [];
  for (const word of capitalizedWords) {
    const lower = word.toLowerCase();
    // Only add if it looks like a skill (not a common name)
    if (
      /^(react|vue|angular|python|java|javascript|typescript|node|aws|azure|gcp|docker|kubernetes|figma|salesforce|hubspot|jira|slack|notion)$/i.test(lower)
    ) {
      hints.add(lower);
    }
  }

  return Array.from(hints).slice(0, 12);
}

export async function discoverJobsForProfile(
  input: DiscoveryInput,
  context?: ProviderContext,
): Promise<SourceJob[]> {
  // Lazy import to avoid circular dependency with jobDiscoveryService.
  const { JobDiscoveryService } = await import('./jobDiscoveryService.js');

  let profileData: {
    skills?: string[];
    experiences?: Array<{ jobTitle: string }>;
    targetRole?: string;
    currentJobTitle?: string | null;
    targetSeniority?: string | null;
    summary?: string | null;
    workValues?: string[];
  } = {};

  if (input.userId) {
    try {
      const userRows = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, input.userId))
        .limit(1);

      const localUserId = userRows[0]?.id;
      if (localUserId) {
        const [profileRow, goalRow, legacyCvRow, documentCvRow] = await Promise.all([
          db
            .select({ id: profiles.id, summary: profiles.summary, headline: profiles.headline })
            .from(profiles)
            .where(eq(profiles.userId, localUserId))
            .limit(1),
          db
            .select({
              currentJobTitle: careerGoals.currentJobTitle,
              targetJobTitle: careerGoals.targetJobTitle,
              targetSeniority: careerGoals.targetSeniority,
              workValues: careerGoals.workValues,
            })
            .from(careerGoals)
            .where(eq(careerGoals.userId, localUserId))
            .limit(1),
          db
            .select({ parsedText: cvUploads.parsedText, parsedData: cvUploads.parsedData })
            .from(cvUploads)
            .where(eq(cvUploads.userId, localUserId))
            .limit(1),
          db
            .select({ extractedTextEncrypted: documentUploads.extractedTextEncrypted, parsedStructure: documentUploads.parsedStructure })
            .from(documentUploads)
            .where(eq(documentUploads.userId, localUserId))
            .limit(1),
        ]);

        const profile = profileRow[0];
        if (profile) {
          const [skillRows, expRows] = await Promise.all([
            db
              .select({ name: skills.name })
              .from(skills)
              .where(eq(skills.profileId, profile.id)),
            db
              .select({ jobTitle: experiences.jobTitle })
              .from(experiences)
              .where(eq(experiences.profileId, profile.id))
              .limit(5),
          ]);

          const cvHints = collectCvKeywordHints({
            legacyParsedText: legacyCvRow[0]?.parsedText ?? null,
            documentText: documentCvRow[0]?.extractedTextEncrypted ?? null,
            parsedData: legacyCvRow[0]?.parsedData,
            parsedStructure: documentCvRow[0]?.parsedStructure,
          });

          const skillNames = skillRows.map((s) => s.name);
          profileData = {
            targetRole: goalRow[0]?.targetJobTitle ?? profile.headline ?? undefined,
            currentJobTitle: goalRow[0]?.currentJobTitle ?? null,
            targetSeniority: goalRow[0]?.targetSeniority ?? null,
            summary: profile.summary ?? null,
            workValues: splitWorkValues(goalRow[0]?.workValues),
            skills: [...skillNames, ...cvHints].filter(Boolean),
            experiences: expRows.map((e) => ({ jobTitle: e.jobTitle })),
          };
        } else if (goalRow[0]) {
          profileData = {
            targetRole: goalRow[0].targetJobTitle ?? undefined,
            currentJobTitle: goalRow[0].currentJobTitle ?? null,
            targetSeniority: goalRow[0].targetSeniority ?? null,
            workValues: splitWorkValues(goalRow[0].workValues),
          };
        }
      }
    } catch (err) {
      console.error('[profileDrivenDiscovery] Failed to load profile:', err);
    }
  }

  const queries = await generateJobQueries(profileData, 5);

  const allJobs: SourceJob[] = [];
  for (const query of queries) {
    try {
      // Enhance query with seniority if available
      let enhancedQuery = query;
      if (profileData.targetSeniority && !query.toLowerCase().includes(profileData.targetSeniority.toLowerCase())) {
        enhancedQuery = `${query} ${profileData.targetSeniority}`;
      }

      const result = await JobDiscoveryService.discover(
        { ...input, query: enhancedQuery, providers: DELEGATE_NAMES },
        context,
      );
      allJobs.push(...result.jobs);
    } catch (err) {
      console.error(`[profileDrivenDiscovery] Query "${query}" failed:`, err);
    }
  }

  const seen = new Set<string>();
  const deduped = allJobs.filter((j) => {
    const key = `${j.externalId.toLowerCase().trim()}|${j.source.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped
    .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
    .slice(0, input.limit);
}
