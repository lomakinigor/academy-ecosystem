/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
    // На Vercel @prisma/client native-binary не попадает в serverless-бандл,
    // если Next.js его трасит. Помечаем как external — Vercel подгрузит
    // из node_modules в рантайме.
    serverComponentsExternalPackages: ["@prisma/client", "@academy/db", "bcryptjs"],
    // Принудительно включаем Prisma query engine (.so) в output trace.
    // Без этого pnpm-симлинки теряются и runtime не находит libquery_engine.
    outputFileTracingIncludes: {
      "**/*": [
        "../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/**",
        "../../node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/**",
      ],
    },
  },
  // pnpm-symlinked workspace deps + Vercel output file tracing — нужно явно
  // включить @prisma/client движок в trace. monorepo-root указываем чтобы
  // tracing захватил весь node_modules pnpm-store.
  outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
};

export default nextConfig;
