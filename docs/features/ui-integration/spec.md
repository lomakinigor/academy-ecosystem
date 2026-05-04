# UI Integration — подключение @academy/ui к apps/web

**Этап:** 0 close-out (закрытие каркасной фазы)
**Owner:** UI Agent
**Дата спеки:** 2026-05-04
**Состояние:** Draft → review → approved

---

## 1. Problem statement

Дизайн-система `@academy/ui` уже реализована (12 shadcn-примитивов, 5 академических компонентов, tailwind-preset со всеми токенами, 34 зелёных теста), но `apps/web` работает **мимо неё**: tailwind-конфиг не подхватывает preset, существуют дублирующие `globals.css`, страницы написаны inline-стилями. Главная страница — текстовая заглушка без брендинга.

Без интеграции Этап 1 (календарь, CRUD событий, ЛК) стартует в полу-broken-состоянии: либо команда снова пишет inline-стили, либо тратит время на ту же интеграцию посреди фичевой работы.

## 2. User stories

- **Как разработчик** хочу импортировать `Button`, `Card`, `Input` из `@academy/ui` в `apps/web` и видеть их со всеми token'ами, чтобы Этап 1 не начинался с design-debt.
- **Как пользователь сайта академии** хочу видеть на главной фирменный логотип и Playfair-заголовок «Академия Развития Человека им. В.Ю. Светлова», а не «Foundation Ready».
- **Как пользователь** хочу видеть в браузерной вкладке favicon академии, а не дефолтную иконку Next.js.
- **Как пользователь** на странице `/login` хочу видеть аккуратную форму в фирменных цветах (карточка на кремовом фоне, золотая CTA-кнопка), а не голый HTML.

## 3. Acceptance criteria

### A. Конфигурация

- [ ] [apps/web/tailwind.config.ts](apps/web/tailwind.config.ts) импортирует `preset` из `@academy/ui/tailwind-preset` через `presets: [...]`, оставляет только `content[]`
- [ ] [apps/web/app/globals.css](apps/web/app/globals.css) удалён (дубль)
- [ ] [apps/web/styles/globals.css](apps/web/styles/globals.css) остаётся единственным CSS-входом (он уже импортирует `@academy/ui/styles`)
- [ ] [apps/web/app/layout.tsx](apps/web/app/layout.tsx) импортирует `./globals.css` из `app/`-папки заменён на импорт из `../styles/globals.css` (или сам `globals.css` в `app/` переписан как один re-import)

### B. Логотип и фирменная навигация

- [ ] [apps/web/public/logo.png](apps/web/public/logo.png) — уже на месте, размер 500×500
- [ ] [apps/web/app/icon.png](apps/web/app/icon.png) — копия `logo.png`, Next.js App Router автоматически отдаст её как favicon
- [ ] [apps/web/app/apple-icon.png](apps/web/app/apple-icon.png) — копия `logo.png`, для iOS home screen

### C. Страницы (переписаны на @academy/ui)

- [ ] [apps/web/app/page.tsx](apps/web/app/page.tsx) — hero с логотипом 240px по центру + 3-строчный wordmark справа (`АКАДЕМИЯ` / `РАЗВИТИЯ` / `ЧЕЛОВЕКА`, Playfair Display 700, золотой акцент на «РАЗВИТИЯ»). На mobile (<768px) — wordmark под логотипом, центрировано. Используются `Card`, кнопка `Button` (CTA «Войти» → `/login`), `Badge` со статусом «Этап 0 завершён».
- [ ] [apps/web/app/login/page.tsx](apps/web/app/login/page.tsx) — форма обёрнута в `Card`, логотип 64px над заголовком, заголовок Playfair, поля через `Input` + `Label` (label обычный `<label>`, есть в shadcn-input), кнопка submit через `Button` варианта `default` (золотая).
- [ ] [apps/web/app/unauthorized/page.tsx](apps/web/app/unauthorized/page.tsx) — `Card` с логотипом 64px, иконкой `Lock` (lucide-react), сообщением «Доступ ограничен» + кнопками «Назад» / «На главную».

### D. Качество

- [ ] `pnpm --filter @academy/web typecheck` — зелёный
- [ ] `pnpm --filter @academy/web lint` — зелёный (no new violations)
- [ ] `pnpm --filter @academy/ui test` — все 34 теста по-прежнему зелёные (не должны затрагиваться, но регрессионная проверка)
- [ ] Smoke-тест в браузере: `/`, `/login`, `/unauthorized` рендерятся без console-error, шрифты Playfair/Space Grotesk/Inter применены
- [ ] `prefers-reduced-motion` соблюдён (он уже в `@academy/ui/styles/globals.css`)

## 4. Affected files

### Новые

```
apps/web/app/icon.png             ← копия public/logo.png
apps/web/app/apple-icon.png       ← копия public/logo.png
apps/web/components/brand/wordmark.tsx       ← 3-line + 1-line брендинг компонент
apps/web/components/brand/brand-mark.tsx     ← логотип <Image> с alt
docs/features/ui-integration/spec.md
docs/features/ui-integration/tasks.md
docs/features/ui-integration/review.md
```

### Изменённые

```
apps/web/tailwind.config.ts       ← подключить preset
apps/web/app/layout.tsx           ← путь к globals.css
apps/web/app/page.tsx             ← полная переписка на @academy/ui
apps/web/app/login/page.tsx       ← обернуть в Card + Playfair
apps/web/app/login/login-form.tsx ← Input/Button/Label из @academy/ui
apps/web/app/unauthorized/page.tsx ← Card + Lock icon + кнопки
```

### Удалённые

```
apps/web/app/globals.css          ← дубль, его место занимает styles/globals.css → @academy/ui/styles
```

## 5. Data model / API changes

**Нет.** Это чисто UI-интеграция, никакая доменная логика, БД, API или state-менеджмент не затрагиваются. Существующие server actions в `app/login/actions.ts` остаются без изменений.

## 6. Test plan

### Уровни

- **Unit (component)** — НЕ добавляются. Компоненты `@academy/ui` уже покрыты в [packages/ui/tests/](packages/ui/tests/) (34 теста). Дублировать их в `apps/web` бессмысленно.
- **Component-light для двух новых компонентов** — `BrandMark` и `Wordmark` в `apps/web/components/brand/`. Каждый — 1–2 теста (рендерится / есть alt-текст / правильный variant). Через Vitest + @testing-library/react в существующем `apps/web/vitest.config.ts`.
- **Integration / smoke** — ручная проверка в браузере на dev-сервере: `/`, `/login`, `/unauthorized`. Скриншот-проверка не автоматизируется на этом этапе (Playwright — отдельная задача).
- **Регрессия** — `pnpm typecheck` + `pnpm test` по всем пакетам, включая существующие тесты [apps/web/tests/auth/](apps/web/tests/auth/) (они НЕ должны сломаться, потому что мы не меняем `auth/`).

### Конкретные тесты (новые)

```
apps/web/tests/brand/brand-mark.test.tsx   ← рендер, alt-текст, размеры
apps/web/tests/brand/wordmark.test.tsx     ← variant 'three-line' и 'one-line'
```

## 7. Rollback plan

Изменения изолированы в `apps/web/`, не трогают `packages/`, `auth/`, БД. Rollback = `git revert <merge-commit>`. Рисков для других модулей нет.

Промежуточный rollback при поломке одной страницы (например, `/login`): откатить только её файлы, оставить остальные. Зависимостей между страницами нет.

## 8. Out of scope

- Миграция шрифтов на `next/font` (отложено)
- Theme toggle (light/dark) — отложено до Этапа 2
- Header/navbar компонент — появится в Этапе 1 вместе с защищёнными маршрутами `/admin/*`
- Storybook полировка / деплой — он уже работает локально, отдельная задача
- Component-тесты в `apps/web` для страниц — overhead без явной ценности
- Анимации hero-секции (Framer Motion) — оставляем минимально, на Этапе 1 при появлении дашбордов добавим осмысленно
- Lighthouse / accessibility audit — отдельный sprint Этапа 2

## 9. Open risks

| Риск                                                                 | Вероятность                                  | Митигация                                                           |
| -------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| Tailwind preset не подхватится из-за pnpm linker                     | Низкая (пакеты hoisted после `.npmrc` патча) | smoke-тест после `pnpm install`, проверка `class-loaded` в DevTools |
| Конфликт стилей старого `app/globals.css` и `@academy/ui/styles`     | Средняя                                      | удаление дубля по чек-листу, явное singleton-правило                |
| Логотип 312 KB — медленная загрузка на 3G                            | Низкая (PNG 500×500 нормально)               | Next.js `<Image>` сам сделает WebP-конверсию + lazy load            |
| Текст «АКАДЕМИЯ РАЗВИТИЯ ЧЕЛОВЕКА» не помещается в hero на iPhone SE | Средняя                                      | mobile-first проверка + `clamp()` font-size в wordmark              |

---

## 10. Definition of Done

- [ ] Все acceptance criteria из §3 выполнены
- [ ] Spec review checklist (§ниже) пройден
- [ ] Self-review в `docs/features/ui-integration/review.md` написан
- [ ] PR создан со ссылкой на spec
