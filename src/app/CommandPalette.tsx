import { Command } from 'cmdk';
import * as RadixDialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, FolderGit2, Plus, Search, Wallet } from 'lucide-react';
import { cn } from '../design/cn';
import { StatusPill } from '../design/primitives';
import { useEscrowProjects, useRecentProjects } from '../hooks/queries';
import { projectStatus } from '../lib/status';
import { shortenAddress } from '../lib/format';
import { ALL_NAV_ITEMS } from './navigation';
import { useWalletContext } from './WalletProvider';

const RECENTS_KEY = 'openforge:palette-recents';
const MAX_RECENTS = 5;

export interface CommandPaletteState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/** Owns the palette's open state and the global keyboard shortcut. */
export function useCommandPalette(): CommandPaletteState {
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

  return useMemo(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [isOpen],
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

function Row({
  icon,
  label,
  meta,
  trailing,
}: {
  icon?: React.ReactNode;
  label: string;
  meta?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <>
      {icon && <span className="shrink-0 text-fg-subtle">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {meta && (
        <span className="shrink-0 font-mono text-[11px] text-fg-subtle">{meta}</span>
      )}
      {trailing}
    </>
  );
}

/**
 * Command palette.
 *
 * Searches real data only — the projects and escrows that actually exist on
 * chain. It never invents suggestions, so an empty result genuinely means
 * there is nothing there.
 */
export function CommandPalette({ state }: { state: CommandPaletteState }) {
  const navigate = useNavigate();
  const wallet = useWalletContext();
  const [search, setSearch] = useState('');
  const [recents, setRecents] = useState<string[]>(readRecents);

  // Only fetch while open — the palette should cost nothing when unused.
  const { data: projectsPage } = useRecentProjects(0, 50);
  const { data: escrows } = useEscrowProjects(state.isOpen ? wallet.account : null);

  const run = useCallback(
    (path: string, recentKey?: string) => {
      if (recentKey) {
        const next = [recentKey, ...recents.filter((r) => r !== recentKey)].slice(
          0,
          MAX_RECENTS,
        );
        setRecents(next);
        try {
          localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
        } catch {
          // Storage can be unavailable in private mode; recents are optional.
        }
      }
      state.close();
      setSearch('');
      navigate(path);
    },
    [navigate, recents, state],
  );

  const recentItems = useMemo(
    () =>
      recents
        .map((path) => ALL_NAV_ITEMS.find((item) => item.path === path))
        .filter((item): item is (typeof ALL_NAV_ITEMS)[number] => Boolean(item)),
    [recents],
  );

  return (
    <RadixDialog.Root open={state.isOpen} onOpenChange={(o) => (o ? state.open() : state.close())}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-[of-fade-in_var(--dur-modal)_var(--ease-out)]" />
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2',
            'overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-dialog)]',
            'data-[state=open]:animate-[of-palette-in_var(--dur-modal)_var(--ease-out)]',
          )}
        >
          <VisuallyHidden>
            <RadixDialog.Title>Command palette</RadixDialog.Title>
            <RadixDialog.Description>
              Search projects and escrows, or jump to a page.
            </RadixDialog.Description>
          </VisuallyHidden>

          <Command loop shouldFilter className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-line px-3">
              <Search className="size-4 shrink-0 text-fg-subtle" aria-hidden />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search projects, escrows and pages…"
                className="h-11 flex-1 bg-transparent text-secondary text-fg placeholder:text-fg-subtle focus:outline-none"
              />
              <kbd className="hidden rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle sm:block">
                Esc
              </kbd>
            </div>

            <Command.List className="max-h-[min(24rem,60vh)] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-secondary text-fg-muted">
                Nothing matches “{search}”.
              </Command.Empty>

              {!search && recentItems.length > 0 && (
                <Command.Group heading="Recent" className="of-cmd-group">
                  {recentItems.map((item) => (
                    <Command.Item
                      key={`recent-${item.path}`}
                      value={`recent ${item.label}`}
                      onSelect={() => run(item.path)}
                      className="of-cmd-item"
                    >
                      <Row icon={<item.icon className="size-4" aria-hidden />} label={item.label} />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group heading="Go to" className="of-cmd-group">
                {ALL_NAV_ITEMS.map((item) => (
                  <Command.Item
                    key={item.path}
                    value={`go ${item.label} ${item.path}`}
                    onSelect={() => run(item.path, item.path)}
                    className="of-cmd-item"
                  >
                    <Row
                      icon={<item.icon className="size-4" aria-hidden />}
                      label={item.label}
                      trailing={
                        <CornerDownLeft
                          className="size-3 shrink-0 text-fg-subtle opacity-0 group-data-[selected=true]:opacity-100"
                          aria-hidden
                        />
                      }
                    />
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Actions" className="of-cmd-group">
                <Command.Item
                  value="create new project"
                  onSelect={() => run('/projects/new')}
                  className="of-cmd-item"
                >
                  <Row icon={<Plus className="size-4" aria-hidden />} label="Create a project" />
                </Command.Item>
                <Command.Item
                  value="deploy escrow milestone contract"
                  onSelect={() => run('/escrow/new')}
                  className="of-cmd-item"
                >
                  <Row icon={<Wallet className="size-4" aria-hidden />} label="Deploy an escrow" />
                </Command.Item>
              </Command.Group>

              {projectsPage && projectsPage.projects.length > 0 && (
                <Command.Group heading="Projects" className="of-cmd-group">
                  {projectsPage.projects.map((project) => (
                    <Command.Item
                      key={project.projectId}
                      value={`project ${project.projectId} ${project.builder}`}
                      onSelect={() => run(`/projects/${project.projectId}`)}
                      className="of-cmd-item"
                    >
                      <Row
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
                      onSelect={() => run(`/escrow/${escrow.escrowAddress}`)}
                      className="of-cmd-item"
                    >
                      <Row
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
