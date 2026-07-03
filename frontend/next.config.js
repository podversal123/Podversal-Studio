/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'res.cloudinary.com'],
  },
  async rewrites() {
    // Proxies only the Google OAuth routes through this domain so the
    // "Sign in with Google" consent screen shows podversal.com instead of
    // the Render backend's onrender.com URL. All other API calls still hit
    // the backend directly (unproxied) to avoid Vercel's payload/timeout
    // limits on large uploads and video streaming.
    const backendOrigin = process.env.BACKEND_ORIGIN || 'http://localhost:3001';
    return [
      {
        source: '/api/auth/google',
        destination: `${backendOrigin}/api/auth/google`,
      },
      {
        source: '/api/auth/google/callback',
        destination: `${backendOrigin}/api/auth/google/callback`,
      },
    ];
  },
  async headers() {
    return [
      {
        // Prevent browsers from caching dashboard pages so that back-navigation
        // after logout always triggers a fresh auth check rather than serving
        // a stale cached version of the protected page.
        source: '/dashboard/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma',        value: 'no-cache'                             },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
