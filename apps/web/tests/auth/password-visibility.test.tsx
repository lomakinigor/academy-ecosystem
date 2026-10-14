// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  useFormState: () => [{}, "/test-submit"],
  useFormStatus: () => ({ pending: false }),
}));
vi.mock("@/app/login/actions", () => ({ loginAction: vi.fn() }));
vi.mock("@/app/signup/actions", () => ({ signupAction: vi.fn() }));

import { LoginForm } from "@/app/login/login-form";
import { SignupForm } from "@/app/signup/signup-form";

describe.each([
  ["вход", LoginForm],
  ["регистрация", SignupForm],
] as const)("Пароль: %s", (_name, Form) => {
  it("позволяет выбрать чужое устройство, личное запоминается по умолчанию", async () => {
    render(<Form />);
    const choice = screen.getByRole("checkbox", { name: "Не запоминать меня на этом устройстве" });
    expect(choice).not.toBeChecked();
    await userEvent.click(choice);
    expect(choice).toBeChecked();
    expect(screen.getByText(/90 дней/)).toBeInTheDocument();
  });
  it("переключает видимость, сохраняя значение и не отправляя форму", async () => {
    render(<Form />);
    const input = screen.getByLabelText("Пароль");
    const submit = vi.fn((event: Event) => event.preventDefault());
    input.closest("form")!.addEventListener("submit", submit);
    expect(input).toHaveAttribute("type", "password");
    await userEvent.type(input, "Example-password-123");
    const show = screen.getByRole("button", { name: "Показать пароль" });
    expect(show).toHaveAttribute("type", "button");
    await userEvent.click(show);
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("Example-password-123");
    await userEvent.click(screen.getByRole("button", { name: "Скрыть пароль" }));
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveValue("Example-password-123");
    expect(submit).not.toHaveBeenCalled();
  });
});
