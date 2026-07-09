const { runCase } = require('./harness');

// Worked examples. Authority noted where one publishes the figure.
const cases = [
  // ---------- VAT (HMRC, standard rate 20%) ----------
  { name: 'VAT add: 100 net @20% -> 20 VAT, 120 gross', file: 'vat-calculator.html',
    fn: 'calcAdd', inputs: { 'add-price': 100, 'add-rate': 20 }, expect: [/120\.00/, /20\.00/] },
  { name: 'VAT remove: 120 gross @20% -> 100 net', file: 'vat-calculator.html',
    fn: 'calcRemove', inputs: { 'rem-price': 120, 'rem-rate': 20 }, expect: [/100\.00/, /20\.00/] },
  { name: 'VAT check: net 100, gross 120 -> rate 20%', file: 'vat-calculator.html',
    fn: 'calcCheck', inputs: { 'chk-net': 100, 'chk-gross': 120 }, ids: { 'chk-rate': /^20%$/ } },
  { name: 'VAT reduced rate: 200 net @5% -> 210 gross', file: 'vat-calculator.html',
    fn: 'calcAdd', inputs: { 'add-price': 200, 'add-rate': 5 }, expect: [/210\.00/, /10\.00/] },

  // ---------- BMI (NHS: kg / m^2) ----------
  { name: 'BMI: 70kg / 1.75m -> 22.9 healthy', file: 'bmi-calculator.html',
    fn: 'calcBMI', inputs: { 'height-cm': 175, 'weight-kg': 70 }, expect: [/22\.9/] },
  { name: 'BMI: 95kg / 1.70m -> 32.9 obese', file: 'bmi-calculator.html',
    fn: 'calcBMI', inputs: { 'height-cm': 170, 'weight-kg': 95 }, expect: [/32\.[89]/, /Obese/i] },
  { name: 'BMI: 45kg / 1.70m -> 15.6 underweight', file: 'bmi-calculator.html',
    fn: 'calcBMI', inputs: { 'height-cm': 170, 'weight-kg': 45 }, expect: [/15\.[56]/, /Underweight/i] },

  // ---------- Profit margin ----------
  { name: 'Gross margin: 500k rev / 300k cogs -> 40%', file: 'profit-margin-calculator.html',
    fn: 'calcGross', inputs: { 'gross-revenue': 500000, 'gross-cogs': 300000 }, expect: [/40\.0/] },
  { name: 'Net margin: 500k / 300k cogs / 100k opex -> 20%', file: 'profit-margin-calculator.html',
    fn: 'calcNet', inputs: { 'net-revenue': 500000, 'net-cogs': 300000, 'net-opex': 100000, 'net-tax': 0 },
    expect: [/20\.0/] },

  // ---------- Markup / margin (the classic trap) ----------
  { name: 'Markup: cost 10 + 50% markup -> 15.00', file: 'markup-calculator.html',
    fn: 'calcPrice', inputs: { 'p-cost': 10, 'p-markup': 50 }, expect: [/15\.00/] },
  { name: 'Markup->margin: 50% markup == 33.33% margin', file: 'markup-calculator.html',
    fn: 'cvMU', inputs: { 'cv-mu': 50 }, expect: [/33\.33/] },
  { name: 'Margin->markup: 50% margin == 100% markup', file: 'markup-calculator.html',
    fn: 'cvMG', inputs: { 'cv-mg': 50 }, expect: [/100\.00/] },
  { name: 'Markup find: cost 80, sell 100 -> 25% markup', file: 'markup-calculator.html',
    fn: 'calcFind', inputs: { 'f-cost': 80, 'f-sell': 100 }, expect: [/25\.0/] },

  // ---------- ROI ----------
  { name: 'ROI: 5000 -> 7500 = 50%', file: 'roi-calculator.html',
    fn: 'calcBasic', inputs: { 'b-invest': 5000, 'b-return': 7500 }, expect: [/50\.0/] },
  { name: 'ROI annualised: 10k -> 20k over 5y = 14.87%', file: 'roi-calculator.html',
    fn: 'calcAnnualized', inputs: { 'a-invest': 10000, 'a-return': 20000, 'a-years': 5 }, expect: [/14\.8[67]/] },

  // ---------- Break-even: FC / (P - VC) ----------
  { name: 'Break-even: FC 10000, P 50, VC 30 -> 500 units', file: 'break-even-calculator.html',
    fn: 'calcBreakEven', inputs: { price: 50, vcost: 30, fcosts: 10000 }, expect: [/500/] },
  { name: 'Break-even target: +2000 profit -> 600 units', file: 'break-even-calculator.html',
    fn: 'calcTarget', inputs: { 'tp-price': 50, 'tp-vcost': 30, 'tp-fcosts': 10000, 'tp-profit': 2000 },
    expect: [/600/] },

  // ---------- Compound interest: A = P(1 + r/n)^(nt) ----------
  { name: 'Compound: 10000 @7% 30y annual -> 76,122.55', file: 'compound-interest-calculator.html',
    fn: 'calcCI', inputs: { principal: 10000, rate: 7, years: 30, freq: 1, monthly: 0 },
    ids: { 'r-final': /76,122\.5[45]/ } },
  { name: 'Compound: 10000 @7% 10y monthly -> 20,096.6', file: 'compound-interest-calculator.html',
    fn: 'calcCI', inputs: { principal: 10000, rate: 7, years: 10, freq: 12, monthly: 0 },
    ids: { 'r-final': /20,096\.6/ } },
  { name: 'Compound: 0 principal, 100/mo @0% 10y -> 12,000 (no Infinity)', file: 'compound-interest-calculator.html',
    fn: 'calcCI', inputs: { principal: 0, rate: 0, years: 10, freq: 12, monthly: 100 },
    ids: { 'r-final': /12,000\.00/, 'r-multi': /\u2014/ } },

  // ---------- Loan amortisation (term in YEARS) ----------
  { name: 'Loan: 50000 @7% 5y -> 990.06/mo', file: 'loan-calculator.html',
    fn: 'calcLoan', inputs: { loan: 50000, rate: 7, term: 5 }, ids: { 'r-monthly': /990\.0[56]/ } },
  { name: 'Loan: 200000 @0% 10y -> 1666.67/mo (zero-rate branch)', file: 'loan-calculator.html',
    fn: 'calcLoan', inputs: { loan: 200000, rate: 0, term: 10 }, ids: { 'r-monthly': /1,666\.6[67]/ } },
  { name: 'Loan rate-comparison reads YEARS: 50000 @7% 5y -> 990.06', file: 'loan-calculator.html',
    fn: 'rateComp', inputs: { 'rc-a': 50000, 'rc-r': 7, 'rc-t': 5 }, expect: [/990\.0[56]/] },

  // ---------- Working capital ----------
  { name: 'Working capital: CA 100k, CL 50k -> NWC 50k, ratio 2.00', file: 'working-capital-calculator.html',
    fn: 'calcWC',
    inputs: { cash: 50000, ar: 30000, inventory: 20000, 'other-assets': 0, ap: 40000, loans: 10000, accrued: 0, 'other-liab': 0 },
    expect: [/50,?000/, /2\.00/] },

  // ---------- Percentage ----------
  { name: 'Percentage: 25% of 200 -> 50', file: 'percentage-calculator.html',
    fn: 'calcA', inputs: { a1: 25, a2: 200 }, expect: [/\b50\b/] },
  { name: 'Percentage: 25 is what % of 80 -> 31.25%', file: 'percentage-calculator.html',
    fn: 'calcB', inputs: { b1: 25, b2: 80 }, expect: [/31\.25/] },
  { name: 'Percentage change: 50 -> 65 = 30%', file: 'percentage-calculator.html',
    fn: 'calcC', inputs: { c1: 50, c2: 65 }, expect: [/30/] },

  // ---------- Discount ----------
  { name: 'Discount: 120 less 30% -> 84.00 (save 36.00)', file: 'discount-calculator.html',
    fn: 'calcPctOff', inputs: { 'po-price': 120, 'po-pct': 30 }, expect: [/84\.00/, /36\.00/] },
  { name: 'Discount reverse: 48 after 20% off -> 60.00 original', file: 'discount-calculator.html',
    fn: 'calcReverse', inputs: { 'rv-sale': 48, 'rv-pct': 20 }, expect: [/60\.00/] },
  { name: 'Discount find %: 80 -> 60 = 25% off', file: 'discount-calculator.html',
    fn: 'calcFindPct', inputs: { 'fp-orig': 80, 'fp-sale': 60 }, expect: [/25/] },
  { name: 'Stacked discount: 100, 30% then 10% -> 63.00 (not 60)', file: 'discount-calculator.html',
    fn: 'calcStacked', inputs: { 'st-price': 100, 'st-d1': 30, 'st-d2': 10, 'st-d3': 0 }, expect: [/63\.00/] },

  // ---------- Tip ----------
  { name: 'Tip: 100 @15% split 2 -> tip 15.00, total 115.00', file: 'tip-calculator.html',
    fn: 'calcTip', inputs: { bill: 100, tippct: 15, people: 2, tax: 0 }, expect: [/15\.00/, /115\.00/] },

  // ---------- Salary -> hourly ----------
  { name: 'Salary: 52000 / 40h / 52w -> 25.00/hr', file: 'salary-to-hourly.html',
    fn: 'calcSalary', inputs: { salary: 52000, hours: 40, weeks: 52, vacation: 0 }, expect: [/25\.00/] },

  // ---------- Hours ----------
  { name: 'Hours: 09:00-17:30 less 30m break -> 8:00 / 8.00', file: 'hours-calculator.html',
    fn: 'calcSingle', inputs: { 's-start': '09:00', 's-end': '17:30', 's-break': 30, 's-round': 0 },
    ids: { 'r-hhmm': /^8:00$/, 'r-decimal': /^8\.00$/ } },
  { name: 'Hours overnight: 22:00-06:00 -> 8:00', file: 'hours-calculator.html',
    fn: 'calcSingle', inputs: { 's-start': '22:00', 's-end': '06:00', 's-break': 0, 's-round': 0 },
    ids: { 'r-hhmm': /^8:00$/ } },

  // ---------- Dates ----------
  { name: 'Age: 2000-01-01 as of 2026-07-09 -> 26', file: 'age-calculator.html',
    fn: 'calcAge', inputs: { dob: '2000-01-01', asof: '2026-07-09' }, expect: [/\b26\b/] },
  { name: 'Date between: 2026-01-01 -> 2026-01-31 = 30 days', file: 'date-calculator.html',
    fn: 'calcBetween', inputs: { 'bt-start': '2026-01-01', 'bt-end': '2026-01-31' }, expect: [/\b30\b/] },
  { name: 'Leap year: 2024-02-01 -> 2024-03-01 = 29 days', file: 'date-calculator.html',
    fn: 'calcBetween', inputs: { 'bt-start': '2024-02-01', 'bt-end': '2024-03-01' }, expect: [/\b29\b/] },

  // ---------- Unit conversion (SI Brochure / NIST SP 811) ----------
  { name: 'Temp: 100C -> 212F', file: 'unit-converter.html',
    fn: 'convert', setup: (w) => w.switchCategory('temperature', w.document.createElement('button')),
    inputs: { 'conv-input': 100, 'from-unit': 'celsius', 'to-unit': 'fahrenheit' }, expect: [/212/] },
  { name: 'Temp: 0C -> 273.15K', file: 'unit-converter.html',
    fn: 'convert', setup: (w) => w.switchCategory('temperature', w.document.createElement('button')),
    inputs: { 'conv-input': 0, 'from-unit': 'celsius', 'to-unit': 'kelvin' }, expect: [/273\.15/] },
  { name: 'Temp: 37C -> 98.6F (body temp)', file: 'unit-converter.html',
    fn: 'convert', setup: (w) => w.switchCategory('temperature', w.document.createElement('button')),
    inputs: { 'conv-input': 37, 'from-unit': 'celsius', 'to-unit': 'fahrenheit' }, expect: [/98\.6/] },
];

let pass = 0, fail = 0;
const failures = [];
for (const tc of cases) {
  const r = runCase(tc);
  if (r.ok) { pass++; console.log('  PASS  ' + r.name); }
  else { fail++; failures.push(r); console.log('  FAIL  ' + r.name + '\n          ' + r.why); }
}
console.log(`\n${pass} passed / ${fail} failed / ${cases.length} total`);
for (const f of failures) if (f.snip) console.log(`\n[${f.name}]\n  ...${f.snip}...`);
process.exit(fail ? 1 : 0);
