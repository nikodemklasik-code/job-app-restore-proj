/**
 * Profile Roadmap Generator
 *
 * Builds an AI-assisted career roadmap from milestones (courses, trainings,
 * intermediate roles) between the user's current profile state and their
 * dream job. Falls back to a deterministic skeleton when no OpenAI client
 * is configured.
 */

import { randomUUID } from 'crypto';
import { tryGetOpenAiClient } from '../lib/openai/openai.client.js';
import { getDefaultTextModel } from '../lib/openai/model-registry.js';
import type { ProfileRoadmapMilestone, ProfileStrategyJson } from '../../../shared/profile.js';

type MilestoneType = 'course' | 'training' | 'role' | 'evidence' | 'skill';

export interface RoadmapInputProfile {
    targetRole: string | null;
    targetSeniority: string | null;
    currentRole: string | null;
    skills: string[];
    experiences: Array<{ jobTitle: string; employerName?: string; description?: string }>;
    educations: Array<{ degree: string; fieldOfStudy?: string; schoolName?: string }>;
    trainings: Array<{ title: string; providerName?: string }>;
    workValues?: string[];
}

export interface GeneratedRoadmap {
    milestones: ProfileRoadmapMilestone[];
    learningPath: NonNullable<ProfileStrategyJson['potentialLearningPath']>;
    summary: string;
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function fallbackRoadmap(profile: RoadmapInputProfile): GeneratedRoadmap {
    const target = profile.targetRole?.trim() || 'your dream role';
    const current = profile.currentRole?.trim() || profile.experiences[0]?.jobTitle?.trim() || 'your current position';

    const milestones: ProfileRoadmapMilestone[] = [
        {
            id: randomUUID(),
            title: `Audit skills gap between ${current} and ${target}`,
            description: 'List specific hard and soft skills required for the target role that you do not yet have evidence for.',
            requiredSkills: profile.skills.slice(0, 5),
            evidenceTarget: 'Updated CV with gap notes',
            status: 'not_started',
        },
        {
            id: randomUUID(),
            title: 'Complete a targeted course aligned with the gap',
            description: 'Choose one high-signal course (Coursera, Udemy, domain-specific) that covers the largest skill gap.',
            evidenceTarget: 'Certificate added to Training / Courses',
            status: 'not_started',
        },
        {
            id: randomUUID(),
            title: `Land an intermediate role or project toward ${target}`,
            description: 'Pick up a stretch assignment, side project, or job one step closer to the target title.',
            evidenceTarget: 'New Work Experience entry with measurable outcomes',
            status: 'not_started',
        },
        {
            id: randomUUID(),
            title: `Apply and interview for ${target}`,
            description: 'Refresh CV and cover letter, practice interview scenarios, then start applying.',
            evidenceTarget: 'Applications tracked and interviews logged',
            status: 'not_started',
        },
    ];

    const learningPath = milestones.slice(0, 3).map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        whyItMatters: milestone.description,
        relatedSkills: milestone.requiredSkills ?? [],
        suggestedCourses: [],
        evidenceTarget: milestone.evidenceTarget,
        status: milestone.status,
    }));

    return {
        milestones,
        learningPath,
        summary: `Baseline plan from ${current} to ${target}. Regenerate with AI once OpenAI is configured for a tailored roadmap.`,
    };
}

function parseRoadmapResponse(raw: string, profile: RoadmapInputProfile): GeneratedRoadmap {
    const parsed = JSON.parse(raw) as {
        summary?: unknown;
        milestones?: Array<{
            title?: unknown;
            description?: unknown;
            type?: unknown;
            requiredSkills?: unknown;
            evidenceTarget?: unknown;
            suggestedCourses?: unknown;
        }>;
    };

    const rawMilestones = Array.isArray(parsed.milestones) ? parsed.milestones : [];
    const milestones: ProfileRoadmapMilestone[] = [];
    for (const item of rawMilestones) {
        const title = typeof item.title === 'string' ? item.title.trim() : '';
        if (!title) continue;
        milestones.push({
            id: randomUUID(),
            title,
            description: typeof item.description === 'string' ? item.description.trim() : undefined,
            requiredSkills: asStringArray(item.requiredSkills),
            evidenceTarget: typeof item.evidenceTarget === 'string' ? item.evidenceTarget.trim() : undefined,
            status: 'not_started',
        });
    }

    if (milestones.length === 0) return fallbackRoadmap(profile);

    const learningPath: NonNullable<ProfileStrategyJson['potentialLearningPath']> = [];
    rawMilestones.forEach((item, index) => {
        const title = typeof item.title === 'string' ? item.title.trim() : '';
        if (!title) return;
        const type = typeof item.type === 'string' ? item.type.toLowerCase() : '';
        if (type !== 'course' && type !== 'training' && type !== 'skill') return;
        learningPath.push({
            id: milestones[index]?.id ?? randomUUID(),
            title,
            whyItMatters: typeof item.description === 'string' ? item.description.trim() : undefined,
            relatedSkills: asStringArray(item.requiredSkills),
            suggestedCourses: asStringArray(item.suggestedCourses),
            evidenceTarget: typeof item.evidenceTarget === 'string' ? item.evidenceTarget.trim() : undefined,
            status: 'not_started',
        });
    });

    return {
        milestones,
        learningPath,
        summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
    };
}

export async function generateProfileRoadmap(profile: RoadmapInputProfile): Promise<GeneratedRoadmap> {
    const client = tryGetOpenAiClient();
    if (!client) return fallbackRoadmap(profile);

    const target = profile.targetRole?.trim() || 'the role the user has described as their dream job';
    const current = profile.currentRole?.trim() || profile.experiences[0]?.jobTitle?.trim() || 'their current position';

    const system = [
        'You are a senior career coach who designs concrete step-by-step roadmaps.',
        'Given the user profile you return a JSON object with keys: summary (string), milestones (array of 4-6 items).',
        'Each milestone has: title (short, action-oriented), description (2-3 sentences), type (one of: course, training, role, evidence, skill), requiredSkills (array of 1-4 skill names), evidenceTarget (what the user should produce to mark this milestone done), suggestedCourses (array of course titles, optional).',
        'Order milestones from immediately actionable to final (landing the dream role).',
        'Include at least one course or training, at least one intermediate role or project, and at least one application/evidence step.',
        'Tailor the plan to the user\'s skills, experiences, and education. Reference specific skills they have and gaps to fill.',
        'Return valid JSON only — no markdown, no commentary.',
    ].join(' ');

    const user = [
        `Target role: ${target}`,
        `Target seniority: ${profile.targetSeniority ?? 'not specified'}`,
        `Current role: ${current}`,
        `Current skills: ${profile.skills.slice(0, 20).join(', ') || 'none listed'}`,
        `Work values: ${(profile.workValues ?? []).join(', ') || 'not specified'}`,
        `Experiences: ${profile.experiences.slice(0, 5).map((e) => `${e.jobTitle}${e.employerName ? ` @ ${e.employerName}` : ''}`).join('; ') || 'none'}`,
        `Education: ${profile.educations.slice(0, 3).map((e) => `${e.degree}${e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ''}`).join('; ') || 'none'}`,
        `Existing trainings: ${profile.trainings.slice(0, 5).map((t) => t.title).join('; ') || 'none'}`,
    ].join('\n');

    try {
        const response = await client.chat.completions.create({
            model: getDefaultTextModel(),
            temperature: 0.5,
            max_tokens: 1200,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
        });

        const content = response.choices[0]?.message?.content ?? '';
        if (!content.trim()) return fallbackRoadmap(profile);
        return parseRoadmapResponse(content, profile);
    } catch (error) {
        console.warn('[profileRoadmapGenerator] OpenAI generation failed, using fallback', error);
        return fallbackRoadmap(profile);
    }
}
