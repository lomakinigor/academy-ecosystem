"use client";

import { useFormState, useFormStatus } from "react-dom";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Вход…" : "Войти"}
    </button>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} noValidate>
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}

      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        aria-invalid={Boolean(state.fieldErrors?.email)}
      />
      {state.fieldErrors?.email ? <p role="alert">{state.fieldErrors.email}</p> : null}

      <label htmlFor="password">Пароль</label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        aria-invalid={Boolean(state.fieldErrors?.password)}
      />
      {state.fieldErrors?.password ? <p role="alert">{state.fieldErrors.password}</p> : null}

      {state.error ? <p role="alert">{state.error}</p> : null}

      <SubmitButton />
    </form>
  );
}
