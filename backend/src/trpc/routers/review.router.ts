import { publicProcedure, router } from '../trpc.js';

export const reviewRouter = router({
  getQueue: publicProcedure
    .query(async () => [
      { id: 'r1', type: 'Job Fit', title: 'Senior Frontend Engineer at Stripe', fit: 96, status: 'High Priority', time: '2 hours ago', action: 'Review match details' },
      { id: 'r2', type: 'CV Review', title: 'Updated CV – Alex Morgan v2.4', fit: 0, status: 'AI Analysis Ready', time: 'Yesterday', action: 'View analysis' },
      { id: 'r3', type: 'Application Draft', title: 'Cover Letter for Vercel', fit: 82, status: 'Needs Revision', time: '3 days ago', action: 'Improve opening' },
    ]),
});
