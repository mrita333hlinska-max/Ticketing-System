import { Link } from 'react-router-dom';

export function SignUpPage() {
  return (
    <section>
      <h1>Create account</h1>
      <p>The sign-up flow is built in Phase 8.</p>
      <p>
        <Link to="/login">Already registered? Log in →</Link>
      </p>
    </section>
  );
}
