/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'res.cloudinary.com'],
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
