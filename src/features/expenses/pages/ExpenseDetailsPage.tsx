import { Alert, Button, Chip, CircularProgress, Divider, Paper, Typography } from '@mui/material'
import { useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient, getApiErrorMessage } from '../../../api/client'
import { useAuth } from '../../../auth/useAuth'
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog'
import { useFeedback } from '../../../components/feedback/useFeedback'
import { FormPageLayout } from '../../../components/form/FormPageLayout'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { API_ROUTES } from '../../../config/apiRoutes'
import { useExpense } from '../api'

function Detail({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <MaterialSymbol name={icon} size={22} style={{ color: '#7567e8' }} />
      <div>
        <Typography color="text.secondary" variant="body2">{label}</Typography>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  )
}

interface ExpenseReceipt {
  id: string
  expenseId: string
  originalName: string
  contentType: string
  sizeBytes: number
  createdAt: string
}

export function ExpenseDetailsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { showSuccess } = useFeedback()
  const { expenseId } = useParams()
  const [receiptToDelete, setReceiptToDelete] = useState<ExpenseReceipt | null>(null)
  const { data: expense, isLoading, error } = useExpense(user?.id, expenseId)
  const receiptsQuery = useQuery({
    queryKey: ['expense-receipts', user?.id, expenseId],
    queryFn: async () => (
      await apiClient.get<ExpenseReceipt[]>(API_ROUTES.receipts.root(user!.id, expenseId!))
    ).data,
    enabled: Boolean(user && expenseId),
  })
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData()
      body.append('file', file)
      return apiClient.post(API_ROUTES.receipts.root(user!.id, expenseId!), body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expense-receipts', user?.id, expenseId] })
      showSuccess('Comprobante adjuntado correctamente.')
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(API_ROUTES.receipts.byId(user!.id, expenseId!, id)),
    onSuccess: async () => {
      setReceiptToDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['expense-receipts', user?.id, expenseId] })
      showSuccess('Comprobante eliminado correctamente.')
    },
  })
  const downloadReceipt = async (receipt: ExpenseReceipt) => {
    const response = await apiClient.get(
      API_ROUTES.receipts.content(user!.id, expenseId!, receipt.id),
      { responseType: 'blob' },
    )
    const url = URL.createObjectURL(response.data)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = receipt.originalName
    anchor.click()
    URL.revokeObjectURL(url)
  }
  const uploadReceipt = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) uploadMutation.mutate(file)
    event.target.value = ''
  }

  return (
    <FormPageLayout
      actions={(
        <Button
          onClick={() => navigate('/expenses')}
          startIcon={<MaterialSymbol name="arrow_back" size={20} />}
          variant="outlined"
        >
          Volver
        </Button>
      )}
      description="Consulta la información registrada del gasto."
      ancestors={[
        { label: 'Catálogos', to: '/catalogs' },
        { label: 'Gastos', to: '/expenses' },
      ]}
      title="Detalle del gasto"
    >
      {isLoading && (
        <div className="grid min-h-64 place-items-center">
          <CircularProgress aria-label="Cargando gasto" />
        </div>
      )}
      {error && <Alert severity="error">No fue posible cargar el gasto.</Alert>}
      {expense && (
        <div className="grid gap-5">
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-7">
            <div>
              <Typography variant="h5">{expense.description}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>{expense.bankOrEntity}</Typography>
            </div>
            <div className="flex items-center gap-3">
              <Chip
                color={expense.paymentStatus ? 'success' : 'warning'}
                label={expense.paymentStatus ? 'Pagado' : 'Pendiente'}
              />
              <Button
                aria-label={`Editar gasto ${expense.description}`}
                onClick={() => navigate(`/expenses/update/${expense.id}`)}
                startIcon={<MaterialSymbol name="edit" size={20} />}
                variant="contained"
              >
                Editar gasto
              </Button>
            </div>
          </div>
          <Divider />
          <div className="grid gap-7 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-3">
            <Detail icon="payments" label="Monto">
              <Typography variant="h6">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: expense.currency ?? 'MXN',
                }).format(expense.amount)}
              </Typography>
            </Detail>
            <Detail icon="category" label="Categoría">
              <Typography>{expense.category?.name}</Typography>
            </Detail>
            <Detail icon="calendar_month" label="Fecha de pago">
              <Typography>{new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })
                .format(new Date(`${expense.paymentDate}T00:00:00`))}</Typography>
            </Detail>
            <Detail icon="account_balance" label="Banco o entidad">
              <Typography>{expense.bankOrEntity}</Typography>
            </Detail>
            <Detail icon="account_balance_wallet" label="Cuenta">
              <Typography>{expense.accountId ? 'Cuenta asociada' : 'Sin cuenta asociada'}</Typography>
            </Detail>
            <Detail icon="credit_card" label="Método de pago">
              <Typography>{expense.paymentMethodId ? 'Método asociado' : 'Sin método asociado'}</Typography>
            </Detail>
          </div>
        </Paper>
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: { xs: 2, sm: 3 } }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Typography variant="h6">Comprobantes</Typography>
              <Typography color="text.secondary">Archivos PDF, PNG o JPEG de hasta 10 MB.</Typography>
            </div>
            <Button
              component="label"
              disabled={uploadMutation.isPending}
              startIcon={<MaterialSymbol name="attach_file" />}
              variant="contained"
            >
              Adjuntar comprobante
              <input accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" hidden onChange={uploadReceipt} type="file" />
            </Button>
          </div>
          {uploadMutation.error && <Alert className="mt-4" severity="error">{getApiErrorMessage(uploadMutation.error)}</Alert>}
          <div className="mt-4 grid gap-2">
            {receiptsQuery.data?.map((receipt) => (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-solid border-[var(--mui-palette-divider)] p-3" key={receipt.id}>
                <div className="flex min-w-0 items-center gap-3">
                  <MaterialSymbol name="description" style={{ color: '#7567e8' }} />
                  <div className="min-w-0">
                    <Typography className="truncate">{receipt.originalName}</Typography>
                    <Typography color="text.secondary" variant="caption">
                      {(receipt.sizeBytes / 1024).toFixed(1)} KB
                    </Typography>
                  </div>
                </div>
                <div>
                  <Button onClick={() => downloadReceipt(receipt)} startIcon={<MaterialSymbol name="download" />}>Descargar</Button>
                  <Button color="error" onClick={() => setReceiptToDelete(receipt)} startIcon={<MaterialSymbol name="delete" />}>Eliminar</Button>
                </div>
              </div>
            ))}
            {receiptsQuery.data?.length === 0 && (
              <Typography color="text.secondary">No hay comprobantes adjuntos.</Typography>
            )}
          </div>
        </Paper>
        </div>
      )}
      <ConfirmDialog
        confirmLabel="Sí, eliminar"
        error={deleteMutation.error ? getApiErrorMessage(deleteMutation.error) : null}
        message={<>¿Deseas eliminar <strong>{receiptToDelete?.originalName}</strong>?</>}
        onClose={() => setReceiptToDelete(null)}
        onConfirm={() => receiptToDelete && deleteMutation.mutate(receiptToDelete.id)}
        open={Boolean(receiptToDelete)}
        pending={deleteMutation.isPending}
        title="Eliminar comprobante"
        tone="danger"
      />
    </FormPageLayout>
  )
}
