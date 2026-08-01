import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { useFeedback } from '../../../components/feedback/useFeedback'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { ModulePageLayout } from '../../../components/layout/ModulePageLayout'
import { DynamicDataTable } from '../../../components/table/DynamicDataTable'
import type { DataTableColumn } from '../../../components/table/DynamicDataTable'
import { useModulePermission } from '../../modules/api'
import { useProfiles } from '../../profiles/api'
import {
  updatePermission,
  useProfilePermissions,
} from '../api'
import type { ModulePermission, PermissionUpdateRequest } from '../api'

type PermissionFlag = keyof PermissionUpdateRequest

const permissionOptions: Array<{ flag: PermissionFlag; label: string }> = [
  { flag: 'canCreate', label: 'Crear' },
  { flag: 'canRead', label: 'Consultar' },
  { flag: 'canUpdate', label: 'Actualizar' },
  { flag: 'canDelete', label: 'Eliminar' },
]

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
  const { showSuccess } = useFeedback()
  const access = useModulePermission('app-modules')
  const profilesQuery = useProfiles()
  const [profileId, setProfileId] = useState('')
  const permissionsQuery = useProfilePermissions(profileId)
  const [draft, setDraft] = useState<Record<string, ModulePermission>>({})

  useEffect(() => {
    if (!profileId && profilesQuery.data?.length) {
      setProfileId(profilesQuery.data[0].id)
    }
  }, [profileId, profilesQuery.data])

  useEffect(() => {
    setDraft(Object.fromEntries(
      (permissionsQuery.data ?? []).map((permission) => [permission.moduleId, permission]),
    ))
  }, [permissionsQuery.data])

  const changedPermissions = useMemo(() => {
    const original = new Map(
      (permissionsQuery.data ?? []).map((permission) => [permission.moduleId, permission]),
    )
    return Object.values(draft).filter((permission) => {
      const previous = original.get(permission.moduleId)
      return previous && permissionOptions.some(({ flag }) => previous[flag] !== permission[flag])
    })
  }, [draft, permissionsQuery.data])

  const saveMutation = useMutation({
    mutationFn: () => Promise.all(changedPermissions.map((permission) => (
      updatePermission(permission.profileId, permission.moduleId, toPermissionRequest(permission))
    ))),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['permissions', profileId] }),
        queryClient.invalidateQueries({ queryKey: ['current-user-modules'] }),
      ])
      showSuccess('Permisos actualizados correctamente.')
    },
  })

  const togglePermission = (moduleId: string, flag: PermissionFlag) => {
    setDraft((current) => ({
      ...current,
      [moduleId]: { ...current[moduleId], [flag]: !current[moduleId][flag] },
    }))
  }

  const columns = useMemo<DataTableColumn<ModulePermission>[]>(() => [
    {
      id: 'module',
      header: 'Módulo',
      minWidth: 220,
      render: (permission) => (
        <div>
          <Typography sx={{ fontWeight: 700 }}>{permission.moduleName}</Typography>
          <Typography color="text.secondary" variant="caption">
            {permission.moduleRoute}
          </Typography>
        </div>
      ),
      sortValue: (permission) => permission.moduleName,
    },
    ...permissionOptions.map(({ flag, label }) => ({
      id: flag,
      header: label,
      align: 'center' as const,
      minWidth: 120,
      render: (permission: ModulePermission) => (
        <FormControlLabel
          control={(
            <Switch
              checked={draft[permission.moduleId]?.[flag] ?? permission[flag]}
              disabled={!access.canUpdate || saveMutation.isPending}
              onChange={() => togglePermission(permission.moduleId, flag)}
            />
          )}
          label={draft[permission.moduleId]?.[flag] ?? permission[flag] ? 'Sí' : 'No'}
          labelPlacement="end"
          sx={{ m: 0 }}
        />
      ),
      sortValue: (permission: ModulePermission) => permission[flag],
    })),
  ], [access.canUpdate, draft, saveMutation.isPending])

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
      description="Define qué operaciones puede realizar cada perfil en los módulos asignados."
      title="Permisos por módulo"
    >
      {!access.isLoading && !access.canRead && (
        <Alert severity="error">No tienes permiso para consultar la configuración de módulos.</Alert>
      )}

      {access.canRead && (
        <>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 3, p: 3 }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TextField
                disabled={profilesQuery.isLoading || saveMutation.isPending}
                label="Perfil"
                onChange={(event) => setProfileId(event.target.value)}
                select
                sx={{ minWidth: { sm: 280 } }}
                value={profileId}
              >
                {(profilesQuery.data ?? []).map((profile) => (
                  <MenuItem key={profile.id} value={profile.id}>{profile.name}</MenuItem>
                ))}
              </TextField>
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

          {(profilesQuery.error || permissionsQuery.error || saveMutation.error) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getApiErrorMessage(saveMutation.error ?? permissionsQuery.error ?? profilesQuery.error)}
            </Alert>
          )}

          <DynamicDataTable
            columns={columns}
            data={Object.values(draft)}
            emptyMessage={profileId
              ? 'Este perfil no tiene módulos asignados.'
              : 'Selecciona un perfil para consultar sus permisos.'}
            getRowId={(permission) => permission.moduleId}
            loading={profilesQuery.isLoading || permissionsQuery.isLoading}
          />
        </>
      )}
    </ModulePageLayout>
  )
}
