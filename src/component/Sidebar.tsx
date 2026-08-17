/**
 * DEPRECATED — renders nothing.
 *
 * Navigation now lives in `src/app/AppShell.tsx`, which wraps every route.
 * The original 504-line component rendered three separate nav surfaces, took
 * its active state from a prop instead of the URL, and refetched the user's
 * avatar by brute-forcing seven file extensions on every page mount.
 *
 * This shim exists so the six pages that still import it keep compiling while
 * they are rebuilt one at a time. Each rewritten page drops the import; the
 * file is deleted in Phase 10 once none remain.
 *
 * Do not add anything here.
 */

interface LegacySidebarProps {
  activeTab?: string | number;
  setActiveTab?: (tab: string) => void;
  [key: string]: unknown;
}

export default function Sidebar(_props: LegacySidebarProps) {
  return null;
}
