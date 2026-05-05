# Jobs UI Fixes - May 5, 2026

## 1. Match Analysis - More Specific Details

### Current:
- "Strong technical skills alignment" (generic)
- "Domain knowledge is relevant" (no details)
- "Salary slightly below your target range" (no numbers)
- "Some preferred skills missing" (no specifics)

### Required:
- Highlight WHICH skills match (e.g., "React, TypeScript, Node.js")
- Specify domain knowledge (e.g., "FinTech experience: 3 years")
- Show salary gap (e.g., "£5k below target: £75k vs £80k target")
- List missing skills (e.g., "Missing: Kubernetes, GraphQL")

## 2. Email Application Bug

### Problem:
After clicking "Send Email" in Applications, the email field shows job description instead of email template

### Expected:
Email field should show:
```
To: [employer email from job listing]
Subject: Application for [Job Title] at [Company]
Body: [Professional application email template]
```

### Fix Location:
- `frontend/src/app/applications/ApplicationsPage.tsx` or similar
- Check email composition logic

## 3. "Open" Button Not Working

### Problem:
"Open" button in top right doesn't lead anywhere

### Fix:
- Should open job listing in new tab (external URL)
- Or navigate to job detail page

## 4. Provider List - Alphabetical Sorting

### Current Order:
Reed, Adzuna, Jooble, Indeed⚠, Gumtree, Totaljobs, CV-Library, Find a Job, LinkedIn⚠, Monster UK, Glassdoor⚠

### Required Order (Alphabetical):
1. Adzuna
2. CV-Library
3. Find a Job
4. Glassdoor⚠
5. Gumtree
6. Indeed⚠
7. Jooble
8. LinkedIn⚠
9. Monster UK
10. Reed
11. Totaljobs

### Fix Location:
- `frontend/src/app/jobs/JobsDiscovery.tsx`
- Reorder `ALL_SOURCES` array
- Update `JOB_SOURCE_CATALOG` order

## 5. Results Limit

### Problem:
Currently limited to 8 results

### Required:
- Max should be what user selects
- No artificial 8-result limit
- User should control results count

### Fix Location:
- Check `searchDiscoveryJobs` endpoint
- Check frontend pagination/limit logic
- Remove hardcoded limit of 8
