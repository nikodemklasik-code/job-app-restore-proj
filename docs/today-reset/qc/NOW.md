# QC - NOW

Primary task:
Review active bounded slices and keep queue moving

Do exactly this every 30-40 seconds:
1. Check docs/qc-reports/
2. Check current repo changes
3. Check whether agents are inside scope
4. Review the first fresh Ready For QC slice
5. Issue only one of:
   - Approved For Integration
   - Not Approved For Integration
   - Rework Required
6. If no fresh report waits, inspect repo for narrow integration risks and record findings

Do not:
- silently widen approvals
- self-certify broad modules from narrow cleanup
- leave Ready For QC waiting without explicit action
