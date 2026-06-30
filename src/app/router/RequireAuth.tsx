import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@/app/providers/session';
import { Spinner } from '@/shared/ui';

/**
 * Gates authenticated routes (REQUIREMENTS §3). While the session is resolving
 * we show a loader; unauthenticated users are sent to the login screen.
 */
export function RequireAuth() {
  const { status } = useSession();

  if (status === 'loading') return <Spinner fullPage label="Loading…" />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  return <Outlet />;
}
