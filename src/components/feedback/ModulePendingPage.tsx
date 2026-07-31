import { Card, CardContent, Typography } from '@mui/material'
import { MaterialSymbol } from '../icons/MaterialSymbol'

interface ModulePendingPageProps {
  title: string
}

export function ModulePendingPage({ title }: ModulePendingPageProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 4, textAlign: 'center' }}>
        <MaterialSymbol
          className="mb-2"
          name="construction"
          size={48}
          style={{ color: '#7567e8' }}
        />
        <Typography variant="h5">{title}</Typography>
        <Typography color="text.secondary" className="mt-2">
          Este módulo está preparado en la navegación y se migrará en una siguiente etapa.
        </Typography>
      </CardContent>
    </Card>
  )
}
