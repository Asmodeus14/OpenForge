import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isAddress } from 'ethers';
import { EscrowDetailClient } from './EscrowDetailClient';
import { shortenAddress } from '@/lib/format';

/**
 * The address is validated here, on the server, before any component mounts.
 * A malformed address would otherwise reach ethers and surface as a contract
 * error, which reads like the escrow is broken rather than like the URL is.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  return {
    title: isAddress(address) ? `Escrow ${shortenAddress(address)}` : 'Escrow',
    description: 'Milestone escrow contract details.',
  };
}

export default async function EscrowDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  if (!isAddress(address)) notFound();

  return <EscrowDetailClient address={address} />;
}
