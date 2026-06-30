import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/app/providers/session';
import { Button, TextInput } from '@/shared/ui';
import {
  buildVerifyPath,
  getDevVerificationToken,
} from '../lib/devVerification';
import styles from './authForms.module.css';

const MIN_PASSWORD_LENGTH = 8;

export function SignUpForm() {
  const { signUp } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signUp({ email, password });
      setCreated(true);
      const token = getDevVerificationToken(email);
      if (token) setDevLink(buildVerifyPath(token));
    } catch (signUpError) {
      setError(
        signUpError instanceof Error
          ? signUpError.message
          : 'Could not create the account.',
      );
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className={styles.form}>
        <p>
          Account created. Check your email to verify your account before
          logging in.
        </p>
        {devLink && (
          <p className={styles.devNote}>
            Dev: <Link to={devLink}>verify this account →</Link>
          </p>
        )}
        <Link to="/login" className={styles.link}>
          Continue to login →
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextInput
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <TextInput
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="Minimum 8 characters"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <TextInput
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
      />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={submitting || !email.trim() || !password || !confirm}
      >
        {submitting ? 'Creating…' : 'Sign up'}
      </Button>

      <div className={styles.links}>
        <Link to="/login" className={styles.link}>
          Already registered? Log in →
        </Link>
      </div>
    </form>
  );
}
