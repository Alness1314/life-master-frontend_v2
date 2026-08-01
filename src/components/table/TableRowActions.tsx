import { Box, IconButton, Stack, Tooltip } from '@mui/material'
import { MaterialSymbol } from '../icons/MaterialSymbol'

interface TableRowActionsProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onConfigurePermissions?: () => void
}

const actionButtonStyles = {
  bgcolor: '#c9c5f7',
  borderRadius: '8px',
  color: '#393467',
  height: 36,
  width: 36,
  '&:hover': { bgcolor: '#d8d5fa' },
}

function PermissionSettingsIcon() {
  return (
    <Box sx={{ height: 22, position: 'relative', width: 24 }}>
      <MaterialSymbol name="shield" size={21} />
      <MaterialSymbol
        name="settings"
        size={12}
        style={{ bottom: -1, position: 'absolute', right: -1 }}
      />
    </Box>
  )
}

export function TableRowActions({
  onView,
  onEdit,
  onDelete,
  onConfigurePermissions,
}: TableRowActionsProps) {
  const actions = [
    { label: 'Ver detalle', icon: <MaterialSymbol name="visibility" size={20} />, handler: onView },
    { label: 'Editar', icon: <MaterialSymbol name="edit" size={20} />, handler: onEdit },
    {
      label: 'Configurar permisos',
      icon: <PermissionSettingsIcon />,
      handler: onConfigurePermissions,
    },
    { label: 'Eliminar', icon: <MaterialSymbol name="delete" size={20} />, handler: onDelete },
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
            {action.icon}
          </IconButton>
        </Tooltip>
      ))}
    </Stack>
  )
}
