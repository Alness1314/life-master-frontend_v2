import axios from 'axios'

const TOKEN_KEY = 'life_master_token'

const apiPrefix = `/${(import.meta.env.VITE_API_PREFIX ?? '/api/v1')
  .trim()
  .replace(/^\/+|\/+$/g, '')}`
const apiOrigin = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')
  : ''
const apiBaseUrl = `${apiOrigin}${apiPrefix}`

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
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

function readErrorText(value: unknown, depth = 0): string | undefined {
  if (typeof value === 'string') {
    const text = value.trim()
    return text || undefined
  }
  if (!value || typeof value !== 'object' || depth >= 2) return undefined

  const payload = value as Record<string, unknown>
  return readErrorText(payload.message, depth + 1)
    ?? readErrorText(payload.error, depth + 1)
}

function readErrorCode(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const payload = value as Record<string, unknown>
  if (typeof payload.code === 'string') return payload.code
  return readErrorCode(payload.error)
}

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return 'Ocurrió un error inesperado.'

  const responseData: unknown = error.response?.data
  const responseCode = readErrorCode(responseData)

  if (error.code === 'ERR_NETWORK'
      || (error.response?.status === 404 && responseCode === 'NOT_FOUND')) {
    return 'No fue posible conectar con el servidor.'
  }

  return readErrorText(responseData) ?? 'No fue posible completar la solicitud.'
}

export function getApiValidationErrors(error: unknown) {
  if (!axios.isAxiosError<Record<string, unknown>>(error) || !error.response?.data) return {}
  return Object.fromEntries(
    Object.entries(error.response.data)
      .filter(([key, value]) => key !== 'code' && typeof value === 'string')
      .map(([key, value]) => [key, String(value)]),
  )
}
