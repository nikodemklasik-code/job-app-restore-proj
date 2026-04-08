import OpenAI from 'openai';

const getClient = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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
