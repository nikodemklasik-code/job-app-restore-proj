import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

// ── Data ───────────────────────────────────────────────────────────────────

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FaqItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'How do I get started?',
    answer:
      "Go to Document Hub and upload your CV as a PDF. The AI parses it and fills your profile context. Once set up, you can browse jobs and get personalised fit scores.",
  },
  {
    category: 'Getting Started',
    question: 'What is Document Hub?',
    answer:
      "Document Hub is the canonical document workspace. Upload files there to auto-fill profile context, generate CV/cover-letter outputs, and support job matching.",
  },
  {
    category: 'Getting Started',
    question: 'Do I need to fill in my profile manually?',
    answer:
      'No. Upload your existing CV as a PDF in Document Hub and import it to profile context. The AI extracts experience, education, skills, and contact info automatically.',
  },

  // Jobs & Applications
  {
    category: 'Jobs & Applications',
    question: 'Where do the job listings come from?',
    answer:
      'Jobs are sourced live from multiple providers including Reed, Adzuna, and Jooble. For Indeed and Gumtree, you can connect your account in the Jobs page to unlock additional results.',
  },
  {
    category: 'Jobs & Applications',
    question: 'What does the Fit Score mean?',
    answer:
      'The Fit Score (0–100) is calculated by comparing your profile skills, experience, and job title against the job description. A score of 80+ means strong alignment. 60–79 means good match. Below 60 means the role may be a stretch.',
  },
  {
    category: 'Jobs & Applications',
    question: 'What do the job statuses mean?',
    answer:
      'New — just discovered. Saved — you bookmarked it. Applied — application submitted. In Review — employer is reviewing. Interview — you have an interview scheduled. Offer — you received an offer. Rejected — no from the employer. Expired — listing deadline has passed. Closed — employer closed the listing.',
  },
  {
    category: 'Jobs & Applications',
    question: 'What is the difference between Expired and Closed?',
    answer:
      'Expired means the application deadline has passed — the listing is no longer accepting candidates. Closed means the employer manually closed the listing, usually because the position has been filled or the recruitment was cancelled.',
  },

  // AI Features
  {
    category: 'AI Features',
    question: 'What AI features are available?',
    answer:
      'MultivoHub includes: AI Assistant (career Q&A), Interview, Daily Warmup, Document Hub (intake + document generation), Negotiation, Skills Lab, Coach, Reports, and Job Radar. AI features use your saved profile/document context where relevant.',
  },
  {
    category: 'AI Features',
    question: 'How does Interview Ready work?',
    answer:
      'Interview (Interview Ready) simulates a conversation with an AI interviewer. Choose a mode: Behavioral, Technical, HR, Case Study, Language Check, or General. The AI asks contextual questions, you respond, and get real-time STAR-style feedback and a coaching score at the end.',
  },
  {
    category: 'AI Features',
    question: 'What is STAR feedback?',
    answer:
      'STAR stands for Situation, Task, Action, Result — the gold standard for structured interview answers. The app detects STAR components in your answers in real time and highlights which parts are present or missing, helping you structure better responses.',
  },
  {
    category: 'AI Features',
    question: 'What is Style Studio?',
    answer:
      'Document Hub analyses your CV or cover letter, suggests improvements, rewrites sections, and can generate complete documents from a job description.',
  },

  // Privacy & Security
  {
    category: 'Privacy & Security',
    question: 'Is my CV data safe?',
    answer:
      'Yes. Your CV data is stored securely and used only to power your personal workspace. It is never shared with employers without your action. We do not sell your data.',
  },
  {
    category: 'Privacy & Security',
    question: 'How are my interview sessions stored?',
    answer:
      'Interview sessions and coaching output are stored against your account and are only available when you are signed in. They are not shared with employers automatically. Keep your own export (e.g. PDF from Interview) if you need an offline record.',
  },
  {
    category: 'Privacy & Security',
    question: 'Can I delete my data?',
    answer:
      'Yes. You can edit profile details in Profile and manage uploaded documents in Document Hub. Export application records from Reports (JSON/CSV).',
  },

  // Billing & Plans
  {
    category: 'Billing & Plans',
    question: 'What is included in the free plan?',
    answer:
      'The free plan includes limited job searches, basic CV and profile tools, and a lower monthly AI allowance. Upgrade to Pro or Autopilot from the Billing page for higher AI limits and access to paid-only features (exact entitlements are shown in-app and may change).',
  },
  {
    category: 'Billing & Plans',
    question: 'Can I cancel my subscription?',
    answer:
      'Yes. You can cancel your subscription at any time from the Billing page. Your access continues until the end of the current billing period.',
  },

  // Technical
  {
    category: 'Technical',
    question: 'What file format does Document Hub accept?',
    answer:
      'Document Hub accepts PDF files only. For best results, use a text-based PDF (not a scanned image). If your CV is in Word format, save as PDF first.',
  },
  {
    category: 'Technical',
    question: 'Why is my fit score low even though I match the job?',
    answer:
      'The fit score is based on keyword and semantic matching between your profile and the job description. Make sure your profile fully reflects your skills and experience. Adding more specific skills and job titles to your profile improves matching accuracy.',
  },
  {
    category: 'Technical',
    question: 'Which browsers are supported?',
    answer:
      'Use a current version of Chrome, Firefox, Safari, or Edge. Enable JavaScript and third-party cookies for authentication (Clerk) where your browser requires it. For interview features, allow microphone access when prompted.',
  },

  // Job Radar
  {
    category: 'Job Radar',
    question: 'What is Job Radar?',
    answer:
      'Job Radar analyses roles against your profile and produces a structured report with scores, sources, and observations to help you prioritise applications. It is a decision-support tool — always verify listings and employers yourself before applying.',
  },
  {
    category: 'Job Radar',
    question: 'How do I start a Job Radar scan?',
    answer:
      'Open Job Radar from the app menu, enter the target role or follow the scan flow, and wait until the scan completes. You will be redirected to a report when results are ready. If a scan fails or times out, try again or contact support with the scan reference.',
  },

  // Reports & data
  {
    category: 'Reports & data',
    question: 'What is on the Reports page?',
    answer:
      'Reports shows analytics for your applications: funnel stats, timelines, source and company breakdowns, and response-rate style metrics. You can export your application list as JSON or CSV, or download a PDF summary where available.',
  },
  {
    category: 'Reports & data',
    question: 'How do I export or delete my data?',
    answer:
      'Use exports on the Reports page for a machine-readable copy of application data. For full account deletion or data subject requests, email privacy@multivohub.com — see the Privacy Policy for retention and your rights under UK GDPR.',
  },

  // Account & access
  {
    category: 'Account & access',
    question: 'How does sign-in work?',
    answer:
      'Accounts are managed by Clerk. You can sign in with email or supported social providers. If you cannot sign in, check your email for verification links, try another browser window, or reset your password through the sign-in screen.',
  },
  {
    category: 'Account & access',
    question: 'How do I delete my account?',
    answer:
      'Email privacy@multivohub.com from your registered address and ask for account erasure. We will verify your identity and process requests within the timelines described in our Privacy Policy. Inactivity-based deletion may also apply to free accounts as explained there.',
  },

  // Billing (extra)
  {
    category: 'Billing & Plans',
    question: 'What are AI credits?',
    answer:
      'AI credits (or monthly AI allowances) limit how much automated generation you can use per billing period on Free or Pro plans. Autopilot may include a higher or unlimited allowance depending on the current Billing page. Credits do not roll over unless we say otherwise.',
  },
  {
    category: 'Billing & Plans',
    question: 'Where can I find invoices or manage my card?',
    answer:
      'Where Stripe Customer Portal is enabled for your subscription, open it from the Billing page to update payment methods or retrieve invoices. PayPal and crypto flows follow each provider’s receipts.',
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-slate-200 transition hover:bg-white/5"
      >
        <span>{item.question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border-t border-white/10 px-5 py-4 text-sm leading-relaxed text-slate-400">
          {item.answer}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const CATEGORIES = [...new Set(FAQ_ITEMS.map((f) => f.category))];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const categories = ['All', ...CATEGORIES];

  const filtered =
    activeCategory === 'All'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((f) => f.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20">
          <HelpCircle className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">FAQ</h1>
          <p className="mt-1 text-sm text-slate-400">Frequently asked questions about MultivoHub</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={[
              'rounded-xl px-4 py-1.5 text-xs font-semibold transition',
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200',
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <FaqAccordion key={`${item.category}::${item.question}`} item={item} />
        ))}
      </div>

      {/* Contact footer */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-6 text-center">
        <p className="text-sm font-medium text-indigo-300">Still have questions?</p>
        <p className="mt-1 text-sm text-slate-400">
          Contact us at{' '}
          <a href="mailto:support@multivohub.com" className="text-indigo-400 hover:underline">
            support@multivohub.com
          </a>
        </p>
      </div>
    </div>
  );
}
