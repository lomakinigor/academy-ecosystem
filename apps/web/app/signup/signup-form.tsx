"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button, Input } from "@academy/ui";

import { signupAction, type SignupState } from "./actions";

const initialState: SignupState = {};

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
      {pending ? "Создаём аккаунт…" : "Зарегистрироваться"}
    </Button>
  );
}

export function SignupForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useFormState(signupAction, initialState);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="font-heading text-sm font-medium text-brand-primary">
          Имя
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        {state.fieldErrors?.name ? (
          <p role="alert" className="text-xs text-destructive">
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

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
        <label htmlFor="phone" className="font-heading text-sm font-medium text-brand-primary">
          Телефон <span className="text-foreground/50">(необязательно)</span>
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+7 999 123-45-67"
          aria-invalid={Boolean(state.fieldErrors?.phone)}
        />
        {state.fieldErrors?.phone ? (
          <p role="alert" className="text-xs text-destructive">
            {state.fieldErrors.phone}
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
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <p className="text-xs text-foreground/60">Не короче 8 символов</p>
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

      <SubmitButton />
    </form>
  );
}
