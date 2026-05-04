import { describe, it, expect } from "vitest";

import { buildAuthConfig } from "@/auth/config";
import { SystemRole, AcademicLevel } from "@/lib/auth/types";

const cfg = buildAuthConfig();

describe("jwt callback", () => {
  it("copies session fields onto the token on first sign-in", async () => {
    const jwt = cfg.callbacks!.jwt as (args: {
      token: Record<string, unknown>;
      user?: Record<string, unknown>;
    }) => Promise<Record<string, unknown>>;

    const token = await jwt({
      token: {},
      user: {
        id: "u1",
        name: "Иван",
        email: "ivan@academy.ru",
        system_role: SystemRole.BRANCH_DIRECTOR,
        academic_level: AcademicLevel.MASTER,
        branch_id: "branch-msk",
        is_speaker: true,
      },
    });

    expect(token).toMatchObject({
      id: "u1",
      system_role: SystemRole.BRANCH_DIRECTOR,
      academic_level: AcademicLevel.MASTER,
      branch_id: "branch-msk",
      is_speaker: true,
    });
  });

  it("preserves token on subsequent calls without user", async () => {
    const jwt = cfg.callbacks!.jwt as (args: {
      token: Record<string, unknown>;
      user?: Record<string, unknown>;
    }) => Promise<Record<string, unknown>>;

    const existing = {
      id: "u1",
      system_role: SystemRole.PRESIDENT,
      academic_level: AcademicLevel.FOUNDER,
      branch_id: null,
      is_speaker: false,
    };
    const result = await jwt({ token: { ...existing } });
    expect(result).toMatchObject(existing);
  });
});

describe("session callback", () => {
  it("projects token claims onto session.user", async () => {
    const session = cfg.callbacks!.session as (args: {
      session: { user: Record<string, unknown> };
      token: Record<string, unknown>;
    }) => Promise<{ user: Record<string, unknown> }>;

    const result = await session({
      session: {
        user: { name: "Иван", email: "ivan@academy.ru" } as Record<string, unknown>,
      },
      token: {
        id: "u1",
        system_role: SystemRole.BRANCH_ADMIN,
        academic_level: AcademicLevel.MAGISTER,
        branch_id: "branch-chel",
        is_speaker: true,
      },
    });

    expect(result.user).toMatchObject({
      id: "u1",
      system_role: SystemRole.BRANCH_ADMIN,
      academic_level: AcademicLevel.MAGISTER,
      branch_id: "branch-chel",
      is_speaker: true,
    });
  });
});
