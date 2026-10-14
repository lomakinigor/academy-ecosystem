/** Untrusted parser output: only a positive whole number is a usable limit. */
export const normalizeParticipantLimit = (value: unknown): number | null =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
