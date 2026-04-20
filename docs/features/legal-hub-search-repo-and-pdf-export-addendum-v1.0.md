# Legal Hub Search: Repo and PDF Export Addendum

**Version:** 1.0  
**Status:** Specification — implementation must follow this addendum so Legal Hub Search does not ship as a half-finished “great idea” without repo direction, source governance, or durable PDF export.

**Canonical source registry:** [`docs/legal-sources/source-registry.yaml`](../legal-sources/source-registry.yaml)

**Full product + UI + stack spec:** [`legal-hub-search-full-implementation-spec-v1.0.md`](./legal-hub-search-full-implementation-spec-v1.0.md)

---

## 1. Repo structure

### Backend

```
backend/src/modules/legal-hub-search/
  controllers/
    legal-search.controller.ts
    legal-answer.controller.ts
    legal-export.controller.ts
  services/
    legal-search.service.ts
    legal-answer.service.ts
    legal-source-router.service.ts
    legal-pdf-export.service.ts
    legal-source-scope.service.ts
  schemas/
    legal-query.schema.ts
    legal-answer.schema.ts
    legal-source-scope.schema.ts
    legal-export.schema.ts
  prompts/
    legal-hub-search-system-prompt.md
  mappers/
    legal-answer.mapper.ts
    legal-source.mapper.ts
  types/
    legal-source.types.ts
    legal-answer.types.ts
    legal-export.types.ts
```

### Frontend

```
frontend/src/app/legal/
  LegalHubSearchPage.tsx
frontend/src/features/legal-hub-search/
  components/
    LegalSearchBar.tsx
    ActiveSourcePills.tsx
    ResearchScopeDropdown.tsx
    SourceToggleRow.tsx
    SourceGroupSection.tsx
    SourceModeBadge.tsx
    LegalAnswerCard.tsx
    LegalSourcesUsedPanel.tsx
    LegalWarningBanner.tsx
    LegalExportMenu.tsx
    LegalPdfButton.tsx
    SearchScopeSummary.tsx
    LegalDisclaimerBlock.tsx
  hooks/
    useLegalSearch.ts
    useLegalSourceScope.ts
    useLegalExport.ts
  api/
    legalHubSearch.api.ts
  types/
    legalHubSearch.types.ts
```

The existing accordion-style **Legal Hub** (`LegalHub.tsx`) remains the static reference hub unless product merges flows; **Legal Hub Search** is the searchable, source-backed product surface described here.

### Source documents (repository tree)

```
docs/legal-sources/
  legislation/
  acas/
  gov-guidance/
  tribunal-decisions/
  eat-decisions/
  explanatory-notes/
  official-pdfs/
  contract-law/
  company-law/
  source-registry.yaml
```

Curated extracts, official PDFs, and indexed metadata live under these paths as governed by the registry — not ad hoc paths in application code.

---

## 2. Source registry

Single explicit file: **`docs/legal-sources/source-registry.yaml`**.

It must define, per source group:

- Source group key and human label  
- Source type  
- Approved status (whether it may be used at all)  
- Default enabled (on first load / sensible defaults)  
- Optional secondary flag (core vs optional approved extension)  
- Jurisdiction  
- Legal domain  
- Update cadence (how often content or pointers should be reviewed)  
- File paths (repo-relative)

**Rule:** This YAML is the **source of truth** for enabling and classifying sources. Do not scatter parallel lists in code (“caveman toggles”). Code reads the registry (or a build-time artefact derived from it).

---

## 3. Legal Hub Search answer contract

Every answer returned to the client (and every PDF export input) must map to a structured contract with at least:

| Block | Purpose |
|--------|--------|
| Short answer | Concise direct response |
| What the sources say | Source-synthesised narrative |
| How this may apply | Practical application to typical employment situations (non-binding) |
| Relevant sources | Citations / links / titles |
| What is still unclear | Honest limits |
| When to seek formal advice | Escalation guidance |
| Sources used | Machine- and human-readable list actually used |
| Search scope | Which groups were active (core vs optional) |

This structure is **required for PDF export** so the PDF is a deliberate document, not a random text dump.

---

## 4. PDF export — feature

**Feature name:** Export answer as PDF  

**Purpose:** The user must be able to save an answer for:

- Later reading  
- Sharing with someone else  
- Personal documentation  
- Case prep, notes, next steps  

In Legal Hub Search especially, users expect to **retain** the answer, **return** to it, and have **sources and scope** stored together with the answer.

---

## 5. PDF export — UI

### Required UI

On the answer surface:

- **Export** affordance  
- **Save as PDF** as primary CTA  

Placement:

- Top-right of the answer card, **or**  
- Compact actions menu: **Save as PDF**, **Copy answer**, **Copy sources**, **Open full research** (where “full research” is defined in product).

### Recommended components

- `LegalExportMenu`  
- `LegalPdfButton`  
- `SearchScopeSummary` (inline + echoed in PDF)  
- `LegalSourcesUsedPanel`  
- `LegalDisclaimerBlock` (visible in UI; repeated in PDF)

### Primary CTA copy

**Save as PDF**

---

## 6. PDF content rules

### PDF must include

- Question  
- Answer timestamp  
- Jurisdiction  
- Search scope (which groups active; core-only vs core + optional — see §12)  
- Sources used  
- Short answer  
- What the sources say  
- How this may apply  
- What is still unclear  
- When to seek formal advice  
- Legal disclaimer (§7)  
- Source links or source titles (as available)

### PDF must not include

- Raw hidden prompts  
- Internal confidence flags  
- Debugging info  
- Vector store IDs  
- File IDs  
- Internal model names  
- Internal system metadata  

The PDF is a **human document**, not telemetry scrap.

---

## 7. Legal disclaimer in PDF

A mandatory closing block, for example:

**Important notice**  
This document is based on approved legal and official sources selected within Legal Hub Search. It is intended as source-backed guidance and research support, **not** as formal legal advice or a guaranteed legal outcome.

This is mandatory to reduce downstream product and reputational risk.

---

## 8. PDF export modes

**A. Standard PDF** — Question, answer blocks, sources used, scope summary, disclaimer.  

**B. Full research PDF** — Everything in standard, plus fuller source list, expanded “What the sources say”, finer-grained scope narrative.

**MVP:** A single **Save as PDF** is acceptable if it implements the **standard** content set above. Second mode can follow without blocking MVP.

Optional dual CTA later:

- Save standard PDF  
- Save full research PDF  

---

## 9. Backend PDF endpoint

**Suggested:** `POST /legal-hub-search/export/pdf` (or equivalent under your API gateway, e.g. tRPC `legalHubSearch.exportPdf` — same contract).

**Request body (conceptual):**

- `question`  
- Answer blocks (structured per §3)  
- `sourcesUsed`  
- `searchScope` (active groups, core vs optional)  
- `jurisdiction`  
- `exportMode` (`standard` | `full_research` when supported)

**Response:**

- Binary PDF download **or** short-lived signed URL — product choice; MVP favours **direct download** for simplicity.

---

## 10. Frontend export flow

1. User runs search.  
2. Answer renders from structured contract.  
3. User clicks **Save as PDF**.  
4. Client sends **current answer payload** (no silent refetch that can change text) to export endpoint.  
5. Server generates PDF per content rules.  
6. Browser downloads PDF.

### UX rules

- Fast, readable  
- No extra form unless legally required  
- Answer must not disappear or reflow destructively during export  
- No hostile pop-ups  

---

## 11. PDF file naming

Predictable, sortable names, for example:

- `legal-hub-search-2026-04-16-employment-rights-answer.pdf`  
- `legal-hub-search-acas-guidance-question-2026-04-16.pdf`

Slug the question fragment; enforce max length; ASCII-safe.

---

## 12. Search scope visibility in PDF

The PDF must state clearly:

- Which source **groups** were active  
- Whether only **core** approved sources were used  
- Whether **optional secondary** approved sources were included  

**Example — core only**

```text
Search scope — core sources only
• Primary Law
• ACAS
• Official guidance
• Tribunal decisions
```

**Example — core + optional**

```text
Search scope — core sources + optional approved sources
• Primary Law
• ACAS
• Official guidance
• Tribunal decisions
• Official PDFs
• Curated company law
```

This is an honesty and transparency requirement.

---

## 13. Required components (checklist)

| Component | Role |
|-----------|------|
| `LegalExportMenu` | Export actions |
| `LegalPdfButton` | Primary PDF CTA |
| `LegalSourcesUsedPanel` | Lists sources used in the answer |
| `SearchScopeSummary` | Core vs optional; mirrors PDF |
| `LegalDisclaimerBlock` | Shown in UI; repeated in PDF |

(Plus search UI pieces from §1: search bar, scope, toggles, answer card, warnings as per risk review.)

---

## 14. Required agent instruction (copy-paste)

Implement **Legal Hub Search** with:

### Repo structure

Add a dedicated **`legal-hub-search`** module in backend and frontend, including:

- Search  
- Source scope control  
- Answer rendering (structured contract)  
- PDF export  

### Source registry

Use **`docs/legal-sources/source-registry.yaml`** as the **source of truth** for approved source groups and paths. Do not duplicate divergent lists in code.

### PDF export

Add **Save as PDF** for each legal answer. The PDF must include:

- Question  
- Answer timestamp  
- Jurisdiction  
- Search scope  
- Sources used  
- Short answer  
- What the sources say  
- How this may apply  
- What is still unclear  
- When to seek formal advice  
- Legal disclaimer  

The PDF must **not** include:

- Internal prompts  
- Model metadata  
- File IDs  
- Vector store IDs  
- Internal debug data  

### UI

Add:

- `LegalExportMenu`  
- `LegalPdfButton`  
- `SearchScopeSummary`  
- `LegalSourcesUsedPanel`  
- `LegalDisclaimerBlock`  

---

## 15. Final product rule

**Legal Hub Search** must let users search within **approved** legal sources **and** preserve a **source-backed** answer as a **structured PDF** with **visible scope**, **visible sources**, and a **clear legal guidance disclaimer** — or the feature is not considered complete for integration.

---

## Document history

| Date | Change |
|------|--------|
| 2026-04-17 | Initial addendum v1.0 — repo layout, registry, answer contract, PDF rules, agent instruction. |
