# PO Bootstrap Checklist

1. Choose one bounded slice from `docs/squad/19-SCREENS_FIRST_PRODUCTION_SLICES.tsv`.
2. Copy `docs/squad/19-SCREENS_RFQ_TEMPLATE.md` to the concrete RFQ path.
3. Fill required sections:
   - Production Readiness (This Slice)
   - Cross-Flows Touched
   - In Scope / Out Of Scope
4. Create the physical report file at the concrete `REPORT_PATH`.
5. Add chain row using `docs/squad/19-SCREENS_AUTO_TASK_CHAIN_SCREEN_TEMPLATE.tsv` as reference.
6. Run:
   `bash scripts/automation/po-automation-health.sh`
7. Only after health passes, set status:
   `bash scripts/automation/set-status.sh ...`
8. Start loop only after chain entry rules pass.
