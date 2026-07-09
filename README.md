# ToolsNook — calculator verification suite

Runs each tool page's **actual shipped JavaScript** inside a DOM (jsdom), drives the
real inputs, and asserts on what the page displays. It does not re-implement the
formulas — it tests the code your users run.

This suite is what backs the claim on `/methodology.html` that every calculation is
tested against worked examples before publication.

## Run it

```bash
npm install jsdom
node tests.js
```

Expected output: `41 passed / 0 failed / 41 total`

## Coverage

| Tool | Worked example | Authority |
|---|---|---|
| VAT | 100 net @20% → 120 gross; 120 gross @20% → 100 net; reduced 5% rate | HMRC |
| BMI | 70kg/1.75m → 22.9 healthy; 95kg/1.70m → obese; 45kg/1.70m → underweight | NHS |
| Profit margin | 500k rev / 300k COGS → 40% gross; less 100k opex → 20% net | — |
| Markup | cost 10 + 50% → 15.00; 50% markup ≡ 33.33% margin; 50% margin ≡ 100% markup | — |
| ROI | 5000 → 7500 = 50%; 10k → 20k over 5y = 14.87% annualised | — |
| Break-even | FC 10000 / (50 − 30) = 500 units; +2000 profit → 600 units | — |
| Compound interest | 10k @7% 30y annual → 76,122.55; zero-principal annuity; ×multiplier guard | A = P(1+r/n)^nt |
| Loan | 50k @7% 5y → 990.06/mo; 0% rate branch; rate-comparison unit consistency | Amortisation formula |
| Working capital | CA 100k / CL 50k → NWC 50k, current ratio 2.00 | — |
| Percentage | 25% of 200; 25 of 80 = 31.25%; 50→65 = +30% | — |
| Discount | 120 −30% → 84; reverse 48 → 60; **stacked 30%+10% = 63, not 60** | — |
| Tip | 100 @15% split 2 | — |
| Salary → hourly | 52,000 / 40h / 52w → 25.00 | — |
| Hours | 09:00–17:30 less 30m → 8:00; overnight 22:00–06:00 → 8:00 | — |
| Age / Date | 26 years; 30 days exclusive; **leap year Feb 2024 = 29 days** | — |
| Unit converter | 100°C → 212°F; 0°C → 273.15K; 37°C → 98.6°F | BIPM SI / NIST SP 811 |

## Defects this suite found and fixed (9 July 2026)

1. **`loan-calculator`** — the main input asked for the term in *years*, while the
   rate-comparison box on the same page asked for *months*. Entering `5` in both gave
   wildly different loans. Rate comparison now uses years.
2. **`compound-interest-calculator`** — the growth loop contained dead code, discarded
   its first result, and recomputed the balance up to three times per year. Replaced with
   a single loop that reduces exactly to `A = P(1+r/n)^(nt)` when contributions are zero.
3. **`compound-interest-calculator`** — headline figures were abbreviated (`$76.1K`), so
   no exact value appeared anywhere on the page. Now full precision.
4. **`compound-interest-calculator`** — a zero principal produced `×Infinity` as the
   growth multiplier. Now guarded.
5. **Prose arithmetic.** Worked examples written into the page copy were wrong:
   - "$131/month reaches $1,000,000 in 30 years at 7%" → actually **$820/month** (out by 6×)
   - "$55/month over 40 years" → actually **$381/month**
   - loan interest figures across four scenarios (out by $14–$240 each)
   - "compound produces $76,123 — a final value of $76,123" (interest and total confused)
   - markup consultant example: "$43,200 gross profit" → **$52,000**

   Each wrong figure appeared up to three times per page — in the prose, in the FAQPage
   schema, and in the FAQ JavaScript array. All occurrences were corrected together.
