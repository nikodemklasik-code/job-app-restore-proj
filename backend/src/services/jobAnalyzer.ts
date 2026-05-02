/**
 * Job Description Analysis Service
 * Extracts structured data from job descriptions for tailored document generation
 */

import { tryGetOpenAiClient } from '../lib/openai/openai.client.js';
import { getDefaultTextModel } from '../lib/openai/model-registry.js';

const getOpenAIClient = () => tryGetOpenAiClient();

export interface JobAnalysis {
    // Extracted from job description
    requiredSkills: string[];
    preferredSkills: string[];
    keywords: string[];
    seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
    industry: string;
    responsibilities: string[];
    qualifications: string[];

    // Scoring
    keywordDensity: Record<string, number>;
    priorityScore: Record<string, number>;
}

export interface ProfileJobMatch {
    matchedSkills: Array<{
        skill: string;
        profileEvidence: string[];
        jobRequirement: string;
        matchStrength: number;
    }>;

    matchedExperience: Array<{
        experienceId: string;
        relevanceScore: number;
        matchingKeywords: string[];
        suggestedHighlights: string[];
    }>;

    gaps: Array<{
        requirement: string;
        severity: 'critical' | 'important' | 'nice-to-have';
        suggestion: string;
    }>;

    overallFitScore: number;
}

/**
 * Analyzes job description to extract structured requirements
 */
export async function analyzeJobDescription(
    jobDescription: string,
    jobTitle: string,
    company: string
): Promise<JobAnalysis> {
    const client = getOpenAIClient();
    if (!client) {
        throw new Error('OpenAI client not available');
    }

    const model = getDefaultTextModel();

    const prompt = `You are an expert recruiter analyzing a job description. Extract structured data from this job posting.

Job Title: ${jobTitle}
Company: ${company}

Job Description:
${jobDescription}

Analyze and return a JSON object with:
1. requiredSkills: Array of 5-10 must-have skills (strings)
2. preferredSkills: Array of 3-5 nice-to-have skills (strings)
3. keywords: Array of 10-15 important keywords/technologies (strings)
4. seniority: One of 'junior', 'mid', 'senior', 'lead', 'principal'
5. industry: Industry category (e.g., 'Tech', 'Finance', 'Healthcare')
6. responsibilities: Array of 3-5 key responsibilities (strings)
7. qualifications: Array of 3-5 education/certification requirements (strings)

For keywordDensity and priorityScore, analyze the job description and return:
- keywordDensity: Object mapping keywords to their frequency (0-1 scale)
- priorityScore: Object mapping skills to importance (1-10 scale)

Return ONLY valid JSON, no markdown or explanation.`;

    try {
        const response = await client.messages.create({
            model,
            max_tokens: 2000,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const content = response.content[0];
        if (content.type !== 'text') {
            throw new Error('Unexpected response type from OpenAI');
        }

        // Parse JSON response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Could not extract JSON from response');
        }

        const analysis = JSON.parse(jsonMatch[0]) as JobAnalysis;

        // Validate and normalize
        return {
            requiredSkills: Array.isArray(analysis.requiredSkills)
                ? analysis.requiredSkills.slice(0, 10)
                : [],
            preferredSkills: Array.isArray(analysis.preferredSkills)
                ? analysis.preferredSkills.slice(0, 5)
                : [],
            keywords: Array.isArray(analysis.keywords)
                ? analysis.keywords.slice(0, 15)
                : [],
            seniority: validateSeniority(analysis.seniority),
            industry: String(analysis.industry || 'Technology'),
            responsibilities: Array.isArray(analysis.responsibilities)
                ? analysis.responsibilities.slice(0, 5)
                : [],
            qualifications: Array.isArray(analysis.qualifications)
                ? analysis.qualifications.slice(0, 5)
                : [],
            keywordDensity: normalizeScores(analysis.keywordDensity || {}),
            priorityScore: normalizeScores(analysis.priorityScore || {}, 10),
        };
    } catch (error) {
        console.error('Error analyzing job description:', error);
        throw error;
    }
}

/**
 * Matches user profile to job requirements
 */
export async function matchProfileToJob(
    profile: {
        fullName?: string;
        summary?: string;
        skills?: string[];
        experience?: Array<{
            id?: string;
            title?: string;
            company?: string;
            description?: string;
            achievements?: string[];
        }>;
        education?: Array<{
            degree?: string;
            school?: string;
        }>;
        trainings?: Array<{
            title?: string;
            provider?: string;
        }>;
    },
    jobAnalysis: JobAnalysis
): Promise<ProfileJobMatch> {
    const client = getOpenAIClient();
    if (!client) {
        throw new Error('OpenAI client not available');
    }

    const model = getDefaultTextModel();

    // Prepare profile summary for AI
    const profileSummary = `
Profile: ${profile.fullName || 'Candidate'}
Summary: ${profile.summary || 'No summary provided'}

Skills: ${(profile.skills || []).join(', ')}

Experience:
${(profile.experience || [])
            .map(
                (exp) => `
- ${exp.title} at ${exp.company}
  ${exp.description || ''}
  Achievements: ${(exp.achievements || []).join('; ')}
`
            )
            .join('\n')}

Education: ${(profile.education || [])
            .map((edu) => `${edu.degree} from ${edu.school}`)
            .join('; ')}

Trainings: ${(profile.trainings || [])
            .map((t) => `${t.title} (${t.provider})`)
            .join('; ')}
`;

    const prompt = `You are an expert recruiter matching a candidate profile to a job.

CANDIDATE PROFILE:
${profileSummary}

JOB REQUIREMENTS:
Required Skills: ${jobAnalysis.requiredSkills.join(', ')}
Preferred Skills: ${jobAnalysis.preferredSkills.join(', ')}
Keywords: ${jobAnalysis.keywords.join(', ')}
Seniority Level: ${jobAnalysis.seniority}
Responsibilities: ${jobAnalysis.responsibilities.join('; ')}
Qualifications: ${jobAnalysis.qualifications.join('; ')}

Analyze the match and return a JSON object with:

1. matchedSkills: Array of objects with:
   - skill: The skill name
   - profileEvidence: Array of where this skill appears in profile (e.g., "Experience: Senior Engineer", "Skills list")
   - jobRequirement: The matching requirement from job
   - matchStrength: 0-100 score

2. matchedExperience: Array of objects with:
   - experienceId: Index or ID of experience entry
   - relevanceScore: 0-100 score
   - matchingKeywords: Array of keywords from job found in this experience
   - suggestedHighlights: Array of achievements to emphasize

3. gaps: Array of objects with:
   - requirement: The missing requirement
   - severity: 'critical', 'important', or 'nice-to-have'
   - suggestion: How to address the gap

4. overallFitScore: 0-100 overall match score

Return ONLY valid JSON, no markdown or explanation.`;

    try {
        const response = await client.messages.create({
            model,
            max_tokens: 3000,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const content = response.content[0];
        if (content.type !== 'text') {
            throw new Error('Unexpected response type from OpenAI');
        }

        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Could not extract JSON from response');
        }

        const match = JSON.parse(jsonMatch[0]) as ProfileJobMatch;

        // Validate and normalize
        return {
            matchedSkills: (match.matchedSkills || [])
                .map((s) => ({
                    skill: String(s.skill || ''),
                    profileEvidence: Array.isArray(s.profileEvidence)
                        ? s.profileEvidence
                        : [],
                    jobRequirement: String(s.jobRequirement || ''),
                    matchStrength: Math.min(100, Math.max(0, Number(s.matchStrength) || 0)),
                }))
                .filter((s) => s.skill),
            matchedExperience: (match.matchedExperience || [])
                .map((e) => ({
                    experienceId: String(e.experienceId || ''),
                    relevanceScore: Math.min(100, Math.max(0, Number(e.relevanceScore) || 0)),
                    matchingKeywords: Array.isArray(e.matchingKeywords)
                        ? e.matchingKeywords
                        : [],
                    suggestedHighlights: Array.isArray(e.suggestedHighlights)
                        ? e.suggestedHighlights
                        : [],
                }))
                .filter((e) => e.experienceId),
            gaps: (match.gaps || [])
                .map((g) => ({
                    requirement: String(g.requirement || ''),
                    severity: validateSeverity(g.severity),
                    suggestion: String(g.suggestion || ''),
                }))
                .filter((g) => g.requirement),
            overallFitScore: Math.min(
                100,
                Math.max(0, Number(match.overallFitScore) || 0)
            ),
        };
    } catch (error) {
        console.error('Error matching profile to job:', error);
        throw error;
    }
}

// Helper functions

function validateSeniority(
    value: unknown
): 'junior' | 'mid' | 'senior' | 'lead' | 'principal' {
    const valid = ['junior', 'mid', 'senior', 'lead', 'principal'];
    if (typeof value === 'string' && valid.includes(value)) {
        return value as 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
    }
    return 'mid';
}

function validateSeverity(
    value: unknown
): 'critical' | 'important' | 'nice-to-have' {
    const valid = ['critical', 'important', 'nice-to-have'];
    if (typeof value === 'string' && valid.includes(value)) {
        return value as 'critical' | 'important' | 'nice-to-have';
    }
    return 'important';
}

function normalizeScores(
    obj: Record<string, unknown>,
    maxValue: number = 1
): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(obj)) {
        const num = Number(value) || 0;
        result[key] = Math.min(maxValue, Math.max(0, num));
    }
    return result;
}
