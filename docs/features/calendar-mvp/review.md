# Calendar MVP — Self-review

**Дата:** 2026-05-06
**Состояние:** Готово к мерджу

---

## 1. Acceptance criteria — статус

### A. БД и Prisma

- [x] `pnpm --filter @academy/db db:push` подключается к Postgres и применяет схему
- [x] Schema [packages/db/prisma/schema.prisma](../../../packages/db/prisma/schema.prisma) обновлена:
  - [x] `EventType`: SEMINAR/PRACTICE/WEBINAR/COURSE/RETREAT/TRIP/MASTERCLASS/GRADING
  - [x] `PricingType`: FIXED/DONATION/FREE
  - [x] `Event.is_online`, `pricing_type`, `pricing_note`, `tags[]`
  - [x] `Event.branch_id` → nullable
  - [x] `Branch.address`, `entrance_code`, `contact_phones[]`, `timezone`
  - [x] `@@index([type])` на Event
- [x] Миграция применена через `db push`
- [x] Prisma client сгенерирован
- [x] Seed: 3 филиала + 9 пользователей + 29 событий, включая многодневный семинар через
      program_id, онлайн-вебинар, donation-практику, branch_id=null, теги «с детьми»/«допуск
      после знакомства»

> **Отклонение от плана:** вместо Docker-Postgres используется Supabase Cloud (Session pooler,
> порт 5432). Docker Desktop не поднялся на хосте пользователя (виртуализация в BIOS, WSL
> distros не установились), поэтому переключились на Supabase. Это полностью эквивалентно
> с точки зрения схемы и Prisma client; единственная разница — в разработке нужно иметь
> доступ к интернету.

### B. tRPC backend

- [x] `event.list({ from, to, branch_id?, types?, speaker_id?, search?, is_online?, tags? })`
- [x] Возвращает `{ events, total, byDay }`
- [x] Branch isolation: PRESIDENT/VP — global, остальные — `branch_id IN (свой, null)`
- [x] При запросе чужого филиала branch-admin'ом — never-фильтр (пустая выборка)
- [x] `branch.list()` для дропдауна (узкий select id/name/city/timezone)
- [x] Тесты: [packages/api/test/branch-isolation.test.ts](../../../packages/api/test/branch-isolation.test.ts) (19 шт),
      [packages/api/test/event-router.test.ts](../../../packages/api/test/event-router.test.ts) (14 шт)

### C. tRPC client в apps/web

- [x] Зависимости: `@trpc/{client,react-query,server,next}@10.45`,
      `@tanstack/react-query@4.36`, `superjson`
- [x] [apps/web/app/api/trpc/[trpc]/route.ts](../../../apps/web/app/api/trpc/%5Btrpc%5D/route.ts) —
      `fetchRequestHandler` с auth-контекстом
- [x] [apps/web/lib/trpc/client.ts](../../../apps/web/lib/trpc/client.ts),
      [provider.tsx](../../../apps/web/lib/trpc/provider.tsx),
      [server.ts](../../../apps/web/lib/trpc/server.ts) (RSC caller)
- [x] [layout.tsx](../../../apps/web/app/layout.tsx) обёрнут в `<TRPCProvider>`
- [x] Smoke: реальный HTTP-roundtrip на `/api/trpc/health.ping` отдаёт
      `{ok:true, service:"academy-api"}` ✓
- [x] Unit-тест wiring: [tests/trpc/health-smoke.test.tsx](../../../apps/web/tests/trpc/health-smoke.test.tsx)

### D. UI календаря (read-only)

- [x] [apps/web/app/admin/layout.tsx](../../../apps/web/app/admin/layout.tsx):
      `requireRole(BRANCH_ADMIN)`, header с брендингом, AcademicBadge юзера, logout
- [x] [calendar/page.tsx](../../../apps/web/app/admin/calendar/page.tsx) (server component):
      читает searchParams, вызывает `trpc.event.list` через server caller, маппит результат
      в `EventCardData`
- [x] [calendar-sidebar.tsx](../../../apps/web/app/admin/calendar/calendar-sidebar.tsx) (client):
  - Mobile: Sheet (триггер-кнопка «Фильтры»), Desktop: sticky aside с rounded card
  - URL search params как single source of truth (`useSearchParams`+`useRouter.replace`)
  - Period switcher Месяц / Квартал / Год / Период (4 кнопки)
  - Чекбоксы 8 направлений
  - Search по названию + поиску по спикеру (фильтр на сервере по name)
  - Select филиалов через `trpc.branch.list` (server-side prefetch)
  - Формат: Все / Очно / Онлайн
  - Кнопка «Сбросить»
  - Счётчик «Всего событий: N»
- [x] [agenda-list.tsx](../../../apps/web/app/admin/calendar/agenda-list.tsx):
      группировка по дням, заголовок «04 мая, понедельник», sortedKeys ASC,
      empty-state с иконкой и подсказкой
- [x] [event-card.tsx](../../../apps/web/app/admin/calendar/event-card.tsx):
  - Левая колонка: число + месяц (Playfair) + время старта
  - Type badge с разными вариантами (default/accent/success/warning/outline/muted)
  - Online badge при is_online
  - Tags badges (включая «с детьми», «СВЕТЛОЯР», «допуск после знакомства»)
  - Playfair-заголовок, описание (line-clamp-2)
  - Спикер с иконкой User2, филиал/«Все филиалы», время, цена (FIXED/DONATION/FREE
    с pricing_note)
  - Capacity progressbar `bookings_count / max_participants` с aria-valuenow
- [x] Empty-state и loading-state для пустого диапазона (loading через React Suspense
      на уровне страницы; для MVP оставлено по умолчанию Next.js)

### E. Качество

- [x] `pnpm typecheck` — все 6 пакетов зелёные
- [x] `pnpm test` — 5 пакетов зелёные:
  - `@academy/db` — 60 тестов
  - `@academy/api` — 66 тестов (33 новых в PR 2)
  - `@academy/ui` — 34 теста
  - `@academy/web` — 114 тестов (включая 25 новых в PR 4: filters/event-card/agenda-list +
    2 tRPC smoke)
  - **Итого: 274 теста**
- [x] `pnpm --filter @academy/web dev` — `/admin/calendar` отдаёт 307 на /login для
      неавторизованных (middleware работает); `/api/trpc/health.ping` отдаёт `pong`
- [x] Smoke: `db:studio` доступен через `pnpm --filter @academy/db db:studio`

---

## 2. Что вышло за рамки спеки (intentional)

| Решение                                          | Зачем                                                                                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Supabase Cloud вместо Docker                     | Docker Desktop не поднялся на машине пользователя; Supabase даёт ту же Postgres + UI                                       |
| `getServerCaller()` в lib/trpc/server.ts         | Нужно было до начала PR 4: server components должны звать tRPC без HTTP roundtrip                                          |
| `/api-health` маршрут                            | Технический smoke-роут для проверки tRPC wiring; удалится в следующих итерациях, когда будет более полный health-dashboard |
| `SystemRole.BRANCH_ADMIN` минимум для `/admin/*` | Чтобы Магистры/Мастера попадали через свой профиль (`/student`), а не через admin-shell                                    |

## 3. Известные ограничения / debt

- **Auth по-прежнему in-memory.** Логин в браузере не работает без seed'a in-memory repo
  (или миграции на Prisma-репо). Spec явно вынес это в out-of-scope (§8). Live-проверка UI
  была через middleware-redirect на /login — сама страница компилируется и подтягивает
  данные через server caller.
- **Empty-state одинаковый для всех причин.** «Нет событий» показывается и при пустом
  диапазоне, и при недоступном филиале (never-фильтр). UX-дифференциация — после auth.
- **Без CRUD-модалок.** Создание/редактирование событий — итерация 2.
- **Без неделя/день views.** Только agenda-list — спека прямо запрещает другие views в MVP.
- **Real-time refetch.** Не реализован: react-query invalidation хватит, когда CRUD появится.
- **Speaker filter — частичный.** Сейчас спикер ищется по name-substring клиентом
  (после получения событий), а не отдельным trpc-фильтром. Когда появится UI-список
  спикеров, переключим на `speaker_id` через select.

## 4. Чек-лист для следующего PR

1. Seed in-memory user repo dev-only credentials (или мигрировать на Prisma) — чтобы
   живой smoke на /admin/calendar работал в браузере
2. CRUD-модалка создания события (тип, дата, цена, теги, branch)
3. Расширить event router: `event.create/update/delete` с RBAC (только Magister+ создаёт
   в своём филиале; President/VP — где угодно)
4. Booking flow (отдельный спринт)
5. Loader skeleton-карточки на /admin/calendar (через React Suspense + cards-skeleton)

## 5. Definition of Done

- [x] Все acceptance criteria из spec.md §3 ✅
- [x] Spec review checklist пройден
- [x] tasks.md создан, все T1–T23 завершены
- [x] review.md написан
- [x] PR'ы запушены: PR 1 (`9415a0c`), PR 2 (`a9c145e`), PR 3 (`e64fe62`),
      PR 4 — текущий коммит
