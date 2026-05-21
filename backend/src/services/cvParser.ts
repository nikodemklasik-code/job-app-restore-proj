import { tryGetOpenAiClient } from '../lib/openai/openai.client.js';
import { getRoutingModel } from '../lib/openai/model-registry.js';

interface ParsedCvExperience {
  company?: string;
  title?: string;
  role?: string;
  employer?: string;
  startDate?: string;
  endDate?: string | null;
  description?: string;
  achievements?: string[];
}

interface ParsedCvEducation {
  school?: string;
  institution?: string;
  university?: string;
  degree?: string;
  fieldOfStudy?: string;
  field?: string;
  startDate?: string;
  endDate?: string | null;
}

interface ParsedCvTraining {
  title?: string;
  providerName?: string;
  issuedAt?: string;
  expiresAt?: string | null;
  credentialUrl?: string;
}

interface ParsedCvLanguage {
  name?: string;
  proficiency?: string;
  certificate?: string | null;
}

interface ParsedCv {
  fullName: string;
  email: string;
  phone: string;
  headline: string;
  location: string;
  linkedinUrl: string;
  summary: string;
  skills: string[];
  experience: ParsedCvExperience[];
  education: ParsedCvEducation[];
  trainings: ParsedCvTraining[];
  languages: ParsedCvLanguage[];
  rawText: string;
}

function pickTopLocationCandidate(text: string): string {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);

  for (const line of lines) {
    if (/@|linkedin|github|http|www\.|\+?\d/.test(line.toLowerCase())) continue;
    if (line.length < 3 || line.length > 80) continue;
    if (/curriculum vitae|resume|cv/i.test(line)) continue;
    if (/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)+$/.test(line)) continue;
    if (line.includes(',')) return line;
  }

  return '';
}

function pickHeadline(text: string, summary: string): string {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10);

  for (const line of lines) {
    if (line.length < 4 || line.length > 120) continue;
    const lower = line.toLowerCase();
    if (/@|linkedin|github|http|www\.|\+?\d/.test(lower)) continue;
    if (/curriculum vitae|resume|cv/i.test(lower)) continue;
    if (/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)+$/.test(line)) continue;
    if (summary && summary.includes(line)) continue;
    return line;
  }

  return '';
}

function normalizeStringList(values: unknown, max = 30): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function normalizeExperience(values: unknown): ParsedCvExperience[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((item): item is ParsedCvExperience => !!item && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      company: typeof item.company === 'string' ? item.company.trim() : undefined,
      title: typeof item.title === 'string' ? item.title.trim() : undefined,
      role: typeof item.role === 'string' ? item.role.trim() : undefined,
      employer: typeof item.employer === 'string' ? item.employer.trim() : undefined,
      startDate: typeof item.startDate === 'string' ? item.startDate.trim() : undefined,
      endDate: typeof item.endDate === 'string' ? item.endDate.trim() : item.endDate === null ? null : undefined,
      description: typeof item.description === 'string' ? item.description.trim() : undefined,
      achievements: normalizeStringList(item.achievements, 10),
    }))
    .filter((item) => Boolean(item.company || item.employer || item.title || item.role || item.description));
}

function normalizeEducation(values: unknown): ParsedCvEducation[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((item): item is ParsedCvEducation => !!item && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      school: typeof item.school === 'string' ? item.school.trim() : undefined,
      institution: typeof item.institution === 'string' ? item.institution.trim() : undefined,
      university: typeof item.university === 'string' ? item.university.trim() : undefined,
      degree: typeof item.degree === 'string' ? item.degree.trim() : undefined,
      fieldOfStudy: typeof item.fieldOfStudy === 'string' ? item.fieldOfStudy.trim() : undefined,
      field: typeof item.field === 'string' ? item.field.trim() : undefined,
      startDate: typeof item.startDate === 'string' ? item.startDate.trim() : undefined,
      endDate: typeof item.endDate === 'string' ? item.endDate.trim() : item.endDate === null ? null : undefined,
    }))
    .filter((item) => Boolean(item.school || item.institution || item.university || item.degree));
}

function normalizeTrainings(values: unknown): ParsedCvTraining[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((item): item is ParsedCvTraining => !!item && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      title: typeof item.title === 'string' ? item.title.trim() : undefined,
      providerName: typeof item.providerName === 'string' ? item.providerName.trim() : undefined,
      issuedAt: typeof item.issuedAt === 'string' ? item.issuedAt.trim() : undefined,
      expiresAt: typeof item.expiresAt === 'string' ? item.expiresAt.trim() : item.expiresAt === null ? null : undefined,
      credentialUrl: typeof item.credentialUrl === 'string' ? item.credentialUrl.trim() : undefined,
    }))
    .filter((item) => Boolean(item.title || item.providerName));
}

function normalizeLanguages(values: unknown): ParsedCvLanguage[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((item): item is ParsedCvLanguage => !!item && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      name: typeof item.name === 'string' ? item.name.trim() : undefined,
      proficiency: typeof item.proficiency === 'string' ? item.proficiency.trim() : undefined,
      certificate: typeof item.certificate === 'string' ? item.certificate.trim() : item.certificate === null ? null : undefined,
    }))
    .filter((item) => Boolean(item.name));
}

function parseCvTextBasic(text: string): ParsedCv {
  const clean = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();

  const emailMatch = clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = clean.match(/(\+?\d[\d\s\-().]{7,})/);
  const nameMatch = text.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/m);
  const linkedinMatch = clean.match(/https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/[^\s)]+/i);

  const skillsMatch = text.match(/(?:Core\s+)?Skills?\s*(?:&\s*Competencies?)?\s*:?\s*([\s\S]*?)(?:\bExperience\b|\bEducation\b|\bEmployment\b|\bCertifications?\b|\bLanguages?\b|$)/i);
  const skills = skillsMatch
    ? skillsMatch[1].split(/[,\n•·▪–\-]/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 60 && !/^[A-Z\s]{10,}$/.test(s))
    : [];

  const summaryMatch = text.match(/(?:Professional\s+)?Summary\s*:?\s*([\s\S]*?)(?:Skills?|Experience|Education|$)/i)
    || text.match(/(?:Profile|About)\s*:?\s*([\s\S]*?)(?:Skills?|Experience|Education|$)/i);
  const summary = summaryMatch?.[1]?.replace(/\s+/g, ' ').trim().slice(0, 500) ?? '';

  const expMatch = text.match(/(?:Work\s+)?Experience\s*:?\s*([\s\S]*?)(?:Education|Certifications?|$)/i)
    || text.match(/Employment\s*:?\s*([\s\S]*?)(?:Education|$)/i);
  const eduMatch = text.match(/Education\s*:?\s*([\s\S]*?)(?:Certifications?|Languages?|References?|$)/i);
  const trainingMatch = text.match(/(?:Certifications?|Courses?|Training)\s*:?\s*([\s\S]*?)(?:Languages?|References?|Education|$)/i);
  const languageMatch = text.match(/Languages?\s*:?\s*([\s\S]*?)(?:References?|Certifications?|$)/i);

  const expEntries = groupCvSection(expMatch?.[1] ?? '', 'experience');
  const eduEntries = groupCvSection(eduMatch?.[1] ?? '', 'education');
  const trainingEntries: ParsedCvTraining[] = groupSimpleList(trainingMatch?.[1] ?? '', 'training');
  const languageEntries: ParsedCvLanguage[] = groupSimpleList(languageMatch?.[1] ?? '', 'language');

  return {
    fullName: nameMatch?.[1] ?? '',
    email: emailMatch?.[0] ?? '',
    phone: phoneMatch?.[0] ?? '',
    headline: pickHeadline(text, summary),
    location: pickTopLocationCandidate(text),
    linkedinUrl: linkedinMatch?.[0] ?? '',
    summary,
    skills: skills.slice(0, 30),
    experience: expEntries,
    education: eduEntries,
    trainings: trainingEntries,
    languages: languageEntries,
    rawText: text,
  };
}

function groupSimpleList(sectionText: string, kind: 'training'): ParsedCvTraining[];
function groupSimpleList(sectionText: string, kind: 'language'): ParsedCvLanguage[];
function groupSimpleList(sectionText: string, kind: 'training' | 'language'): ParsedCvTraining[] | ParsedCvLanguage[] {
  if (!sectionText || sectionText.length < 4) return [];
  const lines = sectionText
    .split('\n')
    .map((line) => line.replace(/^[•·▪\-*\s]+/, '').trim())
    .filter((line) => line.length > 1)
    .slice(0, kind === 'training' ? 8 : 6);

  if (kind === 'training') {
    return lines.map((line) => ({ title: line }));
  }

  return lines.map((line) => ({ name: line }));
}

function groupCvSection(
  sectionText: string,
  kind: 'experience' | 'education',
): Array<{ company?: string; school?: string; title?: string; degree?: string; startDate?: string; endDate?: string | null; description?: string }> {
  if (!sectionText || sectionText.length < 10) return [];

  const lines = sectionText.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
  if (lines.length === 0) return [];

  const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)?\s*\d{4}\s*[-–—to]+\s*(?:Present|Current|\d{4}|\w+\s*\d{4})|\b\d{1,2}\/\d{4}\s*[-–—to]+/i;

  const entries: Array<{ lines: string[] }> = [];
  let currentEntry: string[] = [];

  for (const line of lines) {
    if (datePattern.test(line) && currentEntry.length > 0) {
      entries.push({ lines: currentEntry });
      currentEntry = [line];
    } else {
      currentEntry.push(line);
    }
  }
  if (currentEntry.length > 0) entries.push({ lines: currentEntry });

  if (entries.length === 0) return [];

  const maxEntries = kind === 'experience' ? 6 : 4;

  return entries.slice(0, maxEntries).map((entry) => {
    const fullText = entry.lines.join(' ').slice(0, 500);
    const dateMatch = fullText.match(datePattern);
    const dateRange = dateMatch?.[0] ?? '';
    const [startDate = '', endDateRaw = ''] = dateRange
      ? dateRange.split(/\s*[-–—to]+\s*/i).map((d) => d.trim())
      : ['', ''];
    const endDate = /present|current/i.test(endDateRaw) ? null : endDateRaw || null;

    const firstLine = entry.lines[0] ?? '';
    const separator = firstLine.match(/\s+(?:at|–|—|\||,)\s+/);

    if (kind === 'experience') {
      if (separator) {
        const [title, company] = firstLine.split(separator[0]);
        return {
          title: title?.trim().slice(0, 120) || undefined,
          company: company?.trim().slice(0, 120) || undefined,
          startDate: startDate || undefined,
          endDate,
          description: entry.lines.slice(1).join('\n').slice(0, 800) || undefined,
        };
      }
      return {
        title: firstLine.slice(0, 120) || undefined,
        startDate: startDate || undefined,
        endDate,
        description: entry.lines.slice(1).join('\n').slice(0, 800) || undefined,
      };
    }

    if (separator) {
      const [school, rest] = firstLine.split(separator[0]);
      return {
        school: school?.trim().slice(0, 120) || undefined,
        degree: rest?.trim().slice(0, 120) || undefined,
        startDate: startDate || undefined,
        endDate,
      };
    }
    return {
      school: firstLine.slice(0, 120) || undefined,
      degree: entry.lines[1]?.slice(0, 120) || undefined,
      startDate: startDate || undefined,
      endDate,
    };
  }).filter((item) => Boolean(item.company || item.school || item.title || item.degree || item.description));
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  let pdfParse: (buffer: Buffer) => Promise<{ text: string }>;
  try {
    const mod = await import('pdf-parse');
    pdfParse = (mod.default ?? mod) as typeof pdfParse;
  } catch {
    console.warn('[cvParser] pdf-parse not available, returning raw text');
    return buffer.toString('utf8');
  }
  const { text } = await pdfParse(buffer);
  return text;
}

export async function extractTextFromFile(base64: string, mimeType: string): Promise<string> {
  const buffer = Buffer.from(base64, 'base64');

  if (mimeType === 'application/pdf' || mimeType === 'application/octet-stream') {
    return extractTextFromPdf(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    base64.startsWith('UEsD')
  ) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — mammoth has no bundled type declarations
    const mammothMod = await import('mammoth');
    const mammoth = (mammothMod.default ?? mammothMod) as { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> };
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }

  return extractTextFromPdf(buffer);
}

async function structureWithOpenAI(text: string): Promise<ParsedCv | null> {
  const client = tryGetOpenAiClient();
  if (!client || text.length <= 50) return null;
  try {
    const resp = await client.chat.completions.create({
      model: getRoutingModel(),
      max_tokens: 2200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Extract structured data from this CV text. Return JSON with these exact fields:
- fullName: string
- email: string
- phone: string
- headline: string
- location: string
- linkedinUrl: string
- summary: string (professional summary, max 400 chars)
- skills: string[] (technical and soft skills, max 30)
- experience: array of objects with { company: string, title: string, startDate: string, endDate: string | null, description: string, achievements: string[] }
- education: array of objects with { school: string, degree: string, fieldOfStudy: string, startDate: string, endDate: string | null }
- trainings: array of objects with { title: string, providerName: string, issuedAt: string, expiresAt: string | null, credentialUrl: string }
- languages: array of objects with { name: string, proficiency: string, certificate: string | null }

Rules:
- Preserve the wording from the CV. Do not invent values.
- If a field is not visible, return empty string, null, or [] as appropriate.
- Experience and education must be arrays of objects, not strings.
- Do not fabricate companies, titles, schools, dates, work modes, goals, or preferences.
- Keep descriptions concise but faithful to the CV text.`,
        },
        { role: 'user', content: text.slice(0, 8000) },
      ],
    });
    const parsed = JSON.parse(resp.choices[0]?.message?.content ?? '{}') as Partial<ParsedCv>;
    return {
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName.trim() : '',
      email: typeof parsed.email === 'string' ? parsed.email.trim() : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone.trim() : '',
      headline: typeof parsed.headline === 'string' ? parsed.headline.trim() : '',
      location: typeof parsed.location === 'string' ? parsed.location.trim() : '',
      linkedinUrl: typeof parsed.linkedinUrl === 'string' ? parsed.linkedinUrl.trim() : '',
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
      skills: normalizeStringList(parsed.skills),
      experience: normalizeExperience(parsed.experience),
      education: normalizeEducation(parsed.education),
      trainings: normalizeTrainings(parsed.trainings),
      languages: normalizeLanguages(parsed.languages),
      rawText: text,
    };
  } catch (err) {
    console.error('[cvParser] OpenAI parse failed, falling back to regex:', err);
    return null;
  }
}

export async function parseCvPdf(buffer: Buffer): Promise<ParsedCv> {
  const text = await extractTextFromPdf(buffer);
  const structured = await structureWithOpenAI(text);
  return structured ?? parseCvTextBasic(text);
}

export async function parseCvFromFile(base64: string, mimeType: string): Promise<ParsedCv> {
  const text = await extractTextFromFile(base64, mimeType);
  const structured = await structureWithOpenAI(text);
  return structured ?? parseCvTextBasic(text);
}

export type { ParsedCv };
