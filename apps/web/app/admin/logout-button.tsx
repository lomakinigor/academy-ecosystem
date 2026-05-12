import { LogOut } from "lucide-react";

import { Button } from "@academy/ui";

import { logoutAction } from "../logout/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        aria-label="Выйти из аккаунта"
        className="px-2"
      >
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}
