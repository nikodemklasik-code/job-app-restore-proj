import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Building2, Umbrella, Info } from 'lucide-react';

// ── UK 2024/25 constants ──────────────────────────────────────────────────────
const PERSONAL_ALLOWANCE = 12_570;
const BASIC_RATE_LIMIT = 50_270;
const HIGHER_RATE_LIMIT = 125_140;
const BASIC_RATE = 0.20;
const HIGHER_RATE = 0.40;
const ADDITIONAL_RATE = 0.45;

const NI_LOWER = 12_570;
const NI_UPPER = 50_270;
const NI_MAIN = 0.12;
const NI_UPPER_RATE = 0.02;

const NI_EMPLOYER_THRESHOLD = 9_100;
const NI_EMPLOYER_RATE = 0.138;

const STUDENT_LOAN_PLAN2_THRESHOLD = 27_295;
const STUDENT_LOAN_PLAN2_RATE = 0.09;

const DIVIDEND_ALLOWANCE = 500;
const DIVIDEND_BASIC_RATE = 0.0875;
const DIVIDEND_HIGHER_RATE = 0.3375;

const CORP_TAX_SMALL = 0.19;
const CORP_TAX_LARGE = 0.25;
const CORP_TAX_LOWER_LIMIT = 50_000;
const CORP_TAX_UPPER_LIMIT = 250_000;

// ── Tax calculation helpers ──────────────────────────────────────────────────

function calcIncomeTax(gross: number): number {
  if (gross <= PERSONAL_ALLOWANCE) return 0;
  // Tapered personal allowance above £100k
  let pa = PERSONAL_ALLOWANCE;
  if (gross > 100_000) {
    const excess = gross - 100_000;
    pa = Math.max(0, PERSONAL_ALLOWANCE - Math.floor(excess / 2));
  }
  const taxable = gross - pa;
  if (taxable <= 0) return 0;
  const basicBand = BASIC_RATE_LIMIT - pa;
  const basic = Math.min(taxable, basicBand) * BASIC_RATE;
  const higherBand = Math.max(0, Math.min(taxable - basicBand, HIGHER_RATE_LIMIT - BASIC_RATE_LIMIT));
  const higher = higherBand * HIGHER_RATE;
  const additional = Math.max(0, taxable - (HIGHER_RATE_LIMIT - pa)) * ADDITIONAL_RATE;
  return basic + higher + additional;
}

function calcNI(gross: number): number {
  if (gross <= NI_LOWER) return 0;
  const main = Math.min(gross, NI_UPPER) - NI_LOWER;
  const upper = Math.max(0, gross - NI_UPPER);
  return main * NI_MAIN + upper * NI_UPPER_RATE;
}

function calcEmployerNI(grossSalary: number): number {
  if (grossSalary <= NI_EMPLOYER_THRESHOLD) return 0;
  return (grossSalary - NI_EMPLOYER_THRESHOLD) * NI_EMPLOYER_RATE;
}

function calcStudentLoan(gross: number): number {
  if (gross <= STUDENT_LOAN_PLAN2_THRESHOLD) return 0;
  return (gross - STUDENT_LOAN_PLAN2_THRESHOLD) * STUDENT_LOAN_PLAN2_RATE;
}

function calcCorpTax(profit: number): number {
  if (profit <= 0) return 0;
  if (profit <= CORP_TAX_LOWER_LIMIT) return profit * CORP_TAX_SMALL;
  if (profit >= CORP_TAX_UPPER_LIMIT) return profit * CORP_TAX_LARGE;
  // Marginal relief
  const fullRate = profit * CORP_TAX_LARGE;
  const marginalRelief = (CORP_TAX_UPPER_LIMIT - profit) * ((CORP_TAX_LARGE - CORP_TAX_SMALL) / (CORP_TAX_UPPER_LIMIT - CORP_TAX_LOWER_LIMIT)) * profit / CORP_TAX_UPPER_LIMIT;
  return fullRate - marginalRelief;
}

function calcDividendTax(dividends: number, otherIncome: number): number {
  const remainingBasic = Math.max(0, BASIC_RATE_LIMIT - Math.max(otherIncome, PERSONAL_ALLOWANCE));
  const taxableDivs = Math.max(0, dividends - DIVIDEND_ALLOWANCE);
  if (taxableDivs <= 0) return 0;
  const basicDivs = Math.min(taxableDivs, remainingBasic);
  const higherDivs = Math.min(Math.max(0, taxableDivs - remainingBasic), HIGHER_RATE_LIMIT - BASIC_RATE_LIMIT);
  const additionalDivs = Math.max(0, taxableDivs - remainingBasic - higherDivs);
  return basicDivs * DIVIDEND_BASIC_RATE + higherDivs * DIVIDEND_HIGHER_RATE + additionalDivs * ADDITIONAL_RATE;
}

// ── Formatters ───────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0): string {
  return '£' + n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtPct(n: number): string {
  return n.toFixed(1) + '%';
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/10 bg-white/5'}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-indigo-300' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

interface BreakdownRowProps {
  label: string;
  value: string;
  negative?: boolean;
  bold?: boolean;
}

function BreakdownRow({ label, value, negative, bold }: BreakdownRowProps) {
  return (
    <div className={`flex justify-between py-2 border-b border-white/5 ${bold ? 'font-semibold' : ''}`}>
      <span className={`text-sm ${bold ? 'text-white' : 'text-slate-400'}`}>{label}</span>
      <span className={`text-sm font-medium ${negative ? 'text-red-400' : bold ? 'text-white' : 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

// ── PAYE Tab ─────────────────────────────────────────────────────────────────

function PAYECalculator() {
  const [gross, setGross] = useState('45000');
  const [studentLoan, setStudentLoan] = useState(false);
  const [pension, setPension] = useState('5');

  const calc = useMemo(() => {
    const g = parseFloat(gross) || 0;
    const pensionPct = Math.max(0, Math.min(100, parseFloat(pension) || 0));
    const pensionContrib = g * (pensionPct / 100);
    const taxableGross = g - pensionContrib;
    const incomeTax = calcIncomeTax(taxableGross);
    const ni = calcNI(taxableGross);
    const sl = studentLoan ? calcStudentLoan(taxableGross) : 0;
    const totalDeductions = incomeTax + ni + sl + pensionContrib;
    const netAnnual = g - totalDeductions;
    const netMonthly = netAnnual / 12;
    const effectiveTaxRate = g > 0 ? ((incomeTax + ni) / g) * 100 : 0;

    return { g, pensionContrib, incomeTax, ni, sl, totalDeductions, netAnnual, netMonthly, effectiveTaxRate };
  }, [gross, studentLoan, pension]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Gross Annual Salary</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
            <input
              type="number"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50"
              placeholder="45000"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Pension Contribution (%)</label>
          <div className="relative">
            <input
              type="number"
              value={pension}
              onChange={(e) => setPension(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50"
              min="0"
              max="100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
          </div>
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setStudentLoan(!studentLoan)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${studentLoan ? 'bg-indigo-500' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${studentLoan ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-slate-300">Student Loan Plan 2</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Net Annual" value={fmt(calc.netAnnual)} highlight />
        <StatCard label="Net Monthly" value={fmt(calc.netMonthly)} highlight />
        <StatCard label="Income Tax" value={fmt(calc.incomeTax)} sub={fmtPct((calc.incomeTax / Math.max(1, calc.g)) * 100) + ' of gross'} />
        <StatCard label="Effective Rate" value={fmtPct(calc.effectiveTaxRate)} sub="Tax + NI combined" />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Annual Breakdown</h3>
        <BreakdownRow label="Gross Salary" value={fmt(calc.g)} bold />
        {calc.pensionContrib > 0 && <BreakdownRow label={`Pension Contribution (${pension}%)`} value={`−${fmt(calc.pensionContrib)}`} negative />}
        <BreakdownRow label="Income Tax" value={`−${fmt(calc.incomeTax)}`} negative />
        <BreakdownRow label="National Insurance (Employee)" value={`−${fmt(calc.ni)}`} negative />
        {calc.sl > 0 && <BreakdownRow label="Student Loan Plan 2" value={`−${fmt(calc.sl)}`} negative />}
        <div className="mt-2">
          <BreakdownRow label="Net Take-Home (Annual)" value={fmt(calc.netAnnual)} bold />
          <BreakdownRow label="Net Take-Home (Monthly)" value={fmt(calc.netMonthly)} bold />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Tax Band Breakdown</h3>
        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex justify-between"><span>Personal Allowance (0%)</span><span>£0 – £12,570</span></div>
          <div className="flex justify-between"><span>Basic Rate (20%)</span><span>£12,571 – £50,270</span></div>
          <div className="flex justify-between"><span>Higher Rate (40%)</span><span>£50,271 – £125,140</span></div>
          <div className="flex justify-between"><span>Additional Rate (45%)</span><span>Above £125,140</span></div>
          <div className="flex justify-between pt-2 border-t border-white/5"><span>NI Employee (12%)</span><span>£12,570 – £50,270</span></div>
          <div className="flex justify-between"><span>NI Employee (2%)</span><span>Above £50,270</span></div>
        </div>
      </div>
    </div>
  );
}

// ── Ltd Company Tab ──────────────────────────────────────────────────────────

function LtdCompanyCalculator() {
  const [rate, setRate] = useState('600');
  const [rateType, setRateType] = useState<'daily' | 'annual'>('daily');
  const [daysPerYear, setDaysPerYear] = useState('220');
  const [salary, setSalary] = useState('12570');
  const [expenses, setExpenses] = useState('2000');

  const calc = useMemo(() => {
    const days = parseInt(daysPerYear) || 220;
    const grossContract = rateType === 'daily'
      ? (parseFloat(rate) || 0) * days
      : (parseFloat(rate) || 0);
    const salaryAmount = Math.min(parseFloat(salary) || 0, grossContract);
    const expensesAmount = parseFloat(expenses) || 0;
    const employerNI = calcEmployerNI(salaryAmount);
    const totalRevenue = grossContract;
    const profitBeforeTax = totalRevenue - salaryAmount - employerNI - expensesAmount;
    const corpTax = calcCorpTax(Math.max(0, profitBeforeTax));
    const dividendPool = Math.max(0, profitBeforeTax - corpTax);
    const dividendTax = calcDividendTax(dividendPool, salaryAmount);
    const employeeNI = calcNI(salaryAmount);
    const incomeTaxOnSalary = calcIncomeTax(salaryAmount);
    const netSalary = salaryAmount - incomeTaxOnSalary - employeeNI;
    const netDividends = dividendPool - dividendTax;
    const totalTakeHome = netSalary + netDividends;
    const totalTaxPaid = incomeTaxOnSalary + employeeNI + employerNI + corpTax + dividendTax;
    const effectiveRate = grossContract > 0 ? (totalTaxPaid / grossContract) * 100 : 0;

    // PAYE comparison
    const payeIncomeTax = calcIncomeTax(grossContract);
    const payeNI = calcNI(grossContract);
    const payeTakeHome = grossContract - payeIncomeTax - payeNI;
    const saving = totalTakeHome - payeTakeHome;

    return {
      grossContract, salaryAmount, employerNI, expensesAmount, profitBeforeTax,
      corpTax, dividendPool, dividendTax, employeeNI, incomeTaxOnSalary,
      netSalary, netDividends, totalTakeHome, totalTaxPaid, effectiveRate,
      payeTakeHome, saving, days,
    };
  }, [rate, rateType, daysPerYear, salary, expenses]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Contract Rate</label>
          <div className="flex">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full rounded-l-xl border border-white/10 bg-white/5 pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="flex border border-white/10 rounded-r-xl overflow-hidden">
              {(['daily', 'annual'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setRateType(t)}
                  className={`px-3 py-2.5 text-xs font-medium transition-colors ${rateType === t ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                  {t === 'daily' ? '/day' : '/yr'}
                </button>
              ))}
            </div>
          </div>
        </div>
        {rateType === 'daily' && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Working Days / Year</label>
            <input
              type="number"
              value={daysPerYear}
              onChange={(e) => setDaysPerYear(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Director Salary (£/yr)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">NI secondary threshold: £12,570 is optimal</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Annual Expenses (£)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
            <input
              type="number"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Take-Home" value={fmt(calc.totalTakeHome)} highlight />
        <StatCard label="Monthly Take-Home" value={fmt(calc.totalTakeHome / 12)} highlight />
        <StatCard label="vs PAYE Saving" value={calc.saving >= 0 ? fmt(calc.saving) : `−${fmt(Math.abs(calc.saving))}`} sub="compared to employed" />
        <StatCard label="Effective Tax Rate" value={fmtPct(calc.effectiveRate)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Company P&L</h3>
          <BreakdownRow label="Gross Contract Revenue" value={fmt(calc.grossContract)} bold />
          <BreakdownRow label="Director Salary" value={`−${fmt(calc.salaryAmount)}`} negative />
          <BreakdownRow label="Employer NI" value={`−${fmt(calc.employerNI)}`} negative />
          <BreakdownRow label="Business Expenses" value={`−${fmt(calc.expensesAmount)}`} negative />
          <BreakdownRow label="Pre-Tax Profit" value={fmt(calc.profitBeforeTax)} bold />
          <BreakdownRow label={`Corporation Tax (${calc.profitBeforeTax <= 50000 ? '19%' : calc.profitBeforeTax >= 250000 ? '25%' : 'marginal'})`} value={`−${fmt(calc.corpTax)}`} negative />
          <BreakdownRow label="Available for Dividends" value={fmt(calc.dividendPool)} bold />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Personal Income</h3>
          <BreakdownRow label="Director Salary" value={fmt(calc.salaryAmount)} bold />
          <BreakdownRow label="Employee NI" value={`−${fmt(calc.employeeNI)}`} negative />
          <BreakdownRow label="Income Tax on Salary" value={`−${fmt(calc.incomeTaxOnSalary)}`} negative />
          <BreakdownRow label="Net Salary" value={fmt(calc.netSalary)} bold />
          <BreakdownRow label="Gross Dividends" value={fmt(calc.dividendPool)} />
          <BreakdownRow label="Dividend Tax" value={`−${fmt(calc.dividendTax)}`} negative />
          <BreakdownRow label="Net Dividends" value={fmt(calc.netDividends)} bold />
          <div className="mt-3 pt-3 border-t border-white/10">
            <BreakdownRow label="Total Net Take-Home" value={fmt(calc.totalTakeHome)} bold />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Umbrella Tab ─────────────────────────────────────────────────────────────

function UmbrellaCalculator() {
  const [dayRate, setDayRate] = useState('500');
  const [daysPerWeek, setDaysPerWeek] = useState('5');
  const [margin, setMargin] = useState('25');
  const [studentLoan, setStudentLoan] = useState(false);

  const calc = useMemo(() => {
    const dr = parseFloat(dayRate) || 0;
    const dpw = parseFloat(daysPerWeek) || 5;
    const weeklyGross = dr * dpw;
    const annualGross = weeklyGross * 52;
    const weeklyMargin = parseFloat(margin) || 25;
    const annualMargin = weeklyMargin * 52;

    // Umbrella pays employer NI from the rate, plus apprenticeship levy (0.5%)
    const employerNI = calcEmployerNI(annualGross);
    const apprenticeLevy = annualGross * 0.005;
    const grossSalary = annualGross - employerNI - apprenticeLevy - annualMargin;
    const incomeTax = calcIncomeTax(Math.max(0, grossSalary));
    const employeeNI = calcNI(Math.max(0, grossSalary));
    const sl = studentLoan ? calcStudentLoan(Math.max(0, grossSalary)) : 0;
    const totalDeductions = incomeTax + employeeNI + sl;
    const netAnnual = grossSalary - totalDeductions;
    const netMonthly = netAnnual / 12;
    const netWeekly = netAnnual / 52;
    const netDaily = netWeekly / dpw;
    const effectiveRate = annualGross > 0 ? ((annualGross - netAnnual) / annualGross) * 100 : 0;
    const retentionRate = annualGross > 0 ? (netAnnual / annualGross) * 100 : 0;

    return {
      dr, dpw, weeklyGross, annualGross, weeklyMargin, annualMargin,
      employerNI, apprenticeLevy, grossSalary, incomeTax, employeeNI, sl,
      totalDeductions, netAnnual, netMonthly, netWeekly, netDaily,
      effectiveRate, retentionRate,
    };
  }, [dayRate, daysPerWeek, margin, studentLoan]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex gap-3">
        <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300">
          Under umbrella / Inside IR35, you are treated as an employee. The client pays a "contract rate" and the umbrella deducts employer NI (13.8%), apprenticeship levy (0.5%), and its margin before calculating your PAYE salary.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Day Rate</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
            <input
              type="number"
              value={dayRate}
              onChange={(e) => setDayRate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Days per Week</label>
          <input
            type="number"
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(e.target.value)}
            min="1"
            max="7"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Umbrella Margin (£/week)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
            <input
              type="number"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setStudentLoan(!studentLoan)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${studentLoan ? 'bg-indigo-500' : 'bg-white/10'}`}
            >
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${studentLoan ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-slate-300">Student Loan Plan 2</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Net Daily" value={fmt(calc.netDaily, 2)} highlight />
        <StatCard label="Net Weekly" value={fmt(calc.netWeekly)} highlight />
        <StatCard label="Net Monthly" value={fmt(calc.netMonthly)} />
        <StatCard label="Take-Home Rate" value={fmtPct(calc.retentionRate)} sub="of day rate" />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Annual Deduction Waterfall</h3>
        <BreakdownRow label="Gross Contract (day rate × days)" value={fmt(calc.annualGross)} bold />
        <BreakdownRow label="Employer NI (13.8%)" value={`−${fmt(calc.employerNI)}`} negative />
        <BreakdownRow label="Apprenticeship Levy (0.5%)" value={`−${fmt(calc.apprenticeLevy)}`} negative />
        <BreakdownRow label={`Umbrella Margin (£${margin}/wk)`} value={`−${fmt(calc.annualMargin)}`} negative />
        <BreakdownRow label="PAYE Gross Salary" value={fmt(calc.grossSalary)} bold />
        <BreakdownRow label="Income Tax" value={`−${fmt(calc.incomeTax)}`} negative />
        <BreakdownRow label="Employee NI" value={`−${fmt(calc.employeeNI)}`} negative />
        {calc.sl > 0 && <BreakdownRow label="Student Loan Plan 2" value={`−${fmt(calc.sl)}`} negative />}
        <div className="mt-2">
          <BreakdownRow label="Net Take-Home (Annual)" value={fmt(calc.netAnnual)} bold />
        </div>
      </div>
    </div>
  );
}

// ── Comparison Table ─────────────────────────────────────────────────────────

function ComparisonTable({ gross }: { gross: number }) {
  const g = gross;

  // PAYE
  const payeTax = calcIncomeTax(g);
  const payeNI = calcNI(g);
  const payeNet = g - payeTax - payeNI;

  // Ltd
  const ltdSalary = 12_570;
  const ltdEmployerNI = calcEmployerNI(ltdSalary);
  const ltdProfit = g - ltdSalary - ltdEmployerNI;
  const ltdCorpTax = calcCorpTax(Math.max(0, ltdProfit));
  const ltdDivs = Math.max(0, ltdProfit - ltdCorpTax);
  const ltdDivTax = calcDividendTax(ltdDivs, ltdSalary);
  const ltdNetSalary = ltdSalary - calcNI(ltdSalary) - calcIncomeTax(ltdSalary);
  const ltdNetDivs = ltdDivs - ltdDivTax;
  const ltdNet = ltdNetSalary + ltdNetDivs;

  // Umbrella
  const umbEmployerNI = calcEmployerNI(g);
  const umbLevy = g * 0.005;
  const umbMargin = 25 * 52;
  const umbGrossSalary = g - umbEmployerNI - umbLevy - umbMargin;
  const umbTax = calcIncomeTax(Math.max(0, umbGrossSalary));
  const umbNI = calcNI(Math.max(0, umbGrossSalary));
  const umbNet = umbGrossSalary - umbTax - umbNI;

  const rows = [
    { label: 'Method', paye: 'PAYE (Employed)', ltd: 'Ltd (Outside IR35)', umb: 'Umbrella (Inside IR35)', header: true },
    { label: 'Annual Take-Home', paye: fmt(payeNet), ltd: fmt(ltdNet), umb: fmt(umbNet) },
    { label: 'Monthly Take-Home', paye: fmt(payeNet / 12), ltd: fmt(ltdNet / 12), umb: fmt(umbNet / 12) },
    { label: 'Tax + Deductions', paye: fmt(g - payeNet), ltd: fmt(g - ltdNet), umb: fmt(g - umbNet) },
    { label: 'Effective Rate', paye: fmtPct(((g - payeNet) / g) * 100), ltd: fmtPct(((g - ltdNet) / g) * 100), umb: fmtPct(((g - umbNet) / g) * 100) },
  ];

  const best = Math.max(payeNet, ltdNet, umbNet);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10">
        <h3 className="font-semibold text-white">Side-by-Side Comparison</h3>
        <p className="text-xs text-slate-400 mt-0.5">Based on {fmt(g)} gross annual equivalent</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 w-40"></th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-300">PAYE</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-indigo-400 bg-indigo-500/5">Ltd (Outside IR35)</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-slate-300">Umbrella</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row) => (
              <tr key={row.label} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-slate-400">{row.label}</td>
                <td className={`text-center px-4 py-3 font-medium ${row.paye === fmt(best) ? 'text-emerald-400' : 'text-slate-200'}`}>{row.paye}</td>
                <td className={`text-center px-4 py-3 font-medium bg-indigo-500/5 ${row.ltd === fmt(best) ? 'text-emerald-400' : 'text-slate-200'}`}>{row.ltd}</td>
                <td className={`text-center px-4 py-3 font-medium ${row.umb === fmt(best) ? 'text-emerald-400' : 'text-slate-200'}`}>{row.umb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 bg-white/[0.02]">
        <p className="text-xs text-slate-500">
          Green = highest take-home. Ltd comparison assumes £12,570 director salary + dividends, £2,000 expenses. Umbrella assumes £25/week margin. Tax year 2024/25.
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type Tab = 'paye' | 'ltd' | 'umbrella';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'paye', label: 'PAYE (Employed)', icon: TrendingUp },
  { id: 'ltd', label: 'Ltd (Outside IR35)', icon: Building2 },
  { id: 'umbrella', label: 'Umbrella / Inside IR35', icon: Umbrella },
];

export default function UKSalaryCalculator() {
  const [activeTab, setActiveTab] = useState<Tab>('paye');
  const [comparisonGross, setComparisonGross] = useState('60000');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="inline-flex rounded-xl bg-indigo-500/10 p-2.5">
            <Calculator className="h-5 w-5 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">UK Salary Calculator</h1>
        </div>
        <p className="text-slate-400 ml-14">2024/25 tax year — PAYE, Ltd Company, and Umbrella comparisons</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'paye' && <PAYECalculator />}
      {activeTab === 'ltd' && <LtdCompanyCalculator />}
      {activeTab === 'umbrella' && <UmbrellaCalculator />}

      {/* Comparison Table */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white">Compare All Methods</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Gross Equivalent:</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">£</span>
              <input
                type="number"
                value={comparisonGross}
                onChange={(e) => setComparisonGross(e.target.value)}
                className="w-32 rounded-xl border border-white/10 bg-white/5 pl-6 pr-4 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>
        </div>
        <ComparisonTable gross={parseFloat(comparisonGross) || 60000} />
      </div>
    </div>
  );
}
