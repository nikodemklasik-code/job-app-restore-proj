# PRODUCT OWNER - NOW

Primary task:
Keep execution moving

Do exactly this every 30-40 seconds:
1. Check docs/squad/TODAY_EXECUTION_BOARD.md
2. Check docs/squad/PROJECT_CHECKPOINTS_DASHBOARD.md
3. Check docs/squad/LIVE_EXECUTION_DASHBOARD.md
4. If any agent is stale, force next action.
5. If any agent reaches Ready For QC, move QC attention there.
6. If any task finishes with QC approval, assign next bounded task immediately.
7. Update board/dashboard only when real repo evidence or QC state changes.

Do not:
- write implementation code for agents
- do QC work for QC
- invent fake progress
- let anyone sit in summary loop
