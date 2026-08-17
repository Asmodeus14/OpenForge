import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';

import { Web3Provider } from './hooks/web3';
import { WalletProvider } from './app/WalletProvider';
import { AppShell } from './app/AppShell';
import { ErrorBoundary } from './app/ErrorBoundary';

/**
 * Routes are lazily loaded.
 *
 * Previously all 19 route components were imported statically into a single
 * chunk — including a 6,000-line escrow page and a 3,000-line chat page that
 * every visitor downloaded before the landing page could paint.
 */
const LandingPage = lazy(() => import('./pages/Land'));
const LoginPage = lazy(() => import('./pages/Login'));
const AboutPage = lazy(() => import('./Land-Page-Info/About'));
const ContactPage = lazy(() => import('./Land-Page-Info/Contact'));

const OverviewPage = lazy(() => import('./pages/Overview'));
const DiscoverPage = lazy(() => import('./pages/Discover'));
const MyProjectsPage = lazy(() => import('./pages/ProjectView-Personal'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectView-Homepage'));
const CreateProjectPage = lazy(() => import('./pages/Create'));
const EscrowPage = lazy(() => import('./pages/EsCrow'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const PublicProfilePage = lazy(() => import('./pages/Profile-Public'));
const MessagesPage = lazy(() => import('./pages/Chat'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const HelpPage = lazy(() => import('./pages/Help'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    // The legacy Web3Provider stays mounted until the pages consuming it are
    // rebuilt. New code uses WalletProvider.
    <Web3Provider>
      <WalletProvider>
        <Analytics />
        <ErrorBoundary>
          <Suspense fallback={null}>
            <Routes>
              {/* --- Public marketing pages, outside the app shell. */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* --- The application. */}
              <Route element={<AppShell />}>
                <Route path="/overview" element={<OverviewPage />} />
                <Route path="/discover" element={<DiscoverPage />} />

                <Route path="/projects" element={<MyProjectsPage />} />
                <Route path="/projects/new" element={<CreateProjectPage />} />
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />

                <Route path="/escrow" element={<EscrowPage />} />
                <Route path="/escrow/:action" element={<EscrowPage />} />

                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:address" element={<PublicProfilePage />} />

                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<HelpPage />} />

                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* --- Redirects from the previous URL scheme.
                      The old routes duplicated several destinations
                      (/create + /create-project, /chat + /messages) and used
                      a literal ":action?" segment in one nav link. */}
              <Route path="/home" element={<Navigate to="/discover" replace />} />
              <Route path="/create" element={<Navigate to="/projects/new" replace />} />
              <Route
                path="/create-project"
                element={<Navigate to="/projects/new" replace />}
              />
              <Route path="/chat" element={<Navigate to="/messages" replace />} />
              <Route path="/contracts" element={<Navigate to="/escrow" replace />} />
              <Route path="/contracts/:action" element={<Navigate to="/escrow" replace />} />
              <Route path="/project/:projectId" element={<RedirectProject />} />

              {/* Removed: /saved and /milestone/:milestoneId were placeholder
                  pages reading "Coming soon" with no implementation behind
                  them. They now fall through to the 404 below. */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </WalletProvider>
    </Web3Provider>
  );
}

/** Preserves the project id when redirecting /project/:id -> /projects/:id. */
function RedirectProject() {
  const id = window.location.pathname.split('/').pop();
  return <Navigate to={`/projects/${id}`} replace />;
}

export default App;
