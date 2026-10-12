import { getServerCaller } from "@/lib/trpc/server";

import { ClientsContent } from "./clients-content";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const caller = await getServerCaller();
  const clients = await caller.clients.list();

  return <ClientsContent clients={clients} />;
}
