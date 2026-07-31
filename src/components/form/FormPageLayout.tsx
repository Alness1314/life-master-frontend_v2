import type { PropsWithChildren, ReactNode } from 'react'
import { Divider, Typography } from '@mui/material'
import { BreadcrumbNav } from '../BreadcrumbNav'

interface FormPageLayoutProps extends PropsWithChildren {
  title: string
  description: string
  actions?: ReactNode
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

export function FormPageLayout({
  title,
  description,
  actions,
  root,
  parent,
  ancestors,
  children,
}: FormPageLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0">
        <BreadcrumbNav ancestors={ancestors} current={title} parent={parent} root={root} />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Typography variant="h4">{title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
          </div>
          {actions}
        </div>
        <Divider sx={{ mb: 3, mt: 2.25 }} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto pb-1">
        {children}
      </div>
    </div>
  )
}
