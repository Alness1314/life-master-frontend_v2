import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
} from '@mui/material'
import { getApiErrorMessage } from '../../../api/client'
import { useAuth } from '../../../auth/useAuth'
import { useFeedback } from '../../../components/feedback/useFeedback'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { ModulePageLayout } from '../../../components/layout/ModulePageLayout'
import { DynamicDataTable } from '../../../components/table/DynamicDataTable'
import type { DataTableColumn } from '../../../components/table/DynamicDataTable'
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
  CUSTOM: 'Personalizado',
}

function allowedPeriods(kind: ReportKind): ReportPeriod[] {
  if (kind === 'assistance') return ['WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'CUSTOM']
  if (kind === 'exercises' || kind === 'nutrition') return ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']
  return ['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'CUSTOM']
}

function localDate(offsetDays = 0) {
  const value = new Date()
  value.setDate(value.getDate() + offsetDays)
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${value.getFullYear()}-${month}-${day}`
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`))
}

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function timeLabel(value: string | null) {
  return value ? value.slice(0, 5) : '—'
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return hours ? `${hours} h ${remaining ? `${remaining} min` : ''}`.trim() : `${remaining} min`
}

function moneyFormatter(currency: string) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency })
}

interface SummaryRow {
  id: string
  section: string
  indicator: string
  value: string
}

function SummaryTable({ report }: { report: ConsolidatedReport }) {
  const money = moneyFormatter(report.currency)
  const rows: SummaryRow[] = [
    ['financial-income', 'Finanzas', 'Ingresos', money.format(report.financial.income)],
    ['financial-expenses', 'Finanzas', 'Gastos', money.format(report.financial.expenses)],
    ['financial-paid', 'Finanzas', 'Gastos pagados', money.format(report.financial.paidExpenses)],
    ['financial-pending', 'Finanzas', 'Gastos pendientes', money.format(report.financial.pendingExpenses)],
    ['financial-debt-proceeds', 'Finanzas', 'Entradas por deuda', money.format(report.financial.debtProceeds)],
    ['financial-debt-payments', 'Finanzas', 'Pagos de deuda', money.format(report.financial.debtPayments)],
    ['financial-outstanding', 'Finanzas', 'Deuda pendiente', money.format(report.financial.outstandingDebt)],
    ['financial-result', 'Finanzas', 'Resultado operativo', money.format(report.financial.operatingResult)],
    ['financial-cash-flow', 'Finanzas', 'Flujo neto', money.format(report.financial.netCashFlow)],
    ['activity-assistance', 'Actividad', 'Registros de asistencia', String(report.activity.assistanceRecords)],
    ['activity-retards', 'Actividad', 'Retardos', String(report.activity.retards)],
    ['activity-absences', 'Actividad', 'Ausencias', String(report.activity.absences)],
    ['activity-exercises', 'Actividad', 'Sesiones de ejercicio', String(report.activity.exerciseSessions)],
    ['activity-minutes', 'Actividad', 'Tiempo de ejercicio', durationLabel(report.activity.exerciseMinutes)],
    ['nutrition-meals', 'Nutrición', 'Comidas registradas', String(report.activity.nutritionMeals)],
    ['nutrition-calories', 'Nutrición', 'Calorías conocidas', report.activity.knownCalories.toLocaleString('es-MX')],
  ].map(([id, section, indicator, value]) => ({ id, section, indicator, value }))
  const columns: DataTableColumn<SummaryRow>[] = [
    { id: 'section', header: 'Sección', render: (row) => row.section, sortValue: (row) => row.section, filter: false },
    { id: 'indicator', header: 'Indicador', render: (row) => row.indicator, sortValue: (row) => row.indicator, filter: false },
    { id: 'value', header: 'Valor', align: 'right', render: (row) => row.value, sortValue: (row) => row.value, filter: false },
  ]
  return <DynamicDataTable columns={columns} data={rows} getRowId={(row) => row.id} initialPageSize={25} />
}

function AssistanceTable({ report }: { report: AssistanceReport }) {
  const columns: DataTableColumn<AssistanceReportItem>[] = [
    { id: 'date', header: 'Fecha', render: (row) => dateLabel(row.workDate), sortValue: (row) => row.workDate, filter: false },
    { id: 'entry', header: 'Entrada', align: 'center', render: (row) => timeLabel(row.timeEntry), sortValue: (row) => row.timeEntry, filter: false },
    { id: 'departure', header: 'Salida', align: 'center', render: (row) => timeLabel(row.departureTime), sortValue: (row) => row.departureTime, filter: false },
    { id: 'worked', header: 'Tiempo trabajado', align: 'center', render: (row) => durationLabel(row.workedMinutes), sortValue: (row) => row.workedMinutes, filter: false },
    { id: 'status', header: 'Estado', render: (row) => row.unjustifiedAbsence ? 'Falta' : row.justifiedAbsence ? 'Falta justificada' : row.retard ? 'Retardo' : 'A tiempo', sortValue: (row) => row.unjustifiedAbsence ? 'Falta' : row.justifiedAbsence ? 'Falta justificada' : row.retard ? 'Retardo' : 'A tiempo', filter: false },
  ]
  return <DynamicDataTable columns={columns} data={report.items} getRowId={(row) => row.id} initialPageSize={10} />
}

function ExerciseTable({ report }: { report: ExerciseReport }) {
  const columns: DataTableColumn<ExerciseReportItem>[] = [
    { id: 'date', header: 'Fecha', render: (row) => dateLabel(row.trainingDate), sortValue: (row) => row.trainingDate, filter: false },
    { id: 'activity', header: 'Actividad', render: (row) => row.activityType || 'Sin especificar', sortValue: (row) => row.activityType, filter: false },
    { id: 'start', header: 'Inicio', align: 'center', render: (row) => timeLabel(row.startTime), sortValue: (row) => row.startTime, filter: false },
    { id: 'end', header: 'Fin', align: 'center', render: (row) => timeLabel(row.endTime), sortValue: (row) => row.endTime, filter: false },
    { id: 'duration', header: 'Duración', align: 'center', render: (row) => durationLabel(row.durationMinutes ?? 0), sortValue: (row) => row.durationMinutes, filter: false },
    { id: 'notes', header: 'Notas', minWidth: 300, render: (row) => row.notes || '—', sortValue: (row) => row.notes, filter: false },
  ]
  return <DynamicDataTable columns={columns} data={report.items} getRowId={(row) => row.id} initialPageSize={10} />
}

function NutritionTable({ report }: { report: NutritionReport }) {
  const columns: DataTableColumn<NutritionReportItem>[] = [
    { id: 'date', header: 'Consumo', render: (row) => dateTimeLabel(row.consumedAt), sortValue: (row) => row.consumedAt, filter: false },
    { id: 'name', header: 'Nombre', render: (row) => row.name, sortValue: (row) => row.name, filter: false },
    { id: 'type', header: 'Tipo de comida', render: (row) => row.mealType || 'Sin especificar', sortValue: (row) => row.mealType, filter: false },
    { id: 'foods', header: 'Alimentos', minWidth: 320, render: (row) => row.foods.length ? row.foods.map((food) => `${food.name} (${food.quantity}${food.unitMeasurement ? ` ${food.unitMeasurement}` : ''})`).join(', ') : 'Sin alimentos detallados', filter: false },
    { id: 'calories', header: 'Calorías', align: 'right', render: (row) => row.foods.reduce((total, food) => total + (food.calories ?? 0), 0).toLocaleString('es-MX'), filter: false },
    { id: 'notes', header: 'Notas', minWidth: 260, render: (row) => row.notes || '—', sortValue: (row) => row.notes, filter: false },
  ]
  return <DynamicDataTable columns={columns} data={report.items} getRowId={(row) => row.id} initialPageSize={10} />
}

function ExpenseTable({ report }: { report: ExpenseReport }) {
  const money = moneyFormatter(report.currency)
  const columns: DataTableColumn<ExpenseReportItem>[] = [
    { id: 'date', header: 'Fecha', render: (row) => dateLabel(row.paymentDate), sortValue: (row) => row.paymentDate, filter: false },
    { id: 'description', header: 'Descripción', minWidth: 300, render: (row) => row.description, sortValue: (row) => row.description, filter: false },
    { id: 'category', header: 'Categoría', render: (row) => row.category || 'Sin categoría', sortValue: (row) => row.category, filter: false },
    { id: 'entity', header: 'Entidad', render: (row) => row.bankOrEntity, sortValue: (row) => row.bankOrEntity, filter: false },
    { id: 'status', header: 'Estado', render: (row) => row.paid ? 'Pagado' : 'Pendiente', sortValue: (row) => row.paid, filter: false },
    { id: 'amount', header: 'Importe', align: 'right', render: (row) => money.format(row.amount), sortValue: (row) => row.amount, filter: false },
  ]
  return <DynamicDataTable columns={columns} data={report.items} getRowId={(row) => row.id} initialPageSize={10} />
}

function IncomeTable({ report }: { report: IncomeReport }) {
  const money = moneyFormatter(report.currency)
  const columns: DataTableColumn<IncomeReportItem>[] = [
    { id: 'date', header: 'Fecha', render: (row) => dateLabel(row.paymentDate), sortValue: (row) => row.paymentDate, filter: false },
    { id: 'source', header: 'Fuente', render: (row) => row.source, sortValue: (row) => row.source, filter: false },
    { id: 'description', header: 'Descripción', minWidth: 400, render: (row) => row.description, sortValue: (row) => row.description, filter: false },
    { id: 'amount', header: 'Importe', align: 'right', render: (row) => money.format(row.amount), sortValue: (row) => row.amount, filter: false },
  ]
  return <DynamicDataTable columns={columns} data={report.items} getRowId={(row) => row.id} initialPageSize={10} />
}

function DebtTable({ report }: { report: DebtReport }) {
  const money = moneyFormatter(report.currency)
  const columns: DataTableColumn<DebtReportItem>[] = [
    { id: 'creditor', header: 'Acreedor', render: (row) => row.creditor, sortValue: (row) => row.creditor, filter: false },
    { id: 'dueDate', header: 'Vencimiento', render: (row) => dateLabel(row.dueDate), sortValue: (row) => row.dueDate, filter: false },
    { id: 'total', header: 'Importe original', align: 'right', render: (row) => money.format(row.totalAmount), sortValue: (row) => row.totalAmount, filter: false },
    { id: 'paid', header: 'Capital pagado', align: 'right', render: (row) => money.format(row.paidPrincipal), sortValue: (row) => row.paidPrincipal, filter: false },
    { id: 'pending', header: 'Saldo pendiente', align: 'right', render: (row) => money.format(row.outstandingAmount), sortValue: (row) => row.outstandingAmount, filter: false },
    { id: 'progress', header: 'Avance', align: 'center', render: (row) => `${Number(row.progressPercentage).toFixed(1)}%`, sortValue: (row) => row.progressPercentage, filter: false },
    { id: 'status', header: 'Estado', render: (row) => row.fullyPaid ? 'Liquidada' : row.overdue ? 'Vencida' : 'Pendiente', sortValue: (row) => row.fullyPaid ? 'Liquidada' : row.overdue ? 'Vencida' : 'Pendiente', filter: false },
  ]
  return <DynamicDataTable columns={columns} data={report.items} getRowId={(row) => row.id} initialPageSize={10} />
}

function ReportTable<K extends ReportKind>({ kind, data }: { kind: K; data: ReportDataByKind[K] }) {
  switch (kind) {
    case 'summary': return <SummaryTable report={data as ConsolidatedReport} />
    case 'assistance': return <AssistanceTable report={data as AssistanceReport} />
    case 'exercises': return <ExerciseTable report={data as ExerciseReport} />
    case 'nutrition': return <NutritionTable report={data as NutritionReport} />
    case 'expenses': return <ExpenseTable report={data as ExpenseReport} />
    case 'income': return <IncomeTable report={data as IncomeReport} />
    case 'debts': return <DebtTable report={data as DebtReport} />
  }
}

export function ReportsPage() {
  const { user } = useAuth()
  const { showError, showSuccess } = useFeedback()
  const [kind, setKind] = useState<ReportKind>('summary')
  const [period, setPeriod] = useState<ReportPeriod>('MONTHLY')
  const [referenceDate, setReferenceDate] = useState(localDate)
  const [from, setFrom] = useState(() => localDate(-30))
  const [to, setTo] = useState(localDate)
  const customDatesValid = period !== 'CUSTOM' || (Boolean(from && to) && from <= to)
  const reportQuery = useReportQuery({
    enabled: customDatesValid,
    kind,
    userId: user?.id,
    period,
    referenceDate,
    from,
    to,
    currency: 'MXN',
  })
  const downloadMutation = useMutation({
    mutationFn: (format: ReportExportFormat) => downloadReport({
      kind,
      userId: user!.id,
      period,
      referenceDate,
      from,
      to,
      currency: 'MXN',
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

  const changeKind = (nextKind: ReportKind) => {
    setKind(nextKind)
    if (!allowedPeriods(nextKind).includes(period)) setPeriod('MONTHLY')
  }

  return (
    <ModulePageLayout description="Consulta los registros de cada módulo por periodo." title="Reportes">
      <div className="grid gap-3">
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Tabs allowScrollButtonsMobile onChange={(_, value: ReportKind) => changeKind(value)} scrollButtons="auto" value={kind} variant="scrollable">
            {reportTabs.map((tab) => (
              <Tab icon={<MaterialSymbol name={tab.icon} size={20} />} iconPosition="start" key={tab.kind} label={tab.label} value={tab.kind} />
            ))}
          </Tabs>
        </Paper>

        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: period === 'CUSTOM' ? { xs: '1fr', md: 'repeat(3, 1fr)' } : { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            <TextField label="Periodo" onChange={(event) => setPeriod(event.target.value as ReportPeriod)} select size="small" value={period}>
              {allowedPeriods(kind).map((value) => <MenuItem key={value} value={value}>{periodLabels[value]}</MenuItem>)}
            </TextField>
            {period === 'CUSTOM' ? (
              <>
                <TextField error={Boolean(from && to && from > to)} label="Desde" onChange={(event) => setFrom(event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={from} />
                <TextField error={Boolean(from && to && from > to)} helperText={from && to && from > to ? 'La fecha hasta debe ser igual o posterior.' : undefined} label="Hasta" onChange={(event) => setTo(event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={to} />
              </>
            ) : (
              <TextField label="Fecha de referencia" onChange={(event) => setReferenceDate(event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={referenceDate} />
            )}
          </Box>
          <Box sx={{ alignItems: { xs: 'stretch', sm: 'center' }, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, justifyContent: 'flex-end', mt: 2, pt: 2 }}>
            {([['PDF', 'picture_as_pdf', 'PDF'], ['XLSX', 'table_view', 'Excel'], ['CSV', 'csv', 'CSV']] as const).map(([format, icon, label]) => (
              <Button disabled={!customDatesValid || !reportQuery.data || downloadMutation.isPending} key={format} onClick={() => downloadMutation.mutate(format)} startIcon={downloadMutation.isPending && downloadMutation.variables === format ? <CircularProgress color="inherit" size={16} /> : <MaterialSymbol name={icon} size={19} />} variant={format === 'PDF' ? 'contained' : 'outlined'}>
                {label}
              </Button>
            ))}
          </Box>
        </Paper>

        {reportQuery.isFetching && <LinearProgress aria-label="Actualizando reporte" />}
        {reportQuery.error && <Alert severity="error">{getApiErrorMessage(reportQuery.error)}</Alert>}
        {reportQuery.data && <ReportTable data={reportQuery.data} kind={kind} />}
        {!reportQuery.data && reportQuery.isLoading && <Box sx={{ display: 'grid', minHeight: 240, placeItems: 'center' }}><CircularProgress /></Box>}
      </div>
    </ModulePageLayout>
  )
}
