import type { Metadata } from 'next';
import { MessagesClient } from './MessagesClient';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Rooms you belong to on the OpenForge chat server.',
};

interface Props {
  /** `?room=<id>` — a deep link from a dispute, so the room opens directly. */
  searchParams: Promise<{ room?: string }>;
}

export default async function MessagesPage({ searchParams }: Props) {
  const { room } = await searchParams;
  return <MessagesClient initialRoomId={room ?? null} />;
}
