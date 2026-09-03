# Восстановление production-конфигурации portfolio

## Problem statement

Deployment `academy-ecosystem-portfolio` не содержит environment variables. Из-за этого Auth.js требует отсутствующий `AUTH_SECRET`, а Prisma — `DATABASE_URL`.

## User story

Как владелец Академии, я хочу открыть расписание и войти в ранее созданный аккаунт без server-side error.

## Acceptance criteria

- В production заданы `AUTH_SECRET` и `DATABASE_URL` без раскрытия значений.
- Новый production deployment завершён.
- `GET /` отвечает без ошибки приложения и отображает расписание либо контролируемое сообщение о временной недоступности.
- `GET /login` не содержит `MissingSecret`; Vercel logs не показывают отсутствие `DATABASE_URL`.

## Affected modules

- Vercel project `academy-ecosystem-portfolio`, production environment.
- Исходный проект `academy-ecosystem` — только источник существующих encrypted variables.

## Data/API changes

Нет. Используются исходные credentials одной базы, поэтому существующие пользователи и события не мигрируются.

## Test plan

1. До изменения: logs фиксируют обе ошибки.
2. После redeploy: HTTP smoke для `/` и `/login`; проверка последних server logs.
3. Негативный сценарий: если БД недоступна, прекратить работу без создания новой пустой БД и запросить доступ к прежнему Supabase.

## Rollback

Удалить только добавленные portfolio environment variables и redeploy; исходный проект и база не затрагиваются.

## Spec review

- [x] Бизнес-цель и acceptance criteria понятны.
- [x] Негативный сценарий и ограничение совместимости описаны.
- [x] Стратегия проверки определена.
- [x] Scope ограничен двумя production variables и redeploy.
