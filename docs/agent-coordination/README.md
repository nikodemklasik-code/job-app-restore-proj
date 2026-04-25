# Agent Coordination Hub

This directory is the canonical handoff space for agents working on the Job Assistant App repository.

Agents must use these notes before claiming a task is finished. A task is not accepted because an agent says it is finished. It is accepted only when backend, frontend, tests, integration behaviour and QC evidence all agree. Revolutionary concept: software should actually work.

## Current QC stance

The project is not allowed to mark screens as `Done` while critical backend contracts still rely on public endpoints with client-supplied `userId`, while frontend screens hide missing backend support with placeholders, or while compatibility aliases can lose user data.

## Coordination rules

1. Every screen must have a named backend owner and frontend owner.
2. Backend must publish the real contract before frontend claims integration.
3. Frontend must use the real contract, not local placeholder data or fake fallbacks.
4. No agent may move a screen to `Done` alone.
5. Any PR touching a screen must state which backend procedures and frontend components were tested together.
6. Any limitation that affects required behaviour means the task is not complete.
7. Any data-loss risk, unauthorised access path, hidden spend path, or fake success state is a blocker.

## Required handoff phrase

Backend agent may only say:

`Backend contract implemented and tested.`

Frontend agent may only say:

`Frontend integrated with real backend contract and tested.`

QC may only say:

`Done.`

Anything else is noise wearing a lanyard.

## Files in this directory

- `backend-agent-handoff.md` — backend/foundations instructions and acceptance criteria.
- `frontend-agent-handoff.md` — frontend/integration instructions and acceptance criteria.
- `task-acceptance-gate.md` — shared Definition of Done and rejection rules.
