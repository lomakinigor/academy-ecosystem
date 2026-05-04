# UI Integration — Self-review

**Дата:** 2026-05-04
**Статус:** Stage 7 (Verification & review)

---

## 1. Что изменено

### apps/web (новое и изменённое)

| Файл                                                                                 | Действие                                                                                                            |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| [apps/web/package.json](apps/web/package.json)                                       | Добавлены `@academy/ui` (workspace), `lucide-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` |
| [apps/web/tailwind.config.ts](apps/web/tailwind.config.ts)                           | Подключён `preset` из `@academy/ui/tailwind-preset`                                                                 |
| [apps/web/vitest.config.ts](apps/web/vitest.config.ts)                               | Добавлен `@vitejs/plugin-react`, `environmentMatchGlobs` для `tests/brand/**` → jsdom, setupFiles                   |
| [apps/web/tests/setup.ts](apps/web/tests/setup.ts)                                   | Условный импорт `@testing-library/jest-dom/vitest` (только в jsdom-окружении)                                       |
| [apps/web/app/layout.tsx](apps/web/app/layout.tsx)                                   | Импорт CSS перенесён на `../styles/globals.css` (единый источник через `@academy/ui/styles`)                        |
| [apps/web/app/globals.css](apps/web/app/globals.css)                                 | **Удалён** — был дубль с устаревшими CSS-переменными                                                                |
| [apps/web/app/icon.png](apps/web/app/icon.png)                                       | Новый — favicon (Next.js App Router auto)                                                                           |
| [apps/web/app/apple-icon.png](apps/web/app/apple-icon.png)                           | Новый — apple-touch-icon                                                                                            |
| [apps/web/app/page.tsx](apps/web/app/page.tsx)                                       | Полная переписка: hero с `BrandMark`+`Wordmark`, `Card` с описанием, две CTA-кнопки                                 |
| [apps/web/app/login/page.tsx](apps/web/app/login/page.tsx)                           | Обёрнута в `Card`, добавлен `BrandMark`, Playfair-заголовок                                                         |
| [apps/web/app/login/login-form.tsx](apps/web/app/login/login-form.tsx)               | Поля через `Input`, submit через `Button variant="accent"` с pending-состоянием                                     |
| [apps/web/app/unauthorized/page.tsx](apps/web/app/unauthorized/page.tsx)             | Card + BrandMark + Lock-иконка из lucide-react + 2 кнопки навигации                                                 |
| [apps/web/components/brand/brand-mark.tsx](apps/web/components/brand/brand-mark.tsx) | Новый компонент — `<Image>` обёртка с `priority` и size-prop                                                        |
| [apps/web/components/brand/wordmark.tsx](apps/web/components/brand/wordmark.tsx)     | Новый компонент — wordmark «АКАДЕМИЯ / РАЗВИТИЯ / ЧЕЛОВЕКА» в two variants                                          |
| [apps/web/tests/brand/brand-mark.test.tsx](apps/web/tests/brand/brand-mark.test.tsx) | 3 теста (alt, size, priority)                                                                                       |
| [apps/web/tests/brand/wordmark.test.tsx](apps/web/tests/brand/wordmark.test.tsx)     | 4 теста (three-line/one-line/accent/aria-label)                                                                     |

### packages/ui (необходимый side-effect)

17 файлов компонентов в [packages/ui/src/components/](packages/ui/src/components/) — заменены path-алиасы:

- `@/lib/utils` → `../../lib/utils`
- `@/components/primitives/...` → `../primitives/...`

**Why:** path-алиас `@/*` был привязан к `paths` в `packages/ui/tsconfig.json`, но при импорте из `apps/web` (где `@/*` указывает на корень `apps/web/`) этот алиас ломался. Использование относительных путей делает пакет переносимым между потребителями. Все 34 теста `@academy/ui` остались зелёными — это рефакторинг без изменения поведения.

### packages — побочно (НЕ моя задача, но обнаружено)

- [apps/web/tests/auth/credentials.test.ts](apps/web/tests/auth/credentials.test.ts) — починен **pre-existing баг**: тесты вызывали `provider.authorize` напрямую, но `@auth/core@0.34.x` (зависимость next-auth 5 beta.20) намеренно возвращает `authorize: () => null` на верхнем уровне — реальный config переехал в `provider.options.authorize`. Также заменён асинхронный `beforeAll` на `bcrypt.hashSync` (так стабильнее в node-окружении vitest). См. §3 ниже.

---

## 2. Регрессия — финальные цифры

| Пакет           | Test files | Tests | Результат  |
| --------------- | ---------- | ----- | ---------- |
| @academy/ui     | 6          | 34    | ✅         |
| @academy/db     | 2          | —     | ✅         |
| @academy/web    | 9          | 86    | ✅         |
| @academy/api    | 3          | —     | ✅         |
| @academy/config | —          | —     | (no tests) |

**Root `pnpm typecheck`** — 6/6 зелёные.
**Root `pnpm test`** — 5/5 успешно (config без тестов).

**Smoke-проверка в браузере на dev-сервере**:
| Маршрут | Статус | Размер |
|---|---|---|
| `/` | 200 | 14824 bytes |
| `/login` | 200 | 11903 bytes |
| `/unauthorized` | 200 | 13891 bytes |

В каждом ответе подтверждены маркеры: `font-display` (Playfair), `bg-brand-warm` (tailwind preset), `/_next/image` (оптимизация логотипа).

---

## 3. Risks reflection

### Что упростилось

- **Single source of truth для дизайн-токенов**: brand-цвета, типографика, тени теперь только в [packages/ui/tailwind.preset.ts](packages/ui/tailwind.preset.ts). Любое изменение токена автоматически отражается во всех пакетах.
- **`@academy/ui` стал переносимым**: после рефакторинга path-алиасов пакет можно консумить из любого app (vk-miniapp, telegram-mini-app в будущем) без специальных tsconfig-настроек.
- **CSS-конфликт устранён**: было два `globals.css` с разными форматами CSS-переменных (статические `#1a1a2e` vs HSL `36 33% 96%`). Теперь один.
- **Favicon работает «по соглашению»**: Next.js App Router сам видит `app/icon.png` и `app/apple-icon.png`, никакого `<link rel="icon">` в `<head>` не требуется.

### Что осталось не покрыто (out of scope, явно)

- **`next/font` миграция** — пока шрифты грузятся через `@import url('https://fonts.googleapis.com/...')` в [packages/ui/src/styles/globals.css:1](packages/ui/src/styles/globals.css#L1). Render-blocking, минус несколько баллов в Lighthouse. Отложено по решению из брейншторма.
- **Theme toggle** — `.dark` класс уже есть в `@academy/ui/styles/globals.css`, но переключателя нет. Появится в Этапе 2.
- **Header/navbar** — для авторизованных страниц `/admin`, `/director`, `/network`, `/student`, которых пока нет (создаются на Этапе 1).
- **Component-тесты для самих страниц `apps/web`** — компоненты протестированы внутри `@academy/ui`, дублирование избыточно.
- **Storybook** — не поднимался в этой сессии. Сконфигурирован, можно `pnpm --filter @academy/ui storybook`.
- **Lighthouse / a11y audit** — отдельный Этап 2.

### Pre-existing issues, выявленные в ходе работы

| #   | Симптом                                                                                                | Корневая причина                                                                                                                                          | Что я сделал                                                                       |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | `tailwind.config.ts` падал при typecheck — `Cannot find module '@academy/ui/tailwind-preset'`          | В `apps/web/package.json` отсутствовал `"@academy/ui": "workspace:*"` — pnpm не делал symlink                                                             | Добавил dep, `pnpm install`                                                        |
| 2   | `pnpm test` падал на 2/5 тестах `credentials.test.ts` — `expected null not to be null`                 | `@auth/core@0.34.x` возвращает `authorize: () => null` placeholder, реальный authorize в `provider.options.authorize`. Это design choice, а не bug пакета | Поправил `getAuthorize()` в тесте, заменил `beforeAll(async)` на `bcrypt.hashSync` |
| 3   | `packages/ui` использовал path-алиас `@/*` для внутренних импортов, ломалось при impport из `apps/web` | Path-алиас потребителя имеет приоритет — пакет должен использовать относительные пути                                                                     | Заменил во всех 17 файлах `packages/ui/src/components/`                            |

Все три починены в этой же сессии — иначе интеграция была бы невозможна.

---

## 4. Self-review checklist (из superpowers)

| Вопрос                                      | Ответ                                                                                                                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Код минимален?                              | Да. Никаких компонентов «впрок», только `BrandMark` и `Wordmark` для конкретных требований. Spec явно ограничивал scope.                                          |
| Не протекла ли доменная логика в UI?        | Нет. `auth/`, `lib/auth/*` не трогались — только страницы (presentation) и компоненты пакета `@academy/ui`.                                                       |
| Тесты проверяют поведение, а не реализацию? | Да. `BrandMark` проверяет alt/size/priority (наблюдаемое поведение), `Wordmark` — наличие текста и aria-label, не внутренние теги.                                |
| Нет ли скрытого coupling?                   | `packages/ui` теперь корректно изолирован (relative imports). `apps/web` импортирует только то, что объявлено в exports map пакета.                               |
| Можно ли было решить проще?                 | Нет — все шаги были минимально необходимыми. Единственное «лишнее» — рефакторинг 17 файлов в `packages/ui`, но без него интеграция физически невозможна.          |
| Все acceptance criteria из spec выполнены?  | Да, все группы A–D. Состояние страниц соответствует визуальному описанию (логотип, Playfair, золотой акцент на «РАЗВИТИЯ», Card-обёртки, CTA в брендовом золоте). |

---

## 5. Definition of Done — финальный gate

- [x] Все acceptance criteria spec.md §3 ✅
- [x] Spec review checklist пройден (Stage 4)
- [x] Реализация шла через tests-first для domain-релевантных компонентов (Brand)
- [x] `pnpm typecheck` (root) — 6/6 зелёные
- [x] `pnpm test` (root) — 5/5 успешно
- [x] Smoke-проверка в браузере: `/`, `/login`, `/unauthorized` — все 200
- [x] Self-review (этот файл)
- [ ] PR создан — отложено до решения пользователя о коммитах

---

## 6. Что дальше

Этап 0 закрыт в плане «приложение использует дизайн-систему». Следующий логичный шаг по [CLAUDE.md](CLAUDE.md):

**Этап 1 — Визуальный календарь + расписание + CRUD мероприятий**.

Стартует через тот же протокол:

```
/brainstorming Календарь мероприятий: month/week/day views, фильтры по
филиалу/типу/спикеру, модалки создания/редактирования, mobile-first.
Опираемся на @academy/ui (Card, Dialog, Tabs, Badge, Button) и Prisma
модель Event из CLAUDE.md.
```

Все нужные примитивы (`Card`, `Dialog`, `Tabs`, `Badge`, `Button`, `Input`, `Select`) уже есть и доказали работоспособность в этой интеграции.
