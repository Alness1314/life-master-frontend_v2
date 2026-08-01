import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Typography,
} from '@mui/material'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { FormPageLayout } from '../../../components/form/FormPageLayout'
import { TEXTS } from '../../../config/texts'
import { useUser } from '../api'
import { UserAvatar } from '../components/UserAvatar'
import { apiClient } from '../../../api/client'
import { API_ROUTES } from '../../../config/apiRoutes'
import { blobToDataUrl } from '../profileImage'
import { useModulePermission } from '../../modules/api'

const dateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'long',
  timeStyle: 'short',
})

function formatDateTime(value?: string) {
  if (!value) return 'Sin información'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Sin información' : dateTimeFormatter.format(date)
}

function DetailItem({
  icon,
  label,
  children,
}: {
  icon: string
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 gap-3">
      <MaterialSymbol
        className="mt-0.5 shrink-0"
        name={icon}
        size={22}
        style={{ color: '#7567e8' }}
      />
      <div className="min-w-0">
        <Typography color="text.secondary" variant="body2">{label}</Typography>
        <div className="mt-1 break-words">{children}</div>
      </div>
    </div>
  )
}

export function UserDetailsPage() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const { data: user, isLoading, error } = useUser(userId)
  const access = useModulePermission('users')
  const imageQuery = useQuery({
    queryKey: ['user-image', userId, user?.imageId],
    queryFn: async () => blobToDataUrl((
      await apiClient.get<Blob>(
        API_ROUTES.files.content(userId!, user!.imageId!),
        { responseType: 'blob' },
      )
    ).data),
    enabled: Boolean(userId && user?.imageId),
  })

  return (
    <FormPageLayout
      actions={(
        <Button
          onClick={() => navigate('/users')}
          startIcon={<MaterialSymbol name="arrow_back" size={20} />}
          variant="outlined"
        >
          Volver
        </Button>
      )}
      description="Consulta la información y el estado actual del usuario."
      parent={{ label: TEXTS.users.title, to: '/users' }}
      title="Detalle del usuario"
    >
      {isLoading && (
        <div className="grid min-h-64 place-items-center">
          <CircularProgress aria-label="Cargando usuario" />
        </div>
      )}

      {error && (
        <Alert severity="error">
          No fue posible cargar la información del usuario.
        </Alert>
      )}

      {!isLoading && !error && !user && (
        <Alert severity="warning">No se encontró el usuario solicitado.</Alert>
      )}

      {user && (
        <Paper
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
        >
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
            <UserAvatar fullName={user.fullName} imageUrl={imageQuery.data} size={112} />
            <div className="min-w-0 flex-1">
              <Typography component="h2" variant="h5">{user.fullName}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {user.username}
              </Typography>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip
                  color={user.erased ? 'default' : 'success'}
                  label={user.erased ? 'Inactivo' : 'Activo'}
                  size="small"
                />
                <Chip
                  color={user.verified ? 'success' : 'default'}
                  label={user.verified ? 'Correo verificado' : 'Correo no verificado'}
                  size="small"
                  variant="outlined"
                />
              </div>
            </div>
            {access.canUpdate && <Button
              aria-label={`Editar usuario ${user.fullName}`}
              onClick={() => navigate(`/users/update/${user.id}`)}
              startIcon={<MaterialSymbol name="edit" size={20} />}
              sx={{ minWidth: 138 }}
              variant="contained"
            >
              Editar usuario
            </Button>}
          </div>

          <Divider />

          <div className="grid gap-x-8 gap-y-7 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-3">
            <DetailItem icon="badge" label="Nombre completo">
              <Typography>{user.fullName}</Typography>
            </DetailItem>
            <DetailItem icon="mail" label="Correo electrónico">
              <Typography>{user.username}</Typography>
            </DetailItem>
            <DetailItem icon="admin_panel_settings" label="Perfiles">
              <div className="flex flex-wrap gap-1.5">
                {user.profiles.map((profile) => (
                  <Chip key={profile.id} label={profile.name} size="small" variant="outlined" />
                ))}
              </div>
            </DetailItem>
            <DetailItem icon="calendar_add_on" label="Fecha de creación">
              <Typography>{formatDateTime(user.created)}</Typography>
            </DetailItem>
            <DetailItem icon="update" label="Última actualización">
              <Typography>{formatDateTime(user.updated)}</Typography>
            </DetailItem>
            <DetailItem icon="image" label="Imagen de perfil">
              <Typography color="text.secondary">
                {user.imageId ? 'Imagen asociada' : 'Sin imagen'}
              </Typography>
            </DetailItem>
          </div>
        </Paper>
      )}
    </FormPageLayout>
  )
}
