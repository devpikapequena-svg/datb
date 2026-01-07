import type { NextConfig } from 'next';
import WebpackObfuscator from 'webpack-obfuscator';
require('dotenv').config();

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // ✅ se der erro com algum domínio externo, só trocar unoptimized: true
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'logodownload.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gematsu.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-gop.garenanow.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'contentgarena-a.akamaihd.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's2-ge.glbimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.s3.glbimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'p.novaskin.me',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'payment.boacompra.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'recargarjogo.help',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**', // fallback global (qualquer domínio externo)
        pathname: '/**',
      },
    ],
   unoptimized: true,
  },
  serverRuntimeConfig: {
    BUCKPAY_API_TOKEN: process.env.BUCKPAY_API_TOKEN,
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    GHOSTPAY_SECRET_KEY: process.env.GHOSTPAY_SECRET_KEY,
    UTMIFY_API_URL: process.env.UTMIFY_API_URL,
    UTMIFY_API_TOKEN: process.env.UTMIFY_API_TOKEN,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "index, follow",
          },
        ],
      },
    ];
  },

  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.plugins.push(
        new WebpackObfuscator(
          {
            compact: true,
            disableConsoleOutput: true,
            selfDefending: true,
            simplify: true,
            stringArray: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayThreshold: 0.75,
          },
          []
        )
      );
    }
    return config;
  },
};

export default nextConfig;
