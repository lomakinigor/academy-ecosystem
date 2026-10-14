export function DeviceRememberChoice() {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name="forgetDevice"
          className="h-5 w-5 shrink-0 accent-brand-accent"
        />
        Не запоминать меня на этом устройстве
      </label>
      <p className="mt-2 text-xs text-foreground/70">
        На личном устройстве вход сохраняется на 90 дней. На чужом — только на текущий сеанс,
        максимум 8 часов. После работы нажмите «Выйти»: браузер может восстановить сеанс.
      </p>
    </div>
  );
}
