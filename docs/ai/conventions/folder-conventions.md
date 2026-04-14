# Folder Conventions

## Rule

Folders should represent domains, not accidental collections of files.

## Main split

- `docs/ai/` for human-readable documentation
- `backend/src/prompts/` for prompt implementations
- `backend/src/ai/` for domain logic, models, and orchestration

## Avoid

Avoid folders such as:
- `misc`
- `helpers`
- `utils` with no domain context
- `shared-everything`

## Practical rule

If a folder cannot be described in one sentence, its boundary is probably too vague.
