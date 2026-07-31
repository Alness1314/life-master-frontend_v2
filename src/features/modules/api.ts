import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { API_ROUTES } from '../../config/apiRoutes'

export interface SidebarModule {
  id: string
  name: string
  route: string
  iconName: string
  level: string
  description: string
  erased: boolean
  isParent: boolean
}

function useModulesByLevel(profileId: string | undefined, level: 'sidebar' | 'menu' | 'settings') {
  return useQuery({
    queryKey: ['modules', profileId, level],
    queryFn: async () => {
      const { data } = await apiClient.get<SidebarModule[]>(API_ROUTES.modules.all, {
        params: { profile: profileId, level },
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
    enabled: Boolean(profileId),
  })
}

export function useSidebarModules(profileId?: string) {
  return useModulesByLevel(profileId, 'sidebar')
}

export function useMenuModules(profileId?: string) {
  return useModulesByLevel(profileId, 'menu')
}

export function useSettingsModules(profileId?: string) {
  return useModulesByLevel(profileId, 'settings')
}
