import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeScript } from '@/components/theme/ThemeScript';
import { Providers } from '@/app/providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'OpenForge',
    template: '%s · OpenForge',
  },
  description:
    'A workspace for building open source together: projects, milestones and escrowed payments in one place.',
  applicationName: 'OpenForge',
  openGraph: {
    title: 'OpenForge',
    description:
      'A workspace for building open source together: projects, milestones and escrowed payments in one place.',
    siteName: 'OpenForge',
    type: 'website',
  },
  // No og:image is declared until a real one exists — pointing at a missing
  // asset produces a broken preview card, which is worse than none.
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#08090a' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        {/* Keyboard users reach content without tabbing the whole sidebar. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-toast)] focus:rounded-md focus:bg-elevated focus:px-4 focus:py-2 focus:text-body focus:shadow-[var(--shadow-lg)]"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
