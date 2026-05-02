/**
 * Document Tailoring Service
 * Generates tailored CV and cover letter based on job analysis and profile matching
 */

import { tryGetOpenAiClient } from '../lib/openai/openai.client.js';
import { getDefaultTextModel } from '../lib/openai/model-registry.js';
import type { JobAnalysis, ProfileJobMatch } from './jobAnalyzer.js';

const getOpenAIClient = () => tryGetOpenAiClient();

export interface TailoredCvConfig {
    jobAnalysis: JobAnalysis;
    profileMatch: ProfileJobMatch;
    emphasizeSkills?: string[];
    reorderExperience?: boolean;
    includeAllExperience?: boolean;
    summaryStyle?: 'technical' | 'leadership' | 'balanced';
    maxPages?: 1 | 2 | 3;
}

export interface GeneratedCv {
    summary: string;
    skills: Array<{
        name: string;
        category: string;
        relevanceToJob: number;
    }>;
    experience: Array<{
        id: string;
        title: string;
        company: string;
        dates: string;
        description: string;
        achievements: string[];
        relevanceScore: number;
    }>;
    education: Array<{
        degree: string;
        school: string;
        dates: string;
        relevantCourses?: string[];
    }>;
    trainings: Array<{
        title: string;
        provider: string;
        date: string;
        relevanceToJob: number;
    }>;
    atsScore: number;
    keywordCoverage: number;
    estimatedFitScore: number;
}

export interface TailoredCoverLetter {
    greeting: string;
    opening: string;
    body: string[];
    closing: string;
    signature: string;
    companyResearch: {
        companyName: string;
        industry: string;
        recentNews?: string;
        values?: string[];
    };
    roleAlignment: {
        topMatchedSkills: string[];
        relevantAchievements: string[];
        whyThisRole: string;
    };
    tone: 'formal' | 'professional' | 'conversational';
    length: 'short' | 'medium' | 'long';
}

/**
 * Generates tailored CV based on job analysis
 */
export async function generateTailoredCv(
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
    jobAnalysis: JobAnalysis,
    profileMatch: ProfileJobMatch,
    config?: Partial<TailoredCvConfig>
): Promise<GeneratedCv> {
    const client = getOpenAIClient();

    // Prepare data
    const emphasizeSkills = config?.emphasizeSkills || jobAnalysis.requiredSkills.slice(0, 5);
    const reorderExperience = config?.reorderExperience !== false;
    const summaryStyle = config?.summaryStyle || 'balanced';

    // Reorder experience by relevance if requested
    let orderedExperience = profile.experience || [];
    if (reorderExperience && profileMatch.matchedExperience.length > 0) {
        const relevanceMap = new Map(
            profileMatch.matchedExperience.map((m) => [m.experienceId, m.relevanceScore])
        );
        orderedExperience = [...orderedExperience].sort((a, b) => {
            const scoreA = relevanceMap.get(a.id || '') || 0;
            const scoreB = relevanceMap.get(b.id || '') || 0;
            return scoreB - scoreA;
        });
    }

    // Reorder skills by relevance
    const skillRelevance = new Map<string, number>();
    for (const matched of profileMatch.matchedSkills) {
        skillRelevance.set(matched.skill.toLowerCase(), matched.matchStrength);
    }

    const orderedSkills = [...(profile.skills || [])]
        .map((skill) => ({
            name: skill,
            relevance: skillRelevance.get(skill.toLowerCase()) || 0,
        }))
        .sort((a, b) => b.relevance - a.relevance);

    // Filter trainings by relevance
    const relevantTrainings = (profile.trainings || []).filter((t) => {
        const title = (t.title || '').toLowerCase();
        return jobAnalysis.keywords.some((k) => title.includes(k.toLowerCase()));
    });

    // Calculate keyword coverage
    const allText = [
        profile.summary || '',
        ...(orderedSkills || []).map((s) => s.name),
        ...(orderedExperience || []).map((e) => e.description || ''),
    ]
        .join(' ')
        .toLowerCase();

    const keywordCoverage = Math.round(
        (jobAnalysis.keywords.filter((k) => allText.includes(k.toLowerCase())).length /
            jobAnalysis.keywords.length) *
        100
    );

    // Build CV
    const cv: GeneratedCv = {
        summary: profile.summary || '',
        skills: orderedSkills.slice(0, 15).map((s) => ({
            name: s.name,
            category: categorizeSkill(s.name, jobAnalysis),
            relevanceToJob: s.relevance,
        })),
        experience: orderedExperience.slice(0, 5).map((e) => {
            const matched = profileMatch.matchedExperience.find((m) => m.experienceId === e.id);
            return {
                id: e.id || '',
                title: e.title || '',
                company: e.company || '',
                dates: '',
                description: e.description || '',
                achievements: e.achievements || [],
                relevanceScore: matched?.relevanceScore || 0,
            };
        }),
        education: (profile.education || []).map((e) => ({ degree: e.degree || '', school: e.school || '', dates: '' })),
        trainings: relevantTrainings.slice(0, 5).map((t) => ({
            title: t.title || '',
            provider: t.provider || '',
            date: '',
            relevanceToJob: 75,
        })),
        atsScore: calculateAtsScore(profile, jobAnalysis),
        keywordCoverage,
        estimatedFitScore: profileMatch.overallFitScore,
    };

    return cv;
}

/**
 * Generates tailored cover letter based on job analysis
 */
export async function generateTailoredCoverLetter(
    profile: {
        fullName?: string;
        summary?: string;
        skills?: string[];
        experience?: Array<{
            title?: string;
            company?: string;
            description?: string;
            achievements?: string[];
        }>;
    },
    jobAnalysis: JobAnalysis,
    profileMatch: ProfileJobMatch,
    jobData: {
        title: string;
        company: string;
        description?: string;
    }
): Promise<TailoredCoverLetter> {
    const client = getOpenAIClient();

    // Extract top matched skills
    const topMatchedSkills = profileMatch.matchedSkills
        .sort((a, b) => b.matchStrength - a.matchStrength)
        .slice(0, 5)
        .map((s) => s.skill);

    // Extract relevant achievements
    const relevantAchievements = profileMatch.matchedExperience
        .flatMap((e) => e.suggestedHighlights)
        .slice(0, 3);

    // Generate company research
    const companyResearch = {
        companyName: jobData.company,
        industry: jobAnalysis.industry,
        values: extractCompanyValues(jobData.description || ''),
    };

    // Generate role alignment
    const roleAlignment = {
        topMatchedSkills,
        relevantAchievements,
        whyThisRole: `This ${jobData.title} role at ${jobData.company} aligns perfectly with my expertise in ${topMatchedSkills.slice(0, 2).join(' and ')}.`,
    };

    // Generate cover letter text
    let coverLetter: TailoredCoverLetter = {
        greeting: `Dear Hiring Manager at ${jobData.company},`,
        opening: `I am writing to express my strong interest in the ${jobData.title} position at ${jobData.company}. With my background in ${topMatchedSkills.slice(0, 2).join(' and ')}, I am confident I can make a significant contribution to your team.`,
        body: [
            `In my current role, I have developed strong expertise in ${topMatchedSkills[0]}, which directly aligns with your requirements. ${relevantAchievements[0] || 'I have consistently delivered results that exceed expectations.'}`,
            `My experience with ${topMatchedSkills[1] || 'cross-functional collaboration'} has enabled me to work effectively in dynamic environments. I am particularly drawn to ${jobData.company}'s commitment to ${companyResearch.values?.[0] || 'innovation and excellence'}.`,
            `I am excited about the opportunity to bring my skills and passion to your team and contribute to ${jobData.company}'s continued success.`,
        ],
        closing: `I would welcome the opportunity to discuss how my background, skills, and enthusiasm can contribute to your team. Thank you for considering my application.`,
        signature: profile.fullName || 'Best regards',
        companyResearch,
        roleAlignment,
        tone: 'professional',
        length: 'medium',
    };

    // Try to enhance with AI if available
    if (client) {
        try {
            const enhanced = await enhanceCoverLetterWithAi(
                client,
                profile,
                jobData,
                jobAnalysis,
                profileMatch,
                coverLetter
            );
            return enhanced;
        } catch (error) {
            console.warn('AI enhancement failed, using basic cover letter:', error);
            return coverLetter;
        }
    }

    return coverLetter;
}

// Helper functions

function categorizeSkill(skill: string, jobAnalysis: JobAnalysis): string {
    const skillLower = skill.toLowerCase();

    // Technical skills
    if (
        [
            'javascript',
            'typescript',
            'python',
            'java',
            'react',
            'node',
            'aws',
            'docker',
            'kubernetes',
            'sql',
            'postgres',
            'mongodb',
            'api',
            'rest',
            'graphql',
        ].some((t) => skillLower.includes(t))
    ) {
        return 'Technical';
    }

    // Leadership/Soft skills
    if (
        [
            'leadership',
            'management',
            'communication',
            'mentoring',
            'team',
            'collaboration',
            'strategic',
        ].some((s) => skillLower.includes(s))
    ) {
        return 'Leadership';
    }

    // Domain skills
    if (jobAnalysis.industry && skillLower.includes(jobAnalysis.industry.toLowerCase())) {
        return 'Domain';
    }

    return 'Professional';
}

function calculateAtsScore(
    profile: {
        fullName?: string;
        summary?: string;
        skills?: string[];
        experience?: Array<{
            title?: string;
            company?: string;
            description?: string;
        }>;
        education?: Array<{
            degree?: string;
            school?: string;
        }>;
    },
    jobAnalysis: JobAnalysis
): number {
    let score = 50; // Base score

    // Check for required fields
    if (profile.fullName) score += 10;
    if (profile.summary) score += 10;
    if (profile.skills && profile.skills.length > 0) score += 10;
    if (profile.experience && profile.experience.length > 0) score += 10;
    if (profile.education && profile.education.length > 0) score += 10;

    // Check for keyword coverage
    const allText = [
        profile.summary || '',
        ...(profile.skills || []),
        ...(profile.experience || []).map((e) => e.description || ''),
    ]
        .join(' ')
        .toLowerCase();

    const keywordMatches = jobAnalysis.keywords.filter((k) =>
        allText.includes(k.toLowerCase())
    ).length;

    const keywordScore = Math.round((keywordMatches / jobAnalysis.keywords.length) * 20);
    score += keywordScore;

    return Math.min(100, score);
}

function extractCompanyValues(description: string): string[] {
    const values: string[] = [];

    // Common company values
    const valuePatterns = [
        { pattern: /innovation/i, value: 'innovation' },
        { pattern: /excellence/i, value: 'excellence' },
        { pattern: /integrity/i, value: 'integrity' },
        { pattern: /collaboration/i, value: 'collaboration' },
        { pattern: /diversity/i, value: 'diversity' },
        { pattern: /sustainability/i, value: 'sustainability' },
        { pattern: /customer/i, value: 'customer focus' },
    ];

    for (const { pattern, value } of valuePatterns) {
        if (pattern.test(description)) {
            values.push(value);
        }
    }

    return values.slice(0, 3);
}

async function enhanceCoverLetterWithAi(
    client: ReturnType<typeof tryGetOpenAiClient>,
    profile: {
        fullName?: string;
        summary?: string;
        skills?: string[];
        experience?: Array<{
            title?: string;
            company?: string;
            description?: string;
            achievements?: string[];
        }>;
    },
    jobData: {
        title: string;
        company: string;
        description?: string;
    },
    jobAnalysis: JobAnalysis,
    profileMatch: ProfileJobMatch,
    baseLetter: TailoredCoverLetter
): Promise<TailoredCoverLetter> {
    if (!client) return baseLetter;

    const model = getDefaultTextModel();

    const prompt = `You are an expert cover letter writer. Enhance this cover letter to be more compelling and personalized.

Candidate: ${profile.fullName}
Target Role: ${jobData.title} at ${jobData.company}
Key Skills: ${profileMatch.matchedSkills.map((s) => s.skill).join(', ')}
Top Achievements: ${profileMatch.matchedExperience.flatMap((e) => e.suggestedHighlights).join('; ')}

Current Cover Letter:
${baseLetter.opening}

${baseLetter.body.join('\n\n')}

${baseLetter.closing}

Enhance this cover letter to:
1. Be more specific and personalized to ${jobData.company}
2. Include concrete examples from the candidate's background
3. Show genuine enthusiasm for the role
4. Highlight the most relevant skills and achievements
5. Maintain a professional but personable tone

Return ONLY the enhanced cover letter text (opening + 3 body paragraphs + closing), no markdown or explanation.`;

    try {
        const response = await client.chat.completions.create({
            model,
            max_tokens: 1500,
            temperature: 0.4,
            messages: [
                { role: 'system', content: 'You are an expert cover letter writer.' },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const text = response.choices[0]?.message?.content?.trim();
        if (!text) {
            return baseLetter;
        }

        // Parse the enhanced text
        const paragraphs = text.split('\n\n').filter((p) => p.trim());

        if (paragraphs.length >= 3) {
            return {
                ...baseLetter,
                opening: paragraphs[0],
                body: paragraphs.slice(1, -1),
                closing: paragraphs[paragraphs.length - 1],
            };
        }

        return baseLetter;
    } catch (error) {
        console.warn('AI enhancement failed:', error);
        return baseLetter;
    }
}
