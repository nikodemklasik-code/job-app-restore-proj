import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM ?? 'no-reply@multivohub.com';

let _client: Resend | null = null;

const getResendClient = (): Resend => {
  if (!_client) {
    if (!apiKey) throw new Error('Missing RESEND_API_KEY');
    _client = new Resend(apiKey);
  }
  return _client;
};

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
  const client = getResendClient();
  await client.emails.send({
    from: fromEmail,
    to,
    subject: 'Welcome to MultivoHub — Your Career Workspace',
    html: `<h1>Welcome, ${name}!</h1><p>Your career workspace is ready. Start by completing your profile to get the best AI job matches.</p>`,
  });
};
