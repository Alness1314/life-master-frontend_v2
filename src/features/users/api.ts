import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { API_ROUTES } from '../../config/apiRoutes'

export interface UserProfile {
  id: string
  name: string
}

export interface CurrentUser {
  id: string
  username: string
  fullName: string
  imageId: string | null
  profiles: UserProfile[]
  verified: boolean
  erased: boolean
  created: string
  updated: string
}

export interface CreateUserRequest {
  username: string
  password: string
  fullName: string
  profiles: string[]
  imageId?: string | null
}

export type UpdateUserRequest = CreateUserRequest

export async function createUser(request: CreateUserRequest) {
  const { data } = await apiClient.post<CurrentUser>(API_ROUTES.users.root, request)
  return data
}

export async function deleteUser(userId: string) {
  const { data } = await apiClient.delete(API_ROUTES.users.byId(userId))
  return data
}

export async function updateUser(userId: string, request: UpdateUserRequest) {
  const { data } = await apiClient.put<CurrentUser>(API_ROUTES.users.byId(userId), request)
  return data
}

export function useCurrentUser() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['current-user', user?.id],
    queryFn: async () => {
      const { data } = await apiClient.get<CurrentUser>(API_ROUTES.users.byId(user!.id))
      return data
    },
    enabled: Boolean(user?.id),
  })
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await apiClient.get<CurrentUser[]>(API_ROUTES.users.root)
      return data
    },
  })
}

export function useUser(userId?: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const { data } = await apiClient.get<CurrentUser>(API_ROUTES.users.byId(userId!))
      return data
    },
    enabled: Boolean(userId),
  })
}
