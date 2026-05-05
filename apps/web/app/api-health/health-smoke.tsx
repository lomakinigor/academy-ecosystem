"use client";

import { trpc } from "@/lib/trpc/client";

export function HealthSmoke() {
  const ping = trpc.health.ping.useQuery();

  if (ping.isLoading) {
    return <span className="text-sm text-muted-foreground">проверяем…</span>;
  }

  if (ping.error) {
    return <span className="text-sm text-destructive">Ошибка: {ping.error.message}</span>;
  }

  return (
    <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm">
      <div>
        <span className="font-medium">service:</span> {ping.data?.service}
      </div>
      <div>
        <span className="font-medium">ok:</span> {ping.data?.ok ? "true ✓" : "false"}
      </div>
      <div>
        <span className="font-medium">timestamp:</span> {ping.data?.timestamp}
      </div>
    </div>
  );
}
