# Auth & RBAC — матрица прав

Документ зоны Agent AUTH. Описывает административную иерархию ролей,
карту защищённых маршрутов и правила изоляции данных по филиалам.

> Академический уровень (`AcademicLevel`) **не используется** для маршрутного RBAC —
> он влияет только на бизнес-логику API (создание мероприятий, выдача уровней)
> и проверяется в зоне Agent CORE.

---

## 1. Иерархия системных ролей

`SystemRole` — единственная ось проверки доступа на уровне HTTP-маршрутов.
Ранг — целое число, чем больше, тем шире привилегии.

| Ранг | `SystemRole`        | Зона ответственности                          |
|------|---------------------|-----------------------------------------------|
| 4    | `PRESIDENT`         | Вся сеть, консолидированная аналитика         |
| 3    | `VICE_PRESIDENT`    | Вся сеть, управление                          |
| 2    | `BRANCH_DIRECTOR`   | Полный доступ к своему филиалу                |
| 1    | `BRANCH_ADMIN`      | Операционное управление своим филиалом        |
| 0    | `STUDENT`           | Только свой личный кабинет                    |

`PRESIDENT` и `VICE_PRESIDENT` помечены как **network-wide** —
они обходят проверку `branch_id`.

---

## 2. Матрица маршрут × роль

| Маршрут          | min `SystemRole`     | STUDENT | BRANCH_ADMIN | BRANCH_DIRECTOR | VICE_PRESIDENT | PRESIDENT |
|------------------|----------------------|:-------:|:------------:|:---------------:|:--------------:|:---------:|
| `/student/*`     | `STUDENT`            |   ✅    |      ✅      |       ✅        |       ✅       |    ✅     |
| `/admin/*`       | `BRANCH_ADMIN`       |   ❌    |      ✅      |       ✅        |       ✅       |    ✅     |
| `/director/*`    | `BRANCH_DIRECTOR`    |   ❌    |      ❌      |       ✅        |       ✅       |    ✅     |
| `/network/*`     | `VICE_PRESIDENT`     |   ❌    |      ❌      |       ❌        |       ✅       |    ✅     |

**Поведение middleware:**
- Не авторизован → `307 → /login?callbackUrl=<original>`
- Роль ниже минимума → `307 → /unauthorized`
- Иначе → `next()`

Публичные маршруты (`/login`, `/logout`, `/unauthorized`, `/api/auth/*`, `/`)
**не входят** в `config.matcher` и не пропускаются через middleware.

---

## 3. Изоляция филиала (branch isolation)

Применяется в Server Components и API через `requireBranch(branchId)` /
`canAccessBranch(userId, branchId)`. Middleware саму проверку не делает —
он не знает целевой `branch_id` маршрута.

| `system_role`        | `branch_id` пользователя | целевой `branch_id` | Результат |
|----------------------|--------------------------|---------------------|:---------:|
| `PRESIDENT`          | любой / `null`           | любой               |    ✅     |
| `VICE_PRESIDENT`     | любой / `null`           | любой               |    ✅     |
| `BRANCH_DIRECTOR`    | `branch-msk`             | `branch-msk`        |    ✅     |
| `BRANCH_DIRECTOR`    | `branch-msk`             | `branch-chel`       |    ❌     |
| `BRANCH_ADMIN`       | `null`                   | любой               |    ❌     |
| `STUDENT`            | `null`                   | любой               |    ❌     |

Правило: **branch-scoped роли без `branch_id` не получают доступа никуда**,
кроме `network-wide` исключений.

---

## 4. Auth-хелперы (Server Components / Server Actions / API)

Импорт: `import { … } from "@/lib/auth"`

| Хелпер                                      | При неудаче                | Назначение                                    |
|---------------------------------------------|----------------------------|-----------------------------------------------|
| `getCurrentUser()`                          | `null`                     | Безопасное чтение сессии                       |
| `requireUser()`                             | `redirect("/login")`       | Гарантирует авторизацию                       |
| `requireRole(min)`                          | `redirect("/unauthorized")`| Гарантирует ранг ≥ `min`                      |
| `requireBranch(branchId)`                   | `redirect("/unauthorized")`| Гарантирует доступ к филиалу                  |
| `canAccessBranch(userId, branchId)` (async) | `false`                    | Безопасный bool для условного UI / API guard  |
| `hasRoleAtLeast(user, min)` (sync, чистая)  | `false`                    | Используется в middleware и тестах            |
| `canAccessBranch(user, branchId)` (sync)    | `false`                    | Чистая логика для тестов и кэшируемой проверки|

Все `require*` бросают через `next/navigation.redirect` — функция
никогда не возвращается в случае неудачи.

---

## 5. Сессия (NextAuth.js v5, JWT)

Стратегия: `jwt`, срок жизни — 7 дней.

```ts
session.user = {
  id: string;
  name: string;
  email: string;
  system_role: SystemRole;
  academic_level: AcademicLevel;
  branch_id: string | null;
  is_speaker: boolean;
}
```

Поля копируются `User → JWT` в `jwt()`-callback и `JWT → session.user`
в `session()`-callback. Расширения типов — в [types/next-auth.d.ts](../apps/web/types/next-auth.d.ts).

---

## 6. Зависимости от других зон

| От | Что нужно | Текущий статус |
|----|-----------|----------------|
| Agent CORE | `User` Prisma-модель + `password_hash` + Prisma-репозиторий | ⏳ stub `InMemoryUserRepository` в [user-repository.ts](../apps/web/auth/user-repository.ts), готов к замене |
| Agent CORE | Экспорт enum'ов `SystemRole` / `AcademicLevel` из `@academy/db` | ⏳ временно дублируются в [types.ts](../apps/web/lib/auth/types.ts), помечены `TODO(core)` |
| Agent DEVOPS | `AUTH_SECRET` / `NEXTAUTH_SECRET` в `.env.example` | ⏳ NextAuth не запустится без переменной |

---

## 7. Файлы AUTH-зоны

```
apps/web/
├── auth/
│   ├── config.ts              ← buildAuthConfig + Credentials provider + JWT/session callbacks
│   ├── handlers.ts            ← реэкспорт GET/POST для /api/auth
│   ├── index.ts               ← NextAuth(authConfig) → { auth, signIn, signOut, handlers }
│   └── user-repository.ts     ← UserRepository интерфейс + in-memory stub
├── middleware.ts              ← RBAC: matcher + редиректы на /login и /unauthorized
├── lib/auth/
│   ├── types.ts               ← SystemRole, AcademicLevel, SYSTEM_ROLE_RANK, SessionUser
│   ├── rbac.ts                ← matchRule, hasRoleAtLeast, isNetworkWide, canAccessBranch (sync)
│   ├── helpers.ts             ← getCurrentUser, requireUser, requireRole, requireBranch
│   └── index.ts               ← публичная поверхность
├── types/
│   └── next-auth.d.ts         ← расширение Session/JWT
├── app/
│   ├── api/auth/[...nextauth]/route.ts
│   ├── login/{page.tsx, login-form.tsx, actions.ts}
│   ├── logout/page.tsx
│   └── unauthorized/page.tsx
└── tests/auth/
    ├── rbac.test.ts           ← чистая логика matchRule + ранги + canAccessBranch
    ├── route-matrix.test.ts   ← матрица из раздела 2
    ├── jwt-session.test.ts    ← JWT и session callbacks
    ├── helpers.test.ts        ← requireUser/requireRole/requireBranch с mock auth()
    ├── login-action.test.ts   ← Zod-валидация + AuthError + редирект
    └── middleware.test.ts     ← smoke: matcher + форма экспортов
```

---

## 8. Что вне зоны AUTH

- Хеширование паролей при регистрации — у Agent CORE (seed)
- Восстановление пароля, email-верификация, OAuth-провайдеры — отдельная фича, не Этап 0
- API-уровневая проверка `branch_id` для доменных сущностей (Event/Booking/Payment) — у Agent CORE
- UI логин-формы с дизайн-токенами и shadcn — у Agent UI (текущая форма — функциональный минимум)
