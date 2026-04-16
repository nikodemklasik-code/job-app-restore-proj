# Agent Instruction: Screen Foundation & Shared Components

**Scope:** Turn the first screen inventory file (`docs/SCREEN_AUDIT.md`) into a **coherent production frontend foundation**, not a loose set of views.

**Do not:** add random features, invent product scope, or rewrite unrelated modules.

---

## Goal

You must:

1. Order the **screen structure** (routes ↔ product intent).
2. Define **shared components** (minimal set below; extend with variants, not clones).
3. **Unify naming** (Title Case everywhere it applies to UI chrome).
4. **Separate layout from screen logic** (composition only in route-level pages).
5. Deliver a **screen skeleton** ready for wiring to real data.
6. Remove **copy, capitalization, and CTA** inconsistencies.
7. Build a **small component system** that can grow without duplication.

---

## Core Rule

Do not treat the inventory file as unrelated pages. Treat it as a **screen system**: shared components + shared UX rules.

Deliver, in order of dependency:

1. **App shell** (already exists — align with it; do not fork a second shell).
2. **Shared layout primitives** (page chrome inside content area).
3. **Shared page pattern** (header → sections → optional sticky actions).
4. **Shared UI components** (listed below).
5. **Consistent naming** (canonical titles: see `frontend/src/lib/navigationCopy.ts`).
6. **Consistent CTAs** (Title Case, short verb-led labels).
7. **Screen-level composition** (each route page composes shared pieces only).

---

## Source File

- **Primary input:** `docs/SCREEN_AUDIT.md` (per-route audit: what exists, mocks, gaps).
- **Naming alignment:** `frontend/src/lib/navigationCopy.ts` + sidebar labels.
- **Routes:** `frontend/src/router.tsx`.

---

## Phase 1 — Extract Inventory

From `docs/SCREEN_AUDIT.md`, list for **each screen**:

- Name (product Title Case)
- Purpose
- Main page heading (should match shell title where applicable)
- Sections (section headers in Title Case)
- CTAs (Title Case)
- Statuses (Title Case, single vocabulary)
- Empty / loading / populated / error states (explicit)

Do not merge two screens into one. Do not skip routes that exist in the router.

---

## Phase 2 — Naming (Title Case)

Applies to: screen names, section titles, tiles, buttons, status chips, primary nav.

**Good:** Applications Review, Daily Warmup, Style Studio, Job Radar, Save As Draft.

**Bad:** daily warmup, Applications review, save as draft, STYLE STUDIO.

Normalize the inventory and any UI strings you touch while implementing skeletons.

---

## Phase 3 — Shared Component Set (Minimal)

Prefer **one component + variants** over many near-duplicates.

| Component | Role |
|-----------|------|
| `PageHeader` | Title + optional description + optional actions slot |
| `SectionHeader` | Section title + optional hint / link |
| `Panel` | Bordered surface for grouped content |
| `SplitLayout` | Two-column responsive split |
| `InfoCard` / `ActionCard` | Static vs CTA-forward cards |
| `MetricCard` | KPI number + label |
| `StatusBadge` | Mapped status vocabulary |
| `SignalBadge` | Risk / trust / low-level signal |
| `PrimaryButton` / `SecondaryButton` | Consistent CTA styling |
| `EmptyState` / `LoadingState` / `ErrorState` | Mandatory screen states |
| `ActivityList` / `TimelineBlock` | Recent activity / lifecycle |
| `CaseCard` | Application / review case summary |
| `TemplateCard` | Style Studio template pickers |
| `InsightBlock` | AI insight chunk |
| `ProgressBlock` | Step or completion UI |
| `FormField` / `TextAreaField` | Label + control + hint |
| `TagList` | Skills / tags |
| `StickyActionBar` | Bottom primary actions on long forms |

**Anti-pattern names:** `DashboardApplicationsSummarySpecialCardFinal` — forbidden.

---

## Phase 4 — Layout vs Content

- Global layout: existing **AppShell** (sidebar, header, content container).
- Inside pages: use **max width**, **vertical rhythm**, and **mobile stacking** from existing Tailwind patterns; do not invent a second spacing system unless extracted as tokens.

Every screen should feel like **one product**, not a separate micro-app.

---

## Phase 5 — Per-Screen Spec Template

Before coding each screen, write (in the deliverable doc or PR description):

- Screen name  
- Purpose  
- Primary user goal  
- Main sections  
- Core shared components  
- Primary CTA / secondary CTA  
- States: loading, empty, error, populated  
- Data needs (tRPC / props; mock today, real tomorrow)  
- Interaction notes  

---

## Phase 6 — Module Boundaries (Hard)

Do not blur:

| Module | Responsibility |
|--------|----------------|
| Documents Upload | Upload + extraction |
| Style Studio | Generate + download documents |
| Profile | Source of truth for candidate data |
| Applications | Executing applications (lifecycle) |
| Applications Review | Post-send analysis |
| Job Radar | Market / sources / signals |
| Skill Lab | Skills, value, verification |
| Assistant | Conversation + light routing |
| AI Analysis | Structured analysis output |
| Coach | Strategic career support |
| Interview | Interview practice |
| Negotiation | Terms / compensation framing |
| Daily Warmup | Short daily exercises |

If the audit describes mixed concerns on one route, **split UI sections** and cross-links, not merged product logic.

---

## Phase 7 — Data-Driven, Not Hardcoded

- Sections accept **props** or **small view-model hooks**; avoid giant single components.
- Map statuses through a **single dictionary** → `StatusBadge`.
- No “coming soon” where the spec expects **real structure** (use empty state + honest copy).

---

## Forbidden

- Merging multiple product screens into one route without an explicit product decision.
- New arbitrary screen names that diverge from `navigationCopy` / router.
- Breaking Title Case conventions for chrome.
- One mega-component per route.
- Placeholders that pretend finished features are shipped.
- Scope creep beyond the audit + this instruction.

---

## Work Order

1. Read `docs/SCREEN_AUDIT.md` → extract screens, sections, CTAs, statuses, repeated UI patterns.  
2. Design shared component API (props, variants).  
3. Align layout rules with AppShell + existing Tailwind usage.  
4. Refactor **route by route** into the shared page pattern (skeletons first).  
5. Normalize copy / CTAs / statuses.  
6. Remove duplicates and cross-screen drift.  
7. Leave a **merge-ready skeleton**: compiles, consistent chrome, honest states.

---

## Required Deliverable Format

When reporting back (or opening a PR), structure output as:

**A. Screen inventory** — routes, purpose, primary goal.  
**B. Shared component inventory** — names, responsibilities, variants.  
**C. Layout rules** — shell, content width, spacing, mobile behavior.  
**D. Screen-by-screen structure** — sections, components, CTAs, states, data.  
**E. Copy normalization** — before/after table for names, statuses, CTAs.  
**F. Implementation direction** — file tree, order of PRs, what stays mock vs wired.

---

## If Writing Code

1. Shared UI primitives under e.g. `frontend/src/components/ui-shell/` or extend existing `components/ui/` — **pick one namespace** and stick to it.  
2. Page pattern wrapper (optional): e.g. `PageScaffold` using `PageHeader` + `Panel`.  
3. Skeletons for **all** audited routes that need alignment (not one random page).  
4. Then deepen sections per priority from the audit.

---

## Success Criteria

After the work, the app reads as **one product**: one layout system, one naming convention, one CTA style, and clear module boundaries—**not** a collection of divergent tabs from different branches.
