import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material'
import type { MouseEvent } from 'react'
import { apiClient } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { MaterialSymbol } from '../../components/icons/MaterialSymbol'
import { API_ROUTES } from '../../config/apiRoutes'
import { useModulePermission } from '../modules/api'

interface FinancialAlert {
  id: string
  severity: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    .format(new Date(value))
}

function severityColor(severity: string): 'error' | 'warning' | 'info' {
  if (severity === 'HIGH' || severity === 'CRITICAL') return 'error'
  if (severity === 'MEDIUM') return 'warning'
  return 'info'
}

export function NotificationCenter() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const access = useModulePermission('alerts')
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [onlyUnread, setOnlyUnread] = useState(false)
  const queryKey = ['financial-alerts', user?.id]
  const alertsQuery = useQuery({
    queryKey,
    queryFn: async () => (await apiClient.get<FinancialAlert[]>(API_ROUTES.alerts.root(user!.id))).data,
    enabled: Boolean(user?.id && access.canRead),
    refetchInterval: 60_000,
  })
  const readMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(API_ROUTES.alerts.markRead(user!.id, id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
  const readAllMutation = useMutation({
    mutationFn: () => apiClient.patch(API_ROUTES.alerts.markAllRead(user!.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
  const unread = alertsQuery.data?.filter((alert) => !alert.read).length ?? 0
  const visible = useMemo(() => (alertsQuery.data ?? [])
    .filter((alert) => !onlyUnread || !alert.read)
    .slice(0, 10), [alertsQuery.data, onlyUnread])

  if (!access.canRead) return null

  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchor(event.currentTarget)
    void alertsQuery.refetch()
  }
  const close = () => setAnchor(null)
  const openHistory = () => {
    close()
    navigate('/alerts')
  }

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton aria-label={`${unread} notificaciones sin leer`} onClick={open} sx={{ mr: 0.5 }}>
          <Badge badgeContent={unread} color="error" max={99}>
            <MaterialSymbol name="notifications" />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        anchorEl={anchor}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        onClose={close}
        open={Boolean(anchor)}
        slotProps={{
          paper: {
            sx: {
              border: '1px solid',
              borderColor: 'divider',
              mt: 1,
              width: { xs: 'calc(100vw - 24px)', sm: 420 },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 750 }} variant="h6">Notificaciones</Typography>
          <Box sx={{ flex: 1 }} />
          {unread > 0 && (
            <Button
              disabled={readAllMutation.isPending}
              onClick={() => readAllMutation.mutate()}
              size="small"
            >
              Marcar todas como leídas
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, px: 2, pb: 1.5 }}>
          <Chip color={!onlyUnread ? 'primary' : 'default'} label="Todas" onClick={() => setOnlyUnread(false)} size="small" />
          <Chip color={onlyUnread ? 'primary' : 'default'} label="No leídas" onClick={() => setOnlyUnread(true)} size="small" />
        </Box>
        <Divider />
        {alertsQuery.isLoading && (
          <Box sx={{ display: 'grid', minHeight: 180, placeItems: 'center' }}><CircularProgress size={28} /></Box>
        )}
        {alertsQuery.error && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <MaterialSymbol name="cloud_off" size={30} />
            <Typography color="text.secondary" sx={{ mt: 1 }}>No fue posible cargar las notificaciones.</Typography>
          </Box>
        )}
        {!alertsQuery.isLoading && !alertsQuery.error && (
          <List disablePadding sx={{ maxHeight: 'min(560px, 62vh)', overflowY: 'auto' }}>
            {visible.map((alert) => (
              <ListItemButton
                key={alert.id}
                onClick={() => { if (!alert.read) readMutation.mutate(alert.id) }}
                sx={{
                  alignItems: 'flex-start',
                  bgcolor: alert.read ? 'transparent' : 'action.hover',
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                }}
              >
                <Box
                  sx={{
                    bgcolor: `${severityColor(alert.severity)}.main`,
                    borderRadius: '50%',
                    color: `${severityColor(alert.severity)}.contrastText`,
                    display: 'grid',
                    flexShrink: 0,
                    height: 42,
                    placeItems: 'center',
                    width: 42,
                  }}
                >
                  <MaterialSymbol name={alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? 'warning' : 'notifications'} size={22} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                    <Typography noWrap sx={{ fontWeight: alert.read ? 600 : 750 }} variant="body2">{alert.title}</Typography>
                    {!alert.read && <Box aria-label="Sin leer" sx={{ bgcolor: 'primary.main', borderRadius: '50%', flexShrink: 0, height: 8, width: 8 }} />}
                  </Box>
                  <Typography
                    color="text.secondary"
                    sx={{ display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}
                    variant="body2"
                  >
                    {alert.message}
                  </Typography>
                  <Typography color={alert.read ? 'text.secondary' : 'primary.main'} variant="caption">
                    {dateTime(alert.createdAt)}
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
            {visible.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <MaterialSymbol name="notifications_none" size={38} />
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {onlyUnread ? 'No tienes notificaciones sin leer.' : 'No tienes notificaciones.'}
                </Typography>
              </Box>
            )}
          </List>
        )}
        <Divider />
        <Button fullWidth onClick={openHistory} sx={{ borderRadius: 0, py: 1.25 }}>
          Ver todas las notificaciones
        </Button>
      </Popover>
    </>
  )
}
