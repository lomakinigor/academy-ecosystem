# Исправление бюджета пакетного распознавания

Problem/discovery: owner получил HTTP402 — провайдер рассчитывает слишком большой ответ, поскольку max_tokens не указан. Desired: явный max_tokens=8192, понятное сообщение вместо JSON с provider metadata. Ограничения: текущая модель/ключ/списки спикеров/данные событий неизменны; без пополнений и automatic retries. Альтернатива пополнения не нужна для устранения завышенного бюджета. Риск: очень большой ответ может быть обрезан; existing parse error остаётся, нельзя обещать бесконечный batch.

Acceptance: body OpenRouter содержит max_tokens8192; HTTP402 отображается как бюджетная ошибка с советом сократить список/проверить баланс, без user_id и сырого ответа. Другие upstream ошибки — нейтральный retry-later текст. Успешный tool_call по-прежнему возвращает события. Без user/валидного input запросы провайдеру не уходят.

Spec review пройден: DB/API success contracts не меняются, негативные сценарии и rollback определены. Откат: один route; лимит ключа/баланс не трогаем. План: red route tests → request budget/error text → web tests/typecheck → отдельная сборка для владельца. Настоящий запрос платный, в unit-тестах только mock.

## Результат

Red: три из четырёх новых тестов упали на отсутствующем лимите и сыром тексте ошибок. Green: полный web-набор 148/148, TypeScript и diff check прошли. Минимальный self-review: изменён только request budget/error response, success payload и DB не затронуты. Новая сборка dpl_HHaXzXEjpAMw6DWYTG6ZAJSzgjvY Ready: https://academy-ecosystem-aapyvmaj8-igorsibola.vercel.app/admin/calendar . Host добавлен в существующее WAF правило; основной домен не переключён. HTTP проверка admin/calendar: ожидаемый 307 на login. Успешный платный запрос с реальным текстом ещё не проверен.
