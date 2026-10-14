const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
async function main() {
  const primaryId = process.env.OWNER_USER_ID;
  if (!primaryId) throw new Error("OWNER_USER_ID is required");
  await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(8142026)`;
      const columns =
        await tx.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'is_owner'`;
      if (columns.length) return;
      await tx.$executeRawUnsafe(
        'ALTER TABLE "User" ADD COLUMN "is_owner" BOOLEAN NOT NULL DEFAULT false',
      );
      const count =
        await tx.$executeRaw`UPDATE "User" SET "is_owner" = true WHERE "id" = ${primaryId} AND "email" IS NOT NULL AND "password_hash" IS NOT NULL`;
      if (count !== 1) throw new Error("Primary owner account not found; migration rolled back");
    },
    { timeout: 30000 },
  );
  console.log("Owner schema is ready");
}
main()
  .catch(() => {
    console.error("Owner migration failed; inspect configuration and database");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
