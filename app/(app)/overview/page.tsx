import type { Metadata } from 'next';
import { OverviewClient } from './OverviewClient';

export const metadata: Metadata = {
  title: 'Overview',
  description: 'Your projects, escrows and profile.',
};

export default function OverviewPage() {
  return <OverviewClient />;
}
