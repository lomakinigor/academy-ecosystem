# Calendar MVP — визуальный календарь и DB-инфраструктура

**Этап:** 1 (фундаментальный модуль)
**Owner:** UI Agent + DB Agent
**Дата:** 2026-05-05
**Состояние:** Draft

---

## 1. Problem statement

Этап 0 закрыл UI-фундамент, но `apps/web` живёт на in-memory user repo и не имеет ни БД, ни tRPC-клиента, ни календаря. Академия публикует расписание текстом в Telegram («📝 4.05. Понедельник …»). Нет ни единого источника событий, ни поиска, ни фильтров.

MVP-цель: **превратить расписание в живую страницу** `/admin/calendar` с фильтрами по периоду, направлению, спикеру и филиалу — на реальных данных из Prisma. Без CRUD пока (это итерация 2).

## 2. User stories

- **Как branch admin** хочу видеть список всех событий своего филиала за месяц с фильтрами, чтобы планировать загрузку залов.
- **Как Магистр** хочу видеть события только своего филиала, отфильтрованные по типу (Семинары/Практики/Курсы/Ритриты), чтобы понимать загруженность.
- **Как President/VP** хочу видеть события всех филиалов с переключателем «филиал» (или «все филиалы») и сводным счётчиком, чтобы делать стратегический обзор.
- **Как разработчик** хочу tRPC-клиент в apps/web и Prisma-bound queries, чтобы Этап 1+ мог писать новые роутеры без re-architecture.

## 3. Acceptance criteria

### A. БД и Prisma

- [ ] `docker compose up -d` поднимает Postgres 16 на :5432 + Adminer на :8080
- [ ] Schema [packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma) обновлена:
  - `EventType` заменён на `SEMINAR | PRACTICE | WEBINAR | COURSE | RETREAT | TRIP | MASTERCLASS | GRADING`
  - `PricingType` enum добавлен: `FIXED | DONATION | FREE`
  - `Event.is_online: Boolean` — модификатор формата
  - `Event.branch_id: String?` — стал nullable («все филиалы»)
  - `Event.pricing_type: PricingType @default(FIXED)`
  - `Event.pricing_note: String?` — свободный текст для tier-pricing (early bird и пр.)
  - `Event.tags: String[]` — расширяемые лейблы (с детьми / допуск после знакомства / открытое / др.)
  - `Branch.address: String?`, `Branch.entrance_code: String?`, `Branch.contact_phones: String[]`, `Branch.timezone: String?`
- [ ] Миграция применена: `pnpm --filter @academy/db db:push` (или migrate dev)
- [ ] Prisma client сгенерирован: `pnpm --filter @academy/db db:generate`
- [ ] Seed обновлён: 3 филиала + 6 пользователей разных ролей + ~30 событий за текущий и следующий месяц, включая:
  - многодневный семинар (4 события связаны через `program_id`)
  - онлайн-вебинар
  - событие с `pricing_type=DONATION`
  - событие с `branch_id=null` («все филиалы»)
  - событие с тегом «с детьми»

### B. tRPC backend

- [ ] [packages/api/src/routers/event.ts](packages/api/src/routers/event.ts) расширен:
  - `list({ from, to, branch_id?, types?, speaker_id?, search?, is_online?, tags? })` — фильтрованная выборка
  - Branch isolation middleware: `branch_admin/director` видит только свой `branch_id` (плюс `branch_id=null` события); `president/vp` — всё
  - Возвращает `{ events: Event[], total: number, byDay: Record<isoDate, EventCard[]> }` для удобного рендера
- [ ] `branchRouter.list()` для дропдауна филиалов в сайдбаре
- [ ] Тесты в [packages/api/test/](packages/api/test/) — фильтры, RBAC, branch isolation

### C. tRPC client в apps/web

- [ ] Зависимости: `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query`, `superjson`
- [ ] `apps/web/app/api/trpc/[trpc]/route.ts` — Next.js handler
- [ ] `apps/web/lib/trpc/client.ts` + `apps/web/lib/trpc/provider.tsx` — типизированный клиент + провайдер
- [ ] `apps/web/app/layout.tsx` оборачивает children в `<TRPCProvider>` + `<QueryClientProvider>`
- [ ] Smoke-тест: `health.ping` query успешно ходит туда-обратно

### D. UI календаря (read-only)

- [ ] `apps/web/app/admin/calendar/page.tsx` — защищена middleware (`branch_admin+`)
- [ ] Левый сайдбар (sticky):
  - Профиль: avatar, имя, system_role badge
  - Период: переключатель Месяц / Квартал / Год / Произвольный (с date range pickers)
  - Направления: чекбоксы по типам
  - Доп. фильтры: текст по названию, спикер, филиал, локация
  - Кнопка Сбросить
  - Счётчик «Всего событий: N»
- [ ] Главная зона — agenda-list событий, сгруппированный по дням:
  - Заголовок страницы Playfair `РАСПИСАНИЕ`
  - День: заголовок «04 апреля, понедельник» + список карточек
  - Карточка события (`Card` из `@academy/ui`):
    - Левая колонка: число + месяц крупно
    - Правая часть: badges типа + online + tags (top), Playfair title, описание, спикер с иконкой, badge филиала, capacity progress «X/N записано» (через bookings.count)
- [ ] Mobile-first: на <768px сайдбар сворачивается в drawer (через `Sheet` из `@academy/ui`)
- [ ] Empty state: «Нет событий в выбранном периоде»
- [ ] Loading state: skeleton-карточки

### E. Качество

- [ ] `pnpm typecheck` (root) — зелёный по 6 пакетам
- [ ] `pnpm test` — все пакеты зелёные, новые тесты в `@academy/api`
- [ ] `pnpm --filter @academy/web dev` рендерит `/admin/calendar` без ошибок при залогиненном branch_admin
- [ ] Smoke-проверка: 10+ seed-событий видны на странице, фильтр по типу работает, фильтр по периоду работает
- [ ] `pnpm --filter @academy/db db:studio` открывает Prisma Studio

## 4. Affected files

### Новые

```
apps/web/app/admin/calendar/page.tsx
apps/web/app/admin/calendar/calendar-sidebar.tsx
apps/web/app/admin/calendar/agenda-list.tsx
apps/web/app/admin/calendar/event-card.tsx
apps/web/app/admin/layout.tsx                    ← shared admin shell, middleware-protected
apps/web/app/api/trpc/[trpc]/route.ts
apps/web/lib/trpc/client.ts
apps/web/lib/trpc/provider.tsx
apps/web/lib/trpc/server.ts                      ← server-side caller
apps/web/tests/calendar/event-card.test.tsx
apps/web/tests/calendar/agenda-list.test.tsx
packages/api/test/event-router.test.ts           ← фильтры, RBAC
packages/api/test/branch-isolation.test.ts
docs/features/calendar-mvp/{spec,tasks,review}.md
```

### Изменённые

```
packages/db/prisma/schema.prisma                 ← Event/Branch/EventType/PricingType
packages/db/prisma/seed.ts                       ← realistic seed
packages/api/src/routers/event.ts                ← list with filters + RBAC middleware
packages/api/src/routers/branch.ts               ← list для дропдауна
packages/api/src/schemas/event.ts                ← input schemas
apps/web/package.json                            ← @trpc/*, @tanstack/react-query, @academy/api
apps/web/app/layout.tsx                          ← TRPCProvider wrap
apps/web/middleware.ts                           ← /admin matcher уже есть
```

## 5. Data model changes

### EventType (новый набор)

```
SEMINAR | PRACTICE | WEBINAR | COURSE | RETREAT | TRIP | MASTERCLASS | GRADING
```

### PricingType (новый enum)

```
FIXED     — обычная цена (Decimal в Event.price)
DONATION  — за донат (price опционален, pricing_note может быть «минимум 500₽»)
FREE      — бесплатно
```

### Event — новые поля

```prisma
is_online     Boolean      @default(false)
branch_id     String?      // ← было required
pricing_type  PricingType  @default(FIXED)
pricing_note  String?      // ранний период / донат-минимум / для своих
tags          String[]     // ["с детьми", "допуск после знакомства", "открытое"]
```

### Branch — расширение

```prisma
address         String?
entrance_code   String?
contact_phones  String[]
timezone        String?    // IANA: "Europe/Moscow", "Asia/Yekaterinburg"
```

## 6. Test plan

### Unit/integration в @academy/api

- `event.list` — фильтр по date range, по type, по branch_id, по speaker_id, search по title
- RBAC middleware — branch_admin не видит чужой филиал; president видит всё
- branch_id=null события видят все

### Component-light в @academy/web

- `EventCard` — рендерит title, speaker, badges, capacity correctly
- `AgendaList` — группирует события по дням, показывает empty state

### Smoke

- Dev-сервер, login как branch_admin, переход на /admin/calendar, фильтрация работает

## 7. Rollback plan

Если что-то пойдёт не так:

- DB: `pnpm docker:down -v` сносит volume и состояние
- Schema: `git revert <migration commit>`
- UI: страница изолирована в `app/admin/calendar/`, удаление не ломает остальные маршруты

## 8. Out of scope (явно)

- **CRUD-модалки** (создание/редактирование/удаление событий) — итерация 2
- **Booking flow** (запись слушателя, оплата) — итерация 3, отдельный спринт
- **Неделя/день views** — после MVP, когда визуал устаканится
- **Real-time updates** (WebSocket) — react-query refetch достаточно
- **Auth Prisma migration** — пока остаётся in-memory `defaultUserRepository`. Добавим Prisma-backed репо в отдельной задаче когда понадобится регистрация (на этом этапе — только seed-юзеры)
- **iCal/Google Calendar export** — будущее
- **Пуши/email уведомления** — workers/notifications будет позже
- **Recharts dashboard** — Admin Dashboard модуль отдельно

## 9. Open risks

| Риск                                                                   | Вероятность                                       | Митигация                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| Docker Desktop не установлен у пользователя                            | Средняя                                           | Проверим в начале T1, fallback на Supabase free tier                   |
| Prisma client breaking change при `db push` (если schema не аддитивна) | Низкая (мы только добавляем поля + меняем 1 enum) | `db push --accept-data-loss` или migrate dev с явной миграцией         |
| tRPC v10 + Next.js 14 App Router имеет известные edge cases с RSC      | Средняя                                           | Начинаем с client-side queries (`useQuery`), server components — позже |
| Mismatch EventType между UI и старым seed (если был)                   | Высокая                                           | Полностью переписываем seed под новый enum                             |
| pnpm + tRPC + TypeScript path resolution                               | Низкая (мы прошли этот урок с @academy/ui)        | Уроки из ui-integration, добавляем @academy/api как workspace dep      |

## 10. Definition of Done

- [ ] Все acceptance criteria из §3 выполнены
- [ ] Spec review checklist пройден
- [ ] `tasks.md` создан и все задачи завершены
- [ ] `review.md` написан с самопроверкой
- [ ] PR'ы созданы и запушены (4 PR'а: DB-infra, tRPC backend, tRPC client, UI calendar)
