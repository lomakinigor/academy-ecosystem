# START.md — Запуск 4 агентов в 4 окнах VS Code

## Структура папок

После выполнения команд ниже у тебя будет:

```
D:\AI\VS Code\Local\projects\
├── academy-ecosystem\          ← главный репозиторий (git init здесь)
│   ├── CLAUDE.md
│   ├── START.md
│   └── packages\config\        ← общие конфиги (ESLint, TypeScript)
│
├── academy-core\               ← Окно 1: Monorepo + DB
├── academy-ui\                 ← Окно 2: Дизайн-система
├── academy-auth\               ← Окно 3: Auth + RBAC
└── academy-devops\             ← Окно 4: CI/CD + Docker
```

---

## Шаг 1 — Подготовка (терминал, один раз)

Открой терминал в `academy-ecosystem` и выполни по одной команде:

```bash
# Инициализация git (если ещё не сделано)
git init
git add .
git commit -m "init: project foundation"

# Создать 4 worktree-папки (каждая — отдельная ветка)
git worktree add ../academy-core    feat/core-infra
git worktree add ../academy-ui      feat/design-system
git worktree add ../academy-auth    feat/auth-rbac
git worktree add ../academy-devops  feat/cicd-devops
```

После этого 4 папки появятся рядом с `academy-ecosystem`.

---

## Шаг 2 — Открыть 4 окна VS Code

Выполни в терминале одну за другой:

```bash
code "D:\AI\VS Code\Local\projects\academy-core"
code "D:\AI\VS Code\Local\projects\academy-ui"
code "D:\AI\VS Code\Local\projects\academy-auth"
code "D:\AI\VS Code\Local\projects\academy-devops"
```

Каждая команда откроет отдельное окно VS Code со своей папкой.

> 💡 `CLAUDE.md` автоматически скопируется в каждую worktree-папку,
> потому что worktree — это та же ветка git, просто в другой директории.

---

## Шаг 3 — Дать задание каждому окну

Открой Claude Code в каждом окне и вставь соответствующий промпт ниже.

---

## Окно 1 — Agent CORE
### Папка: `academy-core`

```
Ты Agent CORE. Контекст проекта — в файле CLAUDE.md в корне этой папки.

ЗОНА ОТВЕТСТВЕННОСТИ — работаешь только здесь:
- packages/db/        ← Prisma schema, migrations, seed
- packages/api/       ← tRPC routers, Zod schemas
- turbo.json          ← monorepo pipeline
- package.json        ← root scripts

НЕ ТРОГАЙ:
- packages/ui/
- apps/web/auth/
- .github/
- docker-compose.yml
- README.md

ЗАДАЧА:
1. Настроить Turborepo monorepo:
   - apps/web (Next.js 14)
   - packages/db (Prisma + PostgreSQL)
   - packages/api (tRPC)
   - packages/config (ESLint, TypeScript, Tailwind конфиги)

2. Prisma schema — строго по CLAUDE.md:
   - Все модели: User, Branch, Event, Booking, Payment,
     ExecutorBalance, MentorRelation, AcademicRecord, SpeakerProfile
   - Все enum'ы: SystemRole, AcademicLevel, EventStatus,
     EventType, BookingStatus, PaymentStatus, PaymentType

3. Seed файл:
   - 2 филиала: Москва, Челябинск
   - По 1 пользователю каждой роли и уровня
   - 5 тестовых мероприятий разных типов

4. .env.example с переменными:
   DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL,
   REDIS_URL, ANTHROPIC_API_KEY, SUPABASE_URL

ПРОТОКОЛ:
- Сначала напиши план (коротко)
- Пиши тест ДО кода (TDD)
- В конце: список созданных файлов + команды для запуска
```

---

## Окно 2 — Agent UI
### Папка: `academy-ui`

```
Ты Agent UI. Контекст проекта — в файле CLAUDE.md в корне этой папки.

ЗОНА ОТВЕТСТВЕННОСТИ — работаешь только здесь:
- packages/ui/             ← компоненты
- tailwind.config.ts       ← токены
- apps/web/styles/         ← базовые стили

НЕ ТРОГАЙ:
- packages/db/
- apps/web/auth/
- .github/
- docker-compose.yml

ЗАДАЧА:
1. Tailwind config с токенами из CLAUDE.md:
   - brand-primary: #1A1A2E
   - brand-accent:  #C9A84C
   - brand-warm:    #F5F0E8
   - brand-earth:   #8B6914
   - Шрифты: Playfair Display + Space Grotesk + Inter

2. Установить и кастомизировать shadcn/ui компоненты:
   Button, Card, Badge, Input, Select, Dialog,
   Sheet, Tabs, Avatar, Separator, Skeleton, Toast

3. Кастомные компоненты академии:
   - AcademicBadge   (уровни: Основатель/Магистр/Мастер/Слушатель)
   - StatusBadge     (статусы мероприятий с цветами)
   - UserCard        (фото + имя + академический бейдж)
   - PageHeader      (Playfair Display заголовок + описание)
   - KpiCard         (метрика + иконка + тренд для дашборда)

4. Storybook: история для каждого компонента

ПРОТОКОЛ:
- Сначала напиши план
- Mobile-First: всё проверяй на 375px
- Тесты с Testing Library
- В конце: список компонентов и статус готовности
```

---

## Окно 3 — Agent AUTH
### Папка: `academy-auth`

```
Ты Agent AUTH. Контекст проекта — в файле CLAUDE.md в корне этой папки.

ЗОНА ОТВЕТСТВЕННОСТИ — работаешь только здесь:
- apps/web/auth/          ← NextAuth конфиг
- apps/web/middleware.ts  ← RBAC middleware
- apps/web/app/login/     ← страница входа
- apps/web/app/logout/    ← выход
- lib/auth/               ← хелперы

НЕ ТРОГАЙ:
- packages/db/schema (только импортируй готовые типы)
- packages/ui/
- .github/
- docker-compose.yml

ЗАДАЧА:
1. NextAuth.js v5 (Auth.js):
   - Credentials provider (email + password)
   - JWT стратегия
   - Session содержит: id, name, email,
     system_role, academic_level, branch_id, is_speaker

2. RBAC Middleware для App Router:
   - /admin/*     → BRANCH_ADMIN и выше
   - /director/*  → BRANCH_DIRECTOR и выше
   - /network/*   → VICE_PRESIDENT, PRESIDENT
   - /student/*   → любой авторизованный
   - Изоляция по branch_id (видит только свой филиал)

3. Auth хелперы:
   - getCurrentUser()
   - requireRole(role)
   - requireBranch(branchId)
   - canAccessBranch(userId, branchId)

4. Страницы:
   - /login  (форма входа)
   - /unauthorized (страница отказа доступа)

ПРОТОКОЛ:
- Тесты на каждый сценарий доступа (позитив + негатив)
- Vitest + mock сессий
- В конце: матрица прав и список файлов
```

---

## Окно 4 — Agent DEVOPS
### Папка: `academy-devops`

```
Ты Agent DEVOPS. Контекст проекта — в файле CLAUDE.md в корне этой папки.

ЗОНА ОТВЕТСТВЕННОСТИ — работаешь только здесь:
- .github/workflows/     ← GitHub Actions
- docker-compose.yml     ← локальная среда
- README.md              ← документация
- turbo.json             ← pipeline (если нет — создать)
- package.json scripts   ← корневые команды

НЕ ТРОГАЙ:
- packages/db/schema
- packages/ui/
- apps/web/auth/
- любой application-код

ЗАДАЧА:
1. docker-compose.yml:
   - PostgreSQL 16
   - Redis 7
   - Adminer (веб-интерфейс для БД, порт 8080)

2. GitHub Actions:
   - ci.yml       → lint + typecheck + tests на каждый PR
   - preview.yml  → deploy preview на Vercel при push в feature-ветки
   - deploy.yml   → deploy production при merge в main

3. Turborepo pipeline в turbo.json:
   build → test → lint → typecheck
   с правильным кэшированием зависимостей

4. package.json корневые scripts:
   dev, build, test, lint,
   db:push, db:seed, db:studio

5. README.md — инструкция запуска за 5 минут:
   Prerequisites → Clone → docker-compose up →
   .env.local → db:push → db:seed → dev

ПРОТОКОЛ:
- Сначала план
- В конце: список файлов + команда проверки "всё работает"
```

---

## Шаг 4 — Порядок запуска

Запускай **не все одновременно**, а чуть сдвинуто:

| Момент | Действие |
|--------|----------|
| Сразу | Запусти Окно 1 (CORE) и Окно 4 (DEVOPS) |
| Через 2–3 мин | Запусти Окно 2 (UI) |
| Через 5 мин | Запусти Окно 3 (AUTH) |

AUTH лучше запускать последним — он иногда хочет сослаться на структуру проекта,
которую создаёт CORE.

---

## Шаг 5 — Что делать после завершения

Когда все 4 агента завершили работу, в папке `academy-ecosystem` выполни:

```bash
# Слить изменения в main строго в этом порядке
git merge feat/core-infra    # 1. Сначала фундамент
git merge feat/cicd-devops   # 2. Окружение
git merge feat/auth-rbac     # 3. Auth (зависит от схемы)
git merge feat/design-system # 4. UI последним

# Проверить
npm run dev
```

После успешного запуска — **Этап 0 завершён**.

---

## Следующие 4 окна (Этап 1)

| Окно | Агент | Задача |
|------|-------|--------|
| 1 | Agent CALENDAR | Визуальный календарь + страница мероприятия |
| 2 | Agent CRUD | CRUD мероприятий, статусная машина, форма |
| 3 | Agent DASHBOARD | Admin Dashboard, KPI, графики Recharts |
| 4 | Agent STUDENT | Личный кабинет слушателя + PWA |
