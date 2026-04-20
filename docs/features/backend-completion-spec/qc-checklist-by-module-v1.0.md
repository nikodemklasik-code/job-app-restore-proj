# Module-by-module QC checklist

Index: [`README.md`](./README.md) · Monolit §11: [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md)

---

## Credits and billing engine

- monthly free allowance exists
- free allowance resets correctly
- fixed cost spend works
- estimated cost spend requires approval
- actual spend never exceeds approved max
- usage history is correct
- insufficient balance is handled properly

---

## Profile as source of truth

- work values persist
- auto-apply threshold persists
- growth plan persists
- roadmap persists
- profile fields influence downstream module logic
- no dead profile fields with no product effect

---

## Skill Lab

- skill value logic exists
- salary impact logic exists
- CV value signals exist
- verification states are meaningful
- courses map to skills
- evidence states are meaningful

---

## Legal Hub search

- source registry loads correctly
- source scope toggles work
- answer uses only active approved sources
- sources used are shown honestly
- search scope summary is correct
- PDF export is complete and clean

---

## Warmup / Coach / Interview / Negotiation

- session types are separated
- pricing models are separated
- outputs match module purpose
- analytics and usage rules are separated
- modules no longer share accidental logic

---

## Community / settings / consent

- settings persist
- preferences affect product behaviour
- discoverability flags work
- case study preferences are respected
- social consent is respected

---

## Deploy integrity

- canonical repo marker exists
- wrong-folder deploy is blocked
- remote path validation exists
- host and domain validation exists
- copied repo cannot deploy by default
