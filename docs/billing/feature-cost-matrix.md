# Feature Cost Matrix

## Purpose
This matrix defines default pricing models for major product features.

| Feature | Pricing Mode | Notes |
|---|---|---|
| Daily Warmup | Fixed | Short tiers should be explicit and simple |
| Assistant basic reply | Fixed or low capped estimate | Lightweight paths only |
| Assistant deep analysis | Estimated with ceiling | Must expose depth and model tier |
| Coach quick reframe | Fixed | Small bounded action |
| Coach deep session | Estimated with ceiling | Depth-sensitive |
| Interview lite | Fixed | Short predictable session |
| Interview advanced | Estimated with ceiling | Premium interviewer or longer depth |
| Negotiation short run | Fixed | Small bounded tactical flow |
| Negotiation advanced | Estimated with ceiling | Depends on pressure and depth |
| Legal Search core | Fixed or low estimate | Limited source scope |
| Legal Search deep | Estimated with ceiling | Source complexity matters |
| Document processing basic | Fixed | Standard bounded operation |
| Document processing advanced | Estimated with ceiling | Multiple passes or synthesis |
| Report generation | Fixed or estimated | Depends on size and model path |
| Job Radar scan | Fixed or capped estimate | Depends on scan scope |
| Job Radar Salary Search | Fixed | Bounded search by role, skills, location, work mode, and minimum salary threshold |
| Job Radar Advanced Employer Context | Fixed or capped estimate | Must use neutral context wording, not employer labels |
| Export PDF | Fixed | Should be highly predictable |

## Design rule
Every feature must have:
- a pricing mode
- a display rule
- a backend settlement rule

No heavy feature should exist without an explicit charging model.

## Backend rule
Every feature in this matrix must map to:
- pricing engine logic
- authorization logic
- execution handler
- settlement logic
- ledger category
