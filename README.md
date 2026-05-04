# Academy Ecosystem

Интеллектуальная Экосистема Академии Развития Человека им. В.Ю. Светлова —
платформа управления образовательными мероприятиями, академическим прогрессом,
финансовым учётом и контент-фабрикой.

Сайт академии: https://svetlov.academy/

> Полный контекст и архитектурные решения — в [CLAUDE.md](CLAUDE.md).

---

## 🚀 Quickstart за 5 минут

### Prerequisites

| Инструмент | Версия | Проверка |
|------------|--------|----------|
| Node.js    | ≥ 20   | `node -v` |
| pnpm       | ≥ 9    | `pnpm -v` |
| Docker     | любая актуальная (с `docker compose`) | `docker compose version` |
| Git        | ≥ 2.40 | `git --version` |

Установка pnpm, если нет:
```bash
npm install -g pnpm@9
```

---

### 1. Клонировать и установить зависимости

```bash
git clone <repo-url> academy-ecosystem
cd academy-ecosystem
pnpm install
```

---

### 2. Поднять локальную инфраструктуру (Postgres + Redis + Adminer)

```bash
pnpm docker:up
```

Поднимутся три контейнера:

| Сервис   | Порт   | Назначение |
|----------|--------|------------|
| Postgres 16 | `5432` | Основная БД (юзер/пароль/БД = `academy`) |
| Redis 7  | `6379` | Очереди BullMQ + кэш |
| Adminer  | `8080` | Веб-UI для БД → http://localhost:8080 |

Логи: `pnpm docker:logs` · Стоп: `pnpm docker:down` · Сброс данных: `pnpm docker:reset`

В Adminer вход: System=`PostgreSQL`, Server=`postgres`, User=`academy`, Password=`academy`, DB=`academy`.

---

### 3. Настроить переменные окружения

```bash
cp .env.example .env.local
```

Минимум для локального запуска уже заполнен (`DATABASE_URL`, `REDIS_URL`).
Для NextAuth сгенерируй секрет:

```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Вставь результат в `NEXTAUTH_SECRET`.

---

### 4. Применить схему БД и налить тестовые данные

```bash
pnpm db:push     # синхронизировать Prisma schema → БД (без миграций, dev-only)
pnpm db:seed     # 2 филиала + пользователи всех ролей + тестовые мероприятия
```

Открыть Prisma Studio (графический редактор БД):
```bash
pnpm db:studio   # → http://localhost:5555
```

---

### 5. Запустить dev-сервер

```bash
pnpm dev
```

| URL | Что |
|-----|-----|
| http://localhost:3000 | Next.js приложение |
| http://localhost:5555 | Prisma Studio (если запущен) |
| http://localhost:8080 | Adminer |

---

## 📂 Структура monorepo

```
academy-ecosystem/
├── apps/
│   ├── web/              ← Next.js 14 (App Router + RSC + PWA)
│   └── vk-miniapp/       ← VK Mini App (VKUI)
├── packages/
│   ├── db/               ← Prisma schema + migrations + seed
│   ├── api/              ← tRPC routers + Zod schemas
│   ├── ui/               ← shadcn/ui + дизайн-токены
│   └── config/           ← общие ESLint/TS/Tailwind конфиги
├── workers/
│   ├── notifications/    ← BullMQ: рассылки, напоминания
│   └── content-machine/  ← AI-генерация, автопубликации
└── bots/
    ├── telegram/         ← Grammy.js Bot + Mini App
    └── vk/               ← VK Bot API + MAX Bot
```

---

## 🛠 Корневые скрипты

| Команда | Что делает |
|---------|-----------|
| `pnpm dev`         | Параллельно поднимает все `dev` таски (web, workers, bots) |
| `pnpm build`       | Сборка всего monorepo через Turbo |
| `pnpm test`        | Юнит/интеграционные тесты (Vitest) |
| `pnpm test:e2e`    | E2E-тесты (Playwright) |
| `pnpm lint`        | ESLint по всем пакетам |
| `pnpm typecheck`   | `tsc --noEmit` по всем пакетам |
| `pnpm format`      | Prettier по всему проекту |
| `pnpm db:generate` | Сгенерировать Prisma Client |
| `pnpm db:push`     | Залить схему в БД (dev) |
| `pnpm db:migrate`  | Создать/применить миграцию |
| `pnpm db:seed`     | Наполнить БД тестовыми данными |
| `pnpm db:studio`   | Открыть Prisma Studio |
| `pnpm docker:up`   | Поднять Postgres + Redis + Adminer |
| `pnpm docker:down` | Остановить контейнеры |
| `pnpm docker:reset`| Сбросить тома (внимание: чистит БД) |
| `pnpm clean`       | Очистить все `node_modules` и кэш Turbo |

---

## 🔄 CI/CD

GitHub Actions, три воркфлоу:

| Файл | Триггер | Что делает |
|------|---------|-----------|
| [.github/workflows/ci.yml](.github/workflows/ci.yml)           | PR в `main` + push в `main` | Lint + typecheck + тесты на матрице с реальными Postgres/Redis в services |
| [.github/workflows/preview.yml](.github/workflows/preview.yml) | push в `feat/**`, `fix/**`, `chore/**` | Preview-деплой на Vercel + комментарий с URL в коммит |
| [.github/workflows/deploy.yml](.github/workflows/deploy.yml)   | push в `main` + ручной запуск | Миграции на prod БД + production-деплой на Vercel + Sentry release |

### Необходимые GitHub Secrets

Для preview/deploy:
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

Для deploy.yml дополнительно:
- `DATABASE_URL` (production Postgres, обычно от Railway/Supabase)
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` (опционально — при пустом токене шаг пропускается)

---

## ✅ Локальная проверка «всё работает»

Минимальный smoke-test после установки:

```bash
pnpm docker:up                # 1. Инфра поднялась?
docker compose ps             # 2. Все 3 контейнера healthy
pnpm install                  # 3. Зависимости встали
pnpm db:push && pnpm db:seed  # 4. Схема и сид
pnpm lint && pnpm typecheck   # 5. Код чистый
pnpm test                     # 6. Тесты зелёные
pnpm dev                      # 7. http://localhost:3000 открывается
```

---

## 🧭 Методология разработки

Вся работа — по протоколу **Superpowers**:

1. `/brainstorming` → 2. `/spec` → 3. `/writing-plans` →
4. `/subagent-driven-development` → 5. `/tdd` → 6. `/code-review`

**Целевое покрытие тестами: 85–95%.**
Тест пишется **до** кода. Подробности — в [CLAUDE.md](CLAUDE.md).

---

## 🔗 Стек

Next.js 14 · Tailwind + shadcn/ui · PostgreSQL + Prisma · tRPC · NextAuth v5 · BullMQ + Redis · Vitest + Playwright · Turborepo · Vercel + Railway · Sentry + Axiom

Полный стек и архитектурные решения — в [CLAUDE.md](CLAUDE.md).
