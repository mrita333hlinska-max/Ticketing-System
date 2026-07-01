/**
 * Password hashing (REQUIREMENTS §3): passwords are never stored in plain text
 * and are hashed with Argon2id, an established memory-hard algorithm. The
 * `argon2` library encodes the salt and parameters into the hash string, so no
 * separate salt column is needed.
 */
import argon2 from 'argon2';

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  return argon2.verify(hash, password);
}
