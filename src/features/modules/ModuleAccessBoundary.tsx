import type { PropsWithChildren } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import { useLocation } from 'react-router-dom'
import { ModulePageLayout } from '../../components/layout/ModulePageLayout'
import { useModulePermission } from './api'
import type { ModuleAction } from './api'

interface RoutePermission {
  pattern: RegExp
  permissionKey: string
}

const routePermissions: RoutePermission[] = [
  { pattern: /^\/users(?:\/|$)/, permissionKey: 'users' },
  { pattern: /^\/asistencia(?:\/|$)/, permissionKey: 'asistencia' },
  { pattern: /^\/expenses(?:\/|$)/, permissionKey: 'expenses' },
  { pattern: /^\/debts(?:\/|$)/, permissionKey: 'debts' },
  { pattern: /^\/payment-methods(?:\/|$)/, permissionKey: 'payment-methods' },
  { pattern: /^\/financial-accounts(?:\/|$)/, permissionKey: 'financial-accounts' },
  { pattern: /^\/recurring-movements(?:\/|$)/, permissionKey: 'recurring-movements' },
  { pattern: /^\/exercises(?:\/|$)/, permissionKey: 'exercises' },
  { pattern: /^\/nutrition(?:\/|$)/, permissionKey: 'nutrition' },
  { pattern: /^\/incomes(?:\/|$)/, permissionKey: 'incomes' },
  { pattern: /^\/notes(?:\/|$)/, permissionKey: 'notes' },
  { pattern: /^\/vault(?:\/|$)/, permissionKey: 'vault' },
  { pattern: /^\/categories(?:\/|$)/, permissionKey: 'categories' },
  { pattern: /^\/app-modules(?:\/|$)/, permissionKey: 'app-modules' },
  { pattern: /^\/alerts(?:\/|$)/, permissionKey: 'alerts' },
  { pattern: /^\/reminders(?:\/|$)/, permissionKey: 'reminders' },
  { pattern: /^\/bank-import(?:\/|$)/, permissionKey: 'bank-import' },
  { pattern: /^\/audit(?:\/|$)/, permissionKey: 'audit' },
]

function actionForPath(pathname: string): ModuleAction {
  if (/\/register\/?$/.test(pathname)) return 'create'
  if (/\/update\/[^/]+\/?$/.test(pathname)) return 'update'
  return 'read'
}

export function ModuleAccessBoundary({ children }: PropsWithChildren) {
  const { pathname } = useLocation()
  const target = routePermissions.find(({ pattern }) => pattern.test(pathname))
  const access = useModulePermission(target?.permissionKey ?? '__unmanaged__')
  const action = actionForPath(pathname)
  const allowed = !target || access[`can${action[0].toUpperCase()}${action.slice(1)}` as keyof typeof access]

  if (target && access.isLoading) {
    return (
      <div className="grid min-h-64 place-items-center">
        <CircularProgress aria-label="Validando permisos" />
      </div>
    )
  }

  if (!allowed) {
    return (
      <ModulePageLayout
        description="Tu perfil no tiene habilitada esta operación."
        title="Acceso restringido"
      >
        <Alert severity="warning">
          Solicita a un administrador que actualice los permisos de tu perfil.
        </Alert>
      </ModulePageLayout>
    )
  }

  return children
}
