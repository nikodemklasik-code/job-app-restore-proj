# Total screen requirements checklist (master)

Use for **every screen**. Tag each line **Must** / **Should** / **Could** when scoping MVP.

**Nothing is implicit:** if a row does not apply, write **`N/A` + reason + owner initials/date**. Empty cells are not allowed at “Ready for QC”.

---

## A. Identity and scope

1. **Screen ID** (e.g. `SCR-…`) + **name** + **user goal** (one sentence). — Must  
2. **Role / persona** (guest vs signed-in; admin). — Must  
3. **Entry points** (nav, deep link, notification). — Should  
4. **Exit / next step** (where user goes after primary actions). — Must  
5. **Related screens** (same feature across screens; dependencies). — Must  

---

## B. Functional (product)

6. **Visible structure** (sections, lists, primary actions). — Must  
7. **User actions** and **expected outcome** each. — Must  
8. **Business rules** (thresholds, limits, ordering). — Must  
9. **Data states**: empty / loading / success / error / partial. — Must  
10. **Validation + error copy** (fields, formats). — Must  
11. **Idempotency / double-submit / refresh** behaviour. — Should  
12. **Feature flags / rollout** if any. — Could  

---

## C. Below UI — data and backend contract

13. **DB model**: tables, keys, indexes, enums required before screen can be “done”. — Must  
14. **SQL migration** path in repo + **apply order** on MySQL. — Must (or `N/A` + reason)  
15. **Drizzle / ORM schema file paths** (exact repo paths touched). — Must (or `N/A` + reason)  
16. **API / tRPC (or REST):** procedure names **and** file paths implementing them. — Must (or `N/A` + reason)  
17. **Router registration:** where procedures are wired (e.g. `routers/index.ts`). — Must when new/changed router  
18. **AuthN/AuthZ** + **ownership** (who can call; row-level user match). — Must  
19. **Repo conventions** (ESM `.js` imports, `publicProcedure` vs `protectedProcedure`). — Must  
20. **Contract versioning** / backward compatibility. — Should  

---

## D. Non-functional and quality

21. **Performance** (pagination, lazy load, large lists). — Should  
22. **Security** (no secrets client-side; PII in logs). — Must  
23. **Observability** (what is logged on failure). — Should  
24. **Accessibility** (headings, focus, contrast) per org standard. — Must  
25. **Theme / layout** compliance per org unified layout doc. — Must  
26. **i18n** if required. — Could  

---

## E. Legal, copy, product risk

27. **Marketing vs fact** (no promises without backend support). — Must  
28. **Consent / compliance** if collecting data or sending comms. — Must when applicable  
29. **Retention / deletion** if showing regulated data. — Should when applicable  

---

## F. Tests and proof (DoD)

30. **Backend automated tests** — file paths + **exact command** + **result** (date/commit). — Must (or written justification + approver)  
31. **Frontend automated tests** — file paths + **exact command** + **result**. — Must when FE changes (or written justification + approver)  
32. **Manual smoke** (happy path + one error path). — Must  
33. **Test data** / how to reproduce on staging. — Should  
34. **Acceptance criteria** checkboxes tied to requirement IDs. — Must  
35. **QC / verdict artefact** path if process requires it. — Must when applicable  

---

## G. Deploy and operations

36. **Environment variables** new or changed. — Must  
37. **Deploy order** (DB → API → FE). — Must  
38. **Rollback** note (migration vs code mismatch). — Should  
39. **Post-deploy checks** (first hour / day). — Should  

---

## H. Documentation traceability

40. **Traceability matrix** row for this screen (see `matrix/`). — Must  
41. **Requirement tree** (parent screen ID + child DATA/API/FE-UI IDs). — Must  
42. **Link to global canonical docs** (full app screen list, billing policy, layout standard). — Must  

---

## I. Delivered code — full stack (explicit; no “obvious” code)

43. **Backend file list:** every changed/new file under `backend/` (repo-relative paths), one per line. — Must (or `N/A` + reason)  
44. **Frontend file list:** every changed/new file under `frontend/` (repo-relative paths), one per line. — Must (or `N/A` + reason)  
45. **New or changed route(s):** URL path + file defining the route + nav entry file (if any). — Must when user can open a new URL (or `N/A` + reason)  
46. **tRPC procedures consumed on FE:** names + file(s) where `trpc.*.useQuery/useMutation` is called. — Must when FE calls API (or `N/A` + reason)  
47. **Shared types:** `packages/` or `shared/` paths if any cross FE/BE. — Should when applicable  
48. **Build proof — backend:** e.g. `cd …/backend && npm run build` → **exit code** + date/commit. — Must when BE list non-empty (or `N/A` + reason)  
49. **Build proof — frontend:** e.g. `cd …/frontend && npm run build` → **exit code** + date/commit. — Must when FE list non-empty (or `N/A` + reason)  

---

## Rule

**Screen-level spec is incomplete** if any **Must** is blank without an approved **`N/A` + reason**, or if **§ I** does not match the actual PR diff for this screen.

**“Full code” for delivery** means: **§ I lists match the merged change set** for the screen slice, and **§ F + § I (48–49)** contain honest build/test evidence.
