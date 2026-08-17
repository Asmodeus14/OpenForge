'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Data table.
 *
 * Developer data is usually better as a table than as a grid of cards.
 * Heavy borders are avoided: row spacing, a single hairline under the head,
 * and a hover tint do the structural work.
 *
 * On narrow screens the table scrolls horizontally inside its own container
 * rather than forcing the page to scroll sideways. Where a row is better
 * expressed as a card on mobile, pass `mobileCards`.
 */

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Right-align numeric columns so digits line up. */
  align?: 'left' | 'right';
  /** Hide below the `sm` breakpoint — for secondary metadata. */
  hideOnMobile?: boolean;
  width?: string;
  render: (row: T) => ReactNode;
}

export function Table<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  caption,
  empty,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Describes the table for screen readers. */
  caption: string;
  empty?: ReactNode;
  className?: string;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className={cn('-mx-2 overflow-x-auto', className)}>
      <table className="w-full min-w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  'px-2 pb-2.5 text-meta font-medium text-fg-muted',
                  column.align === 'right' ? 'text-right' : 'text-left',
                  column.hideOnMobile && 'hidden sm:table-cell',
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              className={cn(
                'border-b border-line-faint transition-colors duration-[var(--dur-instant)]',
                onRowClick && 'cursor-pointer hover:bg-subtle focus-visible:bg-subtle',
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-2 py-3.5 text-secondary text-fg align-middle',
                    column.align === 'right' ? 'text-right' : 'text-left',
                    column.hideOnMobile && 'hidden sm:table-cell',
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
