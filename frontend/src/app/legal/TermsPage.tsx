import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '15 April 2026';

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: (
      <>
        <p>
          By accessing or using MultivoHub (the "Service"), you agree to be bound by these Terms of Service
          ("Terms"). If you do not agree to these Terms, you must not use the Service. These Terms constitute
          a legally binding agreement between you and MultivoHub Ltd ("MultivoHub", "we", "us", or "our").
        </p>
        <p className="mt-3">
          We reserve the right to update these Terms at any time. We will notify you of material changes by
          email or via an in-app notification. Continued use of the Service after changes are posted constitutes
          your acceptance of the revised Terms. The date of the most recent revision is shown at the top of
          this page.
        </p>
        <p className="mt-3">
          If you are using the Service on behalf of an organisation, you represent that you have authority to
          bind that organisation to these Terms, and "you" refers to both you individually and that organisation.
        </p>
      </>
    ),
  },
  {
    id: 'description',
    title: '2. Description of Service',
    content: (
      <>
        <p>
          MultivoHub is a UK-oriented job application platform that provides the following features to
          registered users:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-1.5">
          <li>Job discovery and search tools tailored to the UK employment market (including aggregated listings from third-party providers where connected)</li>
          <li>CV and cover letter management, including AI-assisted generation and formatting</li>
          <li>Application pipeline tracking and optional analytics and exports (including Reports)</li>
          <li>Job Radar and related scanning features that produce personalised summaries and scores</li>
          <li>AI-powered tools including interview practice, career coach, assistant chat, negotiation coach, Skills Lab, and salary tools</li>
          <li>Document Lab, Style Studio, and warmup or coaching experiences we may offer from time to time</li>
          <li>UK employment law reference materials in the Legal Hub for general information only — not legal advice</li>
        </ul>
        <p className="mt-3">
          The Service is intended for individuals seeking employment in the United Kingdom. While some features
          may be useful for international job seekers, our AI tools and legal reference content are calibrated
          to UK norms, legislation, and employer expectations.
        </p>
        <p className="mt-3">
          We reserve the right to modify, suspend, or discontinue any part of the Service at any time with
          reasonable notice. We will not be liable to you or any third party for any modification, suspension,
          or discontinuation of the Service.
        </p>
      </>
    ),
  },
  {
    id: 'accounts',
    title: '3. User Accounts',
    content: (
      <>
        <p>
          Authentication and account management for MultivoHub is provided by Clerk, Inc. ("Clerk"), a
          third-party identity service. By creating an account, you also agree to Clerk's terms of service
          and privacy policy, available at clerk.com.
        </p>
        <p className="mt-3">
          You are responsible for:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-1.5">
          <li>Maintaining the confidentiality of your login credentials and any connected SSO accounts</li>
          <li>All activity that occurs under your account, whether or not authorised by you</li>
          <li>Ensuring that the information you provide during registration is accurate and up to date</li>
          <li>Notifying us immediately at support@multivohub.com if you suspect unauthorised access to your account</li>
        </ul>
        <p className="mt-3">
          You must be at least 16 years old to create an account on MultivoHub, in accordance with the UK's
          age of digital consent under the Data Protection Act 2018. By creating an account, you confirm
          that you meet this requirement.
        </p>
        <p className="mt-3">
          We reserve the right to suspend or terminate any account that we reasonably believe is being used
          in violation of these Terms, or where the security of the account may be compromised.
        </p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: '4. Acceptable Use',
    content: (
      <>
        <p>
          You agree to use the Service only for lawful purposes and in a manner consistent with these Terms.
          You must not:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-1.5">
          <li>Scrape, crawl, or systematically extract data from the Service using automated tools without our prior written consent</li>
          <li>Use the Service to send unsolicited communications (spam) to employers, recruiters, or other users</li>
          <li>Misrepresent your identity, qualifications, or employment history in any way that is fraudulent or misleading</li>
          <li>Upload or transmit any content that is unlawful, defamatory, harassing, discriminatory, or infringes the intellectual property rights of any third party</li>
          <li>Attempt to gain unauthorised access to any part of the Service or its infrastructure</li>
          <li>Reverse engineer, decompile, or disassemble any software component of the Service</li>
          <li>Use AI-generated output from the Service to impersonate another person or create deceptive content</li>
          <li>Resell, sublicense, or commercialise access to the Service without our express written consent</li>
          <li>Interfere with or disrupt the integrity or performance of the Service or the data contained therein</li>
        </ul>
        <p className="mt-3">
          We reserve the right to investigate and take appropriate legal action against anyone who, in our sole
          discretion, violates this section, including removing content, suspending accounts, and reporting
          violations to relevant authorities.
        </p>
      </>
    ),
  },
  {
    id: 'subscriptions',
    title: '5. Subscription Plans',
    content: (
      <>
        <p>
          MultivoHub offers the following subscription tiers:
        </p>
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white">Free</p>
            <p className="text-sm text-slate-400 mt-1">
              Basic access to job discovery, limited CV management, and a capped number of AI interactions per month.
              No payment required.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white">Pro</p>
            <p className="text-sm text-slate-400 mt-1">
              Unlimited AI tools, full application pipeline, interview practice, style studio, and priority support.
              Billed monthly or annually at the rate displayed at checkout.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white">Autopilot</p>
            <p className="text-sm text-slate-400 mt-1">
              All Pro features plus automated job application submission and advanced AI personalisation.
              Billed monthly or annually at the rate displayed at checkout.
            </p>
          </div>
        </div>
        <p className="mt-4">
          Payments are processed securely by Stripe or PayPal. By subscribing to a paid plan, you authorise
          us to charge the applicable fees to your chosen payment method on a recurring basis. All prices are
          shown in GBP and include VAT where applicable.
        </p>
        <p className="mt-3">
          You may cancel your subscription at any time. Cancellation takes effect at the end of the current
          billing period, and no refunds are issued for unused portions of a billing period unless required by
          applicable law. Where you are entitled to a statutory cooling-off period of 14 days under the Consumer
          Contracts Regulations 2013, we will honour that right.
        </p>
        <p className="mt-3">
          We reserve the right to change subscription pricing with at least 30 days' written notice. Continued
          use of the paid Service after the effective date of any price change constitutes your acceptance of
          the new pricing.
        </p>
      </>
    ),
  },
  {
    id: 'ai-content',
    title: '6. AI-Generated Content',
    content: (
      <>
        <p>
          MultivoHub uses artificial intelligence, including large language models provided by third parties
          such as OpenAI, to generate CVs, cover letters, interview responses, and other content on your behalf
          ("AI-Generated Content").
        </p>
        <p className="mt-3">
          You acknowledge and agree that:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-1.5">
          <li>
            AI-Generated Content is provided for assistance only and does not constitute professional advice
            of any kind, including legal, financial, career, or medical advice
          </li>
          <li>
            You are solely responsible for reviewing, editing, and verifying the accuracy of any AI-Generated
            Content before submitting it to employers, recruiters, or any third party
          </li>
          <li>
            Inaccuracies, hallucinations, or errors may appear in AI-Generated Content; MultivoHub does not
            warrant that such content is accurate, complete, or fit for any particular purpose
          </li>
          <li>
            You must not submit AI-Generated Content that misrepresents your qualifications, experience, or
            identity — doing so may constitute fraud and is a violation of these Terms
          </li>
          <li>
            By submitting input to AI features, you grant us a licence to process that input solely for the
            purpose of providing the Service
          </li>
        </ul>
        <p className="mt-3">
          MultivoHub shall not be liable for any loss or damage arising from your use of or reliance on
          AI-Generated Content, including any consequences arising from submissions made to third parties
          on the basis of such content.
        </p>
      </>
    ),
  },
  {
    id: 'privacy-data',
    title: '7. Privacy & Data',
    content: (
      <>
        <p>
          MultivoHub is committed to protecting your personal data in accordance with the UK General Data
          Protection Regulation (UK GDPR) as retained in UK law by the European Union (Withdrawal) Act 2018,
          and the Data Protection Act 2018 ("DPA 2018").
        </p>
        <p className="mt-3">
          Our full Privacy Policy, which forms part of these Terms, is available at{' '}
          <Link to="/privacy" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
            /privacy
          </Link>
          . Our Cookie Policy is at{' '}
          <Link to="/cookies" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
            /cookies
          </Link>
          . Together they explain what data we collect, how we use it, and your rights as a data subject.
        </p>
        <p className="mt-3">
          Key points include:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-1.5">
          <li>
            <span className="text-white font-medium">Right to Erasure:</span> You may request deletion of
            your account and personal data at any time by emailing privacy@multivohub.com. We will process
            valid erasure requests within 30 days, subject to any legal obligations to retain data.
          </li>
          <li>
            <span className="text-white font-medium">Automatic Inactivity Deletion:</span> Accounts
            inactive for 45 days are soft-deleted (access suspended). After 60 days of inactivity,
            product data is permanently deleted. You will receive email warnings at 20 days and
            40 days of inactivity before any deletion occurs. Active paid subscribers are exempt
            from automatic deletion. Minimum billing records are retained as required by UK accounting law.
          </li>
          <li>
            <span className="text-white font-medium">Data Portability:</span> You may request a copy of
            your personal data in a structured, machine-readable format under UK GDPR Article 20.
          </li>
          <li>
            <span className="text-white font-medium">Marketing Communications:</span> We will only send
            marketing emails with your explicit consent. You may withdraw consent at any time via the
            unsubscribe link in any email or by contacting us.
          </li>
        </ul>
        <p className="mt-3">
          If you have a complaint about how we handle your data, you have the right to lodge a complaint with
          the Information Commissioner's Office (ICO) at ico.org.uk.
        </p>
      </>
    ),
  },
  {
    id: 'ip',
    title: '8. Intellectual Property',
    content: (
      <>
        <p>
          All content, design, code, trademarks, logos, and other materials comprising the MultivoHub platform
          (excluding User Content) are the exclusive property of MultivoHub Ltd or our licensors and are
          protected by UK and international intellectual property laws.
        </p>
        <p className="mt-3">
          We grant you a limited, non-exclusive, non-transferable, revocable licence to access and use the
          Service for your personal, non-commercial job search purposes, subject to these Terms. This licence
          does not permit you to copy, modify, distribute, sell, or lease any part of the Service.
        </p>
        <p className="mt-3">
          "User Content" means any CV data, cover letters, documents, profile information, or other materials
          that you upload or create within the Service. You retain full ownership of your User Content.
          By uploading User Content, you grant MultivoHub a limited, worldwide, royalty-free licence to
          store, process, and display that content solely to provide and improve the Service. This licence
          terminates when you delete the content or close your account.
        </p>
        <p className="mt-3">
          You represent and warrant that you own or have the necessary rights to any User Content you submit,
          and that such content does not infringe the intellectual property rights of any third party.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    title: '9. Limitation of Liability',
    content: (
      <>
        <p>
          To the fullest extent permitted by applicable law:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-1.5">
          <li>
            MultivoHub provides the Service on an "as is" and "as available" basis without any warranty,
            express or implied, including warranties of merchantability, fitness for a particular purpose,
            or non-infringement
          </li>
          <li>
            MultivoHub does not warrant that the Service will be uninterrupted, error-free, or free of
            viruses or other harmful components
          </li>
          <li>
            MultivoHub shall not be liable for any indirect, incidental, special, consequential, or
            punitive damages, including loss of profits, data, goodwill, or business opportunities,
            arising from your use of or inability to use the Service
          </li>
          <li>
            Our total aggregate liability to you for any claims arising under or in connection with these
            Terms shall not exceed the greater of (a) the total fees paid by you to MultivoHub in the
            12 months preceding the claim, or (b) £100
          </li>
        </ul>
        <p className="mt-3">
          Nothing in these Terms shall limit or exclude our liability for: death or personal injury caused
          by our negligence; fraud or fraudulent misrepresentation; or any other liability that cannot be
          excluded or limited under applicable law (including the Consumer Rights Act 2015 for consumers).
        </p>
        <p className="mt-3">
          If you are a consumer (using the Service for personal, non-business purposes), you may have
          additional rights under UK consumer protection law that these Terms do not affect.
        </p>
      </>
    ),
  },
  {
    id: 'job-radar-thirdparty',
    title: '10. Job Radar, reports & third-party data',
    content: (
      <>
        <p>
          Some features aggregate job listings, metadata, or scores from third-party sources and APIs. We do not
          control third-party sites: listings may change or be withdrawn without notice. Job Radar, fit scores,
          and Reports (including PDF or CSV exports) are provided for your personal planning only. They do not
          constitute recruitment, legal, financial, or career advice and do not guarantee interviews or offers.
        </p>
        <p className="mt-3">
          You are responsible for verifying role details, employers, and application requirements before you
          submit applications or rely on automated summaries. If you report an issue with Job Radar content,
          we may use your feedback to investigate in line with our internal processes and applicable law.
        </p>
      </>
    ),
  },
  {
    id: 'billing-credits',
    title: '11. Subscriptions, AI credits & payment methods',
    content: (
      <>
        <p>
          Free and paid plans may include monthly AI usage limits or credits as described on the Billing page.
          Unused credits may not roll over unless we state otherwise. We may adjust plan limits or pricing with
          notice as set out in the Subscription Plans section.
        </p>
        <p className="mt-3">
          Depending on region and configuration, payments may be processed by Stripe, PayPal, and/or cryptocurrency
          checkout (e.g. Coinbase Commerce). Crypto settlements can take time to confirm; access to paid features
          applies once we record successful payment. Where Stripe Customer Portal is enabled, you may manage certain
          subscriptions and view invoices there.
        </p>
        <p className="mt-3">
          Chargebacks and payment disputes may result in suspension of paid features until resolved. We will
          cooperate with good-faith dispute resolution subject to these Terms and payment-provider rules.
        </p>
      </>
    ),
  },
  {
    id: 'cookies-notices',
    title: '12. Cookies & electronic communications',
    content: (
      <>
        <p>
          We use cookies and similar technologies as described in our{' '}
          <Link to="/cookies" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
            Cookie Policy
          </Link>
          . By using the Service, you agree that we may send essential transactional messages (e.g. security,
          billing receipts, account or inactivity notices) to the email address associated with your account.
        </p>
        <p className="mt-3">
          Marketing emails, if any, are sent only with your consent and include an unsubscribe option.
        </p>
      </>
    ),
  },
  {
    id: 'governing-law',
    title: '13. Governing Law',
    content: (
      <>
        <p>
          These Terms and any disputes or claims arising out of or in connection with them (including
          non-contractual disputes or claims) shall be governed by and construed in accordance with the
          laws of England and Wales.
        </p>
        <p className="mt-3">
          You and MultivoHub agree to submit to the exclusive jurisdiction of the courts of England and Wales
          to resolve any dispute or claim arising from these Terms or your use of the Service, except where
          you are a consumer who is resident in Scotland or Northern Ireland, in which case the courts of
          your place of residence will also have jurisdiction.
        </p>
        <p className="mt-3">
          If you are a consumer in the European Union, you may also be entitled to use the EU Online Dispute
          Resolution platform at ec.europa.eu/consumers/odr. However, we are not obligated to use
          alternative dispute resolution unless required by law.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: '14. Contact',
    content: (
      <>
        <p>
          If you have any questions about these Terms, wish to report a violation, or need to get in touch
          with us for any reason, please contact us:
        </p>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4 space-y-2">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Email</p>
            <a
              href="mailto:support@multivohub.com"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              support@multivohub.com
            </a>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Company</p>
            <p className="text-slate-300">MultivoHub Ltd, registered in England & Wales</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Data / Privacy queries</p>
            <a
              href="mailto:privacy@multivohub.com"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              privacy@multivohub.com
            </a>
          </div>
        </div>
        <p className="mt-4">
          We aim to respond to all enquiries within 5 business days.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">MultivoHub</span>
          </Link>
          <Link
            to="/auth"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Title block */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-sm text-amber-300 leading-relaxed">
              Please read these Terms carefully before using MultivoHub. By creating an account or using
              the Service you agree to be bound by them.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-white/10">
                {section.title}
              </h2>
              <div className="text-sm text-slate-300 leading-relaxed">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {/* Also see Privacy */}
        <div className="mt-12 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-4">
          <p className="text-sm text-indigo-300">
            Our{' '}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-white transition-colors">
              Privacy Policy
            </Link>{' '}
            forms part of these Terms and explains how we handle your personal data in accordance with
            UK GDPR and the Data Protection Act 2018.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="mx-auto max-w-3xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">© 2026 MultivoHub Ltd. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link to="/cookies" className="hover:text-slate-300 transition-colors">Cookies</Link>
            <Link to="/faq" className="hover:text-slate-300 transition-colors">FAQ</Link>
            <Link to="/auth" className="hover:text-slate-300 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
