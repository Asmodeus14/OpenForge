import type { Metadata } from 'next';
import { ProfileClient } from './ProfileClient';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Your public identity on OpenForge.',
};

export default function ProfilePage() {
  return <ProfileClient />;
}
