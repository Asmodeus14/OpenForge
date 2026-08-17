import { useState } from 'react';
import { cn } from '../cn';

const SIZES = {
  xs: 'size-5 text-[10px]',
  sm: 'size-7 text-[11px]',
  md: 'size-9 text-meta',
  lg: 'size-12 text-secondary',
  xl: 'size-20 text-title',
} as const;

/**
 * Deterministic colour from an address, so the same wallet always gets the
 * same swatch. That consistency is itself a small identity signal — a
 * contributor's placeholder looks the same everywhere in the product.
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
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
}

function initialsFor(name: string | undefined, address: string | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  // Address initials use characters after "0x" so every avatar isn't "0X".
  if (address && address.length > 3) return address.slice(2, 4).toUpperCase();
  return '?';
}

export interface AvatarProps {
  src?: string | null;
  name?: string;
  address?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ src, name, address, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const seed = address ?? name ?? '';
  const showImage = src && !failed;
  const label = name ?? address ?? 'Unknown';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line font-medium select-none',
        !showImage && toneFor(seed),
        SIZES[size],
        className,
      )}
      title={label}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          // Falls back to initials rather than a broken-image icon. IPFS
          // content can legitimately be unavailable.
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden>{initialsFor(name, address)}</span>
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
      {shown.map((person, i) => (
        <Avatar
          key={person.address ?? person.name ?? i}
          {...person}
          size={size}
          className={cn(i > 0 && '-ml-2', 'ring-2 ring-surface')}
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full border border-line bg-raised text-fg-muted ring-2 ring-surface -ml-2',
            SIZES[size],
          )}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}
