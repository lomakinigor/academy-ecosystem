import { describe, it, expect } from "vitest";

import { buildAuthConfig } from "@/auth/config";
import { SystemRole, AcademicLevel } from "@/lib/auth/types";
import { decode } from "next-auth/jwt";

const cfg = buildAuthConfig();

describe("jwt callback", () => {
  it("старый JWT сохраняет исходный срок, не продлевается до 90 дней", async () => {
    const callback = cfg.callbacks!.jwt as unknown as (args: {
      token: Record<string, unknown>;
    }) => Promise<Record<string, unknown>>;
    const exp = Math.floor(Date.now() / 1000) + 86400;
    expect((await callback({ token: { id: "u1", exp } })).valid_until).toBe(exp * 1000);
  });
  it("чужой браузер допускается только с совпадающей временной cookie", async () => {
    const callback = buildAuthConfig(undefined, "nonce").callbacks!.jwt as unknown as (args: {
      token: Record<string, unknown>;
    }) => Promise<unknown>;
    const token = {
      remember_device: false,
      browser_session_id: "nonce",
      valid_until: Date.now() + 3600000,
    };
    expect(await callback({ token })).toEqual(token);
    expect(await callback({ token: { ...token, browser_session_id: "other" } })).toBeNull();
  });
  it("обновление клиентом не переключает чужой браузер на личный", async () => {
    const callback = buildAuthConfig(undefined, "nonce").callbacks!.jwt as unknown as (
      args: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
    const token = {
      remember_device: false,
      browser_session_id: "nonce",
      valid_until: Date.now() + 3600000,
    };
    expect(
      await callback({
        token,
        trigger: "update",
        session: { remember_device: true, valid_until: Date.now() + 90 * 86400000 },
      }),
    ).toEqual(token);
  });
  it("криптографический срок JWT ограничен сроком чужого входа", async () => {
    const valid_until = Date.now() + 8 * 3600000;
    const secret = "test-only-secret-with-at-least-32-characters";
    const salt = "authjs.session-token";
    const token = await cfg.jwt!.encode!({
      token: { valid_until } as never,
      secret,
      salt,
      maxAge: 90 * 86400,
    });
    const decoded = await decode({ token, secret, salt });
    expect(decoded!.exp).toBeLessThanOrEqual(Math.floor(valid_until / 1000));
    expect(decoded!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000) + 7 * 3600);
  });
  it("личный браузер получает срок 90 дней", () => {
    expect(cfg.session?.maxAge).toBe(90 * 86400);
  });
  it("чужой браузер без session cookie не получает сессию", async () => {
    const jwt = cfg.callbacks!.jwt as unknown as (args: {
      token: Record<string, unknown>;
    }) => Promise<unknown>;
    expect(
      await jwt({
        token: {
          remember_device: false,
          browser_session_id: "nonce",
          valid_until: Date.now() + 3600000,
        },
      }),
    ).toBeNull();
  });
  it("истёкший срок не продлевается обновлением JWT", async () => {
    const jwt = cfg.callbacks!.jwt as unknown as (args: {
      token: Record<string, unknown>;
    }) => Promise<unknown>;
    expect(await jwt({ token: { remember_device: true, valid_until: Date.now() - 1 } })).toBeNull();
  });
  it("copies session fields onto the token on first sign-in", async () => {
    // next-auth v5 jwt() имеет много обязательных полей (account: Account | null
    // и др.), которые в этом юнит-тесте не интересны. Двойной каст через unknown
    // — единственный способ сузить сигнатуру без protest'а TS2352.
    const jwt = cfg.callbacks!.jwt as unknown as (args: {
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
    const jwt = cfg.callbacks!.jwt as unknown as (args: {
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
    const session = cfg.callbacks!.session as unknown as (args: {
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
