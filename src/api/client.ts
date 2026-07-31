import axios from 'axios'

const TOKEN_KEY = 'life_master_token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      tokenStorage.clear()
      window.dispatchEvent(new Event('life-master:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    return error.response?.data?.message
      ?? error.response?.data?.error
      ?? (error.code === 'ERR_NETWORK'
        ? 'No fue posible conectar con el servidor.'
        : 'No fue posible completar la solicitud.')
  }
  return 'Ocurrió un error inesperado.'
}

export function getApiValidationErrors(error: unknown) {
  if (!axios.isAxiosError<Record<string, unknown>>(error) || !error.response?.data) return {}
  return Object.fromEntries(
    Object.entries(error.response.data)
      .filter(([key, value]) => key !== 'code' && typeof value === 'string')
      .map(([key, value]) => [key, String(value)]),
  )
}
