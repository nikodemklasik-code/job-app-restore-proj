import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';

export const applicationsRouter = router({
  getAll: publicProcedure
    .output(z.array(z.object({ id: z.string(), jobTitle: z.string(), company: z.string(), status: z.string() })))
    .query(async () => [
      { id: 'a1', jobTitle: 'Senior Frontend Engineer', company: 'Stripe', status: 'Interview' },
      { id: 'a2', jobTitle: 'Staff Software Engineer', company: 'Vercel', status: 'Applied' },
      { id: 'a3', jobTitle: 'Lead React Developer', company: 'Linear', status: 'Applied' },
      { id: 'a4', jobTitle: 'Principal Engineer', company: 'Notion', status: 'Offer' },
    ]),
});
