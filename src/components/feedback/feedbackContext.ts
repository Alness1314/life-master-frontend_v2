import { createContext } from 'react'

export interface FeedbackContextValue {
  showError: (message: string) => void
  showInfo: (message: string) => void
  showSuccess: (message: string) => void
  showWarning: (message: string) => void
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null)
