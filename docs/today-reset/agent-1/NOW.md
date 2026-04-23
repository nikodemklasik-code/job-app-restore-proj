# AGENT 1 - NOW

Primary task:
Backend runtime hardening

Do exactly this:
1. Verify trust proxy handling in backend runtime entry path.
2. Verify and harden minimal MySQL closed-state runtime guard.
3. Touch only minimal backend runtime files required for this bounded slice.
4. Run only minimal relevant verification for this slice.
5. Update docs/qc-reports/agent-1-runtime-hardening-ready-for-qc.md with:
   - files changed
   - exact test command
   - actual result
   - known blockers
   - Ready For QC: Yes/No

Do not:
- touch frontend
- redesign billing
- redesign profile
- do unrelated cleanup
- widen scope

Definition of progress:
- 1-20%: inspect files and identify exact edit points
- 21-50%: implement bounded changes
- 51-70%: verify runtime path and test
- 71-85%: write delivery report honestly
- 86-100%: only after QC verdict says Approved For Integration
