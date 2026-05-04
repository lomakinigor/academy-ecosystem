# UI Integration — Task breakdown

10 задач, каждая 5–15 минут, отдельно проверяема.

## T1. Подключить tailwind preset

**Файл:** [apps/web/tailwind.config.ts](apps/web/tailwind.config.ts)
**Действие:** заменить `theme: { extend: {} }` на `presets: [preset]`, импорт сверху.
**Verify:** `pnpm --filter @academy/web typecheck` зелёный.
**Время:** 3 мин.

## T2. Удалить дубль globals.css, перенаправить layout

**Файлы:** [apps/web/app/globals.css](apps/web/app/globals.css) (удалить), [apps/web/app/layout.tsx](apps/web/app/layout.tsx) (поменять путь импорта).
**Действие:** `rm app/globals.css`, в `layout.tsx` поменять `import "./globals.css"` → `import "../styles/globals.css"`.
**Verify:** `pnpm --filter @academy/web typecheck`; dev-сервер рендерит главную без 500.
**Время:** 3 мин.

## T3. Положить иконки для favicon / apple-touch

**Файлы:** [apps/web/app/icon.png](apps/web/app/icon.png), [apps/web/app/apple-icon.png](apps/web/app/apple-icon.png) (новые).
**Действие:** скопировать `public/logo.png` под двумя именами в `app/`.
**Verify:** `curl http://localhost:3000/icon.png` отдаёт PNG; вкладка браузера показывает логотип академии.
**Время:** 2 мин.

## T4. (TDD-red) Тест для BrandMark

**Файл:** [apps/web/tests/brand/brand-mark.test.tsx](apps/web/tests/brand/brand-mark.test.tsx) (новый).
**Действие:** написать падающий тест: рендерится `<img>` с правильным `alt="Академия Светлова"` и `data-size` соответствует пропу.
**Verify:** `pnpm --filter @academy/web test` — тест fail с «module not found».
**Время:** 5 мин.

## T5. (TDD-green) Реализовать BrandMark

**Файл:** [apps/web/components/brand/brand-mark.tsx](apps/web/components/brand/brand-mark.tsx) (новый).
**Действие:** клиентский компонент `<BrandMark size?: number>`, `next/image` с `priority` для hero, `loading="lazy"` для остальных размеров.
**Verify:** тест T4 зелёный.
**Время:** 5 мин.

## T6. (TDD-red+green) Тест и реализация Wordmark

**Файлы:** [apps/web/tests/brand/wordmark.test.tsx](apps/web/tests/brand/wordmark.test.tsx), [apps/web/components/brand/wordmark.tsx](apps/web/components/brand/wordmark.tsx) (оба новые).
**Действие:** компонент `<Wordmark variant: "three-line" | "one-line">`, тест проверяет наличие 3 строк или 1 строки + golden tone на «РАЗВИТИЯ».
**Verify:** оба теста (BrandMark + Wordmark) зелёные.
**Время:** 10 мин.

## T7. Переписать главную страницу

**Файл:** [apps/web/app/page.tsx](apps/web/app/page.tsx) (полная замена).
**Действие:** hero-секция с `<BrandMark size={240}>` + `<Wordmark variant="three-line">` справа (mobile: вертикально). `Card` ниже с описанием экосистемы и CTA `<Button>` → `/login`. `Badge` «Этап 0 завершён».
**Verify:** `/` рендерится в браузере, шрифты Playfair видны в DevTools, на iPhone SE viewport (375px) текст не переполняется.
**Время:** 12 мин.

## T8. Переписать login

**Файлы:** [apps/web/app/login/page.tsx](apps/web/app/login/page.tsx), [apps/web/app/login/login-form.tsx](apps/web/app/login/login-form.tsx).
**Действие:** обернуть форму в `Card`, `<BrandMark size={64}>` сверху, поля через `Input` + `<label>`, submit-кнопка `<Button>`.
**Verify:** `/login` рендерится, форма submit работает (server action не трогали).
**Время:** 10 мин.

## T9. Переписать unauthorized

**Файл:** [apps/web/app/unauthorized/page.tsx](apps/web/app/unauthorized/page.tsx).
**Действие:** `Card` с `<BrandMark size={64}>`, иконкой `Lock` (lucide-react), сообщением и двумя кнопками «Назад» / «На главную» (`Button variant="outline"` и `default`).
**Verify:** `/unauthorized` рендерится корректно.
**Время:** 8 мин.

## T10. Финальная регрессия и self-review

**Действие:**

1. `pnpm typecheck` (root) — зелёный по всем 5 пакетам
2. `pnpm test` (root) — все тесты зелёные, включая 34 теста `@academy/ui` и тесты `apps/web/tests/auth/`
3. Smoke-тест в браузере: `/`, `/login`, `/unauthorized` без console-error
4. Написать [docs/features/ui-integration/review.md](docs/features/ui-integration/review.md): что изменено, риски, что упрощается, что не покрыто

**Verify:** все чек-листы из spec.md §3 (Acceptance criteria) отмечены ✅.
**Время:** 15 мин.

---

**Суммарно:** ~75 минут (час с небольшим). Если что-то стопорит — фиксирую в `review.md` как known issue, не ломаю pipeline остальных задач.
