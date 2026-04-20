# Profile as source of truth — backend spec

Index: [`README.md`](./README.md) · Monolit §2: [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md)

---

## Status

Profile exists conceptually, but backend logic does not yet appear fully expanded into the rest of the product.

The backend must stop treating profile as:
- just basic user info
- just CV fields
- just passive storage

It must become the source of truth for downstream product behaviour.

---

## Required new profile logic

Add and integrate:
- **Work Values**
- **Auto-Apply Threshold**
- **Growth Plan**
- **Roadmap**
- **Skills-Course Relationships**
- **Target Role**
- **Target Seniority**
- **Target Salary Range**
- **Practice Areas**
- **Blocked Areas**
- **High-Impact Improvements**

---

## Required downstream effects

Profile data must influence:
- **Jobs**
- **Job Radar**
- **Employer Validation**
- **Auto-Apply Eligibility**
- **Skill Lab**
- **Growth Recommendations**
- **Manual Review Recommendations**

---

## Required backend tasks

- extend profile schema
- extend profile persistence
- add profile → downstream mapping logic
- expose profile-driven filtering and thresholds
- expose work values for employer and listing evaluation
- expose roadmap / growth plan in API shape

---

## QC must validate

- values are saved and returned correctly
- auto-apply threshold actually changes eligibility logic
- growth fields are not just stored, but used
- profile updates propagate correctly into dependent modules
- no “dead data” fields exist with no product effect
