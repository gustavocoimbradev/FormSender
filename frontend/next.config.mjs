/**
 * The browser only ever talks to this app: `/api/*` is proxied to the backend,
 * so no CORS setup is needed and the API address stays server-side.
 */
const apiUrl = process.env.API_URL ?? "http://localhost:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The production image runs the small server `next build` leaves in .next/standalone.
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
