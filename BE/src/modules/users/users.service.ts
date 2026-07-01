/**
 * User directory service. Maps stored users to the public shape (never the
 * password hash), reusing the auth module's mapper to stay consistent.
 */
import { toPublicUser, type PublicUser } from '../auth/auth.helpers';
import type { UserRepository } from './users.repo';

export interface UserService {
  list(): Promise<PublicUser[]>;
}

export function createUserService(dependencies: {
  repo: UserRepository;
}): UserService {
  const { repo } = dependencies;
  return {
    async list() {
      const rows = await repo.list();
      return rows.map(toPublicUser);
    },
  };
}
