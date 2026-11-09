/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" output bundles only the files needed to run, which makes the
  // production Docker image dramatically smaller (used by the runtime stage).
  output: "standalone",
  reactStrictMode: true,
};

module.exports = nextConfig;
