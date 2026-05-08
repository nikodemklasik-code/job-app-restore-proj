import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ClerkRootProvider } from './lib/clerk';
import { queryClient } from './lib/query-client';
import { api, trpcClient } from './lib/api';
import { router } from './router';

export default function App() {
  return (
    <ClerkRootProvider>
      <QueryClientProvider client={queryClient}>
        <api.Provider client={trpcClient} queryClient={queryClient}>
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </api.Provider>
      </QueryClientProvider>
    </ClerkRootProvider>
  );
}
