import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSession } from '@/app/providers/session';
import { Button, Spinner, TextInput } from '@/shared/ui';
import {
  buildVerifyPath,
  getDevVerificationToken,
} from '../lib/devVerification';
import styles from './authForms.module.css';

type VerifyStatus = 'verifying' | 'success' | 'error';

export function VerifyEmailView() {
  const { verifyEmail, resendVerification } = useSession();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [status, setStatus] = useState<VerifyStatus>('verifying');
  const [error, setError] = useState<string | null>(null);

  // Resend (shown on the error/expired state).
  const [email, setEmail] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  // Consume the single-use token from the link on mount (external sync).
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('This verification link is missing its token.');
      return;
    }
    let active = true;
    verifyEmail(token)
      .then(() => active && setStatus('success'))
      .catch((verifyError) => {
        if (!active) return;
        setStatus('error');
        setError(
          verifyError instanceof Error
            ? verifyError.message
            : 'Verification failed.',
        );
      });
    return () => {
      active = false;
    };
  }, [token, verifyEmail]);

  async function handleResend() {
    setError(null);
    setInfo(null);
    setDevLink(null);
    if (!email.trim()) {
      setError('Enter your email to get a new verification link.');
      return;
    }
    try {
      await resendVerification(email);
      setInfo('Verification email sent.');
      const nextToken = getDevVerificationToken(email);
      if (nextToken) setDevLink(buildVerifyPath(nextToken));
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : 'Could not resend the verification email.',
      );
    }
  }

  if (status === 'verifying') {
    return <Spinner label="Verifying your email…" />;
  }

  if (status === 'success') {
    return (
      <div className={styles.form}>
        <p>Your account is verified and ready to use.</p>
        <Link to="/login" className={styles.link}>
          Continue to login →
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <p className={styles.error} role="alert">
        {error}
      </p>
      <p>Request a new verification link:</p>
      <TextInput
        label="Email"
        type="email"
        placeholder="name@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      {info && <p className={styles.info}>{info}</p>}
      {devLink && (
        <p className={styles.devNote}>
          Dev: <Link to={devLink}>verify this account →</Link>
        </p>
      )}
      <Button onClick={handleResend}>Resend email</Button>
      <div className={styles.links}>
        <Link to="/login" className={styles.link}>
          Back to login →
        </Link>
      </div>
    </div>
  );
}
