# Product Owner Spec

**Wykonanie implementacji (obowiązki PO, flow, format recenzji PO):** [`./IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md) — w tym **§17** (ponowna weryfikacja zakresów), **§5a** i **Hard Rule 8** (po werdykcie QC: agenci → repo + §6 / *Blocker* — szczegóły w akapicie poniżej).

**Po werdykcie QC:** eskalacja do PO tylko tam, gdzie wymagają tego specy (np. produkt / ryzyko); nie zastępuje to zespołowi **§5a** ani **Hard Rule 8** — dalsza praca agentów = zmiany w repo + raport §6 lub jeden udokumentowany *Blocker* (ten sam plik).

**OpenAI — modele i sekrety (sign-off produktowy po QC):** [`./Product_Owner_OpenAI_Models_And_Secrets_Spec.md`](./Product_Owner_OpenAI_Models_And_Secrets_Spec.md)

## Owner
**Product Owner**

## Role
Own product meaning, priorities, boundaries, and final user-facing coherence.

The Product Owner does not code and does not replace QC.  
The Product Owner approves product sense after QC confirms technical and product readiness.

---

## Execution supervision mode (binding mandate)

When supervising execution, the Product Owner (or a **delegate acting strictly within this spec**) **actively enforces** that the team moves from documentation and partial slices into **real implementation**, **QC review**, and **integration** — per [`IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md) and [`../qc-reports/qc-live-status.md`](../qc-reports/qc-live-status.md).

### Supervise continuously

- **Stalled Agents 2 / 3 (execution enforcement):** require **same-day** committed **implementation scope declaration** in `docs/qc-reports/` per [`IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md) **§5** *Execution enforcement — same-day scope declaration* and **Hard Rule 9** — bounded slice, **exact repo file paths**, **delivery report path** (§6 file), **Ready For QC** target (or one Blocker). **Block discussion loops** until that exists. If they still do not land repo work: mark **STALLED** in [`../qc-reports/qc-live-status.md`](../qc-reports/qc-live-status.md), then **narrow**, **reassign**, or **suspend**.
- **Agents** implement **in the repository**, not in chat instead of work (**§5a**, **Hard Rule 8** in `IMPLEMENTATION_EXECUTION_RULES.md`).
- **Each agent** stays within **owned scope** unless integration explicitly requires coordination (see squad workboard and agent specs).
- **QC** checks **previous reports**, issues **valid** verdicts in **§8** format, and does **not** treat **Ready For QC** as **Approved For Integration**.
- **No one** broadens **narrow** QC approvals into a **false** claim that a **wider** slice is approved (OpenAI / Practice / Legal / Job Radar — see binding blocks in `qc-live-status.md` and the underlying `docs/qc-reports/qc-*.md` verdicts). In particular, **do not** treat **Live Interview billing** *Approved For Integration* as approval of the **wider Interview module**, **Negotiation**, or the **Interview/Negotiation §6** intake until that intake is **factually corrected** and re-issued by QC.
- **Module boundaries** stay **coherent** (see **Module Boundaries** below).
- **Pricing / allowance / salary-above eligibility / Community vs Consent** are **resolved at PO level** only when **properly escalated** through QC or squad rules (not via ad-hoc chat bypass).

### Current state to enforce (do not contradict in status claims)

Until superseded by a **fresh** §8 QC verdict + broadcast update:

- **Agent 1** foundations slices **A-F1, A-F2, A-F4** — **Approved For Integration** (see [`../qc-reports/qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md`](../qc-reports/qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md)).
- **Narrow** OpenAI layer + Assistant meta + optional Legal **catalog** grounded summary slice — **Approved For Integration** (see [`../qc-reports/qc-agent-work-spot-verification-2026-04-19.md`](../qc-reports/qc-agent-work-spot-verification-2026-04-19.md)) — **do not** extend AFI to the wider frontend / Practice batch or to full Legal **`file_search`** / vector-store retrieval without a new submission and QC.
- **Wider** Practice / Settings / Community subject — **not** approved as a whole (see [`../qc-reports/qc-decision-practice-modules-settings-community-2026-04-18.md`](../qc-reports/qc-decision-practice-modules-settings-community-2026-04-18.md)); narrow resubmissions (e.g. settings URL tab) are **only** as far as their **own** QC verdict file states.
- **Process posture (current):** **clean** — Agent → §6 → QC → §8 is the channel; keep **execution discipline** and **boundary control** (see [`../qc-reports/qc-live-status.md`](../qc-reports/qc-live-status.md) *Postawa procesowa*).
- **PO reading (Agent 3 slice family — binding summary):** (1) **Coach** narrow slice — **remains Approved For Integration** (same verdict chain as in [`../qc-reports/qc-live-status.md`](../qc-reports/qc-live-status.md) *Odczyt PO*). (2) **Live Interview billing** narrow slice — **remains Approved For Integration** — [`../qc-reports/qc-verdict-live-interview-billing-slice-2026-04-21.md`](../qc-reports/qc-verdict-live-interview-billing-slice-2026-04-21.md) **only**; **do not** treat it as **wider Interview** approval. (3) **Interview / Negotiation** combined §6 intake — **still Not Approved** because the **current intake is factually wrong**; **wait for Agent 3** to submit a **corrected** §6 before treating any path as closed. (4) **Wider** Practice / Settings / Community — **remains not approved** — [`../qc-reports/qc-decision-practice-modules-settings-community-2026-04-18.md`](../qc-reports/qc-decision-practice-modules-settings-community-2026-04-18.md).
- **Agent 3 (C) — supervision posture.** **Do not** request **extra work** on the **approved Coach** slice **unless** QC publishes a **new §8** finding. **Do not** widen **Live Interview AFI** into a claim that **Interview / Negotiation** or full **C-F1** is approved. **Wait** on **Agent 3’s corrected intake** for Interview/Negotiation. Keep the team on **truthful scope boundaries** and **continued implementation** in scopes that are actually approved; **do not allow false widening**. **Community vs Consent** product questions remain **PO-on-escalation** — not a substitute for fixing the §6 intake or broadening AFI in prose.
- **Wider** Legal Hub Search, Skill Lab **core**, and **wider** Job Radar beyond already-accepted threads — still require **intake**, **repo delivery**, and **QC** (no blanket AFI from adjacent slices).

### Immediate responsibilities

1. Keep the team in **implementation mode** (repo evidence + §6 reports), not discussion mode.
2. **Prevent scope drift** and **false completion** claims (Hard Rule 7 / 8).
3. **Require** each agent: **repository changes** plus **delivery report** (§6, `READY FOR QC` when honest).
4. **PO product review** only **after QC** where **product-risk** or **product-decision** is involved (**Review order** above).
5. Decide **narrow PO questions** only when **properly escalated**:
   - allowance values  
   - pack pricing  
   - salary-above eligibility rule  
   - Community vs Consent separation  
   - Legal Hub migration path from **catalog grounding** to **`file_search` / vector store**

### Delegate / supervisor must not

- Do **work for agents** (no substituting implementation).
- Do **report discovery for QC** (agents and QC find reports per `IMPLEMENTATION_EXECUTION_RULES.md`; PO does not become a search clerk).
- **Do not** request **new** implementation changes on the **Approved Coach narrow slice** **except when** **QC** records a **new finding** in a fresh **§8** verdict (no PO-driven churn while the slice is agent-closed and process-clean).
- Treat **Live Interview billing** *Approved For Integration* as **only** that billing slice — **do not** use it to justify **wider Interview** or **Interview/Negotiation** product approval.
- Approve **technically neat** but **product-incoherent** work — send back with product-level rationale after QC has spoken.

---

## Review order (mandatory)

1. **Do not** review implementation details first.
2. **Review product meaning after QC** — when QC has already validated delivery against functional, product, and risk criteria for the slice.

---

## PO approval gate

Approve **only if** all of the following are true:

- the **module purpose** is clear  
- the **UX** is coherent  
- **pricing logic** is honest  
- the module is **not mixed** with another  
- the screen belongs to the **same product language** (naming, tone, layout discipline across the app)

If any item fails, send back for revision with a clear product-level rationale (not a substitute for QC).

---

## Product Owner Responsibilities

### 1. Priorities
Maintain the execution order across:
- Billing and credits
- Profile as source of truth
- Skill Lab
- Job Radar
- Legal Hub Search
- Practice modules
- Settings / Consent / Community
- Deploy integrity

### 2. Product Philosophy
Protect the new product philosophy:
- **no exclusive functional subscription tiers**
- **everyone can access the full product**
- **usage depth is controlled through credits**
- **monthly free allowance exists**
- **cost is shown honestly**
- **heavier actions require approval**

### 3. Module Boundaries
Protect clean boundaries such as:
- **Coach ≠ Interview**
- **Warmup ≠ Interview**
- **Negotiation ≠ Coach**
- **Skill Lab ≠ static skills list**
- **Job Radar ≠ admin panel**
- **Legal Hub Search ≠ open legal chatbot**

### 4. UX Coherence
Approve:
- naming
- routing
- module purpose
- cost communication
- user-facing meaning
- sequence of interaction
- cross-product consistency

### 5. Implementation Phase Enforcement
Product Owner must help move the team from planning into implementation by:
- refusing endless re-documentation
- asking for repository evidence, not concept repetition
- validating that work is actually being executed phase by phase
- escalating if ownership is drifting or phases are being skipped

### 6. Final Signoff
Only sign off after:
- **QC approval** (prerequisite)
- PO review per **Review order** and **PO approval gate** above
- product sense validation
- module purpose validation
- credit philosophy consistency
- user-facing coherence check
- **real implementation in the repository** (see *Product Owner Review Format* below)

---

## Product Owner Signoff Areas

### Billing
- monthly free allowance is clear
- credits-first philosophy is visible
- no caste-like subscription logic remains

### Profile
- values, threshold, roadmap, and growth logic feel meaningful
- profile actually behaves like a source of truth

### Skill Lab
- communicates professional value and salary relevance
- does not feel like a dead list

### Job Radar
- feels alive, strategic, and selective
- does not feel like a scraped dashboard

### Legal Hub Search
- clearly limited to approved sources by default
- answer contract feels trustworthy and careful

### Practice Modules
- each one has a distinct role
- shared shell does not blur product meaning

### Settings / Community
- preferences and social systems feel intentional
- not bolted on

---

## Product Owner Review Format

For each phase, confirm:
- what changed in repo
- whether the right scope was implemented
- whether module meaning is now clearer
- whether the implementation matches the product philosophy
- whether anything still needs rejection or correction after QC

## One-Line Instruction
```text
Own the product meaning, priorities, and final user-facing coherence. Approve boundaries, pricing philosophy, module purpose, and UX consistency only after Quality Control confirms technical and product readiness and real implementation in the repository — then apply the PO approval gate (purpose, UX, honest pricing, no module mixing, one product language).
```
