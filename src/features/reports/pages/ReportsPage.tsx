import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../../../auth/useAuth'
import { getApiErrorMessage } from '../../../api/client'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { ModulePageLayout } from '../../../components/layout/ModulePageLayout'
import { useFeedback } from '../../../components/feedback/useFeedback'
import { DynamicDataTable } from '../../../components/table/DynamicDataTable'
import type { DataTableColumn } from '../../../components/table/DynamicDataTable'
import { toCurrencySelectOptions, useCurrencies } from '../../../hooks/useCurrencies'
import { downloadReport, useReportQuery } from '../api'
import type { ReportExportFormat } from '../api'
import type {
  AssistanceReport,
  AssistanceReportItem,
  ConsolidatedReport,
  DebtReport,
  DebtReportItem,
  ExerciseReport,
  ExerciseReportItem,
  ExpenseReport,
  ExpenseReportItem,
  IncomeReport,
  IncomeReportItem,
  NutritionReport,
  NutritionReportItem,
  ReportDataByKind,
  ReportKind,
  ReportPeriod,
  ReportRange,
} from '../types'

const reportTabs: Array<{ kind: ReportKind; label: string; icon: string }> = [
  { kind: 'summary', label: 'Resumen', icon: 'dashboard' },
  { kind: 'assistance', label: 'Asistencia', icon: 'fact_check' },
  { kind: 'exercises', label: 'Ejercicio', icon: 'fitness_center' },
  { kind: 'nutrition', label: 'Nutrición', icon: 'nutrition' },
  { kind: 'expenses', label: 'Gastos', icon: 'receipt_long' },
  { kind: 'income', label: 'Ingresos', icon: 'payments' },
  { kind: 'debts', label: 'Deudas', icon: 'credit_score' },
]

const periodLabels: Record<ReportPeriod, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  FORTNIGHTLY: 'Quincenal',
  MONTHLY: 'Mensual',
}

const allPeriods = Object.keys(periodLabels) as ReportPeriod[]

function allowedPeriods(kind: ReportKind): ReportPeriod[] {
  if (kind === 'assistance') return ['WEEKLY', 'FORTNIGHTLY', 'MONTHLY']
  if (kind === 'exercises' || kind === 'nutrition') return ['DAILY', 'WEEKLY', 'MONTHLY']
  return allPeriods
}

function localToday() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })
    .format(new Date(`${value}T00:00:00`))
}

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    .format(new Date(value))
}

function timeLabel(value: string | null) {
  if (!value) return '—'
  return value.slice(0, 5)
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (!hours) return `${remaining} min`
  return `${hours} h ${remaining ? `${remaining} min` : ''}`.trim()
}

function RangeChip({ range }: { range: ReportRange }) {
  return (
    <Chip
      icon={<MaterialSymbol name="date_range" size={18} />}
      label={`${dateLabel(range.from)} — ${dateLabel(range.to)}`}
      size="small"
      variant="outlined"
    />
  )
}

interface StatCardProps {
  icon: string
  label: string
  value: ReactNode
  tone?: 'primary' | 'success' | 'warning' | 'error'
}

function StatCard({ icon, label, value, tone = 'primary' }: StatCardProps) {
  const colors = {
    primary: ['rgba(117, 103, 232, .14)', '#7567e8'],
    success: ['rgba(67, 160, 71, .14)', '#43a047'],
    warning: ['rgba(239, 143, 53, .14)', '#ef8f35'],
    error: ['rgba(211, 47, 47, .14)', '#d32f2f'],
  }[tone]
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', minWidth: 0 }}>
      <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Typography color="text.secondary" variant="body2">{label}</Typography>
            <Typography sx={{ fontSize: '1.25rem', mt: 0.4, overflowWrap: 'anywhere' }} variant="h6">
              {value}
            </Typography>
          </div>
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: colors[0], color: colors[1] }}
          >
            <MaterialSymbol name={icon} size={21} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(4, minmax(0, 1fr))',
        },
      }}
    >
      {children}
    </Box>
  )
}

function BreakdownPanel({
  title,
  values,
  format = (value) => String(value),
}: {
  title: string
  values: Record<string, number>
  format?: (value: number) => string
}) {
  const entries = Object.entries(values).sort((left, right) => right[1] - left[1])
  const max = Math.max(...entries.map(([, value]) => value), 1)
  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
      <Typography variant="h6">{title}</Typography>
      {entries.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          No hay información para distribuir en este periodo.
        </Typography>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {entries.map(([label, value]) => (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <Typography noWrap variant="body2">{label}</Typography>
                <Typography sx={{ fontWeight: 700 }} variant="body2">{format(value)}</Typography>
              </div>
              <Box sx={{ bgcolor: 'action.hover', height: 7, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: 'primary.main', height: '100%', width: `${(value / max) * 100}%` }} />
              </Box>
            </div>
          ))}
        </div>
      )}
    </Paper>
  )
}

function SummaryView({ report }: { report: ConsolidatedReport }) {
  const money = useMemo(() => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: report.currency,
  }), [report.currency])
  return (
    <div className="grid gap-3">
      <div className="flex justify-end"><RangeChip range={report.range} /></div>
      <StatGrid>
        <StatCard icon="payments" label="Ingresos" tone="success" value={money.format(report.financial.income)} />
        <StatCard icon="receipt_long" label="Gastos" tone="warning" value={money.format(report.financial.expenses)} />
        <StatCard icon="monitoring" label="Flujo neto" value={money.format(report.financial.netCashFlow)} />
        <StatCard icon="trending_up" label="Resultado operativo" value={money.format(report.financial.operatingResult)} />
        <StatCard icon="account_balance" label="Entrada por deuda" value={money.format(report.financial.debtProceeds)} />
        <StatCard icon="credit_card" label="Pagos de deuda" tone="warning" value={money.format(report.financial.debtPayments)} />
        <StatCard icon="credit_score" label="Deuda pendiente" tone="error" value={money.format(report.financial.outstandingDebt)} />
        <StatCard icon="pending_actions" label="Gastos pendientes" tone="warning" value={money.format(report.financial.pendingExpenses)} />
      </StatGrid>
      <Typography sx={{ mt: 1 }} variant="h6">Actividad del periodo</Typography>
      <StatGrid>
        <StatCard icon="fact_check" label="Registros de asistencia" value={report.activity.assistanceRecords} />
        <StatCard icon="schedule" label="Retardos" tone="warning" value={report.activity.retards} />
        <StatCard icon="event_busy" label="Ausencias" tone="error" value={report.activity.absences} />
        <StatCard icon="fitness_center" label="Sesiones de ejercicio" value={report.activity.exerciseSessions} />
        <StatCard icon="timer" label="Tiempo de ejercicio" value={durationLabel(report.activity.exerciseMinutes)} />
        <StatCard icon="restaurant" label="Comidas registradas" value={report.activity.nutritionMeals} />
        <StatCard icon="local_fire_department" label="Calorías conocidas" value={report.activity.knownCalories.toLocaleString('es-MX')} />
      </StatGrid>
    </div>
  )
}

function AssistanceView({ report }: { report: AssistanceReport }) {
  const columns: DataTableColumn<AssistanceReportItem>[] = [
    { id: 'date', header: 'Fecha', render: (row) => dateLabel(row.workDate), sortValue: (row) => row.workDate, filter: { inputType: 'date' } },
    { id: 'entry', header: 'Entrada', align: 'center', render: (row) => timeLabel(row.timeEntry), sortValue: (row) => row.timeEntry },
    { id: 'departure', header: 'Salida', align: 'center', render: (row) => timeLabel(row.departureTime), sortValue: (row) => row.departureTime },
    { id: 'worked', header: 'Tiempo trabajado', align: 'center', render: (row) => durationLabel(row.workedMinutes), sortValue: (row) => row.workedMinutes, filter: false },
    { id: 'status', header: 'Estado', align: 'center', render: (row) => {
      if (row.unjustifiedAbsence) return <Chip color="error" label="Falta" size="small" variant="outlined" />
      if (row.justifiedAbsence) return <Chip color="warning" label="Falta justificada" size="small" variant="outlined" />
      if (row.retard) return <Chip color="warning" label="Retardo" size="small" variant="outlined" />
      return <Chip color="success" label="A tiempo" size="small" variant="outlined" />
    } },
  ]
  return (
    <div className="grid gap-3">
      <div className="flex justify-end"><RangeChip range={report.range} /></div>
      <StatGrid>
        <StatCard icon="event_available" label="Registros" value={report.records} />
        <StatCard icon="check_circle" label="A tiempo" tone="success" value={report.onTime} />
        <StatCard icon="schedule" label="Retardos" tone="warning" value={report.retards} />
        <StatCard icon="event_busy" label="Faltas sin justificar" tone="error" value={report.unjustifiedAbsences} />
        <StatCard icon="event_note" label="Faltas justificadas" tone="warning" value={report.justifiedAbsences} />
        <StatCard icon="timer" label="Tiempo trabajado" value={durationLabel(report.workedMinutes)} />
      </StatGrid>
      <DynamicDataTable columns={columns} data={report.items} getRowId={(row) => row.id} initialPageSize={10} />
    </div>
  )
}

function ExerciseView({ report }: { report: ExerciseReport }) {
  const columns: DataTableColumn<ExerciseReportItem>[] = [
    { id: 'date', header: 'Fecha', render: (row) => dateLabel(row.trainingDate), sortValue: (row) => row.trainingDate, filter: { inputType: 'date' } },
    { id: 'activity', header: 'Actividad', render: (row) => row.activityType || 'Sin especificar', sortValue: (row) => row.activityType },
    { id: 'start', header: 'Inicio', align: 'center', render: (row) => timeLabel(row.startTime), sortValue: (row) => row.startTime },
    { id: 'end', header: 'Fin', align: 'center', render: (row) => timeLabel(row.endTime), sortValue: (row) => row.endTime },
    { id: 'duration', header: 'Duración', align: 'center', render: (row) => durationLabel(row.durationMinutes ?? 0), sortValue: (row) => row.durationMinutes, filter: false },
    { id: 'notes', header: 'Notas', minWidth: 260, render: (row) => row.notes || '—', sortValue: (row) => row.notes },
  ]
  return (
    <div className="grid gap-3">
      <div className="flex justify-end"><RangeChip range={report.range} /></div>
      <StatGrid>
        <StatCard icon="fitness_center" label="Sesiones" value={report.sessions} />
        <StatCard icon="timer" label="Duración total" value={durationLabel(report.totalDurationMinutes)} />
        <StatCard icon="avg_time" label="Promedio por sesión" value={durationLabel(Math.round(report.averageDurationMinutes))} />
      </StatGrid>
      <BreakdownPanel title="Sesiones por actividad" values={report.sessionsByActivity} />
      <DynamicDataTable columns={columns} data={report.items} getRowId={(row) => row.id} initialPageSize={10} />
    </div>
  )
}

function NutritionView({ report }: { report: NutritionReport }) {
  const columns: DataTableColumn<NutritionReportItem>[] = [
    { id: 'date', header: 'Consumo', minWidth: 180, render: (row) => dateTimeLabel(row.consumedAt), sortValue: (row) => row.consumedAt, filter: { inputType: 'date' } },
    { id: 'name', header: 'Nombre', render: (row) => row.name, sortValue: (row) => row.name },
    { id: 'type', header: 'Tipo de comida', render: (row) => row.mealType || 'Sin especificar', sortValue: (row) => row.mealType },
    { id: 'foods', header: 'Alimentos', minWidth: 300, render: (row) => row.foods.length
      ? row.foods.map((food) => `${food.name} (${food.quantity}${food.unitMeasurement ? ` ${food.unitMeasurement}` : ''})`).join(', ')
      : 'Sin alimentos detallados', sortValue: (row) => row.foods.length, filter: false },
    { id: 'calories', header: 'Calorías conocidas', align: 'right', render: (row) => row.foods.reduce((total, food) => total + (food.calories ?? 0), 0).toLocaleString('es-MX'), sortValue: (row) => row.foods.reduce((total, food) => total + (food.calories ?? 0), 0), filter: false },
    { id: 'notes', header: 'Notas', minWidth: 240, render: (row) => row.notes || '—', sortValue: (row) => row.notes },
  ]
  return (
    <div className="grid gap-3">
      <div className="flex justify-end"><RangeChip range={report.range} /></div>
      <StatGrid>
        <StatCard icon="restaurant" label="Comidas" value={report.meals} />
        <StatCard icon="nutrition" label="Alimentos detallados" value={report.foods} />
        <StatCard icon="local_fire_department" label="Calorías conocidas" value={report.totalKnownCalories.toLocaleString('es-MX')} />
        <StatCard icon="data_check" label="Alimentos con calorías" value={report.foodsWithCalories} />
      </StatGrid>
      <BreakdownPanel title="Comidas por tipo" values={report.mealsByType} />
      <DynamicDataTable columns={columns} data={report.items} getRowId={(row) => row.id} initialPageSize={10} />
    </div>
  )
}

function ExpenseView({ report }: { report: ExpenseReport }) {
  const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: report.currency })
  const columns: DataTableColumn<ExpenseReportItem>[] = [
    { id: 'date', header: 'Fecha', render: (row) => dateLabel(row.paymentDate), sortValue: (row) => row.paymentDate, filter: { inputType: 'date' } },
    { id: 'description', header: 'Descripción', minWidth: 280, render: (row) => row.description, sortValue: (row) => row.description },
    { id: 'category', header: 'Categoría', render: (row) => row.category || 'Sin categoría', sortValue: (row) => row.category },
    { id: 'entity', header: 'Entidad', render: (row) => row.bankOrEntity, sortValue: (row) => row.bankOrEntity },
    { id: 'status', header: 'Estado', align: 'center', render: (row) => <Chip color={row.paid ? 'success' : 'warning'} label={row.paid ? 'Pagado' : 'Pendiente'} size="small" variant="outlined" />, sortValue: (row) => row.paid ? 'Pagado' : 'Pendiente', filter: { inputType: 'select', options: [{ label: 'Pagado', value: 'Pagado' }, { label: 'Pendiente', value: 'Pendiente' }] } },
    { id: 'amount', header: 'Importe', align: 'right', render: (row) => money.format(row.amount), sortValue: (row) => row.amount, filter: false },
  ]
  return (
    <div className="grid gap-3">
      <div className="flex justify-end"><RangeChip range={report.range} /></div>
      <StatGrid>
        <StatCard icon="receipt_long" label="Gasto total" tone="warning" value={money.format(report.total)} />
        <StatCard icon="task_alt" label="Pagado" tone="success" value={money.format(report.paid)} />
        <StatCard icon="pending_actions" label="Pendiente" tone="warning" value={money.format(report.pending)} />
        <StatCard icon="format_list_numbered" label="Movimientos" value={report.records} />
      </StatGrid>
      <BreakdownPanel title="Gastos por categoría" values={report.totalsByCategory} format={(value) => money.format(value)} />
      <DynamicDataTable columns={columns} data={report.items} getRowId={(row) => row.id} initialPageSize={10} />
    </div>
  )
}

function IncomeView({ report }: { report: IncomeReport }) {
  const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: report.currency })
  const columns: DataTableColumn<IncomeReportItem>[] = [
    { id: 'date', header: 'Fecha', render: (row) => dateLabel(row.paymentDate), sortValue: (row) => row.paymentDate, filter: { inputType: 'date' } },
    { id: 'source', header: 'Fuente', render: (row) => row.source, sortValue: (row) => row.source },
    { id: 'description', header: 'Descripción', minWidth: 360, render: (row) => row.description, sortValue: (row) => row.description },
    { id: 'amount', header: 'Importe', align: 'right', render: (row) => money.format(row.amount), sortValue: (row) => row.amount, filter: false },
  ]
  return (
    <div className="grid gap-3">
      <div className="flex justify-end"><RangeChip range={report.range} /></div>
      <StatGrid>
        <StatCard icon="payments" label="Ingresos totales" tone="success" value={money.format(report.total)} />
        <StatCard icon="format_list_numbered" label="Movimientos" value={report.records} />
      </StatGrid>
      <BreakdownPanel title="Ingresos por fuente" values={report.totalsBySource} format={(value) => money.format(value)} />
      <DynamicDataTable columns={columns} data={report.items} getRowId={(row) => row.id} initialPageSize={10} />
    </div>
  )
}

function DebtView({ report }: { report: DebtReport }) {
  const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: report.currency })
  const columns: DataTableColumn<DebtReportItem>[] = [
    { id: 'creditor', header: 'Acreedor', render: (row) => row.creditor, sortValue: (row) => row.creditor },
    { id: 'dueDate', header: 'Vencimiento', render: (row) => dateLabel(row.dueDate), sortValue: (row) => row.dueDate, filter: { inputType: 'date' } },
    { id: 'total', header: 'Importe original', align: 'right', render: (row) => money.format(row.totalAmount), sortValue: (row) => row.totalAmount, filter: false },
    { id: 'paid', header: 'Capital pagado', align: 'right', render: (row) => money.format(row.paidPrincipal), sortValue: (row) => row.paidPrincipal, filter: false },
    { id: 'pending', header: 'Saldo pendiente', align: 'right', render: (row) => money.format(row.outstandingAmount), sortValue: (row) => row.outstandingAmount, filter: false },
    { id: 'progress', header: 'Avance', align: 'center', render: (row) => `${Number(row.progressPercentage).toFixed(1)}%`, sortValue: (row) => row.progressPercentage, filter: false },
    { id: 'status', header: 'Estado', align: 'center', render: (row) => <Chip color={row.fullyPaid ? 'success' : row.overdue ? 'error' : 'warning'} label={row.fullyPaid ? 'Liquidada' : row.overdue ? 'Vencida' : 'Pendiente'} size="small" variant="outlined" />, sortValue: (row) => row.fullyPaid ? 'Liquidada' : row.overdue ? 'Vencida' : 'Pendiente' },
  ]
  return (
    <div className="grid gap-3">
      <div className="flex justify-end"><RangeChip range={report.range} /></div>
      <StatGrid>
        <StatCard icon="account_balance" label="Deuda original" value={money.format(report.originalAmount)} />
        <StatCard icon="credit_score" label="Saldo pendiente" tone="error" value={money.format(report.outstandingAmount)} />
        <StatCard icon="payments" label="Pagado en el periodo" tone="success" value={money.format(report.paidInPeriod)} />
        <StatCard icon="percent" label="Intereses del periodo" tone="warning" value={money.format(report.interestPaidInPeriod)} />
        <StatCard icon="event_upcoming" label="Pagos programados" value={money.format(report.scheduledInPeriod)} />
        <StatCard icon="warning" label="Deudas vencidas" tone={report.overdueDebts ? 'error' : 'success'} value={report.overdueDebts} />
      </StatGrid>
      <DynamicDataTable columns={columns} data={report.items} getRowId={(row) => row.id} initialPageSize={10} />
    </div>
  )
}

function ReportContent<K extends ReportKind>({ kind, data }: { kind: K; data: ReportDataByKind[K] }) {
  switch (kind) {
    case 'summary': return <SummaryView report={data as ConsolidatedReport} />
    case 'assistance': return <AssistanceView report={data as AssistanceReport} />
    case 'exercises': return <ExerciseView report={data as ExerciseReport} />
    case 'nutrition': return <NutritionView report={data as NutritionReport} />
    case 'expenses': return <ExpenseView report={data as ExpenseReport} />
    case 'income': return <IncomeView report={data as IncomeReport} />
    case 'debts': return <DebtView report={data as DebtReport} />
  }
}

export function ReportsPage() {
  const { user } = useAuth()
  const { showError, showSuccess } = useFeedback()
  const currenciesQuery = useCurrencies()
  const [kind, setKind] = useState<ReportKind>('summary')
  const [period, setPeriod] = useState<ReportPeriod>('MONTHLY')
  const [referenceDate, setReferenceDate] = useState(localToday)
  const [currency, setCurrency] = useState('MXN')
  const currencyOptions = toCurrencySelectOptions(currenciesQuery.data)
  const periods = allowedPeriods(kind)
  const financialReport = ['summary', 'expenses', 'income', 'debts'].includes(kind)
  const reportQuery = useReportQuery({
    kind,
    userId: user?.id,
    period,
    referenceDate,
    currency,
  })
  const downloadMutation = useMutation({
    mutationFn: (format: ReportExportFormat) => downloadReport({
      kind,
      userId: user!.id,
      period,
      referenceDate,
      currency,
      format,
    }),
    onSuccess: ({ blob, fileName }) => {
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      showSuccess('Reporte descargado correctamente.')
    },
    onError: (error) => showError(getApiErrorMessage(error)),
  })

  const changeReport = (nextKind: ReportKind) => {
    setKind(nextKind)
    if (!allowedPeriods(nextKind).includes(period)) setPeriod('MONTHLY')
  }

  return (
    <ModulePageLayout
      contentClassName="pb-1"
      description="Consulta indicadores y movimientos por periodo para cada módulo."
      title="Reportes"
    >
      <div className="grid gap-3">
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Tabs
            allowScrollButtonsMobile
            onChange={(_, value: ReportKind) => changeReport(value)}
            scrollButtons="auto"
            value={kind}
            variant="scrollable"
          >
            {reportTabs.map((tab) => (
              <Tab
                icon={<MaterialSymbol name={tab.icon} size={20} />}
                iconPosition="start"
                key={tab.kind}
                label={tab.label}
                value={tab.kind}
              />
            ))}
          </Tabs>
        </Paper>

        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
          <div className={`grid gap-3 ${financialReport ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <TextField
              fullWidth
              label="Periodo"
              onChange={(event) => setPeriod(event.target.value as ReportPeriod)}
              select
              size="small"
              value={period}
            >
              {periods.map((value) => <MenuItem key={value} value={value}>{periodLabels[value]}</MenuItem>)}
            </TextField>
            <TextField
              fullWidth
              label="Fecha de referencia"
              onChange={(event) => setReferenceDate(event.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={referenceDate}
            />
            {financialReport && (
              <TextField
                fullWidth
                label="Moneda"
                onChange={(event) => setCurrency(event.target.value)}
                select
                size="small"
                value={currency}
              >
                {(currencyOptions.length ? currencyOptions : [{ label: 'MXN — Peso mexicano', value: 'MXN' }])
                  .map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </TextField>
            )}
          </div>
          <Box
            sx={{
              alignItems: { xs: 'stretch', sm: 'center' },
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
              justifyContent: 'flex-end',
              mt: 2,
              pt: 2,
            }}
          >
            <Typography color="text.secondary" sx={{ mr: { sm: 'auto' } }} variant="body2">
              Descargar el reporte actual
            </Typography>
            {([
              ['PDF', 'picture_as_pdf', 'PDF'],
              ['XLSX', 'table_view', 'Excel'],
              ['CSV', 'csv', 'CSV'],
            ] as const).map(([format, icon, label]) => (
              <Button
                disabled={!user?.id || downloadMutation.isPending}
                key={format}
                onClick={() => downloadMutation.mutate(format)}
                startIcon={downloadMutation.isPending && downloadMutation.variables === format
                  ? <CircularProgress color="inherit" size={16} />
                  : <MaterialSymbol name={icon} size={19} />}
                variant={format === 'PDF' ? 'contained' : 'outlined'}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Paper>

        {reportQuery.isFetching && <LinearProgress aria-label="Actualizando reporte" />}
        {reportQuery.isLoading && (
          <div className="grid min-h-64 place-items-center"><CircularProgress aria-label="Cargando reporte" /></div>
        )}
        {reportQuery.error && <Alert severity="error">{getApiErrorMessage(reportQuery.error)}</Alert>}
        {reportQuery.data && <ReportContent data={reportQuery.data} kind={kind} />}
      </div>
    </ModulePageLayout>
  )
}
