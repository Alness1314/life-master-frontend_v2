import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import type { ReactNode } from 'react'
import { MaterialSymbol } from '../icons/MaterialSymbol'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  onClose: () => void
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  pending?: boolean
  error?: string | null
  tone?: 'danger' | 'primary'
}

export function ConfirmDialog({
  open,
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  pending = false,
  error,
  tone = 'primary',
}: ConfirmDialogProps) {
  const isDanger = tone === 'danger'

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={pending ? undefined : onClose}
      open={open}
      slotProps={{ paper: { sx: { overflow: 'hidden' } } }}
    >
      <DialogTitle sx={{ pb: 1, pt: 3, textAlign: 'center' }}>
        <span
          className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full"
          style={{
            backgroundColor: isDanger ? 'rgba(211, 47, 47, .12)' : 'rgba(117, 103, 232, .14)',
            color: isDanger ? '#ef5350' : '#7567e8',
          }}
        >
          <MaterialSymbol name={isDanger ? 'warning' : 'help'} size={36} />
        </span>
        {title}
      </DialogTitle>
      <DialogContent sx={{ px: 3, textAlign: 'center' }}>
        <DialogContentText>{message}</DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', px: 3, pb: 3, pt: 2 }}>
        <Button disabled={pending} onClick={onClose} variant="outlined">
          {cancelLabel}
        </Button>
        <Button
          color={isDanger ? 'error' : 'primary'}
          disabled={pending}
          onClick={onConfirm}
          startIcon={pending ? <CircularProgress color="inherit" size={18} /> : undefined}
          variant="contained"
        >
          {pending ? 'Procesando…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
