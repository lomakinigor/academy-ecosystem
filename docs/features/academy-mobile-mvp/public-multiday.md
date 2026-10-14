# Публичное расписание: каждый день многодневного события

Причина: AgendaList группирует только start_at; 16–17 октября отсутствуют несмотря на правильный end_at. Показываем одну и ту же запись/ссылку во всех занятых днях, без новых DBevents/bookings. Date-only UTC endexclusive; timedday Екатеринбург, endexclusive. Clipпо выбранному from/to, не показывать18октября для15–17. Badge даты соответствует дню группы; диапазон event полный. Count остаётся уникальным.

Филиалы: publicpage не запрашивает branches, передаёт пустой список Sidebar, игнорирует старый branch_id URL. Backendсхема и возможность futurebranches не удаляются. Остальные фильтры прежние. Emptytextбез предложенияфилиала.

Reviewpassed: scopepublicUIonly, старые однодневные карточки совместимы, timezone/полночь/конец/clipвыявлены. Plan redagenda test → grouping/daybadge+publicbranch → tests/typecheck → preview. RollbackUIonly, DBнет. Ценаошибки отображение, не записи.
