export async function settlePublicCalendar<TEvents, TBranches>(
  load: () => Promise<readonly [TEvents, TBranches]>,
  fallbackEvents: TEvents = [] as TEvents,
  fallbackBranches: TBranches = [] as TBranches,
) {
  try {
    const [events, branches] = await load();
    return { events, branches, unavailable: false };
  } catch (error) {
    console.error("Public calendar backend is unavailable", error);
    return { events: fallbackEvents, branches: fallbackBranches, unavailable: true };
  }
}
