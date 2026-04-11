# Live Interview — Required Libraries and Implementation Dependencies
**Status:** Production Implementation Specification  
**Priority:** P0  
**Product:** English-first Real Conversational Interviewer / Coaching Reports  
**Audience:** Engineering  
**Owner:** Engineering  
**Last Updated:** 2026-04-11

---

## 1. Purpose

This document defines the required libraries, services, and implementation dependencies for the Live Interview feature and its coaching report verification system.

It is the implementation-level companion to:
- `docs/security/report-verification-logic.md` (verification logic spec)
- `docs/policies/history-verification-policy.md` (product policy)

---

## 2. Backend Runtime

| Requirement | Value |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | tRPC + Express |
| Package manager | npm |

---

## 3. Core Cryptographic Requirements

### 3.1 HMAC-SHA256 (VCODE and Document Signature)

**Required for:** VCODE generation, Document Signature generation

**Implementation:** Node.js built-in `crypto` module

```typescript
import { createHmac } from 'crypto';
```

No external package required. `crypto` is part of the Node.js standard library.

**Usage pattern:**
```typescript
const hmac = createHmac('sha256', secret);
hmac.update(canonicalPayload);
const rawHex = hmac.digest('hex');
```

### 3.2 Secret Management

Secrets must be loaded from environment variables only:
- `REPORT_VERIFICATION_SECRET_RV1`
- `REPORT_SIGNATURE_SECRET_SV1`

Must never be hardcoded or committed to source.

---

## 4. PDF Processing Requirements

### 4.1 PDF Generation (Coaching Report)

**Required library:** `pdfkit` (already used in project)

**Current usage:** `backend/src/services/pdfGenerator.ts`

The report generator must embed:
- all required top-level report fields
- the full Validation Block
- VCODE (display format)
- Document Signature

### 4.2 PDF Parsing (Verification)

**Requirement:** Extract structured text from user-uploaded PDF for verification.

**Recommended library:** `pdf-parse`

```bash
npm install pdf-parse
```

**Alternative:** `pdfjs-dist` (heavier, more capable)

**Decision criteria:**
- if text extraction only is needed: use `pdf-parse`
- if page layout matters: use `pdfjs-dist`

Current recommendation: `pdf-parse` for simplicity in backend text extraction.

---

## 5. Canonicalization and Normalization

No external library required. Canonicalization must be implemented as pure utility functions:

- `reportNormalizer.ts` — field normalization (trim, case, number format)
- `canonicalPayloadBuilder.ts` — ordered field serialization to pipe-delimited string
- `reportFieldExtractor.ts` — extracts fields from parsed PDF text

These must be deterministic and have no external dependencies beyond Node.js built-ins.

---

## 6. Validation Layer

### 6.1 Schema validation

**Required library:** `zod` (already used in project)

Use zod for:
- validating extracted PDF field shapes
- validating canonical payload structure before VCODE computation
- validating backend API input for the verification endpoint

---

## 7. API Layer

### 7.1 Verification endpoint

**Framework:** tRPC (already used in project)

A new tRPC procedure must be added:
- `interview.verifyPriorReport` or equivalent
- input: uploaded PDF buffer or base64
- output: `VerificationResult` shape (see security spec section 12)

### 7.2 File upload handling

**Required for:** receiving uploaded PDF from frontend

**Recommended:** `multer` (standard Express middleware)

```bash
npm install multer
npm install --save-dev @types/multer
```

Or handle via tRPC with base64-encoded PDF in payload if file upload middleware is not preferred.

---

## 8. Frontend Requirements

### 8.1 PDF upload UI

No additional library required beyond existing React + Next.js setup.

Use `<input type="file" accept=".pdf" />` with standard form handling.

### 8.2 State management for verification result

Use existing state management patterns in the project (React state or existing store).

---

## 9. Environment Configuration

The following environment variables must be added to backend configuration:

```env
# Report verification secrets (version-specific)
REPORT_VERIFICATION_SECRET_RV1=<secret>
REPORT_SIGNATURE_SECRET_SV1=<secret>
```

These must be:
- added to `.env.example` with placeholder values only
- documented in `RUNBOOK.md` under secret configuration
- never committed with real values

---

## 10. Implementation Module Map

| Module | File path (recommended) | Responsibility |
|---|---|---|
| `reportFieldExtractor` | `backend/src/services/reportFieldExtractor.ts` | Parse PDF text into structured fields |
| `reportNormalizer` | `backend/src/services/reportNormalizer.ts` | Normalize field values per canonicalization rules |
| `canonicalPayloadBuilder` | `backend/src/services/canonicalPayloadBuilder.ts` | Build ordered canonical payload string |
| `vcodeService` | `backend/src/services/vcodeService.ts` | Generate and verify VCODE |
| `documentSignatureService` | `backend/src/services/documentSignatureService.ts` | Generate and verify Document Signature |
| `reportVerificationService` | `backend/src/services/reportVerificationService.ts` | Orchestrate full 9-step verification flow |
| `verificationVersionRegistry` | `backend/src/services/verificationVersionRegistry.ts` | Map schema versions to verification logic |

---

## 11. Testing Requirements

### 11.1 Unit tests

Required for:
- `reportNormalizer` — normalization edge cases
- `canonicalPayloadBuilder` — field order, delimiter format
- `vcodeService` — determinism, tamper detection
- `reportVerificationService` — all 9 validation steps

### 11.2 Tamper test cases

Must cover all cases listed in `docs/security/report-verification-logic.md` section 16.

### 11.3 Test environment secrets

For tests, use fixed known secrets and pre-computed expected VCODE values.

Must not use production secrets in tests.

---

## 12. Dependency Summary

| Library | Source | Purpose | Already in project |
|---|---|---|---|
| `crypto` | Node.js built-in | HMAC-SHA256 | Yes |
| `pdfkit` | npm | PDF generation | Yes |
| `zod` | npm | Schema validation | Yes |
| `pdf-parse` | npm | PDF text extraction | No — needs install |
| `multer` | npm | File upload handling | Check project |

---

## 13. Related Documents

- `docs/security/report-verification-logic.md`
- `docs/policies/history-verification-policy.md`
- `docs/features/live-interview-implementation-plan.md`
- `docs/features/live-interview-engine-tasks.md`

---

## 14. One-Sentence Summary

The verification system requires only Node.js crypto (built-in), pdfkit (existing), zod (existing), and pdf-parse (new) — all other logic is implemented as pure deterministic TypeScript utilities with no external cryptographic dependencies beyond the standard library.
