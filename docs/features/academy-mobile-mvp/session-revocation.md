# Завершение прежних сессий

13 октября 2026 владелец разрешил принудительно завершить все сессии, включая свою.

## Выполнено

- Значение AUTH_SECRET production заменено криптографически случайным через PATCH существующей sensitive-переменной. Секрет не выводился и не сохранялся в файл; пароли пользователей не изменялись.
- Vercel CLI env update отклонён платформой («cannot change the key of a Sensitive Environment Variable»). Диагностика подтвердила, что можно менять только value; PATCH выполнен без key/type.
- Основная старая версия пересобрана без функционального релиза: deployment `dpl_J24U3bToKnuQu1LBVwJ545Nx4dAn`, URL academy-ecosystem-1hk9secy1-igorsibola.vercel.app. Основной домен academy-ecosystem.vercel.app использует эту сборку.
- Новая проверочная версия также пересобрана: `dpl_s3YDZkXYLuPWPLvueoHdGma9w4uF`, URL academy-ecosystem-qc55kydfd-igorsibola.vercel.app. Это не релиз полного MVP.
- Старые immutable deployments сохраняют старые env и JWT, поэтому создана обратимая project WAF allowlist текущих доменов. Старые сборки не удалены.
- Firewall version 1, правило `rule_block_retired_deployments_after_session_reset_jOeTYB`, deny host NOT IN: основной домен, academy-ecosystem-igorsibola.vercel.app, две новые deployment-ссылки.

## Проверки

- Оба новых deployments Ready.
- Основное публичное расписание HTTP 200.
- /api/auth/session на прежних production и проверочном deployment отвечает HTTP 403.
- Новый /admin/clients/administrators без входа переходит к login с callbackUrl.
- Реальный прежний JWT владельца не читался/не копировался; проверка конкретного пользовательского токена не выполнялась. Отзыв обеспечивается сменой ключа на текущих сборках и блокировкой прежних host на edge.

## Ограничения и сопровождение

- Правило относится только к Vercel project academy-ecosystem, не к другим сервисам/проектам пользователя.
- Новые deployment host нужно добавлять в allowlist до ручных проверок; основной домен при новом релизе остаётся разрешённым.
- Не возвращать старые deployments на разрешённый домен: они содержат прежний ключ. Безопасный rollback — пересобрать известный исходник с текущим ключом.
- Отключение WAF восстановит доступ к старым сборкам и старым сессиям: не делать без отдельного решения владельца.
- Повторный вход владелец выполняет сам. Известные pre-release замечания регистрации и мобильного UX остаются незакрытыми.
