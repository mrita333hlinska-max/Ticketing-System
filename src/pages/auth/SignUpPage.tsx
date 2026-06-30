import { Navigate } from 'react-router-dom';
import { useSession } from '@/app/providers/session';
import { AuthCard, SignUpForm } from '@/features/auth';

export function SignUpPage() {
  const { status } = useSession();
  if (status === 'authenticated') return <Navigate to="/board" replace />;
  return (
    <AuthCard title="Create account" subtitle="Email verification is required.">
      <SignUpForm />
    </AuthCard>
  );
}
