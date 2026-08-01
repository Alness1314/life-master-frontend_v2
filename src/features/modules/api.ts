import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { API_ROUTES } from '../../config/apiRoutes'
import { useAuth } from '../../auth/useAuth'

export interface SidebarModule {
  id: string
  name: string
  route: string
  iconName: string
  level: string
  description: string
  erased: boolean
  isParent: boolean
  permissionKey?: string | null
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

export type ModuleAction = 'create' | 'read' | 'update' | 'delete'

function normalizePermissionKey(value?: string | null) {
  return value?.trim().replace(/^\/+|\/+$/g, '').toLowerCase() ?? ''
}

function useCurrentUserModules() {
  return useQuery({
    queryKey: ['current-user-modules', 'all'],
    queryFn: async () => (
      await apiClient.get<SidebarModule[]>(API_ROUTES.profile.modules)
    ).data,
  })
}

export function useModulePermission(permissionKey: string) {
  const { user } = useAuth()
  const query = useCurrentUserModules()
  const normalizedKey = normalizePermissionKey(permissionKey)
  const module = query.data?.find((item) => (
    normalizePermissionKey(item.permissionKey || item.route) === normalizedKey
  ))
  const administrator = Boolean(user?.isAdmin)

  return {
    canCreate: administrator || Boolean(module?.canCreate),
    canRead: administrator || Boolean(module?.canRead),
    canUpdate: administrator || Boolean(module?.canUpdate),
    canDelete: administrator || Boolean(module?.canDelete),
    isLoading: query.isLoading,
  }
}

function useModulesByLevel(level: 'sidebar' | 'menu' | 'settings') {
  return useQuery({
    queryKey: ['current-user-modules', level],
    queryFn: async () => {
      const { data } = await apiClient.get<SidebarModule[]>(API_ROUTES.profile.modules, {
        params: { level },
      })
      return data
        .filter((module) => !module.erased)
        .filter((module) => {
          const route = module.route.trim().toLowerCase()
          const name = module.name.trim().toLowerCase()
          return route !== '/budgets'
            && route !== 'budgets'
            && !['presupuesto', 'presupuestos', 'budget', 'budgets'].includes(name)
        })
        .sort((left, right) => left.name.localeCompare(right.name))
    },
  })
}

export function useSidebarModules() {
  return useModulesByLevel('sidebar')
}

export function useMenuModules() {
  return useModulesByLevel('menu')
}

export function useSettingsModules() {
  return useModulesByLevel('settings')
}
