import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { API_ROUTES } from '../../config/apiRoutes'

export interface Profile {
  id: string
  name: string
  erased: boolean
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data } = await apiClient.get<Profile[]>(API_ROUTES.profiles.root)
      return data
        .filter((profile) => !profile.erased)
        .sort((left, right) => left.name.localeCompare(right.name))
    },
  })
}
