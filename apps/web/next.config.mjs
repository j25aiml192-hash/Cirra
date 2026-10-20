/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cirra/ui", "@cirra/types", "@cirra/utils"],
  reactStrictMode: true,
};

export default nextConfig;
