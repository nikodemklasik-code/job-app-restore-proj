import OpenAI from 'openai';

const getClient = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const getOpenAIClient = (): OpenAI | null => {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

interface Profile {
  fullName?: string;
  summary?: string;
  skills?: string[];
  phone?: string;
  email?: string;
}

interface Job {
  title: string;
  company: string;
  description?: string;
  location?: string;
  requirements?: string[];
}

export async function generateCoverLetter(
  profile: Profile,
  job: Job,
  learnedSignals: string[] = [],
): Promise<string> {
  const signalHint = learnedSignals.length
    ? `\nSuccessful signals from past applications: ${learnedSignals.slice(0, 5).join(', ')}.`
    : '';

  const prompt = `Write a professional, concise cover letter (max 3 paragraphs) for:
Role: ${job.title} at ${job.company}
${job.location ? `Location: ${job.location}` : ''}
${job.description ? `Job description excerpt: ${job.description.slice(0, 500)}` : ''}

Candidate profile:
Name: ${profile.fullName ?? 'Candidate'}
Summary: ${profile.summary ?? ''}
Key skills: ${(profile.skills ?? []).slice(0, 8).join(', ')}
${signalHint}

Write in first person. Tone: professional, confident, UK English. No generic filler. End with "Yours sincerely,\n${profile.fullName ?? 'Candidate'}".`;

  const resp = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 600,
    messages: [
      { role: 'system', content: 'You write tailored UK job application cover letters. Be specific, concise, and compelling.' },
      { role: 'user', content: prompt },
    ],
  });

  return resp.choices[0]?.message?.content?.trim() ?? fallbackCoverLetter(profile, job);
}

function fallbackCoverLetter(profile: Profile, job: Job): string {
  return `Dear Hiring Manager,

I am writing to apply for the ${job.title} position at ${job.company}. ${profile.summary ?? ''}

My key skills include ${(profile.skills ?? []).slice(0, 4).join(', ')}, which I believe align well with your requirements.

I would welcome the opportunity to discuss how I can contribute to your team.

Yours sincerely,
${profile.fullName ?? 'Candidate'}`;
}

export async function generateCvSummary(profile: Profile, job: Job): Promise<string> {
  const resp = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 150,
    messages: [
      { role: 'system', content: 'Write a 2-sentence professional summary tailored to a specific role. UK English.' },
      {
        role: 'user',
        content: `Role: ${job.title} at ${job.company}\nCandidate: ${profile.fullName}\nCurrent summary: ${profile.summary}\nSkills: ${(profile.skills ?? []).slice(0, 6).join(', ')}`,
      },
    ],
  });
  return resp.choices[0]?.message?.content?.trim() ?? profile.summary ?? '';
}

export async function scoreJobFit(
  profile: Profile,
  job: Job,
): Promise<{ score: number; reasons: string[] }> {
  const skills = (profile.skills ?? []).map((s) => s.toLowerCase());
  const desc = (job.description ?? '').toLowerCase();
  const req = (job.requirements ?? []).map((r) => r.toLowerCase());
  const title = job.title.toLowerCase();

  // Fast heuristic score (no API call needed for basic scoring)
  let score = 50;
  const reasons: string[] = [];

  const matchedSkills = skills.filter(
    (s) => desc.includes(s) || req.some((r) => r.includes(s)),
  );
  if (matchedSkills.length >= 4) { score += 20; reasons.push(`${matchedSkills.length} skills match`); }
  else if (matchedSkills.length >= 2) { score += 10; reasons.push(`${matchedSkills.length} skills match`); }

  const titleWords = title.split(/\s+/).filter((w) => w.length > 3);
  const summaryLower = (profile.summary ?? '').toLowerCase();
  const titleMatchCount = titleWords.filter((w) => summaryLower.includes(w)).length;
  if (titleMatchCount >= 2) { score += 15; reasons.push('Title aligns with profile'); }

  if (score > 90) score = 90 + Math.floor(Math.random() * 8);
  score = Math.min(99, Math.max(20, score));

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

export type SkillsBreakdown = {
  matched: string[];   // user HAS this, job requires it
  missing: string[];   // job requires it, user DOESN'T have it
  partial: string[];   // similar skill exists (e.g. user has JS, job wants TypeScript)
  bonus: string[];     // user has it, job doesn't explicitly require it but it's relevant
};

export type ExplainFitResult = {
  score: number;
  skillsMatch: number;
  experienceMatch: number;
  salaryMatch: number;
  cultureMatch: number;
  strengths: string[];
  gaps: string[];
  advice: string;
  extractedRequirements?: string[];
  skillsBreakdown?: SkillsBreakdown;
};

export interface CandidateExperience {
  jobTitle: string;
  employerName: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
}

export async function explainJobFit(
  profile: { skills: string[]; summary?: string; experiences?: CandidateExperience[] },
  job: { title: string; description: string; requirements: string[] },
  interviewInsights?: InterviewInsightsForScoring,
): Promise<ExplainFitResult> {
  const openai = getOpenAIClient();
  if (!openai) {
    const { score } = await scoreJobFit(profile, { ...job, company: '' });
    const matched = profile.skills.filter((s) =>
      job.requirements.some((r) => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase()))
    );
    const missing = job.requirements.filter((r) =>
      !profile.skills.some((s) => s.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(s.toLowerCase()))
    ).slice(0, 5);
    return {
      score,
      skillsMatch: score,
      experienceMatch: score,
      salaryMatch: 50,
      cultureMatch: 50,
      strengths: matched.slice(0, 3).map((s) => `You have ${s}`),
      gaps: missing.slice(0, 3),
      advice: 'Add more skills to your profile for better matching.',
      skillsBreakdown: { matched, missing, partial: [], bonus: [] },
    };
  }

  // Format employment history for GPT
  const experienceLines = (profile.experiences ?? [])
    .slice(0, 6)
    .map((e) => {
      const period = e.endDate ? `${e.startDate}–${e.endDate}` : `${e.startDate}–present`;
      const desc = e.description ? ` — ${e.description.slice(0, 120)}` : '';
      return `• ${e.jobTitle} at ${e.employerName} (${period})${desc}`;
    })
    .join('\n');

  const insightNote = interviewInsights && interviewInsights.sessionCount > 0
    ? `\nInterview performance (${interviewInsights.sessionCount} sessions, avg ${interviewInsights.averageScore}%):
  Strong: ${interviewInsights.strongAreas.join(', ') || 'none'}
  Weak: ${interviewInsights.weakAreas.join(', ') || 'none'}
  Adjust score: +5 for strong interview, -5 per weak area that matches job requirements.`
    : '';

  const prompt = `Analyse this candidate's fit for the job and respond with JSON only.

CANDIDATE:
Skills: ${profile.skills.join(', ') || 'none listed'}
Summary: ${profile.summary || 'not provided'}
Employment history:
${experienceLines || 'not provided'}${insightNote}

JOB:
Title: ${job.title}
Description (first 600 chars): ${job.description.slice(0, 600)}
Stated requirements: ${job.requirements.join(', ') || 'none stated'}

Return this exact JSON structure:
{
  "score": <0-100 overall match>,
  "skillsMatch": <0-100 how well candidate skills match job requirements>,
  "experienceMatch": <0-100 how well candidate employment history matches seniority and domain of the role — use job titles, employers and dates>,
  "salaryMatch": <50 as default if unknown>,
  "cultureMatch": <0-100 based on work mode signals and company culture clues>,
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "gaps": ["specific gap 1", "specific gap 2"],
  "advice": "one concrete action sentence the candidate should take",
  "extractedRequirements": ["req1","req2","req3","req4","req5","req6","req7","req8"],
  "skillsBreakdown": {
    "matched": ["skill the candidate HAS that the job explicitly requires"],
    "missing": ["skill the job REQUIRES that the candidate does NOT have"],
    "partial": ["skill the candidate has that is close but not exact (e.g. has JS, job wants TypeScript)"],
    "bonus": ["skill candidate has that is relevant but not required — gives them an edge"]
  }
}

Rules:
- experienceMatch: base on actual job titles, seniority level and employment history provided — do NOT default to 0 if history is present
- extractedRequirements: up to 8 specific skill/tool names from the job description
- skillsBreakdown.matched: cross-reference candidate skills vs extracted requirements
- skillsBreakdown.missing: requirements not found in candidate skills (max 6)
- skillsBreakdown.partial: close matches (max 3)
- skillsBreakdown.bonus: candidate skills relevant but not in requirements (max 3)
- All arrays can be empty []
- Scores must be integers 0-100
- skillsMatch must be consistent with skillsBreakdown: if matched array is non-empty, skillsMatch must be > 0`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 700,
  });

  const data = JSON.parse(res.choices[0]?.message?.content ?? '{}') as {
    score?: number;
    skillsMatch?: number;
    experienceMatch?: number;
    salaryMatch?: number;
    cultureMatch?: number;
    strengths?: string[];
    gaps?: string[];
    advice?: string;
    extractedRequirements?: string[];
    skillsBreakdown?: SkillsBreakdown;
  };

  return {
    score: typeof data.score === 'number' ? data.score : 50,
    skillsMatch: typeof data.skillsMatch === 'number' ? data.skillsMatch : (data.score ?? 50),
    experienceMatch: typeof data.experienceMatch === 'number' ? data.experienceMatch : (data.score ?? 50),
    salaryMatch: typeof data.salaryMatch === 'number' ? data.salaryMatch : 50,
    cultureMatch: typeof data.cultureMatch === 'number' ? data.cultureMatch : 50,
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    gaps: Array.isArray(data.gaps) ? data.gaps : [],
    advice: data.advice ?? '',
    extractedRequirements: Array.isArray(data.extractedRequirements) ? data.extractedRequirements : undefined,
    skillsBreakdown: data.skillsBreakdown ?? undefined,
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
    model: 'gpt-4o-mini',
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
      model: 'gpt-4o-mini',
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
