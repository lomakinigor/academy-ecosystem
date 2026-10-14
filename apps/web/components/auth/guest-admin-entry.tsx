import Link from "next/link";

export function GuestAdminEntry() {
  return (
    <Link
      href="/admin/calendar"
      className="text-sm font-medium text-brand-primary underline-offset-4 hover:underline"
    >
      Админ-панель
    </Link>
  );
}
