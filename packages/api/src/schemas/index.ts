/**
 * Zod-схемы — placeholder'ы.
 * Конкретные схемы добавляются вместе с модулями (events, bookings, payments...).
 * Правило: ВСЕ API-эндпоинты обязаны валидировать вход через Zod.
 */

export * from "./common";
export * from "./user";
export * from "./event";
export * from "./booking";
