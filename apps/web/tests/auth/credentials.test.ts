import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

import { buildAuthConfig } from "@/auth/config";
import { SystemRole, AcademicLevel } from "@/lib/auth/types";
import type { UserRecord, UserRepository } from "@/auth/user-repository";

class StubRepo implements UserRepository {
  constructor(private records: UserRecord[]) {}
  async findByEmail(email: string) {
    return this.records.find((r) => r.email.toLowerCase() === email.toLowerCase()) ?? null;
  }
}

const PASSWORD = "correct-horse-battery-staple";
const passwordHash = bcrypt.hashSync(PASSWORD, 4);

function makeRecord(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: "u1",
    name: "Иван",
    email: "ivan@academy.ru",
    password_hash: passwordHash,
    system_role: SystemRole.STUDENT,
    academic_level: AcademicLevel.LISTENER,
    branch_id: "branch-msk",
    is_speaker: false,
    ...overrides,
  };
}

function getAuthorize(repo: UserRepository) {
  const cfg = buildAuthConfig(repo);
  // next-auth v5 beta wraps Credentials() so real authorize is at .options
  const provider = cfg.providers[0] as unknown as {
    options: { authorize: (creds: Record<string, unknown>) => Promise<unknown> };
  };
  return provider.options.authorize.bind(provider);
}

describe("Credentials authorize()", () => {
  it("returns SessionUser shape on valid credentials", async () => {
    const authorize = getAuthorize(new StubRepo([makeRecord()]));
    const result = await authorize({ email: "ivan@academy.ru", password: PASSWORD });
    expect(result).toMatchObject({
      id: "u1",
      name: "Иван",
      email: "ivan@academy.ru",
      system_role: SystemRole.STUDENT,
      academic_level: AcademicLevel.LISTENER,
      branch_id: "branch-msk",
      is_speaker: false,
    });
    expect(result).not.toHaveProperty("password_hash");
  });

  it("rejects unknown email", async () => {
    const authorize = getAuthorize(new StubRepo([makeRecord()]));
    expect(await authorize({ email: "nobody@academy.ru", password: PASSWORD })).toBeNull();
  });

  it("rejects wrong password", async () => {
    const authorize = getAuthorize(new StubRepo([makeRecord()]));
    expect(await authorize({ email: "ivan@academy.ru", password: "wrong-password" })).toBeNull();
  });

  it("rejects malformed input (zod fails)", async () => {
    const authorize = getAuthorize(new StubRepo([makeRecord()]));
    expect(await authorize({ email: "not-an-email", password: PASSWORD })).toBeNull();
    expect(await authorize({ email: "ivan@academy.ru", password: "short" })).toBeNull();
    expect(await authorize({})).toBeNull();
  });

  it("is case-insensitive on email lookup", async () => {
    const authorize = getAuthorize(new StubRepo([makeRecord()]));
    const result = await authorize({ email: "Ivan@Academy.RU", password: PASSWORD });
    expect(result).not.toBeNull();
  });
});
