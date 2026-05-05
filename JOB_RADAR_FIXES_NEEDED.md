# Job Radar & Job Card Issues - May 5, 2026

## Problems Identified

### 1. Job Radar Scan Button
**Status:** ✅ WORKING
- Button is present in JobCardExpanded
- `onStartRadarScan` is properly connected in JobsDiscovery
- `startRadarScanMutation` uses `api.jobRadar.startScan`
- Navigates to `/jobs/radar/${scanId}` on success

**Possible user issues:**
- User may not be signed in (shows toast error)
- Mutation may be failing (check backend logs)
- Button may be disabled during other operations

### 2. "View Full Report" Button
**Status:** ❌ INCORRECT LINK
- Currently links to `/jobs/${job.id}` (JobDetailPage)
- Should link to Job Radar scan if one exists
- JobDetailPage may not show full job description

**Fix needed:**
- Check if job has associated Job Radar scan
- If yes, link to `/jobs/radar/${scanId}`
- If no, show job description in modal or separate page

### 3. Match Analysis Discrepancy
**Status:** ⚠️ NEEDS INVESTIGATION
- JobCardCompact shows basic fit score
- JobCardExpanded shows detailed breakdown (skills, experience, salary, culture)
- Data comes from `fitAnalysis` prop
- If `fitAnalysis` is missing, uses mock data based on `job.fitScore`

**Possible causes:**
- Backend not returning `fitAnalysis` in job search results
- Frontend not passing `fitAnalysis` to JobCardExpanded
- Mock data generation creating inconsistency

### 4. Job Description Display
**Status:** ⚠️ PARTIAL
- JobCardExpanded shows parsed description with sections
- JobRadarReport shows full description
- JobDetailPage (if exists) may show different format

## Recommended Fixes

### Fix 1: Update "View Full Report" Link
```typescript
// In JobCardExpanded.tsx
<Link
  to={job.radarScanId ? `/jobs/radar/${job.radarScanId}` : `/jobs/${job.id}`}
  className="..."
>
  <FileText className="w-4 h-4" />
  {job.radarScanId ? 'View Radar Report' : 'View Full Details'}
</Link>
```

### Fix 2: Add radarScanId to Job Type
```typescript
// In JobsDiscovery.tsx
type JobResult = {
  // ... existing fields
  radarScanId?: string; // Link to existing Job Radar scan
};
```

### Fix 3: Ensure fitAnalysis is Passed
```typescript
// In JobsDiscovery.tsx, when rendering JobCardExpanded
<JobCardExpanded
  job={job}
  fitAnalysis={job.fitAnalysis} // Make sure this is passed
  // ... other props
/>
```

### Fix 4: Backend - Return fitAnalysis in Search
```typescript
// In backend jobs.router.ts
// Ensure explainJobFit returns structured data
const fitAnalysis = await explainJobFit(job, profile, experiences);
return {
  ...job,
  fitAnalysis: {
    skillsMatch: fitAnalysis.skillsMatch,
    experienceMatch: fitAnalysis.experienceMatch,
    salaryMatch: fitAnalysis.salaryMatch,
    cultureMatch: fitAnalysis.cultureMatch,
    strengths: fitAnalysis.strengths,
    gaps: fitAnalysis.gaps,
    extractedRequirements: fitAnalysis.extractedRequirements,
  }
};
```

## Testing Checklist

- [ ] Click "Job Radar Scan" button - should start scan and navigate
- [ ] Click "View Full Report" - should show complete job info
- [ ] Compare Match Analysis in compact vs expanded view - should be consistent
- [ ] Check if job description shows in all views
- [ ] Verify fitAnalysis data is returned from backend
- [ ] Test with and without existing Job Radar scans

## User Feedback

> "job radar scan przy ofertach pracy nie dziala"
- Need to verify if button is visible and clickable
- Check if mutation is failing
- Check backend logs for errors

> "wchodazc w zakladke Viev Full Report nadal nie ma pelnej opisowej informacji o stanowisku"
- "View Full Report" links to wrong page
- Should link to Job Radar report or show full description

> "Match Analysis jest inny anizeli ten na pogladzie w ogloszeniu Match Breakdown"
- fitAnalysis may not be passed correctly
- Mock data may be generating different values
- Backend may not be returning consistent data
