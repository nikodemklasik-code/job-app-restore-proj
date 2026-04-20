import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { redirectIfTrpcUnauthorized } from './trpc-auth-redirect';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      redirectIfTrpcUnauthorized(error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      redirectIfTrpcUnauthorized(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
