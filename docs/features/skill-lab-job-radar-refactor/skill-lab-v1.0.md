# Skill Lab — refactor spec (v1.0)

Index: [`README.md`](./README.md)

---

## Canonical name

**Skill Lab**

## Purpose

Skill Lab is the user’s market value and capability intelligence layer.

It must help the user understand:

- what skills they have  
- which skills are strong  
- which skills are underused  
- which skills are backed by evidence  
- which skills increase salary potential  
- which skills strengthen CV value  
- which skills still need proof, practice, or verification  

## Emotional effect

The user should feel:

- clearer about their professional value  
- more aware of what they can leverage  
- more motivated to strengthen the right things  
- less vague about “what they are worth”  

## What Skill Lab is

Skill Lab is:

- skill intelligence  
- market value interpretation  
- salary relevance visibility  
- verification and evidence mapping  
- CV value interpretation  
- course-to-skill connection  
- growth path support  

## What Skill Lab is not

Skill Lab is not:

- a static skills list  
- a document archive  
- a generic courses page  
- a second Profile page  
- a dead verification dashboard  
- a bland tag cloud of claimed abilities  

---

## Main sections

- **Hero Header**  
- **Skill Overview**  
- **Market Value**  
- **Salary Impact**  
- **CV Value Signals**  
- **High-Value Skills**  
- **Underused Skills**  
- **Verification**  
- **Proof And Evidence**  
- **Courses Supporting Skills**  
- **What Strengthens Your CV**  
- **What Weakens Your Position**  
- **Growth Recommendations**  

---

## Required product logic

### A. CV value signals must be prominent

CV Value Signals must not be buried inside a secondary card.

The user must clearly see:

- which skills strengthen their CV  
- which skills are valuable in the market  
- which skills contribute to stronger salary positioning  
- which strengths are currently underexposed  

### B. Salary relevance must be visible

Skill Lab must explicitly connect skills to earning potential.

Examples:

- **High Salary Impact**  
- **Strong Market Value**  
- **Good Salary Leverage**  
- **Low Proof, High Potential**  
- **Strong CV Value Signal**  

### C. Skills and courses must be connected

Courses and certificates must not exist as a separate dead list.

Show:

- **Related Skills**  
- **Courses Supporting This Skill**  
- **This Course Strengthens**  
- **Learning Evidence**  
- **Still Needs Practice**  
- **Still Needs Verification**  

### D. Skill verification must be actionable

Verification should not be a passive status label only.

The user should understand:

- what is already verified  
- what is only declared  
- what is observed  
- what needs stronger proof  
- what can be verified next  

---

## Credit logic

### Free

- **View Skill Overview**  
- **View Declared Skills**  
- **View Basic Related Courses**  

### Fixed credit actions

- **Skill Value Insight** = **2 Credits**  
- **Salary Impact Insight** = **3 Credits**  
- **Verification Flow** = **4 Credits**  
- **CV Value Deep Review** = **5 Credits**  

### Estimated cost actions

For heavier multi-skill review:

- **Estimated Skill Audit**  
- **Estimated Salary Position Review**  
- **Estimated CV Value Report**  

Display:

- **Estimated Cost**  
- **Maximum Cost Without Further Approval**  
- **Continue For X Credits**  

---

## Required front-end direction

Skill Lab must feel:

- premium  
- insight-driven  
- valuable  
- motivating  
- modern  
- more like a career intelligence product than a spreadsheet  

Avoid:

- grey admin panel feel  
- raw tag lists  
- hidden salary logic  
- lifeless skill tables  

---

## Suggested components

```text
frontend/src/features/skill-lab/components/
  SkillLabHeroHeader.tsx
  SkillCard.tsx
  SkillValueCard.tsx
  SalaryImpactCard.tsx
  CvValueSignalCard.tsx
  VerificationCard.tsx
  EvidencePanel.tsx
  RelatedCourseList.tsx
  GrowthRecommendationPanel.tsx
  SkillLabActionBar.tsx
```

---

## Repo changes (frontend)

Keep and refactor the Skill Lab feature into a clearer value-first module.

Suggested focus areas:

- `frontend/src/app/skills/...`  
- `frontend/src/features/skills/...` or equivalent existing paths  

### Required outcome

The Skill Lab route must clearly expose:

- salary value  
- CV value  
- verification  
- courses linked to skills  
- growth path recommendations  

---

## What must never be mixed into Skill Lab

- Job Radar listing discovery  
- Profile form editing as the primary experience  
- generic AI Assistant chat layout  
- buried salary logic  
- “claimed skills only” with no market interpretation  
