import { Alert, Button, Chip, CircularProgress, Divider, LinearProgress, Paper, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../../api/client'
import { useAuth } from '../../../auth/useAuth'
import { FormPageLayout } from '../../../components/form/FormPageLayout'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { API_ROUTES } from '../../../config/apiRoutes'
import type { Debt } from '../types'

const money = (value: number, currency: string) => new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(value)

export function DebtDetailsPage() {
  const navigate = useNavigate()
  const { debtId } = useParams()
  const { user } = useAuth()
  const query = useQuery({ queryKey: ['debts', user?.id, debtId], queryFn: async () => (await apiClient.get<Debt>(API_ROUTES.debts.byId(user!.id, debtId!))).data, enabled: Boolean(user && debtId) })
  const debt = query.data
  return <FormPageLayout title="Detalle de deuda" description="Consulta el saldo y el historial de pagos de la deuda."
    ancestors={[{ label: 'Catálogos', to: '/catalogs' }, { label: 'Deudas', to: '/debts' }]}
    actions={<Button onClick={() => navigate('/debts')} startIcon={<MaterialSymbol name="arrow_back" size={20} />} variant="outlined">Volver</Button>}>
    {query.isLoading && <div className="grid min-h-64 place-items-center"><CircularProgress /></div>}
    {query.error && <Alert severity="error">No fue posible cargar la deuda.</Alert>}
    {debt && <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-7"><div className="flex items-center gap-4"><MaterialSymbol name="account_balance_wallet" size={40} style={{ color: '#7567e8' }} /><div><Typography variant="h5">{debt.creditorName}</Typography><Chip color={debt.isFullyPaid ? 'success' : 'warning'} label={debt.isFullyPaid ? 'Pagada' : 'Pendiente'} size="small" variant="outlined" /></div></div><Button onClick={() => navigate(`/debts/update/${debt.id}`)} startIcon={<MaterialSymbol name="edit" size={20} />} variant="contained">Editar</Button></div>
      <Divider />
      <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-4">
        {[['Monto total', money(debt.totalAmount, debt.currency)], ['Capital pagado', money(debt.paidAmount, debt.currency)], ['Saldo pendiente', money(debt.outstandingAmount, debt.currency)], ['Vencimiento', debt.dueDate], ['Número de pagos', debt.numberOfPayments], ['Pagos realizados', debt.paymentsMade], ['Entregó dinero', debt.disbursesFunds ? 'Sí' : 'No'], ['Monto recibido', debt.disbursesFunds ? money(Number(debt.receivedAmount), debt.currency) : 'No aplica'], ['Fecha del depósito', debt.receivedDate || 'No aplica'], ['Intereses', debt.hasInterest ? 'Sí' : 'No'], ['Notas', debt.notes || 'Sin información']].map(([label, value]) => <div key={String(label)}><Typography color="text.secondary" variant="body2">{label}</Typography><Typography sx={{ mt: .5 }}>{value}</Typography></div>)}
        <div className="sm:col-span-2 xl:col-span-4"><Typography color="text.secondary" variant="body2">Progreso</Typography><div className="mt-2 flex items-center gap-3"><LinearProgress sx={{ flex: 1, height: 8, borderRadius: 4 }} value={Math.min(100, Number(debt.progressPercentage ?? 0))} variant="determinate" /><Typography>{Number(debt.progressPercentage ?? 0).toFixed(0)}%</Typography></div></div>
      </div>
      <Divider />
      <div className="p-5 sm:p-7"><Typography sx={{ mb: 2 }} variant="h6">Pagos</Typography><div className="grid gap-3">{debt.payments?.length ? debt.payments.map((payment, index) => <Paper key={payment.id ?? index} variant="outlined" sx={{ p: 2 }}><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><div><Typography color="text.secondary" variant="caption">No.</Typography><Typography>{index + 1}</Typography></div><div><Typography color="text.secondary" variant="caption">Fecha</Typography><Typography>{payment.paymentDate}</Typography></div><div><Typography color="text.secondary" variant="caption">Capital</Typography><Typography>{money(payment.principalAmount ?? payment.amountPaid, debt.currency)}</Typography></div><div><Typography color="text.secondary" variant="caption">Intereses</Typography><Typography>{money(payment.interestAmount ?? 0, debt.currency)}</Typography></div><div><Typography color="text.secondary" variant="caption">Salida total</Typography><Typography>{money(payment.amountPaid, debt.currency)}</Typography></div><div><Typography color="text.secondary" variant="caption">Estado</Typography><Typography>{payment.isPaid ? 'Pagado' : 'Pendiente'}</Typography></div><div className="sm:col-span-2 xl:col-span-6"><Typography color="text.secondary" variant="caption">Método</Typography><Typography>{payment.paymentMethod}</Typography></div>{payment.notes && <div className="sm:col-span-2 xl:col-span-6"><Typography color="text.secondary" variant="caption">Notas</Typography><Typography sx={{ whiteSpace: 'pre-wrap' }}>{payment.notes}</Typography></div>}</div></Paper>) : <Typography color="text.secondary">No hay pagos registrados.</Typography>}</div></div>
    </Paper>}
  </FormPageLayout>
}
