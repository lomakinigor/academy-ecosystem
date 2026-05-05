import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@academy/api";

/**
 * Типизированный tRPC-клиент для React.
 * Использовать в client-компонентах: `trpc.event.list.useQuery({...})`.
 */
export const trpc = createTRPCReact<AppRouter>();
