import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  const session = await auth();
  if (session?.user) {
    redirect(searchParams?.callbackUrl || "/student");
  }

  return (
    <main>
      <h1>Вход в Академию</h1>
      <LoginForm callbackUrl={searchParams?.callbackUrl} />
    </main>
  );
}
