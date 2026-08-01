import { useMemo, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, MenuItem,
  TextField, Typography,
} from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../api/client'
import { useAuth } from '../../../auth/useAuth'
import { BreadcrumbNav } from '../../../components/BreadcrumbNav'
import { useFeedback } from '../../../components/feedback/useFeedback'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { API_ROUTES } from '../../../config/apiRoutes'
import { useCurrentUser } from '../../users/api'

interface MonthlySummary {
  year: number
  month: number
  currency: string
  totalIncome: number
  totalExpenses: number
  paidExpenses: number
  pendingExpenses: number
  netBalance: number
  operatingBalance: number
  debtProceeds: number
  debtPayments: number
  debtPrincipalPaid: number
  debtInterestPaid: number
  scheduledDebtPayments: number
  freeMargin: number
  availableAccountBalance: number
  totalDebt: number
  outstandingDebt: number
  expensesByCategory: Array<{ categoryId: string; categoryName: string; amount: number }>
}

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const chartColors = ['#7567e8', '#43a047', '#ef8f35', '#42a5f5', '#ec407a', '#ab47bc']

const chartCardSx = {
  border: '1px solid',
  borderColor: 'divider',
  minHeight: { lg: 410, xl: 430 },
  overflow: 'visible',
}

const chartCardContentSx = {
  p: { xs: 2, sm: 2.5 },
  '&:last-child': { pb: { xs: 2.5, sm: 2.5 } },
}

function CashFlowChart({
  income,
  expenses,
  financing,
  debtPayments,
  balance,
  format,
}: {
  income: number
  expenses: number
  financing: number
  debtPayments: number
  balance: number
  format: (value: number) => string
}) {
  const inflows = income + financing
  const outflows = expenses + debtPayments
  const total = inflows + outflows
  const incomeDegrees = total ? (inflows / total) * 360 : 0
  const background = total
    ? `conic-gradient(#43a047 0deg ${incomeDegrees}deg, #7567e8 ${incomeDegrees}deg 360deg)`
    : 'rgba(117, 103, 232, .14)'
  const rows = [
    { label: 'Ingresos', value: income, color: '#43a047' },
    { label: 'Financiamiento', value: financing, color: '#66bb6a' },
    { label: 'Gastos pagados', value: expenses, color: '#7567e8' },
    { label: 'Pagos de deuda', value: debtPayments, color: '#9575cd' },
  ]
  const savingsRate = inflows > 0 ? (balance / inflows) * 100 : 0
  return (
    <div className="flex flex-col items-center gap-4 pt-5 sm:gap-6 sm:pt-6" aria-label="Comparación de ingresos y gastos">
      <div
        className="relative mx-auto grid h-32 w-32 place-items-center rounded-full shadow-[0_0_22px_rgba(117,103,232,.18)] sm:h-40 sm:w-40 sm:shadow-[0_0_28px_rgba(117,103,232,.18)]"
        style={{ background, border: total ? 'none' : '12px solid rgba(117, 103, 232, .16)' }}
      >
        <Box className="grid h-[84px] w-[84px] place-items-center rounded-full text-center shadow-inner sm:h-[106px] sm:w-[106px]" sx={{ bgcolor: 'background.paper' }}>
          <div>
            <MaterialSymbol name="account_balance_wallet" size={22} style={{ color: '#7567e8' }} />
            <Typography color="text.secondary" variant="caption">Balance</Typography>
            <Typography sx={{ fontWeight: 750 }}>{format(balance)}</Typography>
          </div>
        </Box>
      </div>
      <div className="grid w-full grid-cols-2 gap-4 border-0 border-t border-solid border-black/10 pt-4 dark:border-white/10">
        {rows.map((row) => (
          <div className="text-center" key={row.label}>
            <div className="flex items-center justify-center gap-2">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: row.color }} />
              <Typography>{row.label}</Typography>
            </div>
            <Typography sx={{ fontWeight: 700, mt: 0.5 }}>{format(row.value)}</Typography>
          </div>
        ))}
      </div>
      <Typography color="text.secondary" variant="body2">
        Margen del flujo: <strong>{savingsRate.toFixed(1)}%</strong>
      </Typography>
    </div>
  )
}

function DebtStatusDonut({
  total,
  outstanding,
  scheduledPayments,
  format,
}: {
  total: number
  outstanding: number
  scheduledPayments: number
  format: (value: number) => string
}) {
  const paid = Math.max(0, total - outstanding)
  const percentage = total > 0 ? (paid / total) * 100 : 0
  const visiblePercentage = Math.min(100, Math.max(0, percentage))
  const degrees = visiblePercentage * 3.6
  const color = '#43a047'
  return (
    <div className="flex flex-col items-center gap-4 pt-5 sm:gap-6 sm:pt-6">
      <div
        className="relative mx-auto grid h-32 w-32 place-items-center rounded-full shadow-[0_0_22px_rgba(117,103,232,.18)] sm:h-40 sm:w-40 sm:shadow-[0_0_28px_rgba(117,103,232,.18)]"
        style={{ background: `conic-gradient(${color} 0deg ${degrees}deg, rgba(117,103,232,.14) ${degrees}deg 360deg)` }}
      >
        <Box className="grid h-[84px] w-[84px] place-items-center rounded-full text-center shadow-inner sm:h-[106px] sm:w-[106px]" sx={{ bgcolor: 'background.paper' }}>
          <div>
            <MaterialSymbol name="request_quote" size={22} style={{ color }} />
            <Typography color="text.secondary" variant="caption">Liquidado</Typography>
            <Typography sx={{ fontWeight: 750 }}>{visiblePercentage.toFixed(1)}%</Typography>
          </div>
        </Box>
      </div>
      <div className="grid w-full grid-cols-2 gap-4 border-0 border-t border-solid border-black/10 pt-4 text-center dark:border-white/10">
        <div>
          <Typography color="text.secondary" variant="body2">Saldo pendiente</Typography>
          <Typography sx={{ mt: 0.5 }} variant="h6">{format(outstanding)}</Typography>
        </div>
        <div>
          <Typography color="text.secondary" variant="body2">Monto liquidado</Typography>
          <Typography sx={{ mt: 0.5 }} variant="h6">{format(paid)}</Typography>
        </div>
      </div>
      <Typography color="text.secondary" variant="body2">
        Pagos programados del mes: <strong>{format(scheduledPayments)}</strong>
      </Typography>
    </div>
  )
}

function CategoryDonut({
  categories,
  format,
}: {
  categories: MonthlySummary['expensesByCategory']
  format: (value: number) => string
}) {
  const total = categories.reduce((sum, category) => sum + Number(category.amount), 0)
  let cumulative = 0
  const segments = categories.map((category, index) => {
    const start = total ? (cumulative / total) * 360 : 0
    cumulative += Number(category.amount)
    const end = total ? (cumulative / total) * 360 : 0
    return `${chartColors[index % chartColors.length]} ${start}deg ${end}deg`
  })
  const background = total ? `conic-gradient(${segments.join(',')})` : 'rgba(117, 103, 232, .14)'

  return (
    <div className="flex min-h-0 flex-col items-center gap-4 pt-5 sm:gap-6 sm:pt-6">
      <div
        aria-label={`Gastos totales ${format(total)}`}
        className="relative mx-auto grid h-32 w-32 place-items-center rounded-full shadow-[0_0_22px_rgba(117,103,232,.18)] sm:h-40 sm:w-40 sm:shadow-[0_0_28px_rgba(117,103,232,.18)]"
        style={{
          background,
          border: total ? 'none' : '12px solid rgba(117, 103, 232, .16)',
        }}
      >
        <Box className="grid h-[84px] w-[84px] place-items-center rounded-full text-center shadow-inner sm:h-[106px] sm:w-[106px]" sx={{ bgcolor: 'background.paper' }}>
          <div>
            <MaterialSymbol name={total ? 'donut_large' : 'data_usage'} size={22} style={{ color: '#7567e8' }} />
            <Typography color="text.secondary" variant="caption">{total ? 'Total' : 'Sin gastos'}</Typography>
            <Typography sx={{ fontWeight: 750 }}>{format(total)}</Typography>
          </div>
        </Box>
      </div>
      <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2 border-0 border-t border-solid border-black/10 pt-4 dark:border-white/10">
        {categories.map((category, index) => (
          <div className="flex items-center justify-between gap-3" key={category.categoryId}>
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
              />
              <Typography className="truncate">{category.categoryName}</Typography>
            </div>
            <Typography sx={{ fontWeight: 700 }}>{format(category.amount)}</Typography>
          </div>
        ))}
        {categories.length === 0 && (
          <Typography className="col-span-2 text-center" color="text.secondary">
            Sin gastos categorizados en este periodo.
          </Typography>
        )}
      </div>
    </div>
  )
}

export function DashboardPage() {
  const now = new Date()
  const { user } = useAuth()
  const { showError } = useFeedback()
  const { data: currentUser } = useCurrentUser()
  const displayName = currentUser?.fullName?.trim() || 'Usuario'
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const summaryQuery = useQuery({
    queryKey: ['monthly-summary', user?.id, year, month],
    queryFn: async () => (
      await apiClient.get<MonthlySummary>(API_ROUTES.financialSummary.monthly(user!.id, year, month))
    ).data,
    enabled: Boolean(user),
  })
  const reportMutation = useMutation({
    mutationFn: async () => apiClient.get(
      API_ROUTES.reports.monthlyCsv(user!.id, year, month),
      { responseType: 'blob' },
    ),
    onSuccess: (response) => {
      const url = URL.createObjectURL(response.data)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `life-master-${year}-${String(month).padStart(2, '0')}-MXN.csv`
      anchor.click()
      URL.revokeObjectURL(url)
    },
    onError: () => showError('No fue posible descargar el reporte financiero.'),
  })

  const money = useMemo(() => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: summaryQuery.data?.currency ?? 'MXN',
  }), [summaryQuery.data?.currency])

  const summaryCards = [
    { label: 'Saldo disponible', value: summaryQuery.data?.availableAccountBalance, icon: 'account_balance_wallet' },
    { label: 'Flujo neto del mes', value: summaryQuery.data?.netBalance, icon: 'monitoring' },
    { label: 'Resultado operativo', value: summaryQuery.data?.operatingBalance, icon: 'trending_up' },
    { label: 'Ingresos ordinarios', value: summaryQuery.data?.totalIncome, icon: 'payments' },
    { label: 'Entrada por deuda', value: summaryQuery.data?.debtProceeds, icon: 'account_balance' },
    { label: 'Pagos de deuda', value: summaryQuery.data?.debtPayments, icon: 'credit_card' },
    { label: 'Gastos pagados', value: summaryQuery.data?.paidExpenses, icon: 'receipt_long' },
    { label: 'Margen proyectado', value: summaryQuery.data?.freeMargin, icon: 'savings' },
    { label: 'Deuda pendiente', value: summaryQuery.data?.outstandingDebt, icon: 'credit_score' },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <BreadcrumbNav current="Dashboard" />
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-full">
          <Typography
            sx={{
              fontSize: { xs: '1.75rem', sm: '2.125rem' },
              lineHeight: 1.15,
              overflowWrap: 'anywhere',
            }}
            variant="h4"
          >
            Hola, {displayName}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Consulta el resumen de tu actividad financiera.
          </Typography>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TextField
            label="Mes"
            onChange={(event) => setMonth(Number(event.target.value))}
            select
            size="small"
            value={month}
          >
            {months.map((label, index) => (
              <MenuItem key={label} value={index + 1}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Año"
            onChange={(event) => setYear(Number(event.target.value))}
            size="small"
            slotProps={{ htmlInput: { min: 2000, max: 2100 } }}
            type="number"
            value={year}
          />
          <Chip color="success" label="Sesión activa" variant="outlined" />
        </div>
      </div>
      <Divider sx={{ mb: 2, mt: 1.75 }} />

      {summaryQuery.isLoading && (
        <div className="grid min-h-52 place-items-center"><CircularProgress /></div>
      )}
      {summaryQuery.error && (
        <Alert severity="error">No fue posible cargar el resumen financiero.</Alert>
      )}
      {summaryQuery.data && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid content-start gap-4 pb-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <Card key={card.label} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Typography color="text.secondary" variant="body2">{card.label}</Typography>
                      <Typography sx={{ fontSize: { xs: '1.45rem', xl: '1.25rem' }, mt: 0.75, whiteSpace: 'nowrap' }} variant="h5">
                        {money.format(card.value ?? 0)}
                      </Typography>
                    </div>
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                      style={{ backgroundColor: 'rgba(117, 103, 232, .14)', color: '#7567e8' }}
                    >
                      <MaterialSymbol name={card.icon} size={21} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid min-h-0 items-start gap-4 lg:grid-cols-3">
            <Card elevation={0} sx={chartCardSx}>
              <CardContent sx={chartCardContentSx}>
                <Typography variant="h6">Flujo del mes</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="body2">Comparación entre entradas y salidas.</Typography>
                <CashFlowChart
                  balance={Number(summaryQuery.data.netBalance)}
                  debtPayments={Number(summaryQuery.data.debtPayments)}
                  expenses={Number(summaryQuery.data.paidExpenses)}
                  financing={Number(summaryQuery.data.debtProceeds)}
                  format={(value) => money.format(value)}
                  income={Number(summaryQuery.data.totalIncome)}
                />
              </CardContent>
            </Card>
            <Card elevation={0} sx={chartCardSx}>
              <CardContent sx={chartCardContentSx}>
                <Typography variant="h6">Gastos por categoría</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="body2">Distribución del gasto mensual.</Typography>
                <CategoryDonut
                  categories={summaryQuery.data.expensesByCategory}
                  format={(value) => money.format(value)}
                />
              </CardContent>
            </Card>
            <Card elevation={0} sx={chartCardSx}>
              <CardContent sx={chartCardContentSx}>
                <Typography variant="h6">Estado de las deudas</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="body2">Avance general y próximos compromisos.</Typography>
                <DebtStatusDonut
                  format={(value) => money.format(value)}
                  outstanding={Number(summaryQuery.data.outstandingDebt)}
                  scheduledPayments={Number(summaryQuery.data.scheduledDebtPayments)}
                  total={Number(summaryQuery.data.totalDebt)}
                />
              </CardContent>
            </Card>
          </div>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4" sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <div className="flex items-center gap-4">
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg"
                  style={{ backgroundColor: 'rgba(117, 103, 232, .14)', color: '#7567e8' }}
                >
                  <MaterialSymbol name="csv" />
                </div>
                <div>
                  <Typography variant="h6">Reporte financiero mensual</Typography>
                  <Typography color="text.secondary">
                    Descarga los movimientos y totales de {months[month - 1].toLowerCase()} de {year}.
                  </Typography>
                </div>
              </div>
              <Button
                disabled={reportMutation.isPending}
                onClick={() => reportMutation.mutate()}
                startIcon={<MaterialSymbol name="download" />}
                variant="contained"
              >
                Descargar CSV
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      )}
    </div>
  )
}
