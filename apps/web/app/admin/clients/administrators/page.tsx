import { redirect } from "next/navigation";
import { isConfiguredOwner } from "@academy/api";
import { requireUser } from "@/lib/auth/helpers";
import { getServerCaller } from "@/lib/trpc/server";
import { AdministratorsContent } from "./administrators-content";

export const dynamic = "force-dynamic";
export default async function AdministratorsPage() {
  const user = await requireUser();
  if (!isConfiguredOwner(user.id)) redirect("/unauthorized");
  const caller = await getServerCaller();
  const accounts = await caller.administration.list();
  return <AdministratorsContent accounts={accounts} ownerId={user.id} />;
}
