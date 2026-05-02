# ⚠️ VPS DEPLOYMENT WARNING

**Date:** May 2, 2026  
**Status:** DIRECT VPS DEPLOYMENT - LOCAL CHANGES NOT YET COMMITTED

## Current Situation

- **Local branch:** feature/draft-applications-toasts-loading
- **Main branch:** Behind by several commits
- **Changes made:**
  1. Added `react-hot-toast` library
  2. Replaced all `alert()` with toast notifications
  3. Added loading states to buttons
  4. Fixed TypeScript errors in Job Radar
  5. Added missing API endpoints

## Files Modified

### Frontend
- `frontend/src/App.tsx` - Added Toaster provider
- `frontend/src/app/jobs/JobsDiscovery.tsx` - Toast notifications + loading states
- `frontend/src/components/jobs/JobCardExpanded.tsx` - Loading states + disabled buttons
- `frontend/src/components/jobs/JobCardCompact.tsx` - Loading states
- `frontend/src/app/jobs/JobDetailPage.tsx` - Fixed unused import
- `frontend/src/features/job-radar/**` - Fixed multiple TypeScript errors

### Backend
- `backend/src/trpc/routers/jobRadar.router.ts` - Added missing endpoints:
  - `createComplaint`
  - `getScanStatus`
  - `rescanReport`
  - `adminListComplaints`
  - `adminReviewFinding`
  - `adminUpdateKillSwitch`

## Deployment Steps

1. ✅ Copy files to VPS
2. ⏳ Build on VPS (frontend + backend)
3. ⏳ Deploy to production
4. ⏳ Test end-to-end flow
5. ⏳ Commit to GitHub (after verification)

## Risk Level: MEDIUM

- Changes are isolated to Draft Applications flow
- Job Radar endpoints added but not breaking existing functionality
- Toast library is new dependency but well-tested
- All changes have TypeScript validation

## Rollback Plan

If issues occur:
1. Revert to previous build: `git checkout HEAD~1`
2. Rebuild: `npm run build && npm run deploy`
3. Restart PM2: `pm2 restart jobapp-server`

---

**Next:** Deploy to VPS and test
