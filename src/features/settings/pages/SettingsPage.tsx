import {
  Alert,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { ModulePageLayout } from '../../../components/layout/ModulePageLayout'
import { useSettingsModules } from '../../modules/api'
import type { SidebarModule } from '../../modules/api'
import { useCurrentUser } from '../../users/api'

function getMaterialIcon(module: SidebarModule) {
  const iconName = module.iconName?.trim().toLowerCase()
  return iconName && iconName !== 'none' ? iconName : 'widgets'
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { data: currentUser, isLoading: isLoadingUser, error: userError } = useCurrentUser()
  const profileId = currentUser?.profiles?.[0]?.id
  const {
    data: modules = [],
    isLoading: isLoadingModules,
    error: modulesError,
  } = useSettingsModules(profileId)

  const isLoading = isLoadingUser || (Boolean(profileId) && isLoadingModules)
  const error = userError || modulesError

  return (
    <ModulePageLayout
      description="Administra las configuraciones generales."
      title="Configuración"
    >
      {isLoading && (
        <div className="grid min-h-52 place-items-center">
          <CircularProgress aria-label="Cargando configuraciones" />
        </div>
      )}
      {error && <Alert severity="error">No fue posible cargar las opciones de configuración.</Alert>}
      {!isLoading && !error && modules.length === 0 && (
        <Alert severity="info">No hay opciones de configuración disponibles para este perfil.</Alert>
      )}

      {!isLoading && !error && modules.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {modules.map((module) => (
            <Card
              elevation={0}
              key={module.id}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <CardActionArea
                onClick={() => navigate(module.route)}
                sx={{ height: '100%', minHeight: 220, p: 2 }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <MaterialSymbol
                    className="mb-4"
                    name={getMaterialIcon(module)}
                    size={72}
                    style={{ color: '#7567e8' }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 750 }}>{module.name}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {module.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </div>
      )}
    </ModulePageLayout>
  )
}
