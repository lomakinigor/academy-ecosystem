"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@academy/ui";

import { trpc } from "@/lib/trpc/client";

type ContactChannel = "EMAIL" | "TELEGRAM" | "WHATSAPP" | "MAX";

type ClientCard = {
  id: string;
  name: string;
  createdAt: Date;
  system_role: string;
  is_owner: boolean;
  is_registered: boolean;
  contacts: Array<{ channel: ContactChannel; value: string; verified_at: Date | null }>;
};

const CONTACT_LABELS: Record<ContactChannel, string> = {
  EMAIL: "Email",
  TELEGRAM: "Telegram",
  WHATSAPP: "WhatsApp",
  MAX: "MAX",
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(date);

export function ClientsContent({
  clients,
  isOwner = false,
}: {
  clients: ClientCard[];
  isOwner?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contacts, setContacts] = useState<Record<ContactChannel, string>>({
    EMAIL: "",
    TELEGRAM: "",
    WHATSAPP: "",
    MAX: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const create = trpc.clients.create.useMutation({
    onSuccess: () => {
      startTransition(() => router.refresh());
      setOpen(false);
      setName("");
      setContacts({ EMAIL: "", TELEGRAM: "", WHATSAPP: "", MAX: "" });
    },
    onError: (requestError) => setError(requestError.message),
  });
  const updateAdmin = trpc.administration.setAdmin.useMutation({
    onSuccess: () => startTransition(() => router.refresh()),
    onError: (requestError) => setAdminError(requestError.message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const filledContacts = (Object.entries(contacts) as Array<[ContactChannel, string]>)
      .filter(([, value]) => value.trim())
      .map(([channel, value]) => ({ channel, value: value.trim() }));

    if (name.trim().length < 2) {
      setError("Укажите имя клиента");
      return;
    }
    if (filledContacts.length === 0) {
      setError("Добавьте хотя бы один контакт");
      return;
    }
    create.mutate({ name: name.trim(), contacts: filledContacts });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-wide text-brand-primary">
            Клиенты
          </h1>
          <p className="mt-1 text-sm text-foreground/70">
            Единая база для сайта и Telegram Mini App.
          </p>
        </div>
        <Button type="button" variant="accent" size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Добавить клиента
        </Button>
      </header>

      {isOwner && (
        <Link
          href="/admin/clients/administrators"
          className="mb-6 block rounded-lg border border-brand-accent/40 bg-brand-warm p-3 text-sm font-semibold text-brand-primary"
        >
          Управление администраторами
        </Link>
      )}

      {adminError && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {adminError}
        </p>
      )}

      <div className="space-y-3">
        {clients.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-5 text-sm text-foreground/70">
            Клиентов пока нет. Добавьте клиента вручную или дождитесь самостоятельной регистрации.
          </div>
        ) : (
          clients.map((client) => {
            const isAdmin = client.system_role !== "STUDENT";
            return (
              <article
                key={client.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <h2 className="font-heading text-lg font-semibold text-brand-primary">
                  {client.name}
                </h2>
                <p className="mt-1 text-xs text-foreground/60">
                  Создана {formatDate(client.createdAt)}
                </p>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  {client.contacts.map((contact) => (
                    <div key={`${contact.channel}-${contact.value}`}>
                      <dt className="text-xs text-foreground/60">
                        {CONTACT_LABELS[contact.channel]}
                      </dt>
                      <dd className="break-all text-foreground">{contact.value}</dd>
                    </div>
                  ))}
                </dl>
                {isOwner && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <span className="text-sm text-foreground/70">
                      {client.is_owner
                        ? "Владелец"
                        : !client.is_registered
                          ? "Зарегистрируется самостоятельно"
                          : isAdmin
                            ? "Администратор"
                            : "Клиент"}
                    </span>
                    {!client.is_owner && client.is_registered && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={updateAdmin.isLoading}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `${isAdmin ? "Снять права администратора у" : "Назначить администратором"} ${client.name}?`,
                            )
                          )
                            return;
                          setAdminError(null);
                          updateAdmin.mutate({ id: client.id, isAdmin: !isAdmin });
                        }}
                      >
                        {isAdmin ? "Снять права администратора" : "Назначить администратором"}
                      </Button>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Новый клиент</DialogTitle>
            <DialogDescription>
              Карточка не даёт доступа к аккаунту. Клиент войдёт только после самостоятельной
              регистрации по email и паролю.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">ФИО</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus />
            </label>
            {(Object.keys(CONTACT_LABELS) as ContactChannel[]).map((channel) => (
              <label key={channel} className="block">
                <span className="mb-1.5 block text-sm font-medium">{CONTACT_LABELS[channel]}</span>
                <Input
                  value={contacts[channel]}
                  onChange={(event) =>
                    setContacts((current) => ({ ...current, [channel]: event.target.value }))
                  }
                  placeholder={
                    channel === "EMAIL"
                      ? "name@example.ru"
                      : channel === "TELEGRAM"
                        ? "@username"
                        : "+7 900 000-00-00"
                  }
                />
              </label>
            ))}
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" variant="accent" disabled={create.isLoading}>
                {create.isLoading ? "Сохраняем…" : "Создать карточку"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
