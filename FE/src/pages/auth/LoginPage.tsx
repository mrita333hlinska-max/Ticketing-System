import { Navigate } from 'react-router-dom';
import { useSession } from '@/app/providers/session';
import { AuthCard, LoginForm } from '@/features/auth';

export function LoginPage() {
  const { status } = useSession();
  if (status === 'authenticated') return <Navigate to="/board" replace />;
  return (
    <AuthCard title="Log in" subtitle="Use your verified account.">
      <LoginForm />
    </AuthCard>
  );
}
