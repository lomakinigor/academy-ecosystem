"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2, UserPlus, X, Check } from "lucide-react";
import { Button, Input } from "@academy/ui";
import { trpc } from "@/lib/trpc/client";

export function SpeakersClient() {
  const utils = trpc.useUtils();
  const speakers = trpc.user.listSpeakers.useQuery(undefined);

  const createSpeaker = trpc.user.createSpeaker.useMutation({
    onSuccess: () => {
      utils.user.listSpeakers.invalidate();
      setNewName("");
      setAdding(false);
    },
  });

  const updateSpeaker = trpc.user.updateSpeaker.useMutation({
    onSuccess: () => utils.user.listSpeakers.invalidate(),
  });

  const deleteSpeaker = trpc.user.deleteSpeaker.useMutation({
    onSuccess: () => utils.user.listSpeakers.invalidate(),
  });

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startEdit = (s: { id: string; name: string }) => {
    setEditingId(s.id);
    setEditName(s.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = (id: string) => {
    if (editName.trim().length < 2) return;
    updateSpeaker.mutate({ id, name: editName.trim() });
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Убрать «${name}» из списка спикеров?`)) return;
    deleteSpeaker.mutate({ id });
  };

  const list = speakers.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-brand-primary">
          Спикеры ({list.length})
        </h2>
        <Button variant="accent" size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <UserPlus className="size-4" />
          Добавить
        </Button>
      </div>

      {adding && (
        <div className="flex gap-2 rounded-md border border-border bg-card px-4 py-3">
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Имя и фамилия"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") createSpeaker.mutate({ name: newName.trim() });
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <Button
            variant="accent"
            size="sm"
            disabled={newName.trim().length < 2 || createSpeaker.isLoading}
            onClick={() => createSpeaker.mutate({ name: newName.trim() })}
          >
            {createSpeaker.isLoading ? <Loader2 className="size-4 animate-spin" /> : "Сохранить"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
            <X className="size-4" />
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card">
        {list.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-foreground/50">Спикеров нет</p>
        )}
        {list.map((s, i) => (
          <div
            key={s.id}
            className={`flex items-center gap-3 px-4 py-3 ${i < list.length - 1 ? "border-b border-border/50" : ""}`}
          >
            {editingId === s.id ? (
              <>
                <Input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(s.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
                <Button
                  variant="accent"
                  size="sm"
                  disabled={editName.trim().length < 2 || updateSpeaker.isLoading}
                  onClick={() => saveEdit(s.id)}
                >
                  <Check className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  <X className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-foreground">{s.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(s)}
                  className="text-foreground/50 hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(s.id, s.name)}
                  disabled={deleteSpeaker.isLoading}
                  className="text-foreground/50 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
