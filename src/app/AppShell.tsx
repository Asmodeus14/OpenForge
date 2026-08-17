import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, PanelLeftClose, PanelLeftOpen, Plus, Search, X } from 'lucide-react';
import { cn } from '../design/cn';
import { Button, IconButton, NetworkBadge, Skeleton } from '../design/primitives';
import { TooltipProvider } from '../design/primitives/Tooltip';
import { CommandPalette, useCommandPalette } from './CommandPalette';
import { NAV_GROUPS, type NavItem } from './navigation';
import { WalletStatus } from './WalletStatus';

const SIDEBAR_KEY = 'openforge:sidebar-collapsed';

function Wordmark({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      to="/overview"
      className="flex items-center gap-2 rounded-md px-1 py-1 text-fg"
      aria-label="OpenForge home"
    >
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent text-[11px] font-bold text-accent-fg"
        aria-hidden
      >
        OF
      </span>
      {!collapsed && (
        <span className="text-section tracking-tight">OpenForge</span>
      )}
    </Link>
  );
}

function NavRow({ item, collapsed }: { item: NavItem; collapsed?: boolean }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-md px-2 py-1.5',
          'text-secondary transition-colors duration-[var(--dur-hover)]',
          isActive
            ? 'bg-accent-subtle text-fg'
            : 'text-fg-muted hover:bg-raised hover:text-fg',
          collapsed && 'justify-center px-0',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active state is carried by a bar and a background, not colour
              alone, so it survives greyscale and low-vision settings. */}
          <span
            aria-hidden
            className={cn(
              'absolute left-0 h-4 w-0.5 rounded-r-full bg-accent transition-opacity',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          <Icon className="size-4 shrink-0" aria-hidden />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({
  collapsed,
  onOpenPalette,
}: {
  collapsed?: boolean;
  onOpenPalette: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className={cn('flex items-center', collapsed ? 'justify-center' : 'px-1')}>
        <Wordmark collapsed={collapsed} />
      </div>

      {/* Search entry point. Also advertises the keyboard shortcut, which is
          how the palette gets discovered at all. */}
      <button
        type="button"
        onClick={onOpenPalette}
        className={cn(
          'flex items-center gap-2 rounded-md border border-line bg-surface px-2 py-1.5',
          'text-meta text-fg-subtle transition-colors duration-[var(--dur-hover)]',
          'hover:border-line-strong hover:text-fg-muted',
          collapsed && 'justify-center',
        )}
      >
        <Search className="size-4 shrink-0" aria-hidden />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">Search</span>
            <kbd className="rounded border border-line bg-raised px-1 py-0.5 font-mono text-[10px] text-fg-subtle">
              {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl K'}
            </kbd>
          </>
        )}
      </button>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto" aria-label="Main">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            {!collapsed && (
              <h2 className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-fg-subtle">
                {group.label}
              </h2>
            )}
            {group.items.map((item) => (
              <NavRow key={item.path} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          size="sm"
          fullWidth={!collapsed}
          leadingIcon={<Plus className="size-4" aria-hidden />}
          onClick={() => navigate('/projects/new')}
          aria-label={collapsed ? 'New project' : undefined}
        >
          {!collapsed && 'New project'}
        </Button>
        {!collapsed && <NetworkBadge className="self-start" />}
        <WalletStatus collapsed={collapsed} />
      </div>
    </div>
  );
}

/** Skeleton shown while a lazily-loaded route chunk arrives. */
function RouteFallback() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-3 h-4 w-72" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/**
 * The application shell.
 *
 * Replaces `Sidebar.tsx`, which rendered three separate nav surfaces from one
 * component, derived its active state from a prop each page had to pass by
 * hand (so deep links and the back button never highlighted correctly), and
 * was additionally copy-pasted inline three times inside a single page.
 */
export function AppShell() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === 'true',
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const palette = useCommandPalette();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  // Close the mobile drawer on navigation, otherwise it covers the page the
  // user just asked for.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-canvas">
        {/* ---- Desktop sidebar */}
        <aside
          className={cn(
            'hidden shrink-0 border-r border-line lg:flex lg:flex-col',
            'sticky top-0 h-screen transition-[width] duration-[var(--dur-menu)]',
            collapsed ? 'w-16' : 'w-60',
          )}
        >
          <SidebarContent collapsed={collapsed} onOpenPalette={palette.open} />
          <div className="border-t border-line p-2">
            <IconButton
              label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setCollapsed((v) => !v)}
              icon={
                collapsed ? (
                  <PanelLeftOpen className="size-4" aria-hidden />
                ) : (
                  <PanelLeftClose className="size-4" aria-hidden />
                )
              }
            />
          </div>
        </aside>

        {/* ---- Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/70"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 border-r border-line bg-surface">
              <div className="flex justify-end p-2">
                <IconButton
                  label="Close navigation"
                  onClick={() => setMobileOpen(false)}
                  icon={<X className="size-4" aria-hidden />}
                />
              </div>
              <SidebarContent
                onOpenPalette={() => {
                  setMobileOpen(false);
                  palette.open();
                }}
              />
            </div>
          </div>
        )}

        {/* ---- Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-canvas/85 px-3 py-2 backdrop-blur lg:hidden">
            <IconButton
              label="Open navigation"
              onClick={() => setMobileOpen(true)}
              icon={<Menu className="size-4" aria-hidden />}
            />
            <Wordmark />
            <div className="flex-1" />
            <IconButton
              label="Search"
              onClick={palette.open}
              icon={<Search className="size-4" aria-hidden />}
            />
          </header>

          <main id="main" className="min-w-0 flex-1">
            <Suspense fallback={<RouteFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </div>

        <CommandPalette state={palette} />
      </div>
    </TooltipProvider>
  );
}
