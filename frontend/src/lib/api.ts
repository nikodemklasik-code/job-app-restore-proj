import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../../../shared/trpc';
import { getAuthToken } from './auth-token';

export const api = createTRPCReact<AppRouter>();

export const trpcClient = api.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL ?? ''}/trpc`,
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: 'include' });
      },
      async headers() {
        const token = await getAuthToken();
        if (!token) return {};
        return { Authorization: `Bearer ${token}` };
      },
    }),
  ],
});
