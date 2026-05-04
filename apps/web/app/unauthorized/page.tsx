import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main>
      <h1>Доступ запрещён</h1>
      <p>У вас нет прав на просмотр этой страницы.</p>
      <p>
        <Link href="/student">Вернуться в личный кабинет</Link>
      </p>
      <p>
        <Link href="/logout">Войти под другим аккаунтом</Link>
      </p>
    </main>
  );
}
