# AGENT 3 - NOW

Primary task:
Legacy interview billing parity

Do exactly this:
1. Inspect legacy interview.router billing path.
2. Ensure approveSpend happens before effect.
3. Ensure commitSpend happens only on success.
4. Ensure rejectSpend happens on failure / abandon path where applicable.
5. Touch only minimal files required for this slice.
6. Run only minimal relevant tests or write explicit justification.
7. Update docs/qc-reports/agent-3-legacy-interview-billing-ready-for-qc.md with:
   - files changed
   - exact test command
   - actual result
   - known blockers
   - Ready For QC: Yes/No

Do not:
- touch Coach
- touch Negotiation
- touch wider Practice
- touch Live Interview unless compile strictly requires it
- broaden scope

Definition of progress:
- 1-20%: locate legacy spend path
- 21-50%: implement bounded billing parity
- 51-70%: verify success/failure paths
- 71-85%: write delivery report honestly
- 86-100%: only after QC verdict says Approved For Integration
