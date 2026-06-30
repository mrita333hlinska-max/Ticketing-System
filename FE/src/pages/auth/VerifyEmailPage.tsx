import { AuthCard, VerifyEmailView } from '@/features/auth';

export function VerifyEmailPage() {
  return (
    <AuthCard title="Email verification">
      <VerifyEmailView />
    </AuthCard>
  );
}
