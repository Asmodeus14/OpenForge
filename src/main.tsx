import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Chain reads are idempotent and cheap to cache. Refetching on every
      // window focus produces visible flicker and needless RPC load.
      refetchOnWindowFocus: false,
      // One retry: enough to ride out a flaky gateway, not so many that a
      // genuine failure takes ten seconds to surface as an error state.
      retry: 1,
      retryDelay: 800,
    },
  },
})

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
