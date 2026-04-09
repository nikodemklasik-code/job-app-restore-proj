import OpenAI from 'openai';

interface ParsedCv {
  fullName: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  experience: string[];
  education: string[];
  rawText: string;
}

function parseCvTextBasic(text: string): ParsedCv {
  const clean = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();

  const emailMatch = clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = clean.match(/(\+?\d[\d\s\-().]{7,})/);
  const nameMatch = text.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/m);

  const skillsMatch = text.match(/Skills?\s*:?\s*([\s\S]*?)(Experience|Education|Employment|$)/i);
  const skills = skillsMatch
    ? skillsMatch[1].split(/[,\n•-]/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 60)
    : [];

  const summaryMatch = text.match(/Summary\s*:?\s*([\s\S]*?)(Skills?|Experience|Education|$)/i);
  const summary = summaryMatch?.[1]?.replace(/\s+/g, ' ').trim() ?? clean.slice(0, 300);

  const expMatch = text.match(/Experience\s*:?\s*([\s\S]*?)(Education|$)/i);
  const eduMatch = text.match(/Education\s*:?\s*([\s\S]*?)$/i);

  const splitLines = (s?: string) =>
    (s ?? '').split('\n').map((l) => l.trim()).filter((l) => l.length > 3).slice(0, 20);

  return {
    fullName: nameMatch?.[1] ?? '',
    email: emailMatch?.[0] ?? '',
    phone: phoneMatch?.[0] ?? '',
    summary,
    skills: skills.slice(0, 30),
    experience: splitLines(expMatch?.[1]),
    education: splitLines(eduMatch?.[1]),
    rawText: text,
  };
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || text.length <= 50) return null;
  try {
    const client = new OpenAI({ apiKey });
    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Extract structured data from this CV text. Return JSON with: fullName (string), email (string), phone (string), summary (string, max 300 chars), skills (string[]), experience (string[], max 10 items, each max 100 chars), education (string[], max 5 items).',
        },
        { role: 'user', content: text.slice(0, 4000) },
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
