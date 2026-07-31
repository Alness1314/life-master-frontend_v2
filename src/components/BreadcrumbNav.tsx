import { Breadcrumbs, Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { MaterialSymbol } from './icons/MaterialSymbol'

interface BreadcrumbNavProps {
  current: string
  root?: {
    label: string
    to: string
  }
  parent?: {
    label: string
    to: string
  }
  ancestors?: {
    label: string
    to: string
  }[]
}

export function BreadcrumbNav({
  current,
  root = { label: 'Dashboard', to: '/dashboard' },
  parent,
  ancestors,
}: BreadcrumbNavProps) {
  if (current === 'Dashboard') {
    return (
      <Typography
        color="text.secondary"
        sx={{ alignItems: 'center', display: 'flex', gap: 0.75, mb: 2.25 }}
        variant="body2"
      >
        <MaterialSymbol name="home" size={17} />
        Dashboard
      </Typography>
    )
  }

  return (
    <Breadcrumbs aria-label="Ruta de navegación" sx={{ mb: 2.25 }}>
      <Link
        color="text.secondary"
        component={RouterLink}
        sx={{ alignItems: 'center', display: 'inline-flex', gap: 0.75, textDecoration: 'none' }}
        to={root.to}
      >
        <MaterialSymbol name="home" size={17} />
        {root.label}
      </Link>
      {(ancestors ?? (parent ? [parent] : [])).map((ancestor) => (
        <Link
          color="text.secondary"
          component={RouterLink}
          key={ancestor.to}
          sx={{ textDecoration: 'none' }}
          to={ancestor.to}
        >
          {ancestor.label}
        </Link>
      ))}
      <Typography color="text.primary" variant="body2">{current}</Typography>
    </Breadcrumbs>
  )
}
