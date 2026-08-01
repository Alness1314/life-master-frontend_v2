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
