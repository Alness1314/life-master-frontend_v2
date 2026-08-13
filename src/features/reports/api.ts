import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { API_ROUTES } from '../../config/apiRoutes'
import type { ReportDataByKind, ReportKind, ReportPeriod } from './types'

export type ReportExportFormat = 'PDF' | 'XLSX' | 'CSV'

interface DownloadReportOptions {
  kind: ReportKind
  userId: string
  period: ReportPeriod
  referenceDate: string
  from: string
  to: string
  currency: string
  format: ReportExportFormat
}

interface ReportQueryOptions<K extends ReportKind> {
  enabled?: boolean
  kind: K
  userId?: string
  period: ReportPeriod
  referenceDate: string
  from: string
  to: string
  currency: string
}

export function useReportQuery<K extends ReportKind>({
  enabled = true,
  kind,
  userId,
  period,
  referenceDate,
  from,
  to,
  currency,
}: ReportQueryOptions<K>) {
  return useQuery({
    queryKey: ['reports', kind, userId, period, referenceDate, from, to, currency],
    queryFn: async () => (
      await apiClient.get<ReportDataByKind[K]>(API_ROUTES.reports.byType(userId!, kind), {
        params: {
          period,
          ...(period === 'CUSTOM' ? { from, to } : { referenceDate }),
          ...(['summary', 'expenses', 'income', 'debts'].includes(kind) ? { currency } : {}),
        },
      })
    ).data,
    enabled: enabled && Boolean(userId),
  })
}

export async function downloadReport({
  kind,
  userId,
  period,
  referenceDate,
  from,
  to,
  currency,
  format,
}: DownloadReportOptions) {
  const response = await apiClient.get<Blob>(API_ROUTES.reports.export(userId, kind), {
    params: {
      format,
      period,
      currency,
      ...(period === 'CUSTOM' ? { from, to } : { referenceDate }),
    },
    responseType: 'blob',
  })
  const disposition = response.headers['content-disposition'] as string | undefined
  const encodedName = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const plainName = disposition?.match(/filename="?([^";]+)"?/i)?.[1]
  const extension = format === 'XLSX' ? 'xlsx' : format.toLowerCase()
  const fileName = encodedName
    ? decodeURIComponent(encodedName)
    : plainName ?? `life-master-${kind}-${referenceDate}.${extension}`
  return { blob: response.data, fileName }
}
