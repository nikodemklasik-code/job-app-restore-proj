# QC Handoffs

This folder is the direct QC-to-agent instruction channel.

Rules:
- Each agent reads only their own handoff file.
- QC writes exact rework or approval-related next action here.
- Product Owner does not overwrite QC handoff content.
- Agents do not infer work from summaries if a QC handoff exists.
- Latest content in each agent handoff file is the active QC instruction.

Files:
- docs/qc-handoffs/agent-1-next-action.md
- docs/qc-handoffs/agent-2-next-action.md
- docs/qc-handoffs/agent-3-next-action.md
