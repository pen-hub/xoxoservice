import type { NextConfig } from "next";
import withPWAInit from 'next-pwa';


const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NEXT_ENV === 'development',
  fallbacks: {
    document: '/offline.html',
    image: '/logo.png',
    audio: '/logo.png',
    video: '/logo.png',
    font: '/logo.png',
  },
});
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Turbopack configuration for Next.js 16
  turbopack: {
    root: "D:/xoxo/xoxo",
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },

    ],
  },
   compiler: {
        removeConsole: process.env.NEXT_ENV === 'production',
    },
    ...withPWA,
     async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ]
  },
} as NextConfig;

export default withPWA(nextConfig as any);
