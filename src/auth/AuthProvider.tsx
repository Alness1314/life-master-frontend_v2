import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { apiClient, tokenStorage } from '../api/client'
import { AuthContext } from './authContext'
import type { AuthContextValue, AuthUser, JwtPayload, LoginResponse } from './types'
import { API_ROUTES } from '../config/apiRoutes'

const INACTIVITY_LIMIT_MS = 20 * 60 * 1000
const INACTIVITY_CHECK_INTERVAL_MS = 30 * 1000

function readUserFromToken(token: string): AuthUser | null {
  try {
    const payload = jwtDecode<JwtPayload>(token)
    if (!payload.id || !payload.sub || payload.exp * 1000 <= Date.now()) return null
    return { id: payload.id, username: payload.sub, isAdmin: Boolean(payload.admin) }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const lastActivityAt = useRef(0)

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const logout = useCallback(async () => {
    const token = tokenStorage.get()
    try {
      if (token) {
        await apiClient.post(API_ROUTES.auth.logout, undefined, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 3000,
        })
      }
    } catch {
      // El cierre local no debe quedar bloqueado si el servidor no está disponible.
    } finally {
      clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    window.addEventListener('life-master:unauthorized', clearSession)
    return () => window.removeEventListener('life-master:unauthorized', clearSession)
  }, [clearSession])

  useEffect(() => {
    if (!user) return

    lastActivityAt.current = Date.now()

    const registerActivity = () => {
      lastActivityAt.current = Date.now()
    }

    const checkInactivity = () => {
      if (Date.now() - lastActivityAt.current >= INACTIVITY_LIMIT_MS) void logout()
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      'keydown',
      'mousedown',
      'mousemove',
      'pointerdown',
      'scroll',
      'touchstart',
    ]

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, registerActivity, { passive: true })
    })
    document.addEventListener('visibilitychange', checkInactivity)
    const inactivityInterval = window.setInterval(checkInactivity, INACTIVITY_CHECK_INTERVAL_MS)

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, registerActivity)
      })
      document.removeEventListener('visibilitychange', checkInactivity)
      window.clearInterval(inactivityInterval)
    }
  }, [logout, user])

  useEffect(() => {
    let active = true

    const validateStoredSession = async () => {
      const token = tokenStorage.get()
      const storedUser = token ? readUserFromToken(token) : null

      if (!token || !storedUser) {
        tokenStorage.clear()
        if (active) {
          setUser(null)
          setIsInitializing(false)
        }
        return
      }

      try {
        await apiClient.get(API_ROUTES.auth.checkSession)
        if (active) setUser(storedUser)
      } catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined
        const sessionWasRejected = status === 401 || status === 403 || status === 404

        if (sessionWasRejected) {
          tokenStorage.clear()
          if (active) setUser(null)
        } else if (active) {
          // A network or server failure does not invalidate a locally unexpired token.
          setUser(storedUser)
        }
      } finally {
        if (active) setIsInitializing(false)
      }
    }

    void validateStoredSession()

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await apiClient.post<LoginResponse>(API_ROUTES.auth.login, { username, password })
    const authenticatedUser = readUserFromToken(data.token)
    if (!authenticatedUser) throw new Error('El servidor devolvió una sesión inválida.')
    tokenStorage.set(data.token)
    lastActivityAt.current = Date.now()
    setUser(authenticatedUser)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isInitializing,
    login,
    logout,
  }), [isInitializing, login, logout, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
