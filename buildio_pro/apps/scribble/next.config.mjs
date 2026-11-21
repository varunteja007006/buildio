/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/game-ui"],
  allowedDevOrigins: ['localhost', '*'],
}

export default nextConfig
