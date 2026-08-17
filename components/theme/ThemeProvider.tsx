'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'openforge:theme';

/**
 * Theme state lives outside React.
 *
 * The theme is genuinely external state: `ThemeScript` has already read
 * localStorage and stamped the class on <html> before React hydrates.
 * `useSyncExternalStore` is the right way to read that — it gives a distinct
 * server snapshot, so there is no setState-in-effect and no cascading render
 * on mount.
 */

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/**
 * Reapplies the class to <html> and notifies React.
 *
 * The DOM update happens here rather than in an effect because these are
 * genuine external events — the OS preference changing, or another tab
 * writing to storage — and the class must track them even while the user is
 * following the system setting.
 */
function syncAndEmit() {
  const theme = readStored();
  applyToDocument(theme === 'system' ? systemPrefersDark() : theme === 'dark');
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', syncAndEmit);
  // Another tab may have changed the preference.
  window.addEventListener('storage', syncAndEmit);

  return () => {
    listeners.delete(listener);
    media.removeEventListener('change', syncAndEmit);
    window.removeEventListener('storage', syncAndEmit);
  };
}

function readStored(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Snapshot is a plain string so React's identity check stays cheap. */
function getSnapshot(): string {
  const theme = readStored();
  const resolved = theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;
  return `${theme}:${resolved}`;
}

/** The server cannot know the user's preference; dark is the product default. */
function getServerSnapshot(): string {
  return 'system:dark';
}

function applyToDocument(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

interface ThemeContextValue {
  /** What the user chose, including "follow the system". */
  theme: Theme;
  /** What is actually rendered right now. */
  resolved: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [theme, resolved] = snapshot.split(':') as [Theme, 'light' | 'dark'];

  const setTheme = useCallback((next: Theme) => {
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable in private mode; the theme still applies now.
    }
    applyToDocument(next === 'system' ? systemPrefersDark() : next === 'dark');
    emit();
  }, []);

  const value = useMemo(
    () => ({ theme, resolved, setTheme }),
    [theme, resolved, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>.');
  return context;
}
