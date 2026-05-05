import { tryGetOpenAiClient } from '../lib/openai/openai.client.js';
import { getDefaultTextModel } from '../lib/openai/model-registry.js';

const getOpenAIClient = () => tryGetOpenAiClient();

interface Profile {
  fullName?: string;
  summary?: string;
  skills?: string[];
  phone?: string;
  email?: string;
  experiences?: CandidateExperience[];
}

interface CandidateExperience {
  jobTitle: string | null;
  employerName: string | null;
  startDate: string | null;
  endDate: string | null;
  description?: string | null;
}

interface Job {
  title: string;
  company: string;
  description?: string;
  location?: string;
  requirements?: string[];
}

function cleanText(value?: string | null): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => cleanText(value)).filter(Boolean))];
}

function extractJobSignals(job: Job): { requirements: string[]; keywords: string[] } {
  const description = cleanText(job.description);
  const seededRequirements = uniqueStrings(job.requirements ?? []).slice(0, 8);
  const keywordPatterns = [
    /\b(?:react|typescript|javascript|node(?:\.js)?|python|java|aws|azure|gcp|sql|postgres(?:ql)?|docker|kubernetes|figma|salesforce|excel|power bi|tableau|product management|stakeholder management|project management|data analysis|communication|leadership|mentoring|testing|automation|ci\/cd|rest api|graphql)\b/gi,
  ];
  const extractedKeywords = keywordPatterns.flatMap((pattern) => description.match(pattern) ?? []);
  const bulletRequirements = description
    .split(/(?:\u2022|•|\n|- )/)
    .map((chunk) => cleanText(chunk))
    .filter((chunk) => chunk.length >= 12 && chunk.length <= 120)
    .filter((chunk) => /(experience|knowledge|ability|skilled|proficient|strong|familiar|background|understanding)/i.test(chunk))
    .slice(0, 6);

  return {
    requirements: uniqueStrings([...seededRequirements, ...bulletRequirements]).slice(0, 8),
    keywords: uniqueStrings(extractedKeywords).slice(0, 10),
  };
}

function buildEvidenceLines(profile: Profile, job: Job): string[] {
  const skills = uniqueStrings(profile.skills ?? []).slice(0, 10);
  const summary = cleanText(profile.summary);
  const { keywords, requirements } = extractJobSignals(job);
  const matchedSkills = skills.filter((skill) => {
    const lower = skill.toLowerCase();
    return keywords.some((keyword) => keyword.toLowerCase() === lower)
      || requirements.some((requirement) => requirement.toLowerCase().includes(lower));
  });

  return uniqueStrings([
    ...matchedSkills.map((skill) => `Direct match: ${skill}`),
    ...skills.slice(0, 5).map((skill) => `Candidate skill: ${skill}`),
    summary ? `Candidate summary: ${summary}` : '',
  ]).slice(0, 8);
}

export async function generateCoverLetter(
  profile: Profile,
  job: Job,
  learnedSignals: string[] = [],
): Promise<string> {
  const signalHint = learnedSignals.length
    ? `\nSuccessful signals from past applications: ${learnedSignals.slice(0, 5).join(', ')}.`
    : '';
  const extracted = extractJobSignals(job);
  const evidenceLines = buildEvidenceLines(profile, job);

  const prompt = `Write a tailored UK cover letter for this role.

Role: ${job.title} at ${job.company}
${job.location ? `Location: ${job.location}` : ''}
Job description excerpt: ${cleanText(job.description).slice(0, 900) || 'Not provided'}
Top requirements / signals: ${[...extracted.keywords, ...extracted.requirements].slice(0, 10).join(', ') || 'Not provided'}

Candidate profile:
Name: ${profile.fullName ?? 'Candidate'}
Summary: ${cleanText(profile.summary) || 'Not provided'}
Key skills: ${uniqueStrings(profile.skills ?? []).slice(0, 10).join(', ') || 'Not provided'}
Evidence lines: ${evidenceLines.join(' | ') || 'No explicit evidence lines'}${signalHint}

Rules:
- British English only.
- 3 short paragraphs plus a concise sign-off.
- Sound specific and credible, not gushy.
- Do not invent achievements, employers, numbers, tools, certifications or sector experience.
- Avoid generic filler such as "I am excited", "I am writing to apply", "dynamic team", "fast-paced environment" unless the wording is needed.
- Anchor the letter in the strongest overlaps between profile and role.
- Keep it under 260 words.
- End with exactly: "Yours sincerely,\n${profile.fullName ?? 'Candidate'}".`;

  const client = tryGetOpenAiClient();
  if (!client) {
    return fallbackCoverLetter(profile, job);
  }
  try {
    const resp = await client.chat.completions.create({
      model: getDefaultTextModel(),
      max_tokens: 650,
      temperature: 0.4,
      messages: [
        { role: 'system', content: 'You write sharp, tailored UK job application cover letters. Be concrete, restrained and credible.' },
        { role: 'user', content: prompt },
      ],
    });

    return resp.choices[0]?.message?.content?.trim() ?? fallbackCoverLetter(profile, job);
  } catch {
    return fallbackCoverLetter(profile, job);
  }
}

function fallbackCoverLetter(profile: Profile, job: Job): string {
  const summary = cleanText(profile.summary);
  const extracted = extractJobSignals(job);
  const skills = uniqueStrings(profile.skills ?? []);
  const matchedSkills = skills.filter((skill) => extracted.keywords.some((keyword) => keyword.toLowerCase() === skill.toLowerCase())).slice(0, 3);
  const opening = matchedSkills.length > 0
    ? `Your ${job.title} role at ${job.company} stands out because it aligns closely with my background in ${matchedSkills.join(', ')}.`
    : `I would bring relevant experience and a practical, delivery-focused approach to the ${job.title} role at ${job.company}.`;
  const middle = summary
    ? `My background includes ${summary.charAt(0).toLowerCase() + summary.slice(1)}.`
    : `My experience includes ${skills.slice(0, 4).join(', ') || 'relevant delivery, communication and problem-solving skills'}.`;
  const close = extracted.requirements[0]
    ? `I would be keen to discuss how my experience can support your priorities around ${extracted.requirements[0].replace(/\.$/, '')}.`
    : 'I would welcome the chance to discuss how I could contribute in the role.';

  return `${opening}\n\n${middle} ${close}\n\nYours sincerely,\n${profile.fullName ?? 'Candidate'}`;
}

export async function generateCvSummary(profile: Profile, job: Job): Promise<string> {
  const client = tryGetOpenAiClient();
  const extracted = extractJobSignals(job);
  const skills = uniqueStrings(profile.skills ?? []).slice(0, 10);
  const matchedSkills = skills.filter((skill) => extracted.keywords.some((keyword) => keyword.toLowerCase() === skill.toLowerCase())).slice(0, 5);

  if (!client) {
    return fallbackCvSummary(profile, job);
  }
  try {
    const resp = await client.chat.completions.create({
      model: getDefaultTextModel(),
      max_tokens: 220,
      temperature: 0.3,
      messages: [
        { role: 'system', content: 'Write a targeted UK CV profile summary. Produce 2-3 sentences, polished but factual, with no bullet points.' },
        {
          role: 'user',
          content: `Target role: ${job.title} at ${job.company}\nJob description excerpt: ${cleanText(job.description).slice(0, 700) || 'Not provided'}\nPriority skills / requirements: ${[...matchedSkills, ...extracted.requirements].slice(0, 8).join(', ') || 'Not provided'}\nCandidate summary: ${cleanText(profile.summary) || 'Not provided'}\nCandidate skills: ${skills.join(', ') || 'Not provided'}\n\nRules:\n- British English.\n- 2-3 sentences, 70-110 words total.\n- Focus on role fit, strongest relevant capabilities and credible value.\n- Do not invent years of experience, sector history or achievements.\n- Avoid first-person pronouns and avoid clichés such as "results-driven" unless justified by the evidence.`,
        },
      ],
    });
    return resp.choices[0]?.message?.content?.trim() ?? fallbackCvSummary(profile, job);
  } catch {
    return fallbackCvSummary(profile, job);
  }
}

function fallbackCvSummary(profile: Profile, job: Job): string {
  const skills = uniqueStrings(profile.skills ?? []).slice(0, 6);
  const extracted = extractJobSignals(job);
  const matchedSkills = skills.filter((skill) => extracted.keywords.some((keyword) => keyword.toLowerCase() === skill.toLowerCase())).slice(0, 4);
  const summary = cleanText(profile.summary);
  const firstSentence = matchedSkills.length > 0
    ? `Candidate aligned to ${job.title} opportunities, with relevant capability across ${matchedSkills.join(', ')}.`
    : `Candidate aligned to ${job.title} opportunities, bringing a strong foundation in ${skills.slice(0, 4).join(', ') || 'relevant cross-functional delivery'}.`;
  const secondSentence = summary
    ? `${summary.replace(/^[A-Z]/, (letter) => letter.toLowerCase()).replace(/\.$/, '')}.`
    : `Able to support ${job.company} with practical execution, clear communication and role-relevant problem solving.`;
  return `${firstSentence} ${secondSentence}`;
}

export async function scoreJobFit(
  profile: Profile,
  job: Job,
): Promise<{ score: number; reasons: string[] }> {
  const skills = (profile.skills ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  const desc = (job.description ?? '').toLowerCase();
  const req = (job.requirements ?? []).map((r) => r.toLowerCase());
  const title = job.title.toLowerCase();
  const summaryLower = (profile.summary ?? '').toLowerCase();

  let score = 40; // lower baseline — earn points rather than start high
  const reasons: string[] = [];

  // ── 1. Skill matching (up to 35 pts) ──────────────────────────────────────
  const matchedSkills = skills.filter(
    (s) => desc.includes(s) || req.some((r) => r.includes(s)) || title.includes(s),
  );
  const skillRatio = skills.length > 0 ? matchedSkills.length / skills.length : 0;

  if (matchedSkills.length >= 6) {
    score += 35;
    reasons.push(`${matchedSkills.length} skills match (${matchedSkills.slice(0, 3).join(', ')}…)`);
  } else if (matchedSkills.length >= 4) {
    score += 25;
    reasons.push(`${matchedSkills.length} skills match (${matchedSkills.slice(0, 3).join(', ')})`);
  } else if (matchedSkills.length >= 2) {
    score += 15;
    reasons.push(`${matchedSkills.length} skills match`);
  } else if (matchedSkills.length === 1) {
    score += 7;
    reasons.push(`1 skill match: ${matchedSkills[0]}`);
  }

  // Bonus for high skill coverage ratio
  if (skillRatio >= 0.6 && matchedSkills.length >= 3) {
    score += 5;
    reasons.push('Strong skill coverage');
  }

  // ── 2. Title alignment (up to 20 pts) ─────────────────────────────────────
  const titleWords = title.split(/\s+/).filter((w) => w.length > 3);
  const titleMatchInSummary = titleWords.filter((w) => summaryLower.includes(w)).length;
  const titleMatchInSkills = titleWords.filter((w) => skills.some((s) => s.includes(w))).length;

  if (titleMatchInSummary >= 2 || titleMatchInSkills >= 2) {
    score += 20;
    reasons.push('Job title aligns with profile');
  } else if (titleMatchInSummary >= 1 || titleMatchInSkills >= 1) {
    score += 10;
    reasons.push('Partial title alignment');
  }

  // ── 3. Seniority alignment (up to 10 pts) ─────────────────────────────────
  const seniorityTerms = ['senior', 'lead', 'principal', 'staff', 'head of', 'director', 'vp', 'junior', 'graduate', 'entry'];
  const jobSeniority = seniorityTerms.find((t) => title.includes(t));
  const profileSeniority = seniorityTerms.find((t) => summaryLower.includes(t));
  if (jobSeniority && profileSeniority && jobSeniority === profileSeniority) {
    score += 10;
    reasons.push('Seniority level matches');
  } else if (!jobSeniority) {
    // No seniority specified in job — neutral
    score += 3;
  }

  // ── 4. Work mode preference (up to 5 pts) ─────────────────────────────────
  const jobWorkMode = (job as Job & { workMode?: string }).workMode?.toLowerCase() ?? '';
  const prefersRemote = /remote|zdal/i.test(summaryLower);
  if (prefersRemote && jobWorkMode.includes('remote')) {
    score += 5;
    reasons.push('Remote work preference matched');
  }

  // ── 5. Penalty for obvious mismatches ─────────────────────────────────────
  if (skills.length > 0 && matchedSkills.length === 0) {
    score -= 10;
    reasons.push('No skill overlap found');
  }

  // Cap and floor
  if (score > 90) score = 90 + Math.floor(Math.random() * 8);
  score = Math.min(99, Math.max(10, score));

  if (reasons.length === 0) reasons.push('General profile match');

  return { score, reasons };
}

// Scam / MLM filter
export function isScamJob(title: string, description: string): { isScam: boolean; reasons: string[] } {
  const text = (title + ' ' + description).toLowerCase();
  const reasons: string[] = [];

  const scamPatterns = [
    { pattern: /unlimited earning|uncapped commission|be your own boss|work from home.*no experience/i, reason: 'Unlimited earnings / no experience required' },
    { pattern: /pyramid|mlm|multi.?level|network marketing|direct sales.*recruit/i, reason: 'Possible MLM / pyramid structure' },
    { pattern: /pay.*training|purchase.*kit|buy.*starter|investment required/i, reason: 'Requires upfront payment' },
    { pattern: /too good to be true|guaranteed income|passive income|financial freedom/i, reason: 'Unrealistic income promises' },
    { pattern: /urgently hiring|immediate start.*no interview|no cv required/i, reason: 'Suspiciously low hiring bar' },
  ];

  for (const { pattern, reason } of scamPatterns) {
    if (pattern.test(text)) reasons.push(reason);
  }

  return { isScam: reasons.length >= 2, reasons };
}

// Detailed job fit explanation
export interface InterviewInsightsForScoring {
  averageScore: number;
  sessionCount: number;
  strongAreas: string[];
  weakAreas: string[];
}

export async function explainJobFit(
  profile: { skills: string[]; summary?: string; experiences?: CandidateExperience[] },
  job: { title: string; description: string; requirements: string[] },
  interviewInsights?: InterviewInsightsForScoring,
): Promise<{
  score: number;
  strengths: string[];
  gaps: string[];
  advice: string;
  extractedRequirements?: string[];
  breakdown?: {
    skillsMatch: number;
    experienceMatch: number;
    salaryMatch: number;
    cultureMatch: number;
  };
}> {
  const openai = getOpenAIClient();
  if (!openai) {
    const { score } = await scoreJobFit(profile, { ...job, company: '' });
    return {
      score,
      strengths: profile.skills.slice(0, 3).map((s) => `You have ${s}`),
      gaps: job.requirements.filter((r) => !profile.skills.some((s) => s.toLowerCase().includes(r.toLowerCase()))).slice(0, 3),
      advice: 'Add more skills to your profile for better matching.',
      breakdown: {
        skillsMatch: Math.min(score + 5, 100),
        experienceMatch: Math.min(score + 10, 100),
        salaryMatch: Math.max(score - 15, 60),
        cultureMatch: Math.max(score - 10, 70),
      },
    };
  }

  const insightNote = interviewInsights && interviewInsights.sessionCount > 0
    ? `\nInterview performance data (${interviewInsights.sessionCount} sessions, avg score ${interviewInsights.averageScore}%):
  - Strong areas: ${interviewInsights.strongAreas.join(', ') || 'none identified'}
  - Weak areas: ${interviewInsights.weakAreas.join(', ') || 'none identified'}
  Factor this into the score: strong interview performance (+5), weak areas matching job requirements (-5 each).`
    : '';

  const experienceNote = profile.experiences && profile.experiences.length > 0
    ? `\nEmployment history (${profile.experiences.length} roles):
${profile.experiences.slice(0, 5).map((exp) =>
      `- ${exp.jobTitle || 'Role'} at ${exp.employerName || 'Company'} (${exp.startDate || '?'} to ${exp.endDate || 'present'})${exp.description ? ': ' + exp.description.slice(0, 100) : ''}`
    ).join('\n')}`
    : '';

  const prompt = `Analyse this job fit and respond with JSON only.
Profile skills: ${profile.skills.join(', ')}
Summary: ${profile.summary ?? ''}${experienceNote}
Job title: ${job.title}
Job description (first 400 chars): ${job.description.slice(0, 400)}
Requirements: ${job.requirements.join(', ')}${insightNote}

CRITICAL RULES:
- If employment history is provided above, experienceMatch must NOT default to 0. Assess actual relevance.
- If skillsBreakdown.matched is non-empty, skillsMatch must be > 0 (fixes breakdown vs score inconsistency).

Return: { 
  "score": 0-100, 
  "strengths": ["...","...","..."], 
  "gaps": ["...","..."], 
  "advice": "one sentence action", 
  "extractedRequirements": ["skill1","skill2","skill3","skill4","skill5"],
  "breakdown": {
    "skillsMatch": 0-100,
    "experienceMatch": 0-100,
    "salaryMatch": 0-100,
    "cultureMatch": 0-100
  }
}
extractedRequirements: extract up to 8 specific skills/requirements from the job description as short strings.
breakdown: provide detailed scores for each category based on profile analysis.`;

  const res = await openai.chat.completions.create({
    model: getDefaultTextModel(),
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 500,
  });

  const data = JSON.parse(res.choices[0]?.message?.content ?? '{}') as {
    score?: number;
    strengths?: string[];
    gaps?: string[];
    advice?: string;
    extractedRequirements?: string[];
    breakdown?: {
      skillsMatch?: number;
      experienceMatch?: number;
      salaryMatch?: number;
      cultureMatch?: number;
    };
  };

  return {
    score: typeof data.score === 'number' ? data.score : 50,
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    gaps: Array.isArray(data.gaps) ? data.gaps : [],
    advice: data.advice ?? '',
    extractedRequirements: Array.isArray(data.extractedRequirements) ? data.extractedRequirements : undefined,
    breakdown: data.breakdown ? {
      skillsMatch: typeof data.breakdown.skillsMatch === 'number' ? data.breakdown.skillsMatch : 70,
      experienceMatch: typeof data.breakdown.experienceMatch === 'number' ? data.breakdown.experienceMatch : 75,
      salaryMatch: typeof data.breakdown.salaryMatch === 'number' ? data.breakdown.salaryMatch : 65,
      cultureMatch: typeof data.breakdown.cultureMatch === 'number' ? data.breakdown.cultureMatch : 70,
    } : undefined,
  };
}

// Follow-up email copilot
export async function generateFollowUp(input: {
  applicantName: string;
  jobTitle: string;
  company: string;
  daysSinceApply: number;
  previousStatus: string;
}): Promise<string> {
  const openai = getOpenAIClient();
  if (!openai) {
    return `Subject: Follow-up on ${input.jobTitle} Application\n\nDear Hiring Team,\n\nI wanted to follow up on my application for the ${input.jobTitle} position at ${input.company} submitted ${input.daysSinceApply} days ago. I remain very interested in this opportunity and would welcome the chance to discuss my candidacy further.\n\nKind regards,\n${input.applicantName}`;
  }

  const res = await openai.chat.completions.create({
    model: getDefaultTextModel(),
    messages: [{
      role: 'user',
      content: `Write a short, professional follow-up email for a UK job application.
Applicant: ${input.applicantName}
Job: ${input.jobTitle} at ${input.company}
Days since application: ${input.daysSinceApply}
Current status: ${input.previousStatus}
Keep it under 100 words, professional UK English. Include subject line.`,
    }],
    max_tokens: 200,
  });

  return res.choices[0]?.message?.content ?? '';
}

export interface CompanyProfile {
  industry: string;
  size: string;
  culture: string;
  interviewStyle: string;
  summary: string;
}

export async function getCompanyProfile(companyName: string, jobTitle?: string): Promise<CompanyProfile> {
  const openai = getOpenAIClient();
  const fallback: CompanyProfile = {
    industry: 'Technology',
    size: 'Unknown',
    culture: `${companyName} is a professional organisation. Research their website and LinkedIn for culture insights.`,
    interviewStyle: 'Standard interview process. Expect CV screening, phone screen, and final round.',
    summary: `${companyName} — add the company URL to get a richer profile.`,
  };

  if (!openai) return fallback;

  const prompt = `You are a knowledgeable recruiter. Provide a concise company profile for "${companyName}"${jobTitle ? ` (hiring for: ${jobTitle})` : ''}.
Respond with JSON only:
{
  "industry": "brief industry/sector",
  "size": "startup|SME|enterprise or headcount estimate",
  "culture": "2-3 sentences on work culture, values, and management style",
  "interviewStyle": "1-2 sentences on typical interview process and what they assess",
  "summary": "1 sentence company overview"
}
If you don't have specific knowledge of this company, provide a reasonable inference based on the name and industry context.`;

  try {
    const res = await openai.chat.completions.create({
      model: getDefaultTextModel(),
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 300,
    });
    const data = JSON.parse(res.choices[0]?.message?.content ?? '{}') as Partial<CompanyProfile>;
    return {
      industry: data.industry ?? fallback.industry,
      size: data.size ?? fallback.size,
      culture: data.culture ?? fallback.culture,
      interviewStyle: data.interviewStyle ?? fallback.interviewStyle,
      summary: data.summary ?? fallback.summary,
    };
  } catch {
    return fallback;
  }
}
