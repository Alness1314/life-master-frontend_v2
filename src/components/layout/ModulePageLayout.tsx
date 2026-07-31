import type { PropsWithChildren, ReactNode } from 'react'
import { Divider, Typography } from '@mui/material'
import { BreadcrumbNav } from '../BreadcrumbNav'

interface ModulePageLayoutProps extends PropsWithChildren {
  title: string
  description: string
  actions?: ReactNode
  ancestors?: Array<{ label: string; to: string }>
  contentClassName?: string
}

export function ModulePageLayout({
  title,
  description,
  actions,
  ancestors,
  contentClassName = '',
  children,
}: ModulePageLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0">
        <BreadcrumbNav ancestors={ancestors} current={title} />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Typography variant="h4">{title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
          </div>
          {actions}
        </div>
        <Divider sx={{ mb: 2.5, mt: 2 }} />
      </div>
      <div className={`min-h-0 flex-1 overflow-auto ${contentClassName}`}>
        {children}
      </div>
    </div>
  )
}
