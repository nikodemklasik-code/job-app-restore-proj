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
      "Go to CV Studio (Profile page) and upload your CV as a PDF. The AI will parse it and auto-fill your profile. Once your profile is set up, you can start browsing jobs and get personalised fit scores.",
  },
  {
    category: 'Getting Started',
    question: 'What is CV Studio?',
    answer:
      "CV Studio is your document hub. Upload your CV to auto-fill your profile, generate a formatted CV PDF, and prepare cover letters. It's the foundation that powers your job matching and AI tools.",
  },
  {
    category: 'Getting Started',
    question: 'Do I need to fill in my profile manually?',
    answer:
      'No. Upload your existing CV as a PDF and click "Import to Profile". The AI extracts your experience, education, skills, and contact info automatically. You can then review and edit any field.',
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
      'MultivoHub includes: AI Assistant (career Q&A), Interview Ready (6-mode interview practice with STAR detection), Style Studio (CV and cover letter rewriting), CV Studio (CV generation), Negotiation Coach, Skills Lab, and Job Radar. All AI features use your profile data for personalised results.',
  },
  {
    category: 'AI Features',
    question: 'How does Interview Ready work?',
    answer:
      'Interview Ready simulates a real conversation with an AI recruiter. Choose a mode: Behavioral, Technical, HR, Case Study, Language Check, or General. The AI asks contextual questions, you respond, and get real-time STAR framework feedback and a coaching score at the end.',
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
      'Style Studio analyses your CV or cover letter, suggests improvements, rewrites sections to sound more professional, and can generate a complete document from a job description. It also recommends courses to fill skill gaps.',
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
      'Interview sessions are stored on your account and accessible only to you. Coaching reports are cryptographically signed to ensure they cannot be tampered with or fabricated.',
  },
  {
    category: 'Privacy & Security',
    question: 'Can I delete my data?',
    answer:
      'Yes. You can remove your profile data at any time from the Profile page. To fully delete your account and all associated data, contact support.',
  },

  // Billing & Plans
  {
    category: 'Billing & Plans',
    question: 'What is included in the free plan?',
    answer:
      'The free plan includes limited job searches, basic CV Studio access, and limited AI assistant queries. Upgrade to Pro or Autopilot for unlimited interviews, coaching reports, and full AI feature access.',
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
    question: 'What file format does CV Studio accept?',
    answer:
      'CV Studio accepts PDF files only. For best results, use a text-based PDF (not a scanned image). If your CV is in Word format, save it as PDF first.',
  },
  {
    category: 'Technical',
    question: 'Why is my fit score low even though I match the job?',
    answer:
      'The fit score is based on keyword and semantic matching between your profile and the job description. Make sure your profile fully reflects your skills and experience. Adding more specific skills and job titles to your profile improves matching accuracy.',
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
        {filtered.map((item, i) => (
          <FaqAccordion key={i} item={item} />
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
