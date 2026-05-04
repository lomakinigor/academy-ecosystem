# @academy/ui — Дизайн-система Академии Светлова

Компоненты, токены и Storybook для всей экосистемы (web, VK Mini App, Telegram).

## Структура

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── primitives/    ← shadcn/ui (12 компонентов)
│   │   └── academy/       ← кастомные компоненты академии (5)
│   ├── lib/utils.ts       ← cn() — clsx + tailwind-merge
│   ├── styles/globals.css ← Tailwind layers + CSS-переменные + шрифты
│   └── index.ts           ← публичные экспорты
├── tailwind.preset.ts     ← источник правды для токенов
├── tailwind.config.ts     ← локальный конфиг (для Storybook)
└── .storybook/            ← конфигурация Storybook
```

## Дизайн-токены (CLAUDE.md)

| Токен            | Значение  | Назначение                   |
|------------------|-----------|------------------------------|
| `brand-primary`  | `#1A1A2E` | Глубокий индиго — фоны       |
| `brand-accent`   | `#C9A84C` | Тёплое золото — CTA, акценты |
| `brand-warm`     | `#F5F0E8` | Кремовый — светлые секции    |
| `brand-earth`    | `#8B6914` | Земляной — вторичные акценты |
| `success`        | `#2D6A4F` | Успешные операции            |
| `warning`        | `#E9C46A` | Предупреждения               |
| `destructive`    | `#9B2335` | Опасные действия             |

**Шрифты:** Playfair Display (заголовки `font-display`), Space Grotesk (`font-heading`), Inter (`font-sans`).

## Компоненты

### Примитивы (shadcn/ui)

`Button`, `Card`, `Badge`, `Input`, `Select`, `Dialog`, `Sheet`, `Tabs`, `Avatar`, `Separator`, `Skeleton`, `Toast`.

### Академические

| Компонент       | Назначение                                                    |
|-----------------|---------------------------------------------------------------|
| `AcademicBadge` | Уровни: `founder` / `magister` / `master` / `listener`        |
| `StatusBadge`   | Статусы мероприятий: `draft`/`planned`/`active`/`completed`/`cancelled` |
| `UserCard`      | Карточка пользователя: фото + имя + бейдж + (Спикер)          |
| `PageHeader`    | Hero-заголовок Playfair Display + eyebrow + actions            |
| `KpiCard`       | Метрика с иконкой, дельтой и трендом для дашбордов            |

## Использование

### В apps/web

```css
/* apps/web/styles/globals.css — уже создано */
@import '@academy/ui/styles';
```

```tsx
// apps/web/app/layout.tsx
import { Button, AcademicBadge } from '@academy/ui';
import './globals.css';
```

### Tailwind конфиг приложения

```ts
// apps/web/tailwind.config.ts
import preset from '@academy/ui/tailwind-preset';

export default {
  ...preset,
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};
```

## Команды

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript --noEmit
npm run test       # Vitest (jsdom + Testing Library)
npm run storybook  # Storybook dev на :6006
```

## Принципы

- **Mobile-first** — все компоненты проверены на 375px (Storybook viewport по умолчанию).
- **prefers-reduced-motion** — анимации отключаются глобально через `globals.css`.
- **Типы Radix** — primitives основаны на `@radix-ui/*` для доступности.
- **CVA** — варианты компонентов через `class-variance-authority`.
- **Покрытие тестами 85%+** — цель TDD из CLAUDE.md.
