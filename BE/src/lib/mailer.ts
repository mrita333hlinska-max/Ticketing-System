/**
 * Email delivery via SMTP (REQUIREMENTS §3). Configured entirely from the
 * environment (host/port/credentials), so it can target relay1.dataart.com in
 * production and a Mailpit sink in local/docker dev — with no secrets in code.
 *
 * Under NODE_ENV=test we use Nodemailer's `jsonTransport`, which serializes the
 * message instead of sending it, so tests never touch the network.
 *
 * Exposed as an interface + factory so the auth service can be unit-tested with
 * a fake mailer (PROJECT_RULES §2).
 */
import nodemailer, { type Transporter } from 'nodemailer';
import { env, type Env } from '../config/env';

export interface Mailer {
  sendVerificationEmail(to: string, token: string): Promise<void>;
}

function createTransport(config: Env): Transporter {
  if (config.NODE_ENV === 'test') {
    return nodemailer.createTransport({ jsonTransport: true });
  }
  return nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: config.SMTP_USER
      ? { user: config.SMTP_USER, pass: config.SMTP_PASS ?? '' }
      : undefined,
  });
}

export function createMailer(config: Env = env): Mailer {
  const transport = createTransport(config);

  return {
    async sendVerificationEmail(to, token) {
      const link = `${config.APP_BASE_URL}/verify?token=${token}`;
      await transport.sendMail({
        from: config.MAIL_FROM,
        to,
        subject: 'Verify your Ticketing System account',
        text:
          `Welcome! Confirm your email address to activate your account:\n\n` +
          `${link}\n\n` +
          `This link expires in 24 hours and can be used once.`,
        html:
          `<p>Welcome! Confirm your email address to activate your account:</p>` +
          `<p><a href="${link}">${link}</a></p>` +
          `<p>This link expires in 24 hours and can be used once.</p>`,
      });
    },
  };
}
