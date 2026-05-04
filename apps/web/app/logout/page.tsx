import { redirect } from "next/navigation";

import { signOut } from "@/auth";

export const dynamic = "force-dynamic";

export default async function LogoutPage() {
  await signOut({ redirect: false });
  redirect("/login");
}
