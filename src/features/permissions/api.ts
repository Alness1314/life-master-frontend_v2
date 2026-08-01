import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { API_ROUTES } from '../../config/apiRoutes'

export interface ModulePermission {
  profileId: string
  profileName: string
  moduleId: string
  moduleName: string
  moduleRoute: string
  permissionKey: string | null
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

export interface PermissionUpdateRequest {
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

export function useProfilePermissions(profileId?: string) {
  return useQuery({
    queryKey: ['permissions', profileId],
    queryFn: async () => (
      await apiClient.get<ModulePermission[]>(API_ROUTES.permissions.root, {
        params: { profileId },
      })
    ).data,
    enabled: Boolean(profileId),
  })
}

export async function updatePermission(
  profileId: string,
  moduleId: string,
  request: PermissionUpdateRequest,
) {
  const { data } = await apiClient.put<ModulePermission>(
    API_ROUTES.permissions.byProfileAndModule(profileId, moduleId),
    request,
  )
  return data
}
