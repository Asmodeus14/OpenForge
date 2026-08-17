import type { Metadata } from 'next';
import { EscrowListClient } from './EscrowListClient';

export const metadata: Metadata = {
  title: 'Escrow',
  description: 'Milestone escrows you have funded or are building.',
};

export default function EscrowPage() {
  return <EscrowListClient />;
}
