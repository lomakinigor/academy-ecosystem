/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@academy/api", "@academy/db"],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
