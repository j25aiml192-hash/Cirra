/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backend}/api/v1/:path*`,
      },
      {
        source: "/demo/:path*",
        destination: `${backend}/demo/:path*`,
      },
      {
        source: "/inject/:path*",
        destination: `${backend}/inject/:path*`,
      },
    ];
  },
};

export default nextConfig;
