import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth/helpers";
import { SystemRole } from "@/lib/auth/types";
import { SpeakersClient } from "./speakers-client";

export const dynamic = "force-dynamic";

export default async function SpeakersPage() {
  await requireRole(SystemRole.BRANCH_ADMIN);

  return (
    <div className="mx-auto max-w-screen-md px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/calendar"
          className="flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Календарь
        </Link>
      </div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-brand-primary">
        Управление спикерами
      </h1>
      <SpeakersClient />
    </div>
  );
}
