import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '1 April 2026';

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'who-we-are',
    title: '1. Who We Are',
    content: (
      <>
        <p>
          MultivoHub Ltd ("MultivoHub", "we", "us", "our") is a company registered in England and Wales.
          We operate the MultivoHub platform at multivohub.com — a UK-oriented job application service
          providing CV management, AI-assisted job search tools, and employment resources for job seekers.
        </p>
        <p className="mt-3">
          For the purposes of UK data protection law, MultivoHub Ltd is the Data Controller in respect of
          the personal data we process about you. If you have any questions about this Privacy Policy or
          how we handle your data, please contact our Data Protection contact at privacy@multivohub.com.
        </p>
        <p className="mt-3">
          This Privacy Policy applies to all users of the MultivoHub platform and describes how we collect,
          use, store, share, and protect your personal data. It should be read alongside our{' '}
          <Link to="/terms" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
            Terms of Service
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: 'data-we-collect',
    title: '2. Data We Collect',
    content: (
      <>
        <p>We collect personal data in the following categories:</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Account & Identity Data</p>
            <p className="text-sm text-slate-400 mt-1">
              Name, email address, profile photo (if provided via SSO), and authentication credentials
              managed by Clerk. If you sign in via Google, Apple, LinkedIn, or Facebook, we receive the
              profile data your SSO provider shares with us.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">CV & Career Content</p>
            <p className="text-sm text-slate-400 mt-1">
              CV content, work history, education, skills, cover letters, and any other documents or
              text you upload or create within the platform. This may include sensitive professional
              information such as salary expectations.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Job Search Activity</p>
            <p className="text-sm text-slate-400 mt-1">
              Job searches performed within the platform, jobs saved or applied to, application pipeline
              status, and any notes or tags you attach to applications.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Usage Data</p>
            <p className="text-sm text-slate-400 mt-1">
              Pages visited, features used, session duration, device and browser type, and IP address.
              We use this data to improve the Service and diagnose technical issues.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Payment Information</p>
            <p className="text-sm text-slate-400 mt-1">
              Subscription tier and billing status. Payment card details and transaction information are
              processed entirely by Stripe or PayPal — we do not store your card number, CVV, or full
              payment details on our systems.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Communications</p>
            <p className="text-sm text-slate-400 mt-1">
              Any messages you send to our support team, feedback you submit, or correspondence
              relating to your account.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Data',
    content: (
      <>
        <p>We use your personal data for the following purposes:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>
            <span className="text-white font-medium">Service Provision:</span> Creating and managing your
            account, processing subscriptions, delivering platform features, and providing customer support.
          </li>
          <li>
            <span className="text-white font-medium">AI Personalisation:</span> Tailoring AI-generated
            CVs, cover letters, and suggestions to your career history, target roles, and preferences.
            Your data is passed to our AI providers (see Section 7) only as necessary to generate
            personalised output.
          </li>
          <li>
            <span className="text-white font-medium">Product Improvement:</span> Analysing aggregated,
            anonymised usage patterns to identify bugs, improve features, and enhance the user experience.
          </li>
          <li>
            <span className="text-white font-medium">Security:</span> Detecting, preventing, and
            investigating fraud, unauthorised access, or other potentially harmful activity.
          </li>
          <li>
            <span className="text-white font-medium">Notifications:</span> Sending transactional emails
            (account confirmations, billing receipts, security alerts) and, with your consent, product
            updates and tips.
          </li>
          <li>
            <span className="text-white font-medium">Legal Compliance:</span> Meeting our obligations
            under applicable law, including responding to lawful requests from authorities and resolving
            disputes.
          </li>
        </ul>
        <p className="mt-3">
          We do not sell your personal data to third parties for their marketing purposes. We do not use
          your data to serve you third-party advertising.
        </p>
      </>
    ),
  },
  {
    id: 'legal-basis',
    title: '4. Legal Basis for Processing',
    content: (
      <>
        <p>
          Under UK GDPR Article 6, we rely on the following legal bases for processing your personal data:
        </p>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Contract (Article 6(1)(b))</p>
            <p className="text-sm text-slate-400 mt-1">
              Processing is necessary to perform the contract we have with you (the Terms of Service).
              This covers account creation, subscription management, and delivery of the core platform
              features you have signed up to use.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Legitimate Interests (Article 6(1)(f))</p>
            <p className="text-sm text-slate-400 mt-1">
              We process certain data on the basis of our legitimate interests — including fraud
              prevention, platform security, product analytics, and improving the Service — where those
              interests are not overridden by your rights and interests. You may object to this processing
              at any time (see Section 6).
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Consent (Article 6(1)(a))</p>
            <p className="text-sm text-slate-400 mt-1">
              Where we send marketing emails or place non-essential cookies, we rely on your freely given,
              specific, and informed consent. You may withdraw consent at any time without detriment by
              using the unsubscribe link in any email or by contacting us.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Legal Obligation (Article 6(1)(c))</p>
            <p className="text-sm text-slate-400 mt-1">
              We process data where necessary to comply with a legal obligation, such as retaining
              financial records for HMRC purposes or responding to lawful requests from law enforcement.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'retention',
    title: '5. Data Retention',
    content: (
      <>
        <p>
          We retain your personal data for as long as necessary to provide the Service and fulfil the
          purposes set out in this policy, or as required by law. Our standard retention periods are:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>
            <span className="text-white font-medium">Account data:</span> Retained for the duration of
            your account, plus 3 years after account deletion to satisfy legal, tax, and accounting
            obligations.
          </li>
          <li>
            <span className="text-white font-medium">CV and career content:</span> Deleted promptly
            upon a valid erasure request (see Section 6). You may also delete individual documents
            at any time from within the platform.
          </li>
          <li>
            <span className="text-white font-medium">Payment records:</span> Retained for 7 years
            in line with HMRC requirements for financial records.
          </li>
          <li>
            <span className="text-white font-medium">Usage and analytics data:</span> Retained in
            anonymised or aggregated form indefinitely for product improvement purposes.
          </li>
          <li>
            <span className="text-white font-medium">Support communications:</span> Retained for
            3 years after the relevant issue is resolved.
          </li>
        </ul>
        <p className="mt-3">
          When data is no longer required, we securely delete or anonymise it in accordance with our
          internal data disposal procedures.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: '6. Your Rights',
    content: (
      <>
        <p>
          Under UK GDPR and the Data Protection Act 2018, you have the following rights in relation to
          your personal data:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>
            <span className="text-white font-medium">Right of Access (Article 15):</span> You may request
            a copy of the personal data we hold about you (a Subject Access Request).
          </li>
          <li>
            <span className="text-white font-medium">Right to Rectification (Article 16):</span> You may
            ask us to correct inaccurate or incomplete personal data.
          </li>
          <li>
            <span className="text-white font-medium">Right to Erasure (Article 17):</span> You may request
            deletion of your personal data where it is no longer necessary for the purpose it was collected,
            or where you withdraw consent and no other lawful basis applies.
          </li>
          <li>
            <span className="text-white font-medium">Right to Data Portability (Article 20):</span> You
            may request your data in a structured, commonly used, machine-readable format.
          </li>
          <li>
            <span className="text-white font-medium">Right to Restriction (Article 18):</span> You may
            ask us to restrict processing of your data in certain circumstances, such as while a dispute
            about accuracy is being resolved.
          </li>
          <li>
            <span className="text-white font-medium">Right to Object (Article 21):</span> You may object
            at any time to processing based on our legitimate interests, including for direct marketing.
          </li>
          <li>
            <span className="text-white font-medium">Rights related to automated decision-making:</span>{' '}
            We do not make solely automated decisions with legal or similarly significant effects about you.
          </li>
        </ul>
        <p className="mt-4">
          To exercise any of these rights, please email{' '}
          <a href="mailto:privacy@multivohub.com" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
            privacy@multivohub.com
          </a>
          . We will respond within one calendar month. We may ask you to verify your identity before
          acting on a request.
        </p>
        <p className="mt-3">
          If you are not satisfied with our response, you have the right to lodge a complaint with the
          Information Commissioner's Office (ICO) at ico.org.uk or by calling 0303 123 1113.
        </p>
      </>
    ),
  },
  {
    id: 'third-parties',
    title: '7. Third Parties',
    content: (
      <>
        <p>
          We share your personal data with the following categories of third parties, strictly as necessary
          to provide the Service:
        </p>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Clerk — Authentication</p>
            <p className="text-sm text-slate-400 mt-1">
              Your account credentials, email address, and SSO tokens are managed by Clerk, Inc. Clerk
              acts as a data processor on our behalf. See clerk.com/privacy for their privacy practices.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Stripe / PayPal — Payments</p>
            <p className="text-sm text-slate-400 mt-1">
              Payment processing is handled by Stripe, Inc. and/or PayPal Holdings, Inc. These providers
              receive the billing information necessary to process your subscription. We do not store
              payment card details. See stripe.com/privacy and paypal.com/privacy for their policies.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">OpenAI — AI Features</p>
            <p className="text-sm text-slate-400 mt-1">
              To power AI-generated CVs, cover letters, and other content, we transmit relevant
              portions of your career data to OpenAI, L.L.C. Data sent to OpenAI is used only to
              generate responses for you and is subject to OpenAI's API data usage policies (openai.com/policies).
              OpenAI does not use API data to train models by default.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Infrastructure Providers</p>
            <p className="text-sm text-slate-400 mt-1">
              Our platform is hosted on cloud infrastructure providers who process data on our behalf
              under strict data processing agreements.
            </p>
          </div>
        </div>
        <p className="mt-4">
          We do not sell your personal data to any third party. We do not share your data with
          advertisers, data brokers, or marketing platforms.
        </p>
        <p className="mt-3">
          All third-party data processors are contractually bound to process your data only on our
          instructions and to implement appropriate security measures. Where processors are located
          outside the UK, we ensure appropriate safeguards are in place (such as UK Adequacy Decisions
          or Standard Contractual Clauses).
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: '8. Cookies',
    content: (
      <>
        <p>
          MultivoHub uses cookies and similar technologies to operate the Service. We categorise cookies
          as follows:
        </p>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="font-semibold text-emerald-400 text-sm">Essential Cookies (always active)</p>
            <p className="text-sm text-slate-400 mt-1">
              These cookies are strictly necessary to provide the Service. They include session tokens
              managed by Clerk for authentication, CSRF protection tokens, and cookies required for
              Stripe's payment flow. These cannot be disabled without breaking core functionality.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Analytics Cookies (consent required)</p>
            <p className="text-sm text-slate-400 mt-1">
              We do not place analytics or tracking cookies without your explicit consent. If you
              consent, we may use privacy-focused analytics tools to understand aggregate usage patterns.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="font-semibold text-white text-sm">Marketing Cookies</p>
            <p className="text-sm text-slate-400 mt-1">
              We do not use marketing or advertising cookies. We do not participate in cross-site
              tracking or retargeting programmes.
            </p>
          </div>
        </div>
        <p className="mt-4">
          You can manage cookie preferences through your browser settings. Deleting cookies may affect
          your ability to use parts of the Service that rely on session management.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: '9. Security',
    content: (
      <>
        <p>
          We take the security of your personal data seriously and implement appropriate technical and
          organisational measures to protect it against unauthorised access, loss, or disclosure:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>
            <span className="text-white font-medium">Encryption at rest:</span> All data stored on our
            servers is encrypted using industry-standard encryption algorithms.
          </li>
          <li>
            <span className="text-white font-medium">Encryption in transit:</span> All data transmitted
            between your browser and our servers is protected using TLS (Transport Layer Security).
          </li>
          <li>
            <span className="text-white font-medium">Access controls:</span> Access to personal data
            is restricted to authorised personnel on a need-to-know basis, and is subject to audit logging.
          </li>
          <li>
            <span className="text-white font-medium">Authentication security:</span> Multi-factor
            authentication and passkey support are available to all users through Clerk.
          </li>
          <li>
            <span className="text-white font-medium">Payment security:</span> We do not store payment
            card data. All payment processing is handled by PCI DSS-compliant providers.
          </li>
        </ul>
        <p className="mt-3">
          No method of transmission over the internet or electronic storage is completely secure. While
          we strive to use commercially acceptable means to protect your personal data, we cannot
          guarantee its absolute security.
        </p>
        <p className="mt-3">
          In the event of a personal data breach that poses a risk to your rights and freedoms, we will
          notify the ICO within 72 hours and inform affected users without undue delay, as required by
          UK GDPR Article 33 and 34.
        </p>
      </>
    ),
  },
  {
    id: 'contact-dpo',
    title: '10. Contact & DPO',
    content: (
      <>
        <p>
          If you have any questions, concerns, or requests relating to this Privacy Policy or our data
          processing practices, please contact us:
        </p>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4 space-y-3">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Privacy & Data Enquiries</p>
            <a
              href="mailto:privacy@multivohub.com"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              privacy@multivohub.com
            </a>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Data Protection Officer</p>
            <a
              href="mailto:privacy@multivohub.com"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              privacy@multivohub.com
            </a>
            <p className="text-sm text-slate-500 mt-0.5">MultivoHub Ltd, registered in England & Wales</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Supervisory Authority</p>
            <p className="text-slate-300 text-sm">
              Information Commissioner's Office (ICO){' '}
              <span className="text-slate-500">— ico.org.uk — 0303 123 1113</span>
            </p>
          </div>
        </div>
        <p className="mt-4">
          We aim to respond to all data protection enquiries within one calendar month. Where a request
          is complex or we receive a high volume, we may extend this period by up to two further months,
          in which case we will notify you.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
          <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
            <p className="text-sm text-blue-300 leading-relaxed">
              This policy explains how MultivoHub Ltd collects, uses, and protects your personal data in
              accordance with UK GDPR and the Data Protection Act 2018.
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

        {/* Also see Terms */}
        <div className="mt-12 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-4">
          <p className="text-sm text-indigo-300">
            This Privacy Policy forms part of our{' '}
            <Link to="/terms" className="underline underline-offset-2 hover:text-white transition-colors">
              Terms of Service
            </Link>
            . By using MultivoHub you agree to both documents.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="mx-auto max-w-3xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">© 2026 MultivoHub Ltd. Registered in England & Wales.</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link to="/auth" className="hover:text-slate-300 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
