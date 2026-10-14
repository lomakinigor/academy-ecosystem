import Link from "next/link";

import { Button } from "@academy/ui";

export function ExitAdminPanel() {
  return (
    <Button asChild variant="ghost" size="sm" className="max-sm:px-2">
      <Link href="/">Выйти из админ-панели</Link>
    </Button>
  );
}
