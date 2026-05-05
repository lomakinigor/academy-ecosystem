import { prisma } from "@academy/db";

import type { SessionUser, SystemRole, AcademicLevel } from "@/lib/auth/types";

export interface UserRecord extends SessionUser {
  password_hash: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
}

/**
 * Prisma-backed репо — читает юзеров из БД (см. db:seed).
 * Юзеры без password_hash не могут логиниться и игнорируются.
 */
class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalized },
    });
    if (!user || !user.password_hash) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      system_role: user.system_role as SystemRole,
      academic_level: user.academic_level as AcademicLevel,
      branch_id: user.branch_id,
      is_speaker: user.is_speaker,
      password_hash: user.password_hash,
    };
  }
}

/**
 * In-memory репо — для unit-тестов; не использовать в проде.
 */
export class InMemoryUserRepository implements UserRepository {
  private readonly users: UserRecord[] = [];

  async findByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    return this.users.find((u) => u.email.toLowerCase() === normalized) ?? null;
  }

  _seed(user: UserRecord): void {
    this.users.push(user);
  }
}

export const defaultUserRepository: UserRepository = new PrismaUserRepository();
