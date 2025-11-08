// next.config.js
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/auth/v1/callback",
        destination: "/api/supabase-auth",
      },
    ]
  },
}