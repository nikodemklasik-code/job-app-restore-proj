# AI Libraries

This directory contains the domain-level AI libraries used by the interview product.

## Libraries

- `prompt-core`
- `interview-engine`
- `coach-engine`
- `persona-kit`
- `report-engine`
- `session-engine`

## Design rule

Each library owns one primary responsibility.

This directory must not become:
- a generic helper dump,
- a duplicate of the prompts folder,
- a temporary playground for unrelated logic.

## Practical rule

If a new file does not clearly belong to one of the libraries above, stop and decide the domain first.
