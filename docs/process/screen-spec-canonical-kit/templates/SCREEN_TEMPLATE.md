# Screen: `<SCR-XXXX>` — `<Human-readable name>`

**MoSCoW legend:** Must / Should / Could  
**Owner (product):**  
**Owner (engineering):**  
**Status:** Draft | Ready for build | In QC | Done  
**Links:** global screen catalogue · layout standard · billing/credits (if any)

**Rule:** No empty “obvious” cells. Use **`N/A` + reason + initials + date** where something truly does not apply.

---

## A. Identity and scope

| # | Item | MoSCoW | Notes |
|---|------|--------|-------|
| 1 | Screen ID + user goal | Must | |
| 2 | Roles | Must | |
| 3 | Entry points | Should | |
| 4 | Exit / next step | Must | |
| 5 | Related screens | Must | |

---

## B. Functional

| # | Item | MoSCoW | Notes |
|---|------|--------|-------|
| 6 | UI structure | Must | |
| 7 | Actions + outcomes | Must | |
| 8 | Business rules | Must | |
| 9 | Empty/loading/success/error | Must | |
| 10 | Validation + copy | Must | |
| 11 | Idempotency / double submit | Should | |
| 12 | Feature flags | Could | |

---

## C. Backend — data and API (paths required)

| Child ID | Type | Repo path (exact) | MoSCoW | Notes |
|----------|------|---------------------|--------|-------|
| `<SCR-XXXX>-DATA-01` | SQL migration | `backend/sql/….sql` | Must | |
| `<SCR-XXXX>-SCHEMA-01` | Drizzle table / column | `backend/src/db/schema.ts` (or module) | Must / N/A | |
| `<SCR-XXXX>-API-01` | tRPC procedure | `backend/src/trpc/routers/….ts` | Must / N/A | |
| `<SCR-XXXX>-API-REG` | Router mount | `backend/src/trpc/routers/index.ts` | Must / N/A | |
| `<SCR-XXXX>-AUTH-01` | AuthZ / ownership | (describe + file) | Must | |

---

## D. Frontend — UI code (paths required)

| Child ID | Type | Repo path (exact) | MoSCoW | Notes |
|----------|------|---------------------|--------|-------|
| `<SCR-XXXX>-FE-PAGE` | Page / screen component | `frontend/src/pages/….tsx` | Must / N/A | |
| `<SCR-XXXX>-FE-COMP` | Child components | `frontend/src/components/…/….tsx` | Must / N/A | |
| `<SCR-XXXX>-FE-TYPES` | Types | `frontend/src/types/….ts` | Must / N/A | |
| `<SCR-XXXX>-FE-ROUTE` | Route registration | `frontend/src/…` (router file) | Must / N/A | |
| `<SCR-XXXX>-FE-TRPC` | tRPC calls | files with `trpc.*.useQuery` / `useMutation` | Must / N/A | |

---

## E. NFR, a11y, legal

| Topic | MoSCoW | Notes |
|-------|--------|-------|
| Performance | Should | |
| Security | Must | |
| Observability | Should | |
| a11y | Must | |
| Theme/layout | Must | |
| Consent / copy risk | Must / N/A | |

---

## F. Tests and DoD

### Backend

| Test file(s) | Command | Result (exit + date + commit) |
|--------------|---------|-------------------------------|
| | `cd <REPO>/backend && …` | |

### Frontend

| Test file(s) | Command | Result (exit + date + commit) |
|--------------|---------|-------------------------------|
| | `cd <REPO>/frontend && …` | |

**Acceptance criteria (checkboxes)**

- [ ] …
- [ ] …

**QC report (if required):** `…`

---

## G. Build proof (mandatory when code in that layer exists)

| Layer | Command | Exit code | Date / commit |
|-------|---------|-----------|---------------|
| Backend | `cd <REPO>/backend && npm run build` | | |
| Frontend | `cd <REPO>/frontend && npm run build` | | |

---

## H. Deploy

| Env vars | Deploy order | Rollback |
|----------|--------------|----------|
| | DB → API → FE | |

---

## I. Traceability (summary table)

| Screen ID | Child ID | Type | Repo path | Status |
|-----------|----------|------|-----------|--------|
| `<SCR-XXXX>` | … | DATA / API / FE / TEST | … | |
