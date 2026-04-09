import { useEffect, useRef } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const ensureFromClerk = api.profile.ensureFromClerk.useMutation();
  const ensuredForClerkId = useRef<string | null>(null);

  useEffect(() => {
    if (!userLoaded || !user) return;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;
    if (ensuredForClerkId.current === user.id) return;
    ensuredForClerkId.current = user.id;
    const display =
      user.fullName?.trim() ||
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      undefined;
    ensureFromClerk.mutate({ userId: user.id, email, fullName: display });
  }, [userLoaded, user, ensureFromClerk]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
