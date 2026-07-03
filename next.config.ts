import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb", // permite subir varias fotos del avance por vez
    },
  },
};

export default nextConfig;
