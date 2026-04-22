import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import { APP_SCREENS } from '@/config/appScreens';
import {
  Scale,
  ChevronDown,
  Shield,
  Briefcase,
  Users,
  ClipboardCheck,
  ExternalLink,
  Building2,
  AlertTriangle,
  Landmark,
  Search,
  Sparkles,
  X,
  FileDown,
} from 'lucide-react';

interface AccordionItem {
  question: string;
  answer: string;
}

interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  summary: string;
  items: AccordionItem[];
}

const SECTIONS: Section[] = [
  {
    id: 'gdpr',
    title: 'Privacy & GDPR',
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    summary: 'Your data rights during the job search process and what recruiters can legitimately collect.',
    items: [
      {
        question: 'Right to Erasure ("Right to be Forgotten")',
        answer: `Under UK GDPR Article 17, you have the right to request that a recruiter or employer deletes your personal data. This applies when: the data is no longer necessary for the purpose it was collected; you withdraw consent (where consent was the legal basis); you object to processing and there are no overriding legitimate grounds; the data has been unlawfully processed.

Recruiters must respond within one month. They may refuse if they need to retain your data to comply with a legal obligation or to establish, exercise, or defend legal claims — for example, keeping records for tax purposes. To exercise this right, send a written request to the recruiter's data controller.`,
      },
      {
        question: 'Data Portability (Article 20)',
        answer: `You have the right to receive your personal data in a structured, commonly used, machine-readable format (such as CSV or JSON) and to transmit it to another controller. This applies when processing is based on your consent or on a contract.

In practice, you can request your CV, application history, assessment results, and any other data held in a recruiter's ATS (Applicant Tracking System). They must provide this free of charge within one month.`,
      },
      {
        question: 'What Recruiters Can Legally Ask For',
        answer: `Recruiters and employers may collect: name and contact details, CV and work history, right to work documentation, information relevant to the role (qualifications, skills), references with your consent.

They may NOT collect without a lawful basis: racial or ethnic origin, political opinions, religious beliefs, trade union membership, genetic or biometric data, health or medical data, sexual orientation (except where strictly necessary, e.g., occupational requirement). Collecting protected characteristic data for "equal opportunities monitoring" is permitted only if it is genuinely anonymised before decision-makers see it.`,
      },
      {
        question: 'Lawful Basis for Processing',
        answer: `Recruiters must have a lawful basis under UK GDPR Article 6. In recruitment, this is typically: Legitimate Interests (the most common — processing is necessary for the recruiter's business), or Consent (less common, as it must be freely given and withdrawable without detriment).

Consent is problematic in recruitment because there is an inherent power imbalance. The ICO guidance suggests legitimate interests is usually more appropriate. You should receive a privacy notice explaining what data is held, why, how long it is kept, and your rights.`,
      },
      {
        question: 'Data Retention in Recruitment',
        answer: `There is no fixed statutory retention period for recruitment data, but the ICO recommends: unsuccessful candidate data should not be kept longer than 6–12 months after the recruitment process ends, unless you consent to be kept on file for future roles. Successful candidate data becomes part of the employment record and is governed by employment law.

If a recruiter wants to retain your details for a talent pool, they must get your explicit consent and tell you how long they will keep it.`,
      },
      {
        question: 'Making a Subject Access Request (SAR)',
        answer: `Under UK GDPR Article 15, you can ask any organisation what personal data they hold about you. This is called a Subject Access Request (SAR). You must respond within one month (extendable to 3 months for complex requests). The organisation must provide: confirmation that your data is processed, a copy of the data, information on purpose, categories, recipients, retention period, and your rights.

SARs are free of charge. If you believe a recruiter or employer has mishandled your data, you can complain to the ICO (Information Commissioner's Office) at ico.org.uk.`,
      },
    ],
  },
  {
    id: 'employment',
    title: 'Employment Rights',
    icon: Briefcase,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    summary: 'Key employment rights for workers in the UK, including minimum wage, notice periods, and IR35.',
    items: [
      {
        question: 'National Minimum Wage & NLW (check GOV.UK)',
        answer: `NLW and NMW cash rates for each age band and apprentice category are updated on a fixed timetable (usually each April) and are published only in official sources. Do not rely on any figure copied into a third-party app — it may be out of date before we update this hub.

Use the live tables at https://www.gov.uk/national-minimum-wage-rates for every rate that applies to you. Underpayment is unlawful; workers can claim arrears subject to time limits. HMRC can impose civil penalties and "naming" in serious underpayment cases — see GOV.UK for current enforcement policy.`,
      },
      {
        question: 'Notice Periods',
        answer: `Statutory minimum notice periods under the Employment Rights Act 1996: 1 week after 1 month of continuous employment; 2 weeks after 2 years; 1 additional week per year of employment up to a maximum of 12 weeks (for 12+ years service).

Your contract may specify a longer notice period — the longer of statutory or contractual applies. You are also entitled to give your employer notice: statutory minimum is 1 week once you have worked for more than 1 month. Garden leave and payment in lieu of notice (PILON) are both lawful if the contract permits them or both parties agree.`,
      },
      {
        question: 'IR35 — Off-Payroll Working Rules',
        answer: `IR35 (the off-payroll working rules) determines whether a contractor is genuinely self-employed or effectively an employee ("deemed employee"). If caught inside IR35, the contractor pays employee Income Tax and NI as if employed, even though they operate through a limited company.

Key tests: Substitution — can you send a substitute? Mutuality of obligation — are you obliged to accept work? Control — does the client control how (not just what) you deliver? Since April 2021, medium and large private sector clients are generally responsible for determining IR35 status and issuing a Status Determination Statement (SDS). "Small" clients may be exempt so the contractor determines status — the headcount, turnover, and balance-sheet tests are defined in tax law and the numeric thresholds change; always confirm the current HMRC "Check employment status for tax" guidance rather than any example figures here.`,
      },
      {
        question: 'Zero-Hours Contract Rights',
        answer: `Workers on zero-hours contracts have the same basic employment rights as other workers, regardless of guaranteed hours: National Minimum Wage for all hours worked; paid annual leave (5.6 weeks pro-rated, calculated on average weekly earnings over last 52 weeks worked); rest breaks and working time protections; protection from unlawful discrimination; the right to be accompanied at disciplinary/grievance hearings.

Zero-hours workers do NOT have unfair dismissal protection until 2 years of continuous employment. From April 2024, under the Employment Relations (Flexible Working) Act 2023, workers can request a predictable working pattern after 26 weeks of service. Exclusivity clauses in zero-hours contracts (preventing workers from working for others) are unenforceable.`,
      },
      {
        question: 'Worker vs Employee vs Self-Employed',
        answer: `UK law has three main categories: Employees have the fullest rights — unfair dismissal (after 2 years), redundancy pay, maternity/paternity leave, auto-enrolment pension. Workers have intermediate rights — NMW, paid holiday, rest breaks, whistleblowing protection, but not unfair dismissal or redundancy pay. Self-employed (genuine) have only contractual rights and health & safety protections.

The label on your contract is NOT conclusive — courts look at the reality of the working relationship (mutuality of obligation, personal service, control). The Supreme Court ruled in Uber v Aslam [2021] that Uber drivers were workers, not self-employed, despite Uber's contracts saying otherwise.`,
      },
      {
        question: 'Statutory Sick Pay (SSP) and Holiday Pay',
        answer: `SSP: usually paid by the employer from the fourth qualifying day of illness, for up to 28 weeks, if you meet average earnings tests. The weekly SSP amount and the Lower Earnings Limit change — check GOV.UK "Statutory Sick Pay (SSP)" for the current rate and eligibility.

Statutory annual leave: 5.6 weeks per year (28 days for a full-time five-day week), including bank holidays. Holiday pay must be calculated on "normal remuneration" where applicable — including regular overtime, commission, and certain allowances, not just basic salary (Lock v British Gas [2016] and later cases).`,
      },
    ],
  },
  {
    id: 'acas',
    title: 'ACAS',
    icon: Landmark,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    summary:
      'The Advisory, Conciliation and Arbitration Service — free workplace guidance, early conciliation before tribunal claims, and statutory Codes of Practice.',
    items: [
      {
        question: 'What is ACAS?',
        answer: `ACAS (Advisory, Conciliation and Arbitration Service) is an independent public body funded by the Department for Business and Trade. It provides impartial information and advice on employment rights and good practice to employers, workers, and representatives across England, Scotland, and Wales.

ACAS is not a court and does not decide legal claims, but it helps people understand the law and resolve disputes without going to an Employment Tribunal where possible.`,
      },
      {
        question: 'What is ACAS for?',
        answer: `Common reasons job seekers and employees use ACAS include: understanding rights at work (notice, dismissal, discrimination, pay, flexible working); preparing for a disciplinary or grievance process; getting help before resigning or after a dispute; and Early Conciliation — a free process you must usually complete before lodging most Employment Tribunal claims.

The ACAS helpline offers confidential, tailored guidance. ACAS also publishes practical guidance pages and statutory Codes of Practice that tribunals can take into account when deciding cases.`,
      },
      {
        question: 'Official ACAS links',
        answer: `Home and all guidance: https://www.acas.org.uk/

Early conciliation (before most tribunal claims): https://www.acas.org.uk/early-conciliation

Contact ACAS (phone, web form, opening hours — check the site for updates): https://www.acas.org.uk/contact-us

Helpline (as widely publicised; confirm current number on the ACAS site): 0300 123 1100`,
      },
      {
        question: 'ACAS Codes of Practice — what they are',
        answer: `ACAS publishes Codes of Practice on topics such as disciplinary and grievance procedures, and other employment practices. Some codes are issued under powers in the Employment Rights Act 1996 and other legislation. Where a code is designated as a statutory code, Employment Tribunals can adjust compensation by up to 25% if an employer or employee has unreasonably failed to follow it (depending on the rules that apply to the claim).

The best-known example for day-to-day work is the ACAS Code of Practice on disciplinary and grievance procedures, which sets expectations for fair handling of misconduct issues and grievances. Always read the current version on ACAS — wording and guidance are updated from time to time.

Direct link (verify it still matches ACAS navigation): https://www.acas.org.uk/acas-code-of-practice-on-disciplinary-and-grievance-procedures`,
      },
    ],
  },
  {
    id: 'recruitment',
    title: 'Recruitment Regulations',
    icon: Users,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    summary: 'What employment agencies must disclose, and your rights as a job seeker when dealing with recruiters.',
    items: [
      {
        question: 'Employment Agencies Act 1973 & Conduct Regulations 2003',
        answer: `Employment agencies (permanent placement) and employment businesses (supplying temporary workers) are regulated by the Conduct of Employment Agencies and Employment Businesses Regulations 2003.

Key requirements: Agencies cannot charge fees to work-seekers for finding them work (they can charge for optional services like CV writing, with your informed consent). They must provide you with written terms before introducing you to a hirer. They must obtain confirmation that a vacancy genuinely exists before submitting your details. They cannot supply your CV to a client without your explicit consent.`,
      },
      {
        question: 'What Recruiters Must Disclose',
        answer: `Before taking you on as a candidate, a compliant agency must disclose: the type of work; pay rate and any terms; any known detrimental terms about the position; whether the role is actually with the agency (employment business model) or directly with the client. They must also tell you: the name of the hiring client (before submitting your CV, unless you consent to a blind submission); whether the position is permanent, fixed-term, or contract; any restrictions that may affect you (e.g., you must not be on a similar contract with the same company within 14 weeks).`,
      },
      {
        question: 'Background Check Rules',
        answer: `Employers may carry out: Identity verification (required for right to work checks); DBS checks (Disclosure and Barring Service) — Standard or Enhanced checks require your written consent and are only lawful for roles where they are legally permitted (e.g., working with children, healthcare, legal positions, financial services under FCA); Credit checks — lawful for financial roles (FCA-regulated firms, handling cash); reference checks with your consent.

Employers CANNOT: ask about spent criminal convictions for roles not covered by exceptions (Rehabilitation of Offenders Act 1974); conduct social media surveillance that breaches your reasonable expectation of privacy; require medical examinations before a job offer (Equality Act 2010 s.60) — they can ask about health only after a conditional offer is made.`,
      },
      {
        question: 'The 14-Week Opt-Out Rule',
        answer: `Under Regulation 10 of the Conduct Regulations 2003, an agency cannot restrict your right to work directly for a hirer within 14 weeks of your last assignment through that agency without charging a fee.

Specifically: if a hirer wants to take you on directly after a temporary placement, the agency may charge the hirer a transfer fee. Alternatively, the hirer can extend your temporary assignment for at least 14 weeks before bringing you on directly without fee. This rule protects workers — the agency cannot contractually stop you from accepting a direct offer.`,
      },
      {
        question: 'Agency Worker Regulations 2010',
        answer: `Agency workers qualify for equal treatment with comparable permanent employees after 12 weeks in the same role with the same hirer. Equal treatment covers: basic pay; working time, rest periods, and night work; duration of working time; paid annual leave; paid time off for ante-natal appointments; access to collective facilities (canteen, car parking, childcare) and information about permanent vacancies from day one.

Equal treatment does NOT require equal bonuses, sick pay, occupational pension, or redundancy pay (these come from the employment business, not the hirer). The Swedish Derogation (previously allowing agencies to pay retainer instead of equal pay) was abolished in April 2020.`,
      },
    ],
  },
  {
    id: 'checklist',
    title: 'Application Checklist',
    icon: ClipboardCheck,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    summary: 'Legal and practical checklist for job applications — what employers can ask, and what is unlawful.',
    items: [
      {
        question: 'Right to Work Verification',
        answer: `Since 2016 (Immigration Act), employers have a legal duty to check that all employees have the right to work in the UK before employment starts. Failure to carry out proper checks means the employer has no "statutory excuse" if they are found to employ someone illegally — civil penalties apply and maximum amounts are set in law and updated over time. Search GOV.UK for the employer right-to-work civil penalty scheme for the figures that apply when you read this.

Documents: British/Irish passport or birth certificate + NI number; EU Settlement Scheme share code for EU/EEA nationals; Biometric Residence Permit or visa for other nationals. Certified digital identity service providers (IDSPs) may be used for certain checks where permitted — follow the current GOV.UK employer guide. You must provide right-to-work evidence before your start date unless your employer agrees a lawful timetable.`,
      },
      {
        question: 'What Employers Cannot Legally Ask in Interviews',
        answer: `The Equality Act 2010 prohibits asking questions that reveal protected characteristics if those questions are used to discriminate in hiring. Employers should not ask: Are you pregnant or planning to have children? What is your religion? Are you disabled? (health questions are restricted before a job offer under s.60) What is your sexual orientation? How old are you? (they can verify you are of legal working age) Are you married/in a civil partnership?

If an employer asks such questions, it does not automatically make a rejection unlawful — but if you are rejected, it is strong evidence that the protected characteristic was a factor. You can bring a claim to the Employment Tribunal within 3 months of the act complained of.`,
      },
      {
        question: 'References — Your Rights',
        answer: `There is no legal requirement to provide references, and no right to a reference in most cases (except financial services — FCA-regulated firms must provide references). However: a reference must be true, accurate, and fair — a negligent or malicious reference can be challenged in court. If a reference is provided, the data in it is subject to UK GDPR — you have a right to request a copy of any reference held about you via a Subject Access Request.

An employer who gives a deliberately misleading reference (by omission or distortion) could be liable in negligence (Spring v Guardian Assurance [1994] HL). Most employers give only "dates of employment and job title" references to avoid liability.`,
      },
      {
        question: 'Salary History and Pay Transparency',
        answer: `There is currently no UK law prohibiting employers from asking about your salary history (unlike several US states and the EU Pay Transparency Directive which applies only to EU employers). However, the Equality Act 2010 s.77 makes it unlawful to enforce pay secrecy clauses that prevent workers from discussing pay to establish whether there is pay discrimination.

From a practical standpoint: you are not obliged to disclose your current salary. It is lawful to decline by saying "I'd prefer to discuss my expectations based on the role." The EU Pay Transparency Directive introduces pay-transparency rules for EU employers on a phased timetable — UK employers are not automatically bound by it for domestic roles, but some multinationals align policies voluntarily; check the role's jurisdiction.`,
      },
      {
        question: 'Offer Letters and Contract Timing',
        answer: `Since April 2020, all employees and workers (including zero-hours workers) must receive a written statement of particulars (Section 1 Statement) on or before their first day of employment. This must include: employer and employee names; start date and continuous employment date; pay rate and intervals; working hours; holiday entitlement; job title; place of work; notice periods; probation period length and conditions.

A verbal offer is contractually binding in law, but always get the written offer letter before handing in your notice. A conditional offer (subject to references, DBS check, right to work) is only binding once conditions are met. If an employer withdraws an unconditional offer, you may have a claim for damages for breach of contract.`,
      },
    ],
  },
  {
    id: 'links',
    title: 'Useful Resources',
    icon: ExternalLink,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    summary: 'Key GOV.UK and official resources for employment law and job seeker rights.',
    items: [
      {
        question: 'GOV.UK Employment Rights Resources',
        answer: `Employment status checker: GOV.UK > Employment status
Check employment status for tax: GOV.UK > CEST tool (Check Employment Status for Tax)
National Minimum Wage rates: GOV.UK > National Minimum Wage and National Living Wage
Statutory notice periods: GOV.UK > Notice periods
Holiday entitlement calculator: GOV.UK > Calculate holiday entitlement
Statutory Sick Pay: GOV.UK > Statutory Sick Pay (SSP)`,
      },
      {
        question: 'HMRC and Tax Resources',
        answer: `IR35 guidance: GOV.UK > Understanding off-payroll working (IR35)
HMRC CEST tool: GOV.UK > Check Employment Status for Tax
P60 and P45 guidance: GOV.UK > P45, P60 and P11D forms
Income Tax rates and bands: GOV.UK > Income Tax rates and allowances
National Insurance rates: GOV.UK > National Insurance rates and categories`,
      },
      {
        question: 'Employment Tribunal and Dispute Resolution',
        answer: `Make a claim to an Employment Tribunal: GOV.UK > Make a claim to an Employment Tribunal
Early conciliation via ACAS (mandatory before ET claim): acas.org.uk > Early conciliation
ACAS helpline: 0300 123 1100 (Monday–Friday 8am–6pm)
Citizens Advice Bureau: citizensadvice.org.uk > Work
ICO data rights: ico.org.uk > Make a complaint`,
      },
      {
        question: 'Recruitment Agency Regulation',
        answer: `Employment Agency Standards (EAS) Inspectorate: GOV.UK > Employment Agency Standards
Conduct of Employment Agencies and Employment Businesses Regulations 2003: legislation.gov.uk
Agency Worker Regulations 2010: legislation.gov.uk
Complain about an employment agency: GOV.UK > Complain about a recruitment agency`,
      },
      {
        question: 'DBS Checks and Background Screening',
        answer: `DBS check types and eligibility: GOV.UK > DBS checks
Check the DBS update service: GOV.UK > DBS Update Service
Rehabilitation of Offenders Act 1974 (spent convictions): legislation.gov.uk
Right to work check guidance for employers: GOV.UK > Employers' guide to right to work checks`,
      },
    ],
  },
  {
    id: 'jobcentre',
    title: 'Job Centre & Benefits Support',
    icon: Building2,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    summary: 'How to register at the Job Centre, claim Universal Credit, and access emergency support.',
    items: [
      {
        question: 'How to Register at the Job Centre Plus',
        answer: `Visit gov.uk/jobseekers-allowance or go in person to your nearest Job Centre Plus to register. You will need to bring: your National Insurance (NI) number, valid photo ID (passport or driving licence), bank details, and proof of address (utility bill or bank statement within 3 months).

Depending on your NI contribution record, you may be eligible for New Style JSA (contribution-based, paid for up to 6 months) or Universal Credit (means-tested). Appointment timing varies by office and demand — confirm when you apply. At your first appointment you will sign a Claimant Commitment — an agreed plan of what you will do to find work.

Contact and find your local Job Centre: gov.uk/contact-jobcentre-plus`,
      },
      {
        question: 'Universal Credit — What It Covers',
        answer: `Universal Credit (UC) is a monthly payment that can help with living costs, and may include amounts for: housing costs (rent), children and childcare costs, disabilities or health conditions, and caring responsibilities.

First payment dates, waiting periods, Advance Payments, and repayment schedules are operational rules that change. Do not rely on any example timetable here — read GOV.UK Universal Credit (including "Your first payment") for the process that applies when you claim.

UC is managed online through your journal at gov.uk/universal-credit where you report changes and communicate with your work coach.`,
      },
      {
        question: 'Emergency Support While Waiting',
        answer: `If you are in financial hardship while waiting for benefits, several options are available:

Budgeting Advance: A loan from UC for emergency household costs (e.g., replacing a broken appliance). Repayable from future UC payments.

Food banks: The Trussell Trust operates a nationwide network of food banks — find your nearest at trusselltrust.org. A referral is usually required from a professional (GP, social worker, Job Centre).

Local Welfare Assistance: Most councils operate a Local Welfare Assistance or Local Crisis Support scheme for residents in emergency need. Contact your council directly.

Citizens Advice: Free, confidential advice on benefits, debt, and housing — 0800 144 8848 (Freephone) or citizensadvice.org.uk.

Shelter helpline: Emergency housing advice — 0808 800 4444 (Freephone).`,
      },
      {
        question: 'Self-employment support on benefits',
        answer: `If you receive Universal Credit and want to start or grow a business, the exact grant, allowance, loan, or mentoring programme available to you depends on current DWP policy in your area — schemes and cash caps change and older programmes (such as the historic New Enterprise Allowance) may be closed to new entrants.

Always ask your work coach what is open now, and search GOV.UK for "Universal Credit" plus self-employment or start-up support. Do not rely on any past weekly cash totals reproduced in third-party guides.`,
      },
    ],
  },
  {
    id: 'emergency_leaving',
    title: 'Emergency Leaving & Constructive Dismissal',
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    summary: 'What to do if you must leave a job urgently — your rights, protections, and legal remedies.',
    items: [
      {
        question: 'What Is Constructive Dismissal?',
        answer: `Constructive dismissal occurs when your employer's conduct is so unreasonable — such as being unsafe, abusive, illegal, or constituting a fundamental breach of your employment contract — that you have no reasonable choice but to resign. Despite resigning, the law treats this as if you were dismissed, giving you the right to bring an Employment Tribunal (ET) claim.

Key requirements: You must resign promptly after the breach (delay can be treated as acceptance of the new terms). You should exhaust internal grievance procedures first where possible. Claims must be brought to the Employment Tribunal within 3 months less one day of the last act complained of. Early conciliation via ACAS is a mandatory first step before an ET claim.`,
      },
      {
        question: 'Emergency Situations: When You Can Leave Immediately',
        answer: `Certain circumstances justify immediate departure without following normal notice or grievance procedures:

Threat to health and safety (Section 44, Employment Rights Act 1996): Employees have the right to leave or refuse to return to a workplace they reasonably believe poses a serious and imminent risk to their health or safety, without suffering detriment.

Whistleblowing retaliation: If you face detriment for making a protected disclosure, you may leave and claim both unfair dismissal and whistleblower detriment.

Sexual harassment or assault: Immediate departure is justified. Report to police if a criminal offence has occurred. Contact your employer's HR in writing. The Worker Protection (Amendment of Equality Act 2010) Act 2023 places a positive duty on employers to prevent sexual harassment.

Bullying or unlawful discrimination: Document all incidents carefully (dates, witnesses, any written evidence). Raise a formal grievance in writing before leaving if at all possible. Contact ACAS: 0300 123 1100.`,
      },
      {
        question: 'Who It Applies To',
        answer: `Constructive dismissal claims via the Employment Tribunal require 2 or more years of continuous employment with the same employer. Workers and contractors have different protections and generally cannot bring unfair dismissal claims.

Day one rights (no qualifying period required): Protection from unlawful discrimination under the Equality Act 2010; whistleblowing protection (protected disclosures); health and safety protections under Section 44 ERA 1996; protection from being subjected to detriment for asserting a statutory right.

If you have under 2 years' service, you may still have claims for discrimination, whistleblowing, or automatic unfair dismissal (where no qualifying period applies) — take advice from ACAS or an employment solicitor.`,
      },
      {
        question: 'Steps to Take Before Leaving',
        answer: `If at all possible, take the following steps before resigning:

1. Document all incidents with dates, times, names of witnesses, and copies of any written communications (emails, messages). Keep copies in a personal location outside work systems.

2. Raise a formal grievance in writing to your employer, citing specific incidents and the contractual or legal rights you believe have been breached. Keep a copy of everything submitted and all responses.

3. Contact ACAS (0300 123 1100) for free, impartial advice. Before making an Employment Tribunal claim, you must notify ACAS for Early Conciliation — ACAS will attempt to facilitate a settlement before the formal tribunal process.

4. Seek legal advice. Many employment solicitors offer a free initial consultation. Law centres and Citizens Advice can also help.

5. If you decide to leave, send your resignation letter in writing, explicitly stating that you are resigning due to your employer's conduct which amounts to constructive dismissal. Cite specific breaches. Keep a copy.`,
      },
      {
        question: 'Financial Support After Emergency Leaving',
        answer: `Leaving a job in an emergency can create immediate financial hardship. The following support may be available:

Universal Credit: When completing your Claimant Commitment, explain the circumstances — your work coach has discretion to take emergency situations into account. Advance Payments are available from day one.

Rapid Reclaim: If you have claimed UC or JSA within the last 12 months, a faster reclaim process (Rapid Reclaim) may be available — your previous details are pre-filled, reducing processing time.

Local welfare emergency fund: Contact your local council for emergency assistance with food, fuel, and essential household items.

Mortgage or rent payment deferral: Contact your lender or landlord as soon as possible. Regulated mortgage lenders must treat customers fairly when you ask for help with payment difficulty — see the FCA's current consumer guidance. Many housing associations have hardship funds.`,
      },
    ],
  },
];

/** Turn bare https:// URLs in a string into clickable links (GOV.UK, ACAS, etc.). */
function linkifyText(text: string): ReactNode {
  const parts = text.split(/(https:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    part.startsWith('https://') ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-400 hover:underline break-all"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

// ── Accordion Item ────────────────────────────────────────────────────────────

function AccordionCard({ item }: { item: AccordionItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? 'border-white/20' : 'border-white/10'} bg-white/5`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="font-medium text-sm text-white pr-4">{item.question}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="border-t border-white/10 pt-4">
            {item.answer.split('\n\n').map((para, i) => (
              <p key={i} className={`text-sm text-slate-300 leading-relaxed ${i > 0 ? 'mt-3' : ''}`}>
                {linkifyText(para)}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({ section }: { section: Section }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className={`inline-flex rounded-xl p-2.5 ${section.bg}`}>
          <section.icon className={`h-5 w-5 ${section.color}`} />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-white">{section.title}</h2>
          <p className="text-sm text-slate-400 mt-0.5">{section.summary}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-500">{section.items.length} topics</span>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {expanded && (
        <div className="px-6 pb-6 space-y-2 border-t border-white/10 pt-4">
          {section.items.map((item) => (
            <AccordionCard key={item.question} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LegalHub() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const trimmedQuery = searchQuery.trim();
  const [includeGroundedSummary, setIncludeGroundedSummary] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const exportPdfMutation = api.legalHub.exportSearchPdf.useMutation({
    onSuccess: (data) => {
      setPdfError(null);
      const a = document.createElement('a');
      a.href = `data:${data.mimeType};base64,${data.base64}`;
      a.download = data.filename;
      a.rel = 'noopener';
      a.click();
    },
    onError: (err) => {
      setPdfError(err.message ?? 'Export failed');
    },
  });

  const legalSearch = api.legalHub.search.useQuery(
    { query: trimmedQuery, limit: 8, includeGroundedSummary },
    { enabled: trimmedQuery.length >= 2, staleTime: 60_000 },
  );

  // Local topic match — helps the user see which section is most relevant
  // before they fire an AI question. This is pure filtering over our curated
  // content; it does NOT pretend to give legal advice.
  const matchedSections = useMemo(() => {
    if (trimmedQuery.length < 2) return [] as Array<{ sectionId: string; sectionTitle: string; question: string }>;
    const needle = trimmedQuery.toLowerCase();
    const hits: Array<{ sectionId: string; sectionTitle: string; question: string }> = [];
    for (const s of SECTIONS) {
      for (const item of s.items) {
        if (
          item.question.toLowerCase().includes(needle)
          || item.answer.toLowerCase().includes(needle)
          || s.title.toLowerCase().includes(needle)
          || s.summary.toLowerCase().includes(needle)
        ) {
          hits.push({ sectionId: s.id, sectionTitle: s.title, question: item.question });
        }
      }
    }
    return hits.slice(0, 6);
  }, [trimmedQuery]);

  const handleAskAi = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const prompt = [
      `UK employment law question: ${text}.`,
      'Answer as a career coach for UK job seekers. Be concise and practical.',
      'Cite the relevant statute, ACAS code or GOV.UK page where possible.',
      'Remind me to verify current figures on GOV.UK / ACAS / HMRC and that this is guidance, not legal advice.',
    ].join(' ');
    navigate('/assistant', {
      state: { prefill: { text: prompt, mode: 'general' as const, autoSend: true } },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="inline-flex rounded-xl bg-purple-500/10 p-2.5">
            <Scale className="h-5 w-5 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">{APP_SCREENS.legalHub.label}</h1>
        </div>
        <p className="text-slate-400 ml-14">UK employment law reference for job seekers — verify current rates on GOV.UK</p>
      </div>

      {/* Legal disclaimer — collapsible (same pattern as other AI modules) */}
      <div className="mvh-card-glow rounded-xl border border-amber-500/25 bg-amber-500/[0.07] text-amber-100">
        <button
          type="button"
          onClick={() => setDisclaimerOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[11px] font-medium text-amber-100/95 transition hover:bg-white/[0.04]"
          aria-expanded={disclaimerOpen}
        >
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />
            <span>Legal disclaimer (educational only — tap to {disclaimerOpen ? 'hide' : 'show'})</span>
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-amber-200/80 transition-transform ${disclaimerOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {disclaimerOpen && (
          <div
            className="border-t border-amber-500/20 px-3 py-2 text-xs leading-relaxed text-amber-200/95"
            role="region"
            aria-label="Legal disclaimer details"
          >
            <p className="m-0">
              <span className="font-semibold">Legal Disclaimer:</span> This hub is educational and does not constitute legal advice.
              Statutory rates, thresholds, and guidance change — always confirm figures on{' '}
              <a href="https://www.gov.uk/" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-100">GOV.UK</a>,{' '}
              <a href="https://www.acas.org.uk/" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-100">ACAS</a>, or{' '}
              <a href="https://www.gov.uk/government/organisations/hm-revenue-customs" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-100">HMRC</a>.
              For advice on your situation, consult a qualified employment solicitor or ACAS (0300 123 1100).
            </p>
          </div>
        )}
      </div>

      {/* AI topic search — AI-only Q&A, not local answer generation */}
      <section
        id="legal-search"
        aria-labelledby="legal-hub-search-heading"
        className="mvh-card-glow rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.06] p-5 md:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="inline-flex rounded-xl bg-indigo-500/15 p-2 ring-1 ring-inset ring-indigo-400/30">
            <Sparkles className="h-5 w-5 text-indigo-300" aria-hidden />
          </div>
          <div className="flex-1">
            <h2 id="legal-hub-search-heading" className="text-base font-semibold text-white">
              Ask the AI Coach about UK employment law
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Type a topic or a full question — we&apos;ll send it to the <span className="text-indigo-300">AI Coach</span> for a plain-English
              answer with pointers to the relevant ACAS / GOV.UK / HMRC pages. The sections below remain unchanged.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskAi(searchQuery);
          }}
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          role="search"
        >
          <label htmlFor="legal-hub-search-input" className="sr-only">Legal topic or question</label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="legal-hub-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. notice period, holiday pay, redundancy, grievance, zero-hours…"
              autoComplete="off"
              className="w-full rounded-lg border border-white/15 bg-slate-950/60 py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIncludeGroundedSummary(false);
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={trimmedQuery.length < 2}
            className="mvh-card-glow inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Ask AI Coach
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-400">Popular:</span>
          {[
            'Notice period during probation',
            'Statutory holiday entitlement',
            'Redundancy pay calculation',
            'Raising a grievance',
            'Zero-hours worker rights',
            'Right to work checks',
            'Unfair dismissal (ET limit)',
          ].map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => {
                setSearchQuery(topic);
                handleAskAi(topic);
              }}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-indigo-400/40 hover:bg-indigo-500/15 hover:text-white"
            >
              {topic}
            </button>
          ))}
        </div>

        {legalSearch.data && legalSearch.data.hits.length > 0 && (
          <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3">
            {legalSearch.data.scope?.scopeLabel ? (
              <p className="mb-2 text-[10px] leading-snug text-slate-500">{legalSearch.data.scope.scopeLabel}</p>
            ) : null}
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-indigo-300/90">
              Official sources ({legalSearch.data.hits.length})
            </p>
            <ul className="space-y-2">
              {legalSearch.data.hits.map((h) => (
                <li key={h.url}>
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-white hover:text-indigo-200"
                  >
                    {h.title}
                  </a>
                  <p className="text-xs text-slate-400 mt-0.5">{h.snippet}</p>
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">{h.tier} · GOV.UK/ACAS/HMRC index</span>
                </li>
              ))}
            </ul>
            {!includeGroundedSummary ? (
              <button
                type="button"
                onClick={() => setIncludeGroundedSummary(true)}
                disabled={legalSearch.isFetching}
                className="mt-3 w-full rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-left text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Summarise these official links (AI — catalogue only, no open web)
              </button>
            ) : null}
            {includeGroundedSummary && legalSearch.isFetching ? (
              <p className="mt-3 text-xs text-slate-400">Generating catalogue-grounded summary…</p>
            ) : null}
            {legalSearch.data.groundedSummary ? (
              <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-950/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90">
                  {legalSearch.data.groundedSummary.synthesisLabel} · {legalSearch.data.groundedSummary.modelTier} tier ·{' '}
                  {legalSearch.data.groundedSummary.sourceCount} sources
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{legalSearch.data.groundedSummary.text}</p>
                <p className="mt-2 text-[10px] text-slate-500">
                  Educational only — verify live guidance on GOV.UK / ACAS / HMRC. Not legal advice.
                </p>
              </div>
            ) : includeGroundedSummary && !legalSearch.isFetching ? (
              <p className="mt-3 text-xs text-slate-500">
                Summary unavailable (configure backend AI or try again). Official links above remain authoritative.
              </p>
            ) : null}
          </div>
        )}

        {trimmedQuery.length >= 2 && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <div>
              <p className="text-xs font-medium text-slate-200">Export catalogue search</p>
              <p className="text-[11px] text-slate-500">PDF includes disclaimer + current official links for your query. Fixed cost: 1 credit (allowance first).</p>
            </div>
            <button
              type="button"
              disabled={!isSignedIn || exportPdfMutation.isPending}
              onClick={() => {
                setPdfError(null);
                exportPdfMutation.mutate({ query: trimmedQuery, limit: 12 });
              }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-400/40 bg-indigo-600/90 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" aria-hidden />
              {exportPdfMutation.isPending ? 'Preparing…' : 'Save as PDF (1 credit)'}
            </button>
          </div>
        )}
        {!isSignedIn && trimmedQuery.length >= 2 ? (
          <p className="mt-2 text-xs text-amber-200/90">Sign in to export PDF (billing).</p>
        ) : null}
        {pdfError ? <p className="mt-2 text-xs text-rose-300">{pdfError}</p> : null}

        {matchedSections.length > 0 && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Also in this hub ({matchedSections.length})
            </p>
            <ul className="space-y-1.5">
              {matchedSections.map((m) => (
                <li key={`${m.sectionId}-${m.question}`} className="flex items-start gap-2 text-sm text-slate-200">
                  <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 -rotate-90 text-slate-500" aria-hidden />
                  <span>
                    <span className="text-slate-400">{m.sectionTitle} · </span>
                    <span>{m.question}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-slate-500">
              Tip: AI Coach answers your exact question; the curated sections below are a fixed reference.
            </p>
          </div>
        )}

        <p className="mt-3 text-[11px] text-slate-500">
          AI answers are educational guidance only — verify figures on GOV.UK / ACAS / HMRC. No legal advice.
        </p>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'NLW / NMW', value: 'GOV.UK', sub: 'All hourly bands — updated each April' },
          { label: 'Holiday (statutory min.)', value: '5.6 weeks', sub: 'Typ. 28 days incl. bank hols (5-day week)' },
          { label: 'SSP & LEL', value: 'GOV.UK', sub: 'Weekly SSP rate and earnings threshold' },
          { label: 'ET limitation', value: '3 months', sub: 'Usual limit less one day — confirm ACAS/ET rules' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-xs font-medium text-slate-300 mt-0.5">{stat.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 -mt-2">
        Quick tiles are memory aids only. NMW/NLW, SSP, and tax figures change — always confirm on{' '}
        <a href="https://www.gov.uk/" className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">GOV.UK</a>
        , ACAS, or HMRC before relying on a number in a negotiation or claim.
      </p>

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>

      {/* Footer note */}
      <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Sources: Employment Rights Act 1996; Equality Act 2010; UK GDPR (retained EU law); Conduct of Employment Agencies and Employment Businesses Regulations 2003; Agency Workers Regulations 2010; IR35 / Income Tax (Earnings and Pensions) Act 2003 Chapter 8; National Minimum Wage Act 1998; ACAS statutory codes and guidance (acas.org.uk). Case law cited: Uber BV v Aslam [2021] UKSC 5; Spring v Guardian Assurance plc [1994] 3 All ER 129; Lock v British Gas Trading Ltd [2016] EWCA Civ 983.
        </p>
      </div>
    </div>
  );
}
