# ADR 0001: Keep SSE Streaming for Live Interview, Add Post-Session Orchestrators

## Status
Accepted

## Context
The existing system uses SSE streaming for live interview responses. This supports:
- fast perceived responsiveness,
- early TTS start,
- progressive response delivery.

A new integration layer introduced REST-style orchestrators for:
- closing summary,
- coach handoff,
- report generation.

## Decision
We keep SSE streaming for live turn-by-turn interview behavior and add the new orchestrators as a post-session and reporting layer.

## Rationale
This preserves working real-time interview behavior while allowing cleaner architecture for:
- summary generation,
- report generation,
- coach routing,
- structured outputs.

## Consequences
- live interview transport remains SSE-based,
- post-session logic may use orchestrators and structured payloads,
- no forced rewrite of the working real-time engine is required.
