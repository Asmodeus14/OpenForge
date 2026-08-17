'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

const SIZES = {
  xs: 'size-5 text-[10px]',
  sm: 'size-7 text-micro',
  md: 'size-9 text-meta',
  lg: 'size-12 text-secondary',
  xl: 'size-24 text-heading',
} as const;

/**
 * Deterministic tint from the address, so the same wallet always gets the
 * same swatch everywhere in the product. That consistency is itself a small
 * identity signal.
 */
function toneFor(seed: string): string {
  const palette = [
    'bg-accent-subtle text-accent-text',
    'bg-info-subtle text-info-text',
    'bg-success-subtle text-success-text',
    'bg-warning-subtle text-warning-text',
    'bg-danger-subtle text-danger-text',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function initials(name?: string, address?: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  // Skip the "0x" so every placeholder isn't the same two characters.
  if (address && address.length > 3) return address.slice(2, 4).toUpperCase();
  return '?';
}

export function Avatar({
  src,
  name,
  address,
  size = 'md',
  className,
}: {
  src?: string | null;
  name?: string;
  address?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const label = name ?? address ?? 'Unknown';

  return (
    <span
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'border border-line font-medium select-none',
        !showImage && toneFor(address ?? name ?? ''),
        SIZES[size],
        className,
      )}
    >
      {showImage ? (
        // Optimised through next/image. The IPFS gateway hosts are declared
        // in next.config.ts; avatars are small and fixed-size, so `fill`
        // with a sizes hint avoids shipping a needlessly large source.
        <Image
          src={src!}
          alt=""
          width={96}
          height={96}
          sizes="96px"
          className="size-full object-cover"
          // Falls back to initials rather than a broken-image glyph — IPFS
          // content can legitimately be unavailable.
          onError={() => setFailed(true)}
          unoptimized={src!.includes('pinataGatewayToken')}
        />
      ) : (
        <span aria-hidden>{initials(name, address)}</span>
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function AvatarGroup({
  people,
  max = 4,
  size = 'sm',
  className,
}: {
  people: { src?: string | null; name?: string; address?: string }[];
  max?: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;

  return (
    <span className={cn('inline-flex items-center', className)}>
      {shown.map((person, index) => (
        <Avatar
          key={person.address ?? person.name ?? index}
          {...person}
          size={size}
          className={cn(index > 0 && '-ml-2', 'ring-2 ring-canvas')}
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full border border-line bg-subtle text-fg-muted ring-2 ring-canvas -ml-2',
            SIZES[size],
          )}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}
