/** Эвристическая подсказка; ручная подпись всегда приоритетнее. */
export function calendarTitle(title: string, custom?: string | null): string {
  if (custom?.trim()) return custom.trim();
  const words = title.match(/[\p{L}\p{N}-]+/gu) ?? [];
  const common =
    /^(семинар|занятие|занятия|курс|практика|вебинар|ритрит|ретрит|мастер-класс|путь|по|на|для|с)$/i;
  const word = words.find((value) => !common.test(value)) ?? words[0] ?? "Событие";
  if (/^велеса$/i.test(word)) return "Велес";
  return word[0]!.toLocaleUpperCase("ru") + word.slice(1).toLocaleLowerCase("ru");
}
