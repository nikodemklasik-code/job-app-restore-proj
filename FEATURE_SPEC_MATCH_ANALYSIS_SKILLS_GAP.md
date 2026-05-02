# Feature Spec: Match Analysis & Skills Gap

**Date:** May 2, 2026  
**Priority:** High  
**Status:** Planning

---

## 🎯 Requirements Summary

1. **Job Search Results Persistence** ✅ (Already Done)
   - Search results stored in URL params
   - Persist across navigation

2. **Draft Applications** ❌ (TODO)
   - Save job offers to drafts
   - Show in /applications page

3. **Match Analysis Flip Card** ❌ (TODO)
   - Click to see Skills & Experience breakdown
   - Show matched vs missing skills

4. **Skills Gap Section** ❌ (TODO)
   - Show missing skills with importance
   - Link to Skills Lab

---

## 📋 Implementation Priority

### Phase 1: Draft Applications (2-3 hours)
- Add "Save to Draft" button
- Create applications.saveDraft() endpoint
- Show in /applications page

### Phase 2: Match Analysis Flip Card (3-4 hours)
- Create flip card component
- Show matched skills on back
- Show missing skills on back

### Phase 3: Skills Gap Section (2-3 hours)
- Show must-have skills (red)
- Show nice-to-have skills (amber)
- Link to Skills Lab

### Phase 4: Backend Endpoints (4-5 hours)
- jobs.getSkillBreakdown()
- jobs.getSkillsGap()

---

## 🔧 Technical Details

### API Endpoints Needed

1. **applications.saveDraft**
```
Input: { jobId, userId, notes? }
Output: { id, status: 'draft' }
```

2. **jobs.getSkillBreakdown**
```
Input: { jobId, userId }
Output: {
  matched: [{ skill, userLevel, jobLevel }],
  missing: [{ skill, importance, level }]
}
```

3. **jobs.getSkillsGap**
```
Input: { jobId, userId }
Output: {
  mustHave: [{ skill, level, learningPath? }],
  niceToHave: [{ skill, level }]
}
```

---

## ✅ Acceptance Criteria

### Draft Applications
- [ ] "Save to Draft" button on job card
- [ ] Saves to database
- [ ] Shows in /applications
- [ ] Can edit before submitting

### Match Analysis Flip Card
- [ ] Shows score (60%)
- [ ] Flip shows matched skills
- [ ] Flip shows missing skills
- [ ] Smooth animation

### Skills Gap Section
- [ ] Shows must-have skills (red)
- [ ] Shows nice-to-have skills (amber)
- [ ] Link to Skills Lab works
- [ ] Responsive design

---

**Total Effort:** 11-15 hours  
**Next Step:** Start Phase 1 (Draft Applications)

