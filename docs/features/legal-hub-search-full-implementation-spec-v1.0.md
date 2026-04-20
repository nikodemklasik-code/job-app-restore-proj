# Legal Hub Search — Full Implementation Spec

**Version:** 1.0  
**Imported:** from `Legal_Hub_Search_Full_Implementation_Spec.md` (Downloads).  
**Companion (repo layout + PDF export contract):** [`legal-hub-search-repo-and-pdf-export-addendum-v1.0.md`](./legal-hub-search-repo-and-pdf-export-addendum-v1.0.md)  
**Source registry:** [`../legal-sources/source-registry.yaml`](../legal-sources/source-registry.yaml)

**Implementation note (§16 — models):** Identifiers such as `gpt-5.4-mini` / `gpt-5.4` are **product targets**. Implementation must bind to deployment-approved model configuration (for example `OPENAI_MODEL`) and the API capabilities the backend actually exposes (Responses API + `file_search` as in this spec).

---

## Module Name
**Legal Hub Search**

## Working Definition
**Legal Hub Search** is a source-restricted legal research and answer layer inside Legal Hub. It provides structured, source-backed answers based on approved legal and official sources relevant to UK employment and workplace-related law.

## Product Boundary
Legal Hub Search is an addition to Legal Hub.  
The rest of Legal Hub remains unchanged.

This module does **not** replace the rest of Legal Hub.  
It adds:
- constrained legal source search
- structured AI synthesis
- source scope control
- answer transparency
- PDF export

---

## 1. Core Product Principle

Legal Hub Search must default to the safest, most reliable mode:

**Core Legal Sources Only**

This means:
- no open internet by default
- no random web results
- no blog-style legal summaries
- no uncontrolled source mixing

The default answer must come only from:
- approved primary law
- approved official guidance
- ACAS
- approved tribunal material
- approved appeal tribunal material

The user may optionally widen the research scope, but only into approved secondary sources and only through explicit on/off controls.

---

## 2. Core User Value

Legal Hub Search should help the user answer:

- What Does The Law Actually Say?
- What Does ACAS Say About This?
- What Is The Practical Interpretation Of This Issue?
- What Do Tribunal-Level Materials Suggest?
- What Is Still Unclear?
- What Should I Do Next To Strengthen My Position?

The product should reduce AI error by reducing source uncertainty.

---

## 3. What This Module Is Not

Legal Hub Search is not:
- an open legal chatbot
- a generic internet search engine
- a law-firm blog summarizer
- a guarantee of legal outcome
- a substitute for formal legal advice
- a hidden web search tool pretending to be precise

---

## 4. Default Source Groups

The following source groups must be enabled by default:

- **Primary Law**
- **Official Guidance**
- **ACAS**
- **Tribunal Decisions**
- **Appeal Tribunal Decisions**

These define the default trusted search mode.

### Source Group Definitions

#### Primary Law
- UK legislation relevant to workplace and employment matters
- examples:
  - Employment Rights Act
  - Equality Act
  - related statutory material
  - selected contract and company law sections where relevant to workplace disputes

#### Official Guidance
- official government guidance relevant to employment and workplace legal issues
- official explanatory materials where approved

#### ACAS
- ACAS guidance, process guidance, and practical workplace interpretation

#### Tribunal Decisions
- approved Employment Tribunal decision materials

#### Appeal Tribunal Decisions
- approved Employment Appeal Tribunal decision materials

---

## 5. Optional Secondary Source Groups

The following may be available, but must not be enabled by default unless approved in product configuration:

- **Explanatory Notes**
- **Official PDFs**
- **Curated Contract Law**
- **Curated Company Law**

These are broader than the core source groups, but still approved and controlled.

### Definitions

#### Explanatory Notes
- selected official explanatory notes linked to approved legislation

#### Official PDFs
- approved official PDF guidance documents from trusted public bodies

#### Curated Contract Law
- approved source material relevant to contract issues affecting employment matters

#### Curated Company Law
- approved source material relevant to directors, company duties, and company-related employment issues

---

## 6. Per-Source On / Off Controls

Every source group must support explicit user on / off control.

That means the user may choose combinations such as:
- ACAS on
- Primary Law on
- Tribunal Decisions off
- Official PDFs on
- Curated Company Law off

### Rules
- core sources are enabled by default
- optional sources are disabled by default unless configured otherwise
- every source group must be user-visible
- active search scope must never be hidden from the user
- the answer must reflect the sources that were actually active

---

## 7. Search UI

## Main Screen
**Legal Hub Search**

### Top Structure
1. **Header**
2. **Search Bar**
3. **Active Source Pills**
4. **Research Scope Dropdown**
5. **Answer Area**
6. **Sources Used Panel**
7. **Export Controls**

---

## 8. Search Bar

### Purpose
Primary query entry point for legal source-backed search.

### Labels
- **Search Legal Guidance**
- **Search Approved Legal Sources**
- **Ask About Workplace Rights**

### Behaviour
The search bar must feel:
- focused
- trustworthy
- controlled
- professional

### Required Adjacent Controls
- **Search**
- **Sources**
- optional:
  - **Deep Review**
  - **Expand Beyond Core Sources** (if supported)

---

## 9. Active Source Pills

Directly next to or under the search bar, show visible pills / indicators for all currently enabled source groups.

### Examples
- **Primary Law**
- **Official Guidance**
- **ACAS**
- **Tribunal**
- **EAT**
- **Official PDFs**
- **Curated Contract Law**

### Visual Rules
- active = clearly visible
- inactive = muted or hidden from the active strip
- optional secondary sources should be visually distinguishable from core sources

### UX Goal
Before searching, the user should understand:
**what the system is currently allowed to search**

---

## 10. Research Scope Dropdown

Add a dropdown near the search bar.

### Recommended Labels
- **Sources**
- **Research Scope**

### Contents
Group source toggles into:

#### Core Sources
- **Primary Law**
- **Official Guidance**
- **ACAS**
- **Tribunal Decisions**
- **Appeal Tribunal Decisions**

#### Optional Approved Sources
- **Explanatory Notes**
- **Official PDFs**
- **Curated Contract Law**
- **Curated Company Law**

### Rules
- each row must have on / off control
- active changes must update the source pills immediately
- optional source groups must be clearly marked as broader / secondary

---

## 11. Search Mode Visibility

The UI must show the current mode clearly.

### Example Labels
- **Core Legal Sources Only**
- **Core Sources + Optional Approved Sources**

This must be visible near the answer or search controls.

---

## 12. Answer Contract

Every legal answer must follow this structure:

- **Short Answer**
- **What The Sources Say**
- **How This May Apply**
- **Relevant Sources**
- **What Is Still Unclear**
- **When To Seek Formal Advice**
- **Sources Used**
- **Search Scope**

### Important Rules
- distinguish source-backed information from inference
- do not invent law or outcomes
- do not pretend uncertainty does not exist
- if the sources do not support a conclusion, say so
- if the question exceeds source scope, say so

---

## 13. Sources Used Transparency

Each answer must include a visible **Sources Used** block.

### Examples
- **Primary Law**
- **ACAS**
- **Official Guidance**
- **Tribunal Decisions**
- **Official PDFs**

This must reflect actual active and retrieved sources, not assumed categories.

---

## 14. Search Scope Summary

Each answer must include a visible **Search Scope** summary.

### Example
**Search Scope**  
Core Sources Only:
- Primary Law
- Official Guidance
- ACAS
- Tribunal Decisions

or

**Search Scope**  
Core Sources + Optional Approved Sources:
- Primary Law
- Official Guidance
- ACAS
- Tribunal Decisions
- Official PDFs
- Curated Company Law

---

## 15. PDF Export

### Feature Name
**Save As PDF**

### Purpose
The user must be able to save the answer for:
- later reading
- personal records
- sharing
- case preparation
- structured legal guidance reference

### Required UI
Add:
- **Save As PDF**
- optional menu:
  - **Copy Answer**
  - **Copy Sources**
  - **Save As PDF**

### Required PDF Content
- **Question**
- **Answer Timestamp**
- **Jurisdiction**
- **Search Scope**
- **Sources Used**
- **Short Answer**
- **What The Sources Say**
- **How This May Apply**
- **What Is Still Unclear**
- **When To Seek Formal Advice**
- **Legal Disclaimer**
- **Source Titles Or Links**

### PDF Must Not Include
- hidden prompts
- internal model names
- file IDs
- vector store IDs
- internal debug info
- internal confidence metadata

### Legal Disclaimer
**Important Notice**  
This document is based on approved legal and official sources selected within Legal Hub Search.  
It is intended as source-backed guidance and research support, not as formal legal advice or a guaranteed legal outcome.

### File Naming Examples
- `legal-hub-search-2026-04-16-employment-rights-answer.pdf`
- `legal-hub-search-acas-guidance-question-2026-04-16.pdf`

---

## 16. AI Model And Retrieval Stack

### Default Model
**gpt-5.4-mini**

### Escalation Model
**gpt-5.4**

Use escalation only for:
- deep review
- harder multi-source synthesis
- complex comparative analysis
- longer structured answers when explicitly requested

### Retrieval Method
Use:
- **Responses API**
- **file_search**
- approved **vector stores**

Do not use open web search as the default retrieval mode.

---

## 17. Source Policy

### Approved Core Sources
- Legislation.gov.uk
- ACAS
- GOV.UK official guidance
- Employment Tribunal materials
- Employment Appeal Tribunal materials

### Optional Approved Sources
- selected official explanatory notes
- approved official PDF guidance
- curated contract law material relevant to employment disputes
- curated company law material relevant to employment disputes

### Out Of Scope By Default
- blogs
- law firm marketing pages
- Reddit
- random forums
- general web results
- user-supplied external links unless separately validated
- unapproved legal commentary

---

## 18. Repo Structure

### Backend

```text
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

```text
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
    SearchScopeSummary.tsx
    LegalWarningBanner.tsx
    LegalExportMenu.tsx
    LegalPdfButton.tsx
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

### Source Documents

```text
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

---

## 19. Source Registry

Use:

```text
docs/legal-sources/source-registry.yaml
```

as the source-of-truth for:
- source group name
- approval status
- default enabled state
- optional source status
- jurisdiction
- domain
- update cadence
- file paths

### Example Structure

```yaml
source_groups:
  - key: primary_law
    label: Primary Law
    approved: true
    default_enabled: true
    optional_secondary: false
    jurisdiction: UK
    domain: employment
    paths:
      - docs/legal-sources/legislation/

  - key: acas
    label: ACAS
    approved: true
    default_enabled: true
    optional_secondary: false
    jurisdiction: UK
    domain: employment
    paths:
      - docs/legal-sources/acas/

  - key: official_pdfs
    label: Official PDFs
    approved: true
    default_enabled: false
    optional_secondary: true
    jurisdiction: UK
    domain: employment
    paths:
      - docs/legal-sources/official-pdfs/
```

---

## 20. Backend Flow

1. user submits legal query
2. backend validates query schema
3. backend resolves active source scope
4. backend maps source scope to approved vector store / file groups
5. backend calls Responses API with file_search
6. backend receives source-backed retrieval
7. model generates structured answer
8. backend normalizes answer format
9. frontend renders answer and source transparency
10. user may export as PDF

---

## 21. Frontend Behaviour

The frontend must:
- show active source groups clearly
- let the user control source scope
- update scope pills immediately
- render structured answers consistently
- show sources used and search scope visibly
- offer PDF export without friction

---

## 22. Required Components

Minimum required components:

- **LegalSearchBar**
- **ActiveSourcePills**
- **ResearchScopeDropdown**
- **SourceToggleRow**
- **SourceGroupSection**
- **SourceModeBadge**
- **LegalAnswerCard**
- **LegalSourcesUsedPanel**
- **SearchScopeSummary**
- **LegalWarningBanner**
- **LegalExportMenu**
- **LegalPdfButton**
- **LegalDisclaimerBlock**

---

## 23. Required States

Legal Hub Search must support:

- **Loading State**
- **Empty State**
- **Error State**
- **Populated State**

### Loading State
Examples:
- **Searching Approved Legal Sources**
- **Reading ACAS And Primary Law**
- **Checking Tribunal Materials**

### Empty State
Examples:
- **Search Approved Legal Sources**
- **Ask A Question About Employment Or Workplace Law**

### Error State
Examples:
- **We Could Not Complete The Search**
- **Please Try Again Or Adjust The Source Scope**

---

## 24. Prompt Rules

The system prompt must require the model to:

- answer only from approved sources
- distinguish source-backed statements from inference
- say when sources do not support a conclusion
- avoid pretending to be a lawyer
- avoid guaranteeing outcomes
- avoid inventing citations
- say when the query exceeds approved source scope

---

## 25. Product Rules

### Rule 1
Default mode must be safe and source-restricted.

### Rule 2
Expanded research must be a conscious user choice.

### Rule 3
Users must always be able to see which source groups are active.

### Rule 4
Answers must show the actual sources used.

### Rule 5
PDF export must preserve scope, sources, and disclaimer.

### Rule 6
The module must reduce error by reducing source uncertainty.

---

## 26. Agent Instruction Block

```md
Implement Legal Hub Search as a source-restricted legal search layer inside Legal Hub.

## Default Enabled Source Groups
- Primary Law
- Official Guidance
- ACAS
- Tribunal Decisions
- Appeal Tribunal Decisions

## Optional Secondary Source Groups
- Explanatory Notes
- Official PDFs
- Curated Contract Law
- Curated Company Law

## Required Behaviour
- each source group supports on/off
- core sources are enabled by default
- optional sources are available only if approved
- add visible active-source pills near the search bar
- add a Sources / Research Scope dropdown
- every answer must include:
  - Short Answer
  - What The Sources Say
  - How This May Apply
  - Relevant Sources
  - What Is Still Unclear
  - When To Seek Formal Advice
  - Sources Used
  - Search Scope
- add Save As PDF
- PDF must include:
  - Question
  - Answer Timestamp
  - Jurisdiction
  - Search Scope
  - Sources Used
  - Short Answer
  - What The Sources Say
  - How This May Apply
  - What Is Still Unclear
  - When To Seek Formal Advice
  - Legal Disclaimer
- use docs/legal-sources/source-registry.yaml as source-of-truth for approved source groups
```

---

## 27. Final Product Statement

**Legal Hub Search is a source-restricted legal search layer inside Legal Hub that answers workplace and employment-related legal questions using only approved, official, and primary legal sources by default, while giving users visible control over source scope, answer transparency, and PDF export.**

---

## Document history

| Date | Change |
|------|--------|
| 2026-04-17 | Imported into repo as `legal-hub-search-full-implementation-spec-v1.0.md`; linked addendum + registry; markdown heading tidy (`###` under §7, §15, §18); registry default for EAT aligned with §4. |
