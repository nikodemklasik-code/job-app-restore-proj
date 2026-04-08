import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';

const MOCK_JOBS = [
  { id: 'j1', title: 'Senior Frontend Engineer', company: 'Stripe', fit: 96 },
  { id: 'j2', title: 'Staff Software Engineer', company: 'Vercel', fit: 89 },
  { id: 'j3', title: 'Lead React Developer', company: 'Linear', fit: 92 },
  { id: 'j4', title: 'Principal Engineer', company: 'Notion', fit: 84 },
  { id: 'j5', title: 'Frontend Architect', company: 'Figma', fit: 91 },
  { id: 'j6', title: 'Senior UI Engineer', company: 'Loom', fit: 78 },
];

export const jobsRouter = router({
  search: publicProcedure
    .input(z.object({ query: z.string().optional() }))
    .query(async ({ input }) => {
      const q = input.query?.trim().toLowerCase() ?? '';
      return q
        ? MOCK_JOBS.filter((j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q))
        : MOCK_JOBS;
    }),
});
