import Link from "next/link";

export function GuestAdminEntry() {
  return (
    <Link
      href="/admin/calendar"
      className="text-xs font-medium text-brand-primary underline-offset-4 hover:underline sm:text-sm"
    >
      Админ-панель
    </Link>
  );
}
