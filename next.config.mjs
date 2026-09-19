/** @type {import('next').NextConfig} */
const isMobileBuild =
  process.env.NEXT_EXPORT === "true" ||
  process.env.BUILD_TARGET === "mobile" ||
  process.env.npm_lifecycle_event === "build:mobile" ||
  process.env.npm_lifecycle_event === "build:apk" ||
  process.env.npm_lifecycle_event === "cap:build";

const nextConfig = {
  reactStrictMode: true,
  ...(isMobileBuild
    ? {
        output: "export",
        trailingSlash: true,
      }
    : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
