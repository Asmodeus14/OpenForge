'use client';

import { Command } from 'cmdk';
import * as RadixDialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ArrowRight,
  Clock,
  FolderGit2,
  HandCoins,
  Plus,
  Search,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { StatusPill } from '@/components/ui/Badge';
import { useEscrowProjects, useRecentProjects } from '@/hooks/queries';
import { useWalletContext } from '@/components/wallet/WalletProvider';
import { NAV_ITEMS } from '@/lib/navigation';
import { projectStatus } from '@/lib/status';
import { shortenAddress } from '@/lib/format';

const RECENTS_KEY = 'openforge:palette-recents';
const MAX_RECENTS = 5;

interface PaletteContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

/** Lets any component — a search button, an empty state — open the palette. */
export function useCommandPalette(): PaletteContextValue {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used inside <CommandPaletteProvider>.');
  }
  return context;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [isOpen],
  );

  return (
    <PaletteContext.Provider value={value}>
      {children}
      <CommandPalette />
    </PaletteContext.Provider>
  );
}

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function Item({
  icon,
  label,
  meta,
  trailing,
}: {
  icon: ReactNode;
  label: string;
  meta?: string;
  trailing?: ReactNode;
}) {
  return (
    <>
      <span className="shrink-0 text-fg-muted">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {meta && <span className="shrink-0 font-mono text-micro text-fg-muted">{meta}</span>}
      {trailing}
      <ArrowRight
        className="size-3 shrink-0 text-fg-muted opacity-0 group-data-[selected=true]:opacity-100"
        aria-hidden
      />
    </>
  );
}

/**
 * Command palette.
 *
 * Searches only real data — the projects and escrows that exist on chain —
 * so an empty result genuinely means there is nothing there rather than a
 * failed lookup.
 */
function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const router = useRouter();
  const wallet = useWalletContext();
  const [search, setSearch] = useState('');

  // Lazily initialised rather than set in an effect. This is safe from a
  // hydration standpoint because the palette's contents live inside a Radix
  // portal that renders nothing while closed — and it is always closed on
  // first paint.
  const [recents, setRecents] = useState<string[]>(() =>
    typeof window === 'undefined' ? [] : readRecents(),
  );

  // Data is fetched only while the palette is open, so it costs nothing when
  // unused. react-query keeps it warm between openings.
  const { data: projectsPage } = useRecentProjects(0, 50);
  const { data: escrows } = useEscrowProjects(isOpen ? wallet.account : null);

  const go = useCallback(
    (href: string, remember?: string) => {
      if (remember) {
        const next = [remember, ...recents.filter((r) => r !== remember)].slice(
          0,
          MAX_RECENTS,
        );
        setRecents(next);
        try {
          localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
        } catch {
          // Recents are a convenience; storage failure is not worth surfacing.
        }
      }
      close();
      setSearch('');
      router.push(href);
    },
    [close, recents, router],
  );

  const recentItems = useMemo(
    () =>
      recents
        .map((href) => NAV_ITEMS.find((item) => item.href === href))
        .filter((item): item is (typeof NAV_ITEMS)[number] => Boolean(item)),
    [recents],
  );

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-[of-fade-in_var(--dur-base)_var(--ease-out)] dark:bg-black/60" />
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-[14vh] z-[var(--z-overlay)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2',
            'overflow-hidden rounded-xl border border-line bg-elevated shadow-[var(--shadow-overlay)]',
            'data-[state=open]:animate-[of-drop-in_var(--dur-base)_var(--ease-out)]',
          )}
        >
          <VisuallyHidden>
            <RadixDialog.Title>Search</RadixDialog.Title>
            <RadixDialog.Description>
              Search projects and escrows, or jump to a page.
            </RadixDialog.Description>
          </VisuallyHidden>

          <Command loop className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 shrink-0 text-fg-muted" aria-hidden />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search projects, escrows and pages…"
                className="h-13 flex-1 bg-transparent py-4 text-body text-fg placeholder:text-fg-muted focus:outline-none"
              />
              <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-micro text-fg-muted sm:block">
                Esc
              </kbd>
            </div>

            <Command.List className="max-h-[min(26rem,60vh)] overflow-y-auto p-2">
              <Command.Empty className="px-4 py-10 text-center text-secondary text-fg-secondary">
                Nothing matches “{search}”.
              </Command.Empty>

              {!search && recentItems.length > 0 && (
                <Command.Group heading="Recent" className="of-cmd-group">
                  {recentItems.map((item) => (
                    <Command.Item
                      key={`recent-${item.href}`}
                      value={`recent ${item.label}`}
                      onSelect={() => go(item.href)}
                      className="of-cmd-item group"
                    >
                      <Item icon={<Clock className="size-4" aria-hidden />} label={item.label} />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group heading="Go to" className="of-cmd-group">
                {NAV_ITEMS.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={`go ${item.label} ${item.href}`}
                    onSelect={() => go(item.href, item.href)}
                    className="of-cmd-item group"
                  >
                    <Item icon={<item.icon className="size-4" aria-hidden />} label={item.label} />
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Actions" className="of-cmd-group">
                <Command.Item
                  value="create new project"
                  onSelect={() => go('/projects/new')}
                  className="of-cmd-item group"
                >
                  <Item icon={<Plus className="size-4" aria-hidden />} label="Create a project" />
                </Command.Item>
                <Command.Item
                  value="deploy escrow milestone contract fund work"
                  onSelect={() => go('/escrow/new')}
                  className="of-cmd-item group"
                >
                  <Item icon={<Wallet className="size-4" aria-hidden />} label="Deploy an escrow" />
                </Command.Item>
                <Command.Item
                  value="funding funded who is funding how much money public escrows"
                  onSelect={() => go('/funding')}
                  className="of-cmd-item group"
                >
                  <Item
                    icon={<HandCoins className="size-4" aria-hidden />}
                    label="See what's funded"
                  />
                </Command.Item>
              </Command.Group>

              {projectsPage && projectsPage.projects.length > 0 && (
                <Command.Group heading="Projects" className="of-cmd-group">
                  {projectsPage.projects.map((project) => (
                    <Command.Item
                      key={project.projectId}
                      value={`project ${project.projectId} ${project.builder}`}
                      onSelect={() => go(`/projects/${project.projectId}`)}
                      className="of-cmd-item group"
                    >
                      <Item
                        icon={<FolderGit2 className="size-4" aria-hidden />}
                        label={`Project #${project.projectId}`}
                        meta={shortenAddress(project.builder)}
                        trailing={
                          <StatusPill status={projectStatus(project.status)} showIcon={false} />
                        }
                      />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {escrows && escrows.length > 0 && (
                <Command.Group heading="Escrows" className="of-cmd-group">
                  {escrows.map((escrow) => (
                    <Command.Item
                      key={escrow.escrowAddress}
                      value={`escrow ${escrow.title} ${escrow.escrowAddress}`}
                      onSelect={() => go(`/escrow/${escrow.escrowAddress}`)}
                      className="of-cmd-item group"
                    >
                      <Item
                        icon={<Wallet className="size-4" aria-hidden />}
                        label={escrow.title || `Escrow #${escrow.projectId}`}
                        meta={shortenAddress(escrow.escrowAddress)}
                      />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
