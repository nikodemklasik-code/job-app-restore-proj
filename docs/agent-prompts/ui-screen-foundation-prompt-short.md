# Short paste prompt — UI screen foundation

Copy the block below into Cursor / Claude as the task message.

---

You are working in the MultivoHub repo. **Input:** `docs/SCREEN_AUDIT.md`. **Naming reference:** `frontend/src/lib/navigationCopy.ts` and `frontend/src/router.tsx`.

**Goal:** Build a **production-ready frontend foundation**: shared layout pattern + shared UI components + per-screen skeletons. **Not** new product features.

**Rules:** (1) **Title Case** for all user-facing screen names, section titles, tiles, CTAs, and status labels. (2) **Hard module boundaries** — Documents Upload ≠ Style Studio; Applications ≠ Applications Review; Job Radar ≠ Skill Lab; Assistant vs Coach vs Interview vs Negotiation vs Daily Warmup stay separate. (3) Every screen must define **loading, empty, error, and populated** states — no happy-path-only UI. (4) **Layout separate from content** — use existing AppShell; add thin shared primitives (`PageHeader`, `SectionHeader`, `Panel`, `StatusBadge`, `PrimaryButton`/`SecondaryButton`, `EmptyState`/`LoadingState`/`ErrorState`, `MetricCard`, etc.) with **variants**, not one-off mega components. (5) Components are **props-driven** so mock data today can swap to tRPC tomorrow without rewriting layouts.

**Do not:** merge screens; invent names; break Title Case; add “Coming Soon” where real structure is required; rewrite unrelated files; duplicate five versions of the same card.

**Order:** (1) Extract from SCREEN_AUDIT a list of screens, sections, CTAs, statuses, repeated patterns. (2) Add shared components + optional `PageScaffold`. (3) Apply skeleton per route in router order. (4) Normalize copy. (5) Remove duplicates.

**Output format:** A) Screen inventory B) Shared component list C) Layout rules D) Per-screen structure (sections, components, CTAs, states, data) E) Copy normalization table F) Implementation file list / PR order.

Start by reading `docs/SCREEN_AUDIT.md` and list gaps vs `navigationCopy.ts` before writing code.
