import type { Metadata } from 'next';
import { MessagesClient } from './MessagesClient';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Rooms you belong to on the OpenForge chat server.',
};

export default function MessagesPage() {
  return <MessagesClient />;
}
