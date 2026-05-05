# CLAUDE.md — Интеллектуальная Экосистема Академии Светлова

## 🎯 Контекст проекта

Ты разрабатываешь **Интеллектуальную Экосистему Академии Развития Человека им. В.Ю. Светлова** — комплексную платформу управления образовательными мероприятиями. Это живая экосистема с двойной иерархией ролей, академическим прогрессом, финансовым учётом и контент-фабрикой.

**Сайт академии:** https://svetlov.academy/

---

## 🏗️ Методология: Superpowers Protocol

Вся разработка — строго по протоколу Superpowers:

1. `/brainstorming` — Socratic Dialogue, уточнение требований, HTML-мокап фичи
2. `/spec` — документ требований → `docs/specs/FEATURE_NAME.md`
3. `/writing-plans` — разбивка на изолированные задачи для subagent'ов
4. `/subagent-driven-development` — каждая задача выполняется в изолированном контексте
5. `/tdd` — тесты ВСЕГДА пишутся ДО кода (Red → Green → Refactor)
6. `/code-review` — проверка соответствия спеке и качеству
7. Git Worktree — каждая фича в отдельной ветке, мерж только после зелёных тестов

**Целевое покрытие тестами: 85–95%**
**Новые фичи добавляются в ЛЮБОЙ момент через тот же протокол.**

---

## 🛠️ Технологический стек

```
Frontend:     Next.js 14 (App Router + RSC)
Styling:      Tailwind CSS + shadcn/ui
Typography:   Playfair Display (заголовки) + Space Grotesk + Inter
Animations:   Framer Motion (duration 250–400ms, easeOut)
Charts:       Recharts (градиентные заливки, кастомные tooltips)
Backend:      Next.js API Routes + tRPC
Database:     PostgreSQL + Prisma ORM
Auth:         NextAuth.js v5 + custom RBAC middleware
Validation:   Zod (ВСЕГДА на уровне API)
Queue/Jobs:   BullMQ + Redis
Storage:      Supabase Storage (фото спикеров, баннеры)
AI/Content:   Anthropic Claude API (генерация объявлений)
Mobile Web:   PWA (Service Workers + Web Push)
VK/MAX:       VKUI + VK Bridge (Mini App — приоритет для РФ)
Telegram:     Grammy.js (Bot + Mini App — дополнительный канал)
Deploy:       Vercel (web) + Railway (workers, bots)
CI/CD:        GitHub Actions
Monorepo:     Turborepo
Testing:      Vitest + Playwright (E2E) + Testing Library
i18n:         next-intl (RU основной, EN — будущее)
Observability: Sentry + Axiom
```

---

## 👥 Иерархии ролей — CRITICAL

Пользователь имеет ОДНОВРЕМЕННО два поля: `system_role` И `academic_level`.

### Иерархия 1 — Административная (system_role)

| system_role       | Доступ                                 |
| ----------------- | -------------------------------------- |
| `president`       | Вся сеть, консолидированная аналитика  |
| `vice_president`  | Вся сеть, управление                   |
| `branch_director` | Полный доступ к своему филиалу         |
| `branch_admin`    | Операционное управление своим филиалом |
| `student`         | Только свой личный кабинет             |

### Иерархия 2 — Академическая (academic_level)

| academic_level | Описание                                         |
| -------------- | ------------------------------------------------ |
| `founder`      | В.Ю. Светлов — Основатель, особый статус         |
| `magister`     | Магистры — ведут города, создают мероприятия     |
| `master`       | Мастера — ведут занятия, работают со слушателями |
| `listener`     | Слушатели — участники обучения                   |

### Спикеры

Дополнительный флаг `is_speaker: boolean`. Спикером может быть Магистр, Мастер или приглашённый эксперт. У спикера отдельный профиль с биографией, фото, расписанием и личным финансовым счётом.

### Правила RBAC (обязательны в middleware)

- Branch Admin/Director видит ТОЛЬКО данные своего `branch_id`
- President/VP видят всё через консолидированный view
- Магистры/Мастера создают мероприятия только в своём городе
- API routes обязаны проверять `branch_id` изоляцию

---

## 🎨 Дизайн-система

### Цветовые токены (tailwind.config.ts)

```typescript
colors: {
  brand: {
    primary: '#1A1A2E',   // Глубокий индиго — фоны, header
    accent:  '#C9A84C',   // Тёплое золото — CTA, акценты, бейджи
    warm:    '#F5F0E8',   // Кремовый — светлые секции
    earth:   '#8B6914',   // Земляной — вторичные акценты
  },
  success:     '#2D6A4F',
  warning:     '#E9C46A',
  destructive: '#9B2335',
  muted:       '#E8E3DA',
}
```

### Типографика

```
Playfair Display 700  → Hero-заголовки, имена спикеров
Space Grotesk 600-700 → Заголовки секций и карточек
Inter 400-500         → Основной текст, лейблы
```

### UI-принципы

- Mobile-First: дизайн начинается с 375px
- Padding секций: 32–64px, max-width контента: 1280px
- Карточки: border-radius 16–20px, мягкие тени
- Иконки: Lucide React
- NO motion: `prefers-reduced-motion` обязательно
- Recharts: всегда с градиентными заливками и кастомными tooltips

### Бейджи академических уровней

```
🏛️ Основатель  — золотой щит (#C9A84C)
🌟 Магистр      — золотая звезда с ореолом
⭐ Мастер        — серебряная звезда
🎓 Слушатель    — академический значок
```

---

## 🗄️ Prisma Schema (стартовая)

```prisma
model User {
  id             String        @id @default(cuid())
  email          String        @unique
  name           String
  phone          String?
  avatar         String?
  system_role    SystemRole    @default(STUDENT)
  academic_level AcademicLevel @default(LISTENER)
  is_speaker     Boolean       @default(false)
  branch_id      String?
  branch         Branch?       @relation(fields: [branch_id], references: [id])
  referral_code  String?       @unique
  referred_by    String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  bookings        Booking[]
  payments        Payment[]
  mentor_of       MentorRelation[] @relation("Mentor")
  mentored_by     MentorRelation[] @relation("Student")
  speaker_profile SpeakerProfile?
  executor_balance ExecutorBalance?
  academic_records AcademicRecord[]
}

enum SystemRole {
  PRESIDENT
  VICE_PRESIDENT
  BRANCH_DIRECTOR
  BRANCH_ADMIN
  STUDENT
}

enum AcademicLevel {
  FOUNDER
  MAGISTER
  MASTER
  LISTENER
}

model Branch {
  id      String  @id @default(cuid())
  name    String
  city    String
  country String  @default("RU")
  users   User[]
  events  Event[]
}

model Event {
  id              String      @id @default(cuid())
  title           String
  description     String?
  type            EventType
  status          EventStatus @default(DRAFT)
  start_at        DateTime
  end_at          DateTime
  speaker_id      String
  branch_id       String
  branch          Branch      @relation(fields: [branch_id], references: [id])
  max_participants Int?
  price           Decimal?
  is_grading      Boolean     @default(false)
  program_id      String?
  bookings        Booking[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

enum EventStatus {
  DRAFT
  PLANNED
  ACTIVE
  COMPLETED
  CANCELLED
}

enum EventType {
  SEMINAR
  PRACTICE
  MASTERCLASS
  TRIP
  GRADING
  ONLINE
}

model Booking {
  id        String        @id @default(cuid())
  user_id   String
  user      User          @relation(fields: [user_id], references: [id])
  event_id  String
  event     Event         @relation(fields: [event_id], references: [id])
  status    BookingStatus @default(PENDING)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}

enum BookingStatus {
  PENDING
  CONFIRMED
  WAITLIST
  CANCELLED
  ATTENDED
}

model Payment {
  id        String        @id @default(cuid())
  user_id   String
  user      User          @relation(fields: [user_id], references: [id])
  amount    Decimal
  status    PaymentStatus @default(PENDING)
  type      PaymentType
  booking_id String?
  createdAt DateTime      @default(now())
}

enum PaymentStatus { PENDING COMPLETED FAILED REFUNDED }
enum PaymentType   { BOOKING REFERRAL_BONUS EXECUTOR_PAYOUT }

model ExecutorBalance {
  id       String  @id @default(cuid())
  user_id  String  @unique
  user     User    @relation(fields: [user_id], references: [id])
  accrued  Decimal @default(0)
  paid     Decimal @default(0)
  pending  Decimal @default(0)
}

model MentorRelation {
  id         String   @id @default(cuid())
  mentor_id  String
  mentor     User     @relation("Mentor", fields: [mentor_id], references: [id])
  student_id String
  student    User     @relation("Student", fields: [student_id], references: [id])
  notes      String?
  createdAt  DateTime @default(now())
}

model AcademicRecord {
  id           String        @id @default(cuid())
  user_id      String
  user         User          @relation(fields: [user_id], references: [id])
  level        AcademicLevel
  granted_by   String?
  granted_at   DateTime
  program_id   String?
  notes        String?
}

model SpeakerProfile {
  id           String  @id @default(cuid())
  user_id      String  @unique
  user         User    @relation(fields: [user_id], references: [id])
  bio          String?
  specialties  String[]
  rating       Decimal @default(0)
}
```

---

## 📦 Модули (краткий реестр)

| Модуль                                  | Этап | Статус                                                  |
| --------------------------------------- | ---- | ------------------------------------------------------- |
| Auth + RBAC (двойная иерархия)          | 0    | 🟡 In progress (in-memory repo, ждёт Prisma из Этапа 1) |
| Дизайн-система + компоненты             | 0    | ✅ Done (см. docs/features/ui-integration/)             |
| Визуальный календарь + расписание       | 1    | 🔲 TODO                                                 |
| CRUD мероприятий (Mobile-First)         | 1    | 🔲 TODO                                                 |
| Admin Dashboard + аналитика сети        | 1    | 🔲 TODO                                                 |
| ЛК слушателя                            | 1    | 🔲 TODO                                                 |
| PWA (Service Workers, Push, Install)    | 1    | 🔲 TODO                                                 |
| CRM: база участников, сегментация       | 2    | 🔲 TODO                                                 |
| Менторство + академический прогресс     | 2    | 🔲 TODO                                                 |
| Promotions Report (готовность к уровню) | 2    | 🔲 TODO                                                 |
| Финансовые счета исполнителей           | 2    | 🔲 TODO                                                 |
| Реферальная программа (tiered)          | 2    | 🔲 TODO                                                 |
| VK Mini App + MAX Bot                   | 2    | 🔲 TODO                                                 |
| AI-генерация анонсов (Claude API)       | 3    | 🔲 TODO                                                 |
| Генератор лендингов + баннеров          | 3    | 🔲 TODO                                                 |
| SMM-шедулер (VK + Telegram)             | 3    | 🔲 TODO                                                 |
| Telegram Bot + Mini App                 | 3    | 🔲 TODO                                                 |

---

## 📁 Структура проекта

```
academy-ecosystem/
├── CLAUDE.md                    ← этот файл
├── docs/
│   ├── specs/                   ← спеки фич (через /spec)
│   ├── plans/                   ← планы задач (через /writing-plans)
│   └── adr/                     ← Architecture Decision Records
├── apps/
│   ├── web/                     ← Next.js 14 (основное приложение + PWA)
│   └── vk-miniapp/              ← VK Mini App (VKUI адаптер)
├── packages/
│   ├── ui/                      ← shadcn/ui компоненты + дизайн-токены
│   ├── db/                      ← Prisma schema + migrations + seed
│   ├── api/                     ← tRPC routers + Zod schemas
│   └── config/                  ← ESLint, TypeScript, Tailwind конфиги
├── workers/
│   ├── notifications/           ← BullMQ: рассылки, напоминания
│   └── content-machine/         ← AI-генерация, автопубликации
└── bots/
    ├── telegram/                ← Grammy.js Bot + Mini App
    └── vk/                      ← VK Bot API + MAX Bot
```

---

## 🚀 Команды для старта

### Инициализация (выполни прямо сейчас)

```
/brainstorming Нужно инициализировать monorepo для Академии Светлова.
Turborepo + Next.js 14 (App Router) + PostgreSQL + Prisma + Tailwind CSS +
shadcn/ui + NextAuth v5. Двойная система ролей: SystemRole и AcademicLevel.
Дизайн-токены: brand-primary #1A1A2E, brand-accent #C9A84C.
Весь контекст в CLAUDE.md.
```

### Следующий шаг после инициализации

```
/spec Создай спецификацию Auth модуля с двойной иерархией (SystemRole + AcademicLevel),
RBAC middleware для Next.js App Router, изоляцией данных по branch_id.
```

### Алгоритм добавления любой новой фичи

```
1. /brainstorming [описание фичи]
2. /spec
3. /writing-plans
4. /subagent-driven-development [задача из плана]
5. /tdd
6. /code-review
```

---

## ⚠️ Обязательные правила

- Zod-валидация на ВСЕХ API-эндпоинтах без исключений
- Проверка `branch_id` в КАЖДОМ запросе данных (изоляция филиалов)
- `createdAt` + `updatedAt` на ВСЕХ Prisma-моделях
- Тест ПЕРЕД имплементацией (TDD). Код без теста — удаляется
- `prefers-reduced-motion` учитывается во ВСЕХ анимациях
- Junction-таблицы для связей многие-ко-многим
- Пароли — только через NextAuth (не хранить в открытом виде)

---

## 📌 Ключевые архитектурные решения

| Решение                         | Обоснование                                   |
| ------------------------------- | --------------------------------------------- |
| PWA вместо React Native         | Единый код, нет App Store, быстрее разработка |
| VK Mini App — приоритет для РФ  | Telegram нестабилен, VK = 45M MAU             |
| Telegram — opt-in дополнение    | Работает там, где доступен                    |
| Playfair Display для заголовков | Академический характер бренда                 |
| tRPC + Prisma                   | Type-safety от БД до UI                       |
| BullMQ для очередей             | Надёжность рассылок и AI-генерации            |
| Turborepo monorepo              | Переиспользование кода web/vk/telegram        |
