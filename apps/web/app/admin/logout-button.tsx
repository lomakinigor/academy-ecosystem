import Link from "next/link";
import { LogOut } from "lucide-react";

import { Button } from "@academy/ui";

export function LogoutButton() {
  return (
    <Button asChild variant="ghost" size="sm" aria-label="Выйти из аккаунта" className="px-2">
      <Link href="/logout">
        <LogOut className="size-4" />
      </Link>
    </Button>
  );
}
