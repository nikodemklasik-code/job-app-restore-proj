# Quality Control Developer Spec

**Wykonanie implementacji (hierarchia SoT, format recenzji, integracja):** [`./IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md)

**Po werdykcie QC (agenci):** czytają *Required Next Action* w Twoim dokumencie recenzji i wdrażają w repo — **nie** zastępują werdyktu wielodniową dyskusją bez diffu; reguły **§5a** i **Hard Rule 8** w `IMPLEMENTATION_EXECUTION_RULES.md`.

**Rozszerzony model raportów, certyfikacji i komunikacji z PO:** [`../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md`](../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md) · indeks `docs/qc/`: [`../qc/README.md`](../qc/README.md). **QC:** każda recenzja ze **QC Verdict** — w *Required Next Action* jako **pierwsza** treść obowiązkowa **Mandatory first line** (ten sam tekst co w **§8** [`IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md) i w szablonie specu raportowania).

**Przekrój OpenAI (modele + sekrety):** [`./QC_OpenAI_Models_And_Secrets_Spec.md`](./QC_OpenAI_Models_And_Secrets_Spec.md)

## Owner
**Quality Control Developer**

## Role
Final quality gate before integration.

QC is responsible for validating:
- technical correctness
- product correctness
- downstream behavioural impact
- cost honesty
- source restriction integrity
- consent enforcement
- deploy safety
- implementation reality

QC does not approve work simply because:
- it compiles
- tests pass
- a screen renders
- a module can be demoed once
- documentation was updated

---

## Enforcement Rule

QC must reject any delivery that is mainly:
- a summary
- a plan
- a spec restatement
- a list of intentions
- partial code without wiring
- UI without real state logic
- backend without real product effect
- “done” claims without implemented repository changes

Approve only implemented, wired, testable code.

---

## QC Validation Layers

## A. Functional Validation
Check:
- does it run
- does it persist
- does it return correct outputs
- does it influence dependent modules where required

## B. Product Validation
Check:
- does it match the product spec
- does it support the intended user value
- is it more than a technical placeholder
- does it actually change behaviour in the product

## C. Risk Validation
Check:
- does cost logic behave honestly
- do source restrictions hold
- do approvals really protect the user
- do deploy guards actually block dangerous actions
- do settings and preferences constrain behaviour

---

## Delivery Review Format

For every agent delivery, QC must verify:

### Previous QC reports on same scope (mandatory)

**A QC verdict is invalid unless** QC has **checked** `docs/qc-reports/` for **previous QC reports** for the **same scope** (resubmission, follow-up, or overlapping slice) and has **explicitly reported their status** (file path + decision summary) **in the current review document**.

### Scope Implemented
- does it match owned scope

### Files Changed
- are real repo files changed
- are the right layers touched

### Routes / APIs / Schemas / Components Changed
- are changes wired, not cosmetic

### Tests Added Or Updated
- are tests relevant
- do they match the changed scope

### Ready For QC
- is the claim justified

### Blockers
- are blockers real or just avoidance

---

## Module-Specific QC Checklist

### Credits And Billing Engine
- monthly free allowance exists
- free allowance resets correctly
- fixed cost spend works
- estimated cost spend requires approval
- actual spend never exceeds approved max
- usage history is correct
- insufficient balance is handled properly

### Profile As Source Of Truth
- work values persist
- auto-apply threshold persists
- growth plan persists
- roadmap persists
- profile fields influence downstream module logic
- no dead profile fields exist with no product effect

### Skill Lab
- skill value logic exists
- salary impact logic exists
- CV value signals exist
- verification states are meaningful
- courses map to skills
- evidence states are meaningful

### Job Radar
- route identity is clean
- cards are high-signal and non-admin-like
- fit and risk logic are understandable
- employer context is actionable
- cost logic is visible and honest

### Legal Hub Search
- source registry loads correctly
- source scope toggles work
- answer uses only active approved sources
- sources used are shown honestly
- search scope summary is correct
- PDF export is complete and clean

### Warmup / Coach / Interview / Negotiation
- session types are separated
- pricing models are separated
- outputs match module purpose
- analytics and usage rules are separated
- modules no longer share accidental logic

### Community / Settings / Consent
- settings persist
- preferences affect product behaviour
- discoverability flags work
- case study preferences are respected
- social consent is respected

### Deploy Integrity
- canonical repo marker exists
- wrong-folder deploy is blocked
- remote path validation exists
- host and domain validation exists
- copied repo cannot deploy by default

---

## Approval Rule
Nothing is approved until QC confirms:
- functional correctness
- product correctness
- risk correctness
- real implementation in the repository
- **Previous QC on same scope:** the current verdict is **invalid** unless QC has checked `docs/qc-reports/` for prior reports on the same scope and **explicitly stated their status** in this review (see *Delivery Review Format* → *Previous QC reports on same scope*).

## Rejection Rule
Reject anything that is:
- incomplete
- mixed with another module
- misleading
- falsely marked done
- visually weak where product quality matters
- honest only at the code level, but not at the product level
- still effectively in planning state

## Handoff to Product Owner

After **QC approval**, the Product Owner reviews **product meaning** — not implementation details first. PO sign-off rules: [`Product_Owner_Spec.md`](./Product_Owner_Spec.md) (*Review order*, *PO approval gate*).

## One-Line Instruction
```text
Act as the final quality gate. Validate every delivery for functional correctness, product correctness, downstream behavioural impact, cost honesty, source restriction integrity, consent enforcement, deploy safety, and real implementation in repository code. Reject anything incomplete, mixed, misleading, or falsely marked done.
```
