"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@academy/ui";
import { trpc } from "@/lib/trpc/client";

type Account = { id: string; name: string; email: string | null; system_role: string };

export function AdministratorsContent({
  accounts,
  ownerId,
}: {
  accounts: Account[];
  ownerId: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const update = trpc.administration.setAdmin.useMutation({
    onSuccess: () => startTransition(() => router.refresh()),
    onError: (error) => setError(error.message),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link href="/admin/clients" className="text-sm text-brand-primary underline">
        Назад к клиентам
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-bold text-brand-primary">Администраторы</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Один уровень доступа. Назначать и снимать администраторов может только владелец.
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="mt-6 space-y-3">
        {accounts.map((account) => {
          const owner = account.id === ownerId;
          const isAdmin = account.system_role !== "STUDENT";
          return (
            <article key={account.id} className="rounded-xl border border-border bg-card p-4">
              <h2 className="font-heading font-semibold">{account.name}</h2>
              <p className="mt-1 break-all text-sm text-foreground/70">{account.email}</p>
              <p className="mt-2 text-sm">
                {owner ? "Владелец" : isAdmin ? "Администратор" : "Клиент"}
              </p>
              {!owner && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 max-w-full"
                  disabled={update.isLoading}
                  onClick={() => {
                    if (
                      !window.confirm(
                        `${isAdmin ? "Снять права администратора у" : "Назначить администратором"} ${account.name}?`,
                      )
                    )
                      return;
                    setError(null);
                    update.mutate({ id: account.id, isAdmin: !isAdmin });
                  }}
                >
                  {isAdmin ? "Снять права администратора" : "Назначить администратором"}
                </Button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
