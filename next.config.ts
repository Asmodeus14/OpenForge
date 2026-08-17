import type { NextConfig } from 'next';

/**
 * Avatars and project covers are IPFS content, but they are always served
 * from a known set of gateway hosts, so `next/image` can optimise them.
 * Only these hosts are permitted — a wildcard would turn the image endpoint
 * into an open proxy for arbitrary remote content.
 */
const pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY?.replace(/^https?:\/\//, '')
  .replace(/\/.*$/, '');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(pinataGateway
        ? [{ protocol: 'https' as const, hostname: pinataGateway, pathname: '/ipfs/**' }]
        : []),
      { protocol: 'https', hostname: 'w3s.link', pathname: '/ipfs/**' },
      { protocol: 'https', hostname: 'ipfs.io', pathname: '/ipfs/**' },
      { protocol: 'https', hostname: 'dweb.link', pathname: '/ipfs/**' },
      { protocol: 'https', hostname: 'gateway.pinata.cloud', pathname: '/ipfs/**' },
    ],
  },
};

export default nextConfig;
