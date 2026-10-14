"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";

import { Button, Input } from "@academy/ui";
import { DeviceRememberChoice } from "@/components/auth/device-remember-choice";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="accent"
      size="lg"
      disabled={pending}
      aria-busy={pending}
      className="w-full"
    >
      {pending ? "Вход…" : "Войти"}
    </Button>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useFormState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="font-heading text-sm font-medium text-brand-primary">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        {state.fieldErrors?.email ? (
          <p role="alert" className="text-xs text-destructive">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="font-heading text-sm font-medium text-brand-primary">
          Пароль
        </label>
        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-end"
          aria-controls="password"
          aria-pressed={showPassword}
          onClick={() => setShowPassword((shown) => !shown)}
        >
          {showPassword ? "Скрыть пароль" : "Показать пароль"}
        </Button>
        {state.fieldErrors?.password ? (
          <p role="alert" className="text-xs text-destructive">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <DeviceRememberChoice />
      <SubmitButton />
    </form>
  );
}
