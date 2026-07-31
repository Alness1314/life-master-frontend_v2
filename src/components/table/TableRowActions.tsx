import { IconButton, Stack, Tooltip } from '@mui/material'
import { MaterialSymbol } from '../icons/MaterialSymbol'

interface TableRowActionsProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

const actionButtonStyles = {
  bgcolor: '#c9c5f7',
  borderRadius: '8px',
  color: '#393467',
  height: 36,
  width: 36,
  '&:hover': { bgcolor: '#d8d5fa' },
}

export function TableRowActions({ onView, onEdit, onDelete }: TableRowActionsProps) {
  const actions = [
    { label: 'Ver detalle', icon: 'visibility', handler: onView },
    { label: 'Editar', icon: 'edit', handler: onEdit },
    { label: 'Eliminar', icon: 'delete', handler: onDelete },
  ].filter((action) => Boolean(action.handler))

  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
      {actions.map((action) => (
        <Tooltip key={action.label} title={action.label}>
          <IconButton
            aria-label={action.label}
            onClick={action.handler}
            size="small"
            sx={actionButtonStyles}
          >
            <MaterialSymbol name={action.icon} size={20} />
          </IconButton>
        </Tooltip>
      ))}
    </Stack>
  )
}
