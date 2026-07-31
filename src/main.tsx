import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { ColorModeProvider } from './theme/ColorModeProvider'
import { FeedbackProvider } from './components/feedback/FeedbackProvider'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ColorModeProvider>
        <FeedbackProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </FeedbackProvider>
      </ColorModeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
