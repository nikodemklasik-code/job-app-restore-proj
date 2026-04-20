# Legal Hub search — backend spec

Index: [`README.md`](./README.md) · Monolit §4: [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md)

---

## Status

This area appears far more complete in documentation than in implemented backend.

This should be treated as a **build target**, not a minor patch.

---

## Required backend module

Create or complete:

```text
backend/src/modules/legal-hub-search/
```

---

## Required features

- **Legal Query Validation**
- **Source Registry Loading**
- **Approved Source Scope Resolution**
- **Per-Source Toggle Handling**
- **Core vs Optional Source Filtering**
- **Prompt Orchestration**
- **Retrieval Flow**
- **Structured Answer Contract**
- **Sources Used Tracking**
- **Search Scope Summary**
- **PDF Export Endpoint**

---

## Required source logic

The backend must support:
- core sources on by default
- optional approved sources off by default
- user-controlled source scope
- answer restricted to active approved sources
- source transparency in output

---

## Required PDF export logic

- generate PDF from current answer payload
- include question, timestamp, jurisdiction, search scope, sources used, answer sections, disclaimer
- exclude internal system metadata, model IDs, vector store IDs, file IDs, debug info

---

## QC must validate

- answers are source-backed
- source toggles actually change retrieval scope
- sources used reflect real active sources
- PDF contains required sections
- PDF excludes internal-only metadata
- no answer escapes approved corpus without explicit expanded mode
