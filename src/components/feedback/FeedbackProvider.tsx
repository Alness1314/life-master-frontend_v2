import { useMemo, useState } from 'react'
import type { PropsWithChildren, SyntheticEvent } from 'react'
import { Alert, Snackbar } from '@mui/material'
import type { AlertColor, SnackbarCloseReason } from '@mui/material'
import { FeedbackContext } from './feedbackContext'

interface FeedbackState {
  message: string
  severity: AlertColor
}

const durationBySeverity: Record<AlertColor, number> = {
  success: 5000,
  info: 5000,
  warning: 10000,
  error: 15000,
}

const backgroundBySeverity: Record<AlertColor, string> = {
  success: '#43a047',
  info: '#43a047',
  warning: '#ed8f02',
  error: '#e53935',
}

export function FeedbackProvider({ children }: PropsWithChildren) {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const value = useMemo(() => ({
    showError: (message: string) => setFeedback({ message, severity: 'error' }),
    showInfo: (message: string) => setFeedback({ message, severity: 'info' }),
    showSuccess: (message: string) => setFeedback({ message, severity: 'success' }),
    showWarning: (message: string) => setFeedback({ message, severity: 'warning' }),
  }), [])

  const closeFeedback = (_event?: Event | SyntheticEvent, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') return
    setFeedback(null)
  }

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        autoHideDuration={feedback ? durationBySeverity[feedback.severity] : 5000}
        key={`${feedback?.severity}-${feedback?.message}`}
        onClose={closeFeedback}
        open={Boolean(feedback)}
      >
        <Alert
          onClose={() => setFeedback(null)}
          severity={feedback?.severity ?? 'success'}
          sx={{
            alignItems: 'center',
            bgcolor: feedback ? backgroundBySeverity[feedback.severity] : '#43a047',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.45,
            minHeight: 76,
            minWidth: { xs: 300, sm: 390 },
            px: 2,
            py: 1.4,
            '& .MuiAlert-icon': {
              alignItems: 'center',
              color: '#ffffff',
              fontSize: 28,
            },
            '& .MuiAlert-action': {
              alignItems: 'center',
              color: '#ffffff',
              pl: 2,
            },
          }}
          variant="filled"
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </FeedbackContext.Provider>
  )
}
