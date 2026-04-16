# Execution Reporting Standard (Mandatory)

This standard is mandatory without exceptions.

## 1) Repository Is The Source Of Truth

- Every team member must regularly check tasks in the repository.
- Nobody waits for manual reminders or chat pings to know what to do.

## 2) Work Counts Only If It Is In Repository

- Every task must be driven and closed in repository artifacts (issue, PR, task thread, commit context).
- If work is done but no trace exists in repository, the process treats it as not delivered.

## 3) Mandatory Completion Report Location

After implementation, the executor must report directly in the task, issue, or PR.

The report must be technical, concrete, and verifiable.

## 4) Required Report Content (Minimum)

Every completion report must include:
- what exactly was done
- scope of changes
- files/modules/areas touched
- final result
- how to verify
- known limitations, risks, or follow-ups
- explicit status: `READY FOR QC`

## 5) `READY FOR QC` Usage Rule

`READY FOR QC` is allowed only when work is genuinely ready for quality review.

Forbidden for:
- partial work
- almost-done work
- "works on my machine" without verification notes
- submissions without check instructions

## 6) Invalid Reports

The following messages are invalid and treated as noise:
- "done"
- "ready"
- "gotowe"
- "można sprawdzać"
- any equivalent without technical report content

## 7) Incomplete Work Reporting Rule

If task is not 100% complete, executor must state it explicitly.

In that case report must include:
- what is delivered
- what is missing
- what blocks completion
- the next required step

Such task must not receive `READY FOR QC`.

## 8) QC Intake Rule

QC reviews only tasks that have:
- full completion report
- explicit `READY FOR QC` status

No report means no QC intake.

## 9) Responsibility Traceability

Each task must clearly show:
- who is implementing
- what was delivered
- when it was submitted for QC
- what exactly must be reviewed

## 10) Non-Repository Status Is Not Official

The following do not count as official status:
- chat-only messages
- verbal statements
- screenshots without repository description
- "already said earlier"
- "it was being done"

## 11) No Update Means No Execution Discipline

Missing task update in repository is treated as delivery discipline failure.

This is part of task execution quality, not admin overhead.

## 12) Objective

Every delivered task must be:
- visible
- verifiable
- accountable
- ready for QC without extra questioning

## 13) Communication Chain (Mandatory)

### Agent -> Quality Control

After implementation, Agent reports to QC with:
- status
- work summary
- result
- encountered issues
- follow-up notes

### Quality Control -> Product Owner

QC reports verified outcome with:
- quality evaluation
- detected bugs
- risks
- gaps
- recommended fixes
- status: `Accepted` or `Needs Fix`

### Product Owner -> Agent

Product Owner is not first-line intake for raw execution reports.

Product Owner contacts Agent after QC decision to:
- assign fixes
- change priority
- pass next phase
- approve progression

### Product Owner -> Quality Control

Product Owner provides QC with:
- acceptance criteria
- priority
- business requirements
- task scope

### Quality Control -> Agent

QC does not directly manage Agent execution by default.

Direct QC -> Agent interaction is allowed only for:
- fast technical clarification

Formal decisions and task assignment still flow through Product Owner.

## Required Report Template

```md
Completed Work
- ...

Changed Files / Modules
- ...

Result
- ...

How To Verify
- ...

Known Limitations / Follow-Up
- ...

Status
- READY FOR QC
```
