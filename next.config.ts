import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverRuntimeConfig: {
    APP_SESSION_SECRET: process.env.APP_SESSION_SECRET,
  },
  reactStrictMode: true,
};

export default nextConfig;
