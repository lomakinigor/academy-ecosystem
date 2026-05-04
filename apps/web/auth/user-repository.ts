import type { SessionUser } from "@/lib/auth/types";

// Stub repository — Agent CORE will swap this out for a Prisma-backed implementation
// reading from `packages/db`. The interface is what NextAuth's authorize() needs.
//
// Required by CORE before auth is production-ready:
//   - User table with fields: id, email, password_hash, name, system_role,
//     academic_level, branch_id, is_speaker
//   - bcrypt-hashed passwords (NextAuth never sees plaintext at rest)

export interface UserRecord extends SessionUser {
  password_hash: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
}

// Dev-only in-memory repo so /login is testable before CORE merges Prisma.
// Replace `defaultUserRepository` import in auth/config.ts with the Prisma-backed one.
class InMemoryUserRepository implements UserRepository {
  private readonly users: UserRecord[] = [];

  async findByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    return this.users.find((u) => u.email.toLowerCase() === normalized) ?? null;
  }

  // For tests/seeding only.
  _seed(user: UserRecord): void {
    this.users.push(user);
  }
}

export const defaultUserRepository = new InMemoryUserRepository();
