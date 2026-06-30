import { Link } from 'react-router-dom';

export function LoginPage() {
  return (
    <section>
      <h1>Log in</h1>
      <p>The login flow is built in Phase 8.</p>
      <p>
        <Link to="/signup">Create an account →</Link>
      </p>
    </section>
  );
}
