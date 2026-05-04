import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

import {
  getCurrentUser,
  requireUser,
  requireRole,
  requireBranch,
  canAccessBranch,
} from "@/lib/auth/helpers";
import { SystemRole, AcademicLevel, type SessionUser } from "@/lib/auth/types";
import { auth } from "@/auth";

const authMock = vi.mocked(auth);

function user(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "u1",
    name: "Тестовый",
    email: "test@academy.ru",
    system_role: SystemRole.STUDENT,
    academic_level: AcademicLevel.LISTENER,
    branch_id: "branch-msk",
    is_speaker: false,
    ...overrides,
  };
}

function session(u: SessionUser) {
  return { user: u, expires: "2999-01-01T00:00:00.000Z" } as unknown as Awaited<
    ReturnType<typeof auth>
  >;
}

beforeEach(() => {
  authMock.mockReset();
});

describe("getCurrentUser", () => {
  it("returns null when there is no session", async () => {
    authMock.mockResolvedValue(null);
    expect(await getCurrentUser()).toBeNull();
  });

  it("returns null when session has no user", async () => {
    authMock.mockResolvedValue({ expires: "2999-01-01" } as never);
    expect(await getCurrentUser()).toBeNull();
  });

  it("returns the session user when authenticated", async () => {
    const u = user();
    authMock.mockResolvedValue(session(u));
    expect(await getCurrentUser()).toEqual(u);
  });
});

describe("requireUser", () => {
  it("redirects to /login when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrowError(/NEXT_REDIRECT:\/login/);
  });

  it("returns the user when authenticated", async () => {
    const u = user();
    authMock.mockResolvedValue(session(u));
    expect(await requireUser()).toEqual(u);
  });
});

describe("requireRole", () => {
  it("redirects to /login when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireRole(SystemRole.BRANCH_ADMIN)).rejects.toThrowError(
      /NEXT_REDIRECT:\/login/,
    );
  });

  it("redirects to /unauthorized when role rank is below minimum", async () => {
    authMock.mockResolvedValue(session(user({ system_role: SystemRole.STUDENT })));
    await expect(requireRole(SystemRole.BRANCH_ADMIN)).rejects.toThrowError(
      /NEXT_REDIRECT:\/unauthorized/,
    );
  });

  it("returns the user when role exactly matches the minimum", async () => {
    const u = user({ system_role: SystemRole.BRANCH_ADMIN });
    authMock.mockResolvedValue(session(u));
    expect(await requireRole(SystemRole.BRANCH_ADMIN)).toEqual(u);
  });

  it("returns the user when role exceeds the minimum", async () => {
    const u = user({ system_role: SystemRole.PRESIDENT });
    authMock.mockResolvedValue(session(u));
    expect(await requireRole(SystemRole.BRANCH_DIRECTOR)).toEqual(u);
  });
});

describe("requireBranch", () => {
  it("redirects to /login when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireBranch("branch-msk")).rejects.toThrowError(
      /NEXT_REDIRECT:\/login/,
    );
  });

  it("allows president regardless of branch_id", async () => {
    const u = user({ system_role: SystemRole.PRESIDENT, branch_id: null });
    authMock.mockResolvedValue(session(u));
    expect(await requireBranch("branch-chel")).toEqual(u);
  });

  it("allows vice president across branches", async () => {
    const u = user({ system_role: SystemRole.VICE_PRESIDENT, branch_id: "branch-msk" });
    authMock.mockResolvedValue(session(u));
    expect(await requireBranch("branch-chel")).toEqual(u);
  });

  it("allows branch director on own branch", async () => {
    const u = user({ system_role: SystemRole.BRANCH_DIRECTOR, branch_id: "branch-msk" });
    authMock.mockResolvedValue(session(u));
    expect(await requireBranch("branch-msk")).toEqual(u);
  });

  it("redirects branch director on a foreign branch", async () => {
    const u = user({ system_role: SystemRole.BRANCH_DIRECTOR, branch_id: "branch-msk" });
    authMock.mockResolvedValue(session(u));
    await expect(requireBranch("branch-chel")).rejects.toThrowError(
      /NEXT_REDIRECT:\/unauthorized/,
    );
  });

  it("redirects student without a branch", async () => {
    const u = user({ system_role: SystemRole.STUDENT, branch_id: null });
    authMock.mockResolvedValue(session(u));
    await expect(requireBranch("branch-msk")).rejects.toThrowError(
      /NEXT_REDIRECT:\/unauthorized/,
    );
  });
});

describe("canAccessBranch (async, identity-checked)", () => {
  it("returns false without a session", async () => {
    authMock.mockResolvedValue(null);
    expect(await canAccessBranch("u1", "branch-msk")).toBe(false);
  });

  it("returns false when userId mismatches the session user", async () => {
    authMock.mockResolvedValue(session(user({ id: "u1" })));
    expect(await canAccessBranch("u2", "branch-msk")).toBe(false);
  });

  it("delegates to RBAC for matching userId — president sees any branch", async () => {
    const u = user({
      id: "u1",
      system_role: SystemRole.PRESIDENT,
      branch_id: null,
    });
    authMock.mockResolvedValue(session(u));
    expect(await canAccessBranch("u1", "branch-chel")).toBe(true);
  });

  it("delegates to RBAC — branch admin rejected from a foreign branch", async () => {
    const u = user({
      id: "u1",
      system_role: SystemRole.BRANCH_ADMIN,
      branch_id: "branch-msk",
    });
    authMock.mockResolvedValue(session(u));
    expect(await canAccessBranch("u1", "branch-chel")).toBe(false);
  });
});
