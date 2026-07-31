import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { CircularProgress } from '@mui/material'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return (
      <div className="grid min-h-screen place-items-center">
        <CircularProgress aria-label="Validando sesión" />
      </div>
    )
  }

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location }} />
}
