import { HealthSmoke } from "./health-smoke";

export const metadata = {
  title: "API Health — Академия",
};

/**
 * Технический smoke-маршрут для проверки tRPC wiring.
 * Не для пользователя — удаляется после стабилизации client'а.
 */
export default function ApiHealthPage() {
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-semibold">tRPC health smoke</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Если ниже видна метка «pong» — клиент tRPC и /api/trpc handler работают.
      </p>
      <div className="mt-6">
        <HealthSmoke />
      </div>
    </main>
  );
}
