# Skill Lab logic — backend spec

Index: [`README.md`](./README.md) · Monolit §3: [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md)

---

## Status

Skill Lab appears partially started, but not fully product-complete in backend logic.

It still needs stronger backend support for:
- value interpretation
- salary interpretation
- CV impact
- verification logic
- course linkage
- growth signalling

---

## Required backend features

Implement or complete:
- **Skill Value Logic**
- **Salary Impact Logic**
- **CV Value Signal Generation**
- **High-Value Skill Detection**
- **Underused Skill Detection**
- **Verification State Logic**
- **Evidence State Logic**
- **Course-To-Skill Mapping**
- **Growth Recommendation Hooks**

---

## Required skill states

- **Declared**
- **Observed**
- **Strengthening**
- **Verified**
- **Strong Signal**

---

## Required outputs

Skill Lab backend should support outputs such as:
- skill market value
- salary relevance
- CV value strength
- underexposed strength
- missing proof
- related courses
- suggested next verification action

---

## QC must validate

- salary impact is not fabricated without logic
- skill value outputs are consistent and explainable
- courses actually link to skills
- evidence and verification are not fake labels only
- the module behaves like capability intelligence, not a flat list
