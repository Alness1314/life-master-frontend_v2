import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { API_ROUTES } from '../../config/apiRoutes'
import type { ReportDataByKind, ReportKind, ReportPeriod } from './types'

interface ReportQueryOptions<K extends ReportKind> {
  enabled?: boolean
  kind: K
  userId?: string
  period: ReportPeriod
  referenceDate: string
  currency: string
}

export function useReportQuery<K extends ReportKind>({
  enabled = true,
  kind,
  userId,
  period,
  referenceDate,
  currency,
}: ReportQueryOptions<K>) {
  return useQuery({
    queryKey: ['reports', kind, userId, period, referenceDate, currency],
    queryFn: async () => (
      await apiClient.get<ReportDataByKind[K]>(API_ROUTES.reports.byType(userId!, kind), {
        params: {
          period,
          referenceDate,
          ...(['summary', 'expenses', 'income', 'debts'].includes(kind) ? { currency } : {}),
        },
      })
    ).data,
    enabled: enabled && Boolean(userId),
  })
}
