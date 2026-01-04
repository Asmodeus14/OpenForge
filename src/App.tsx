import { Routes, Route } from "react-router-dom"
import { Web3Provider } from "./hooks/web3"
import HomeLand from "./pages/Home"
import Login from "./pages/Login"
import Profile from "./pages/Profile"
import CreateProject from "./pages/Create"
import ProjectView_Personal from "./pages/ProjectView-Personal"
import ModernChatPage from "./pages/Chat"
import ProfileAddressPage from "./pages/Profile-Public"

import React from "react"
import Land from "./pages/Land"
import MilestonesPage from "./pages/EsCrow"
import ProjectView from "./pages/ProjectView-Homepage"
import ProfilePublicMilestone from "./pages/Profile-Public-Milestone"
import AboutPage from "./Land-Page-Info/About"
import ContactPage from "./Land-Page-Info/Contact"
import Settings from "./pages/Settings"
import Save from "./pages/Save"
import Help from "./pages/Help"
// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-300 mb-6">
              The chat component encountered an error. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <Web3Provider>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Land />} />
          <Route path="/home" element={<HomeLand />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create" element={<CreateProject />} />
          <Route path="/projects" element={<ProjectView_Personal />} />
          <Route path="/chat" element={<ModernChatPage />} />
          <Route path="/messages" element={<ModernChatPage />} />
          {/* Updated routes for contracts */}
          <Route path="/contracts/:action?" element={<MilestonesPage />} />
          <Route path="/contracts/" element={<MilestonesPage />} />
          <Route path="/project/:projectId" element={<ProjectView />} />
          <Route path="/profile/:address" element={<ProfileAddressPage />} />
          <Route path="/milestone/:milestoneId" element={<ProfilePublicMilestone />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/saved" element={<Save />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </ErrorBoundary>
    </Web3Provider>
  )
}

export default App