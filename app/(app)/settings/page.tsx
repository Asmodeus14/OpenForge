import type { Metadata } from 'next';
import { SettingsClient } from './SettingsClient';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Appearance, wallet and locally stored data.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
