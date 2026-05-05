# Calendar MVP — Task breakdown

20 задач, разбиты на 4 PR'а. Каждая задача 5–20 минут, отдельно проверяема.

---

## PR 1: DB infrastructure

### T1. Поднять Postgres локально

**Действие:** `pnpm docker:up`, проверить логи `docker compose logs postgres | tail`, дождаться `database system is ready to accept connections`.
**Verify:** Adminer на http://localhost:8080 пускает с creds academy/academy/academy.
**Время:** 5 мин (или фолбэк на SQLite/Supabase, если Docker не установлен).

### T2. Расширить Prisma schema

**Файл:** [packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma)
**Действие:**

- Заменить `EventType` enum на `SEMINAR | PRACTICE | WEBINAR | COURSE | RETREAT | TRIP | MASTERCLASS | GRADING`
- Добавить `PricingType` enum: `FIXED | DONATION | FREE`
- В `Event`: `is_online`, `pricing_type`, `pricing_note`, `tags: String[]`, `branch_id` → nullable
- В `Branch`: `address`, `entrance_code`, `contact_phones: String[]`, `timezone`
  **Verify:** `pnpm --filter @academy/db typecheck` зелёный (после генерации client).
  **Время:** 10 мин.

### T3. .env с DATABASE_URL

**Файл:** `.env` (если нет) и `.env.example` (на коммит)
**Действие:** `DATABASE_URL=postgresql://academy:academy@localhost:5432/academy?schema=public`
**Verify:** `pnpm --filter @academy/db db:push` подключается без ошибок.
**Время:** 3 мин.

### T4. Миграция и Prisma client

**Действие:** `pnpm --filter @academy/db db:push` (для MVP — без формальных migration files, чтобы не плодить SQL до stable schema). Потом `pnpm --filter @academy/db db:generate`.
**Verify:** `pnpm --filter @academy/db db:studio` открывает таблицы Event/Branch с новыми полями.
**Время:** 5 мин.

### T5. Realistic seed

**Файл:** [packages/db/prisma/seed.ts](packages/db/prisma/seed.ts)
**Действие:** seed с 3 филиалами (Москва/Екб/Челябинск с timezone), 6 юзерами (по 1 на роль), ~30 событиями за -7…+30 дней, включая многодневный семинар через program_id, онлайн-вебинар, donation-событие, branch_id=null, теги.
**Verify:** `pnpm --filter @academy/db db:seed` без ошибок; в Adminer таблица Event содержит ≥30 строк.
**Время:** 20 мин (большой блок данных).

### T6. Коммит PR 1

`feat(db): extend schema with EventType/PricingType, branch metadata, seed`

---

## PR 2: tRPC backend

### T7. Расширить event router

**Файл:** [packages/api/src/routers/event.ts](packages/api/src/routers/event.ts)
**Действие:** заменить заглушку на полноценный `list({ from, to, branch_id?, types?, speaker_id?, search?, is_online?, tags? })` с Prisma `where`-builder. Возвращает `{ events, total, byDay }`.
**Verify:** RPC-тест вручную через `pnpm --filter @academy/api test:watch` или smoke с curl на trpc-handler в apps/web (после T11).
**Время:** 15 мин.

### T8. Branch isolation middleware в @academy/api

**Файл:** [packages/api/src/trpc.ts](packages/api/src/trpc.ts)
**Действие:** `protectedBranchProcedure` middleware: читает session.user, для branch_admin/director ограничивает `branch_id` (плюс `branch_id=null`); president/vp — без ограничений; magister/master — только свой филиал.
**Verify:** unit-тест в `packages/api/test/branch-isolation.test.ts`.
**Время:** 15 мин.

### T9. branchRouter.list для дропдауна

**Файл:** [packages/api/src/routers/branch.ts](packages/api/src/routers/branch.ts)
**Действие:** простой `list()` query — все филиалы с `id, name, city`. Для филиал-фильтра в сайдбаре.
**Verify:** ручной вызов через test или dev.
**Время:** 5 мин.

### T10. Тесты event-router

**Файл:** [packages/api/test/event-router.test.ts](packages/api/test/event-router.test.ts) (новый)
**Действие:** 5–8 тестов: фильтр по date range, по type, по branch_id, search по title, RBAC (branch_admin не видит чужой), branch_id=null виден всем.
**Verify:** `pnpm --filter @academy/api test` — все зелёные.
**Время:** 20 мин.

### T11. Коммит PR 2

`feat(api): event router with filters, branch isolation, branch list`

---

## PR 3: tRPC client в apps/web

### T12. Зависимости + setup

**Файл:** [apps/web/package.json](apps/web/package.json)
**Действие:** добавить `@trpc/client`, `@trpc/react-query`, `@trpc/server`, `@tanstack/react-query`, `superjson`, `@academy/api: workspace:*`. `pnpm install`.
**Verify:** `pnpm --filter @academy/web typecheck` зелёный.
**Время:** 5 мин.

### T13. Next.js handler /api/trpc

**Файл:** `apps/web/app/api/trpc/[trpc]/route.ts` (новый)
**Действие:** `fetchRequestHandler` с `appRouter` из `@academy/api/root` и context, который читает auth().
**Verify:** `curl -X POST http://localhost:3000/api/trpc/health.ping` отдаёт ответ.
**Время:** 10 мин.

### T14. Client provider

**Файлы:** `apps/web/lib/trpc/client.ts`, `apps/web/lib/trpc/provider.tsx` (новые)
**Действие:** `createTRPCReact<AppRouter>()`, `httpBatchLink({ url: '/api/trpc', transformer: superjson })`, `<QueryClientProvider><trpc.Provider>`.
**Verify:** typecheck + smoke (T16).
**Время:** 15 мин.

### T15. Обернуть layout

**Файл:** [apps/web/app/layout.tsx](apps/web/app/layout.tsx)
**Действие:** обернуть `<body>{children}</body>` в TRPCProvider.
**Verify:** typecheck.
**Время:** 3 мин.

### T16. Smoke-тест health.ping

**Действие:** временно добавить `useQuery(trpc.health.ping)` на главную или отдельную тестовую страницу, проверить в DevTools запрос `/api/trpc/health.ping`.
**Verify:** запрос ходит, в Network — 200, в Response — pong.
**Время:** 10 мин.

### T17. Коммит PR 3

`feat(web): wire tRPC client with @tanstack/react-query`

---

## PR 4: /admin/calendar UI (read-only)

### T18. Защищённый admin layout

**Файл:** `apps/web/app/admin/layout.tsx` (новый)
**Действие:** `requireRole(SystemRole.BRANCH_ADMIN)` в server-component, минимальная shell-вёрстка (header или просто `<main>`).
**Verify:** GET /admin без авторизации редиректит на /login.
**Время:** 8 мин.

### T19. Sidebar компонент с фильтрами

**Файл:** `apps/web/app/admin/calendar/calendar-sidebar.tsx` (client)
**Действие:** `<Sheet>` для мобайла, sticky на десктопе. URL search params как source of truth (`useSearchParams` + `useRouter.replace`). Period switcher (Месяц/Квартал/Год/Custom), фильтры направлений (чекбоксы), text-фильтры (название/спикер), select филиала через `trpc.branch.list`.
**Verify:** ручная проверка — клик по чекбоксу обновляет URL `?types=SEMINAR,PRACTICE`.
**Время:** 25 мин.

### T20. AgendaList + EventCard

**Файлы:** `apps/web/app/admin/calendar/agenda-list.tsx`, `event-card.tsx`, и сама `page.tsx` (новые)
**Действие:**

- `page.tsx` (server) — читает search params, вызывает `trpc.event.list` через server caller
- `agenda-list.tsx` — группировка по дням, рендер заголовков «04 апреля, понедельник» + список карточек
- `event-card.tsx` — Card с date column, badges (type через цвета из preset, online/offline, tags), Playfair title, описание, спикер, branch badge, capacity progress
- Empty / loading state
  **Verify:** dev-сервер, /admin/calendar отображает seed-события с правильными бейджами.
  **Время:** 35 мин.

### T21. Component-light тесты

**Файлы:** `apps/web/tests/calendar/event-card.test.tsx`, `agenda-list.test.tsx`
**Действие:** EventCard renders title/speaker/badges; AgendaList groups by day, shows empty state.
**Verify:** `pnpm --filter @academy/web test` — все зелёные.
**Время:** 15 мин.

### T22. Регрессия + self-review

**Действие:**

- `pnpm typecheck` (root) — все 6 пакетов зелёные
- `pnpm test` (root) — все пакеты зелёные
- Smoke: `/`, `/login`, `/admin/calendar` рендерятся
- Написать [docs/features/calendar-mvp/review.md](docs/features/calendar-mvp/review.md)
  **Verify:** все acceptance criteria из spec.md §3 ✅.
  **Время:** 20 мин.

### T23. Коммит PR 4

`feat(web): /admin/calendar agenda view with sidebar filters`

---

## Суммарная оценка

| PR                  | Задачи        | Время         |
| ------------------- | ------------- | ------------- |
| PR 1 — DB infra     | T1–T6         | ~50 мин       |
| PR 2 — tRPC backend | T7–T11        | ~60 мин       |
| PR 3 — tRPC client  | T12–T17       | ~45 мин       |
| PR 4 — UI calendar  | T18–T23       | ~115 мин      |
| **Итого**           | **23 задачи** | **~4.5 часа** |

Реалистично: с учётом отладки (Docker, Prisma, tRPC-RSC edge cases) — **6–8 часов чистого времени, разбитых на 2–3 сессии**.

## Останавливаемся между PR'ами для подтверждения

После каждого PR — пауза, smoke-проверка, push, твоё «погнали дальше» или замечания.
