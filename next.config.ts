import type { NextConfig } from "next";
import withPWAInit from 'next-pwa';


const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NEXT_ENV === 'development',
//   fallbacks: {
//     document: '/offline.html',
//   },
});
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Turbopack configuration for Next.js 16
  turbopack: {},
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
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lfupbsuudntberju.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'loremflickr.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      }
    ],
  },
   compiler: {
        removeConsole: process.env.NEXT_ENV === 'production',
    },
    ...withPWA,
} as NextConfig;

export default withPWA(nextConfig as any);
