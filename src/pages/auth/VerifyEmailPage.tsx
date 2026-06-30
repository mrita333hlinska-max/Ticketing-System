import { Link } from 'react-router-dom';

export function VerifyEmailPage() {
  return (
    <section>
      <h1>Email verification</h1>
      <p>The email-verification result is built in Phase 8.</p>
      <p>
        <Link to="/login">Continue to login →</Link>
      </p>
    </section>
  );
}
