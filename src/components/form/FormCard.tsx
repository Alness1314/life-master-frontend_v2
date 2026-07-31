import type { FormEventHandler, PropsWithChildren } from 'react'
import { Paper } from '@mui/material'

interface FormCardProps extends PropsWithChildren {
  onSubmit: FormEventHandler<HTMLFormElement>
}

export function FormCard({ children, onSubmit }: FormCardProps) {
  return (
    <Paper
      component="form"
      elevation={0}
      noValidate
      onSubmit={onSubmit}
      sx={{ border: '1px solid', borderColor: 'divider', p: { xs: 2, sm: 3 } }}
    >
      {children}
    </Paper>
  )
}
