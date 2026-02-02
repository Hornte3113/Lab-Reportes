import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilitar modo standalone para Docker
  // Esto genera un bundle autónomo más pequeño y eficiente
  output: 'standalone',
  

};

export default nextConfig;