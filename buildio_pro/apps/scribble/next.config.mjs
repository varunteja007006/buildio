/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/game-ui"],
  allowedDevOrigins: ['http://localhost:3000', '*'],
}

export default nextConfig
