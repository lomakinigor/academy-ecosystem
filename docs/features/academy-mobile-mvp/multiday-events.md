# Многодневное мероприятие без времени

## Discovery / problem

Пользователь: один семинар «Путь Велеса» на поселении 15–17.10.2026, часы отсутствуют. Сейчас parser выдумывает часы, batch теряет окончание, week группирует только начало. Требуется одна запись с общими bookings, видимая в каждом занятом дне. Сохраняем текущие timed events, модель бронирования и будущие филиалы; Mini App не затрагиваем. Альтернатива отдельных записей на каждый день нарушит общую регистрацию. Риски: включительность последнего дня, переход недели/месяца, timezone, частичные update.

## Spec / acceptance

Добавляем Event.is_all_day Boolean default false. Для режима «Без указания времени» start_at = дата начала 00:00 UTC, end_at = начало дня после последней включённой даты UTC (exclusive). Эти timestamps — границы календарных дат, не часы проведения. На UI используем UTC-календарные даты без часов; у timed events прежний local time.

Ручная форма: checkbox без времени, два date inputs; конец не раньше начала, один день тоже разрешён. Существующий all-day event редактируется без смещения последнего дня, места и формата.

Parser: end_date (inclusive), is_all_day; отсутствие времени не заменять выдуманным. Диапазон 15–17 возвращает один event, пустые заголовки 16/17 не отдельные events. Обе категории стоимости сохранить в pricing_note, место «На поселении» в venue. Batch review показывает даты начала/конца и режим без времени, сохраняет один event с end_at. Timed end_time теперь тоже сохраняется.

Календарь: один и тот же ID показывается в каждом пересекаемом дне недели; exclusive-end не включает следующий день. API list/publicList ищут overlap, а не только start in range, чтобы показывать продолжающееся мероприятие. Public карточка/detail показывают диапазон и «Без указания времени».

Migration: только ALTER TABLE ADD COLUMN с default false, без reset/dbpush/удаления данных. Новая проверочная сборка применяет только этот SQL перед build, старые приложения совместимы с добавлением. Existing запись не преобразуется автоматически по одному совпадению названия: её правим вручную после открытия точной карточки.

## Review и план

Spec review пройден: границы, одно событие/booking, отрицательные диапазоны, timezone и совместимость определены. Тесты: schema all-day boundaries; API overlap/create; week three days and next week; parser date contract; batch save and manual date roundtrip; regressions/typecheck/build. Rollback UI/version без удаления новой колонки; перед откатом не скрывать созданные date-only данные timed интерфейсом.

План: red tests → schema/API → parser/batch/manual → calendars/cards → полный набор → additive SQL/check build → отдельная публикация → owner browser verification. Реальный AI-запрос платный; unit tests mock only.

## Verification

- Red: отсутствовавшие all-day schema/persistence/overlap и трёхдневный календарь воспроизведены тестами; parser/batch/manual tests тоже сначала упали.
- Green: 123 API и 155 web-тестов, оба TypeScript checks прошли. Два старых теста фильтра дат обновлены с проверки start-in-range на явный overlap (end>from, start<=to).
- Build dpl_AomP6Kwphcw3ahZEMCXDpVqxJcFe Ready, лог подтвердил выполнение только add-event-all-day.sql: Script executed successfully. Без prisma db push/reset; основной домен не переключён. Новый host в существующей WAF allowlist.
- Публичная страница HTTP200, backend-unavailable=false. После входа владельца исправлена существующая карточка «СЕМИНАР ПУТЬ ВЕЛЕСА»: 15–17.10.2026, без времени, На поселении, условия участия. Прежние 50000/70000 ₽ в pricing_note сохранены. Число событий осталось четыре, дубль не создавался.
- Browser повторно открыл карточку: начало15/окончание17, checkbox checked. Один семинар виден на 15/16/17, не18. Проверены desktop1280 и mobile360, screenshots сохранены. Первый fill(date) поменял DOM, но не React state; после штатного ArrowUp ввод сохранился и перечитан. Не считать визуальный fill подтверждением сохранения.
- Self-review: booking model/API не менялись, границы date-only exclusive и UTC, timed events сохраняют прежний режим. Пакетная защита от частичных повторов остаётся отдельной незавершённой задачей; полная релизная UX-планка не подтверждена.
