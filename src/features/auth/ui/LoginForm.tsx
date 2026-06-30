import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/app/providers/session';
import { Button, TextInput } from '@/shared/ui';
import {
  buildVerifyPath,
  getDevVerificationToken,
} from '../lib/devVerification';
import styles from './authForms.module.css';

export function LoginForm() {
  const { login, resendVerification } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      await login({ email, password });
      navigate('/board');
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : 'Could not log in.',
      );
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setDevLink(null);
    if (!email.trim()) {
      setError('Enter your email to resend the verification link.');
      return;
    }
    try {
      await resendVerification(email);
      setInfo('Verification email sent.');
      const token = getDevVerificationToken(email);
      if (token) setDevLink(buildVerifyPath(token));
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : 'Could not resend the verification email.',
      );
    }
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
        autoComplete="current-password"
        placeholder="Your password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {info && <p className={styles.info}>{info}</p>}
      {devLink && (
        <p className={styles.devNote}>
          Dev: <Link to={devLink}>verify this account →</Link>
        </p>
      )}

      <Button type="submit" disabled={submitting || !email.trim() || !password}>
        {submitting ? 'Logging in…' : 'Log in'}
      </Button>

      <div className={styles.links}>
        <button
          type="button"
          className={styles.linkButton}
          onClick={handleResend}
        >
          Account not verified? Resend email
        </button>
        <Link to="/signup" className={styles.link}>
          Create an account →
        </Link>
      </div>
    </form>
  );
}
