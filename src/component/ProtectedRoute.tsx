import { Navigate } from "react-router-dom"
import { useWeb3 } from "../hooks/web3"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { account, isConnecting } = useWeb3()

  // Show loading state while connecting
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Connecting wallet...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not connected
  if (!account) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}