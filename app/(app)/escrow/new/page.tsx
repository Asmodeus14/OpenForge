import type { Metadata } from 'next';
import { DeployEscrowWizard } from './DeployEscrowWizard';

export const metadata: Metadata = {
  title: 'New escrow',
  description: 'Lock funds in a contract that pays out milestone by milestone.',
};

export default function NewEscrowPage() {
  return <DeployEscrowWizard />;
}
