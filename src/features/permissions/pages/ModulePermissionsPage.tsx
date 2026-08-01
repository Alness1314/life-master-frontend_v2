import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient, getApiErrorMessage } from '../../../api/client'
import { useFeedback } from '../../../components/feedback/useFeedback'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { ModulePageLayout } from '../../../components/layout/ModulePageLayout'
import { API_ROUTES } from '../../../config/apiRoutes'
import { useModulePermission } from '../../modules/api'
import {
  updatePermission,
  useModulePermissions,
} from '../api'
import type { ModulePermission, PermissionUpdateRequest } from '../api'

type PermissionFlag = keyof PermissionUpdateRequest

const permissionOptions: Array<{ flag: PermissionFlag; label: string }> = [
  { flag: 'canCreate', label: 'Crear' },
  { flag: 'canRead', label: 'Consultar' },
  { flag: 'canUpdate', label: 'Actualizar' },
  { flag: 'canDelete', label: 'Eliminar' },
]

interface ModuleSummary {
  id: string
  name: string
  route: string
  permissionKey: string | null
}

function toPermissionRequest(permission: ModulePermission): PermissionUpdateRequest {
  return {
    canCreate: permission.canCreate,
    canRead: permission.canRead,
    canUpdate: permission.canUpdate,
    canDelete: permission.canDelete,
  }
}

export function ModulePermissionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { moduleId } = useParams()
  const { showSuccess } = useFeedback()
  const access = useModulePermission('app-modules')
  const moduleQuery = useQuery({
    queryKey: ['app-modules', moduleId],
    queryFn: async () => (
      await apiClient.get<ModuleSummary>(API_ROUTES.modules.byId(moduleId!))
    ).data,
    enabled: Boolean(moduleId && access.canRead),
  })
  const permissionsQuery = useModulePermissions(access.canRead ? moduleId : undefined)
  const permissions = (permissionsQuery.data ?? [])
    .filter((permission) => permission.profileName.toLowerCase() !== 'administrator')
  const [draft, setDraft] = useState<Record<string, ModulePermission>>({})

  const changedPermissions = useMemo(() => Object.values(draft).filter((permission) => {
    const previous = permissions.find((item) => item.profileId === permission.profileId)
    return previous && permissionOptions.some(({ flag }) => previous[flag] !== permission[flag])
  }), [draft, permissions])

  const saveMutation = useMutation({
    mutationFn: () => Promise.all(changedPermissions.map((permission) => (
      updatePermission(permission.profileId, permission.moduleId, toPermissionRequest(permission))
    ))),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['permissions', 'module', moduleId] }),
        queryClient.invalidateQueries({ queryKey: ['current-user-modules'] }),
      ])
      setDraft({})
      showSuccess('Permisos actualizados correctamente.')
    },
  })

  const togglePermission = (permission: ModulePermission, flag: PermissionFlag) => {
    const currentPermission = draft[permission.profileId] ?? permission
    setDraft((current) => ({
      ...current,
      [permission.profileId]: {
        ...currentPermission,
        [flag]: !currentPermission[flag],
      },
    }))
  }

  const loading = access.isLoading || moduleQuery.isLoading || permissionsQuery.isLoading
  const error = moduleQuery.error ?? permissionsQuery.error ?? saveMutation.error

  return (
    <ModulePageLayout
      actions={(
        <Button
          onClick={() => navigate('/app-modules')}
          startIcon={<MaterialSymbol name="arrow_back" size={20} />}
          variant="outlined"
        >
          Volver a módulos
        </Button>
      )}
      ancestors={[
        { label: 'Configuración', to: '/settings' },
        { label: 'Módulos', to: '/app-modules' },
      ]}
      description="Configura las operaciones disponibles para cada perfil asignado."
      title={moduleQuery.data ? `Permisos de ${moduleQuery.data.name}` : 'Permisos del módulo'}
    >
      {!access.isLoading && !access.canRead && (
        <Alert severity="error">No tienes permiso para consultar la configuración de módulos.</Alert>
      )}

      {access.canRead && (
        <>
          <Paper
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', mb: 3, p: { xs: 2, sm: 3 } }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg"
                  style={{ backgroundColor: 'rgba(117, 103, 232, .14)', color: '#7567e8' }}
                >
                  <MaterialSymbol name="shield" size={25} />
                </div>
                <div>
                  <Typography sx={{ fontWeight: 750 }} variant="h6">
                    {moduleQuery.data?.name ?? 'Módulo'}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {moduleQuery.data?.route ?? 'Cargando información...'}
                  </Typography>
                </div>
              </div>
              {access.canUpdate && (
                <Button
                  disabled={changedPermissions.length === 0 || saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  startIcon={saveMutation.isPending
                    ? <CircularProgress color="inherit" size={18} />
                    : <MaterialSymbol name="save" size={20} />}
                  variant="contained"
                >
                  Guardar cambios
                </Button>
              )}
            </div>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getApiErrorMessage(error)}
            </Alert>
          )}

          {loading && (
            <div className="grid min-h-52 place-items-center">
              <CircularProgress aria-label="Cargando permisos" />
            </div>
          )}

          {!loading && !error && permissions.length === 0 && (
            <Alert severity="info">
              Este módulo no tiene perfiles configurables asignados.
            </Alert>
          )}

          {!loading && !error && permissions.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {permissions.map((permission) => {
                const current = draft[permission.profileId] ?? permission
                return (
                  <Paper
                    elevation={0}
                    key={permission.profileId}
                    sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
                  >
                    <div className="flex items-center gap-3 p-4 sm:p-5">
                      <MaterialSymbol name="person_shield" size={28} style={{ color: '#7567e8' }} />
                      <div>
                        <Typography sx={{ fontWeight: 750 }} variant="h6">
                          {permission.profileName}
                        </Typography>
                        <Typography color="text.secondary" variant="caption">
                          Acciones permitidas
                        </Typography>
                      </div>
                    </div>
                    <Divider />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4 sm:p-5">
                      {permissionOptions.map(({ flag, label }) => (
                        <FormControlLabel
                          control={(
                            <Checkbox
                              checked={current[flag]}
                              disabled={!access.canUpdate || saveMutation.isPending}
                              onChange={() => togglePermission(permission, flag)}
                            />
                          )}
                          key={flag}
                          label={label}
                          sx={{ m: 0 }}
                        />
                      ))}
                    </div>
                  </Paper>
                )
              })}
            </div>
          )}
        </>
      )}
    </ModulePageLayout>
  )
}
