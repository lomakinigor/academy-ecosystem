import { getServerCaller } from "@/lib/trpc/server";
import { isConfiguredOwner } from "@academy/api";
import { requireUser } from "@/lib/auth/helpers";

import { ClientsContent } from "./clients-content";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const user = await requireUser();
  const caller = await getServerCaller();
  const clients = await caller.clients.list();

  return <ClientsContent clients={clients} isOwner={isConfiguredOwner(user.id)} />;
}
