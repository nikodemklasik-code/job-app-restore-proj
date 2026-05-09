import { tryGetOpenAiClient } from '../lib/openai/openai.client.js';
import { getRoutingModel } from '../lib/openai/model-registry.js';

interface ParsedCv {
  fullName: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: Array<string | { company?: string; title?: string; role?: string; startDate?: string; endDate?: string; description?: string }>;
  education: Array<string | { school?: string; institution?: string; degree?: string; fieldOfStudy?: string; field?: string; startDate?: string; endDate?: string }>;
  rawText: string;
}

function parseCvTextBasic(text: string): ParsedCv {
  const clean = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();

  const emailMatch = clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = clean.match(/(\+?\d[\d\s\-().]{7,})/);
  const nameMatch = text.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/m);

  const skillsMatch = text.match(/(?:Core\s+)?Skills?\s*(?:&\s*Competencies?)?\s*:?\s*([\s\S]*?)(?:\bExperience\b|\bEducation\b|\bEmployment\b|\bCertifications?\b|\bLanguages?\b|$)/i);
  const skills = skillsMatch
    ? skillsMatch[1].split(/[,\n•·▪–\-]/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 60 && !/^[A-Z\s]{10,}$/.test(s))
    : [];

  const summaryMatch = text.match(/(?:Professional\s+)?Summary\s*:?\s*([\s\S]*?)(?:Skills?|Experience|Education|$)/i)
    || text.match(/(?:Profile|About)\s*:?\s*([\s\S]*?)(?:Skills?|Experience|Education|$)/i);
  const summary = summaryMatch?.[1]?.replace(/\s+/g, ' ').trim().slice(0, 500) ?? '';

  // Extract experience and education as RAW text blocks
  // The regex fallback can't reliably split into structured entries,
  // so we return the raw text as a single summary item. OpenAI will do proper parsing.
  const expMatch = text.match(/(?:Work\s+)?Experience\s*:?\s*([\s\S]*?)(?:Education|Certifications?|$)/i)
    || text.match(/Employment\s*:?\s*([\s\S]*?)(?:Education|$)/i);
  const eduMatch = text.match(/Education\s*:?\s*([\s\S]*?)(?:Certifications?|Languages?|References?|$)/i);

  // Group experience lines into entries: detect date patterns or role titles as boundaries
  const expEntries = groupCvSection(expMatch?.[1] ?? '', 'experience');
  const eduEntries = groupCvSection(eduMatch?.[1] ?? '', 'education');

  return {
    fullName: nameMatch?.[1] ?? '',
    email: emailMatch?.[0] ?? '',
    phone: phoneMatch?.[0] ?? '',
    summary,
    skills: skills.slice(0, 30),
    experience: expEntries,
    education: eduEntries,
    rawText: text,
  };
}

/**
 * Group CV section content into logical entries by detecting date patterns
 * or job/education title boundaries. Returns structured objects.
 */
function groupCvSection(
  sectionText: string,
  kind: 'experience' | 'education',
): Array<{ company?: string; school?: string; title?: string; degree?: string; startDate?: string; endDate?: string; description?: string }> {
  if (!sectionText || sectionText.length < 10) return [];

  const lines = sectionText.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
  if (lines.length === 0) return [];

  // Date pattern: matches "Jan 2020 - Present", "2020-2023", "05/2020 - 08/2023"
  const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)?\s*\d{4}\s*[-–—to]+\s*(?:Present|Current|\d{4}|\w+\s*\d{4})|\b\d{1,2}\/\d{4}\s*[-–—to]+/i;

  // Try to find entries by date boundaries
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

  // If we only found 0-1 entries, return raw text as single entry rather than pollute profile
  if (entries.length === 0) return [];

  // Cap at 6 entries for experience, 4 for education
  const maxEntries = kind === 'experience' ? 6 : 4;

  return entries.slice(0, maxEntries).map((entry) => {
    const fullText = entry.lines.join(' ').slice(0, 500);
    const dateMatch = fullText.match(datePattern);
    const dateRange = dateMatch?.[0] ?? '';
    const [startDate = '', endDate = ''] = dateRange
      ? dateRange.split(/\s*[-–—to]+\s*/i).map((d) => d.trim())
      : ['', ''];

    // First line often contains title + company/school
    const firstLine = entry.lines[0] ?? '';
    const separator = firstLine.match(/\s+(?:at|–|—|\||,)\s+/);

    if (kind === 'experience') {
      if (separator) {
        const [title, company] = firstLine.split(separator[0]);
        return {
          title: title?.trim().slice(0, 120) || 'Role',
          company: company?.trim().slice(0, 120) || 'Company',
          startDate,
          endDate: endDate === 'Present' || endDate === 'Current' ? null as any : endDate,
          description: entry.lines.slice(1).join('\n').slice(0, 800),
        };
      }
      return {
        title: firstLine.slice(0, 120) || 'Role',
        company: 'Unknown',
        startDate,
        endDate,
        description: entry.lines.slice(1).join('\n').slice(0, 800),
      };
    } else {
      // education
      if (separator) {
        const [school, rest] = firstLine.split(separator[0]);
        return {
          school: school?.trim().slice(0, 120) || 'School',
          degree: rest?.trim().slice(0, 120) || 'Degree',
          startDate,
          endDate,
        };
      }
      return {
        school: firstLine.slice(0, 120) || 'School',
        degree: entry.lines[1]?.slice(0, 120) ?? 'Degree',
        startDate,
        endDate,
      };
    }
  });
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

/**
 * Detects file type from mimeType or base64 magic bytes and extracts plain text.
 */
export async function extractTextFromFile(base64: string, mimeType: string): Promise<string> {
  const buffer = Buffer.from(base64, 'base64');

  if (
    mimeType === 'application/pdf' ||
    mimeType === 'application/octet-stream'
  ) {
    return extractTextFromPdf(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    base64.startsWith('UEsD') // DOCX magic bytes in base64
  ) {
    // Dynamic import of mammoth (CJS module)
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

  // fallback — try PDF
  return extractTextFromPdf(buffer);
}

async function structureWithOpenAI(text: string): Promise<ParsedCv | null> {
  const client = tryGetOpenAiClient();
  if (!client || text.length <= 50) return null;
  try {
    const resp = await client.chat.completions.create({
      model: getRoutingModel(),
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Extract structured data from this CV text. Return JSON with these exact fields:
- fullName: string
- email: string
- phone: string
- summary: string (professional summary, max 400 chars)
- skills: string[] (list of technical and soft skills, max 30)
- experience: array of objects with { company: string, title: string, startDate: string (e.g. "Jan 2020"), endDate: string or "Present", description: string }
- education: array of objects with { school: string, degree: string, fieldOfStudy: string, startDate: string, endDate: string }

Experience and education MUST be arrays of objects, not strings. Extract at least 3 experiences and 1 education entry if visible in the CV.`,
        },
        { role: 'user', content: text.slice(0, 6000) },
      ],
    });
    const parsed = JSON.parse(resp.choices[0]?.message?.content ?? '{}') as Partial<ParsedCv>;
    return {
      fullName: parsed.fullName ?? '',
      email: parsed.email ?? '',
      phone: parsed.phone ?? '',
      summary: parsed.summary ?? '',
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
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

/**
 * Parse a CV from any supported format (PDF, DOCX, TXT) given base64 content and MIME type.
 */
export async function parseCvFromFile(base64: string, mimeType: string): Promise<ParsedCv> {
  const text = await extractTextFromFile(base64, mimeType);
  const structured = await structureWithOpenAI(text);
  return structured ?? parseCvTextBasic(text);
}

export type { ParsedCv };
