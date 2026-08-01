import { useMemo, useState } from 'react'
import { Button, Chip } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { useAuth } from '../../../auth/useAuth'
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog'
import { useFeedback } from '../../../components/feedback/useFeedback'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { ModulePageLayout } from '../../../components/layout/ModulePageLayout'
import { DynamicDataTable } from '../../../components/table/DynamicDataTable'
import type { DataTableColumn } from '../../../components/table/DynamicDataTable'
import { TableRowActions } from '../../../components/table/TableRowActions'
import { deleteExpense, useExpenses } from '../api'
import type { Expense } from '../api'
import { useModulePermission } from '../../modules/api'

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function formatMoney(amount: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function ExpensesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { showSuccess } = useFeedback()
  const access = useModulePermission('expenses')
  const { data: expenses = [], isLoading, error } = useExpenses(user?.id)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => deleteExpense(user!.id, expenseId),
    onSuccess: async () => {
      setExpenseToDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] })
      showSuccess('Gasto eliminado correctamente.')
    },
  })

  const closeDeleteDialog = () => {
    if (deleteMutation.isPending) return
    setExpenseToDelete(null)
    deleteMutation.reset()
  }

  const columns = useMemo<DataTableColumn<Expense>[]>(() => [
    {
      id: 'number',
      header: 'No.',
      align: 'center',
      width: 65,
      render: (_, rowIndex) => rowIndex + 1,
    },
    {
      id: 'description',
      header: 'Descripción',
      align: 'center',
      minWidth: 220,
      render: (expense) => expense.description,
      sortValue: (expense) => expense.description,
    },
    {
      id: 'entity',
      header: 'Banco o entidad',
      align: 'center',
      minWidth: 160,
      render: (expense) => expense.bankOrEntity,
      sortValue: (expense) => expense.bankOrEntity,
    },
    {
      id: 'category',
      header: 'Categoría',
      align: 'center',
      minWidth: 130,
      render: (expense) => expense.category?.name ?? 'Sin categoría',
      sortValue: (expense) => expense.category?.name,
    },
    {
      id: 'amount',
      header: 'Monto',
      align: 'center',
      minWidth: 130,
      render: (expense) => formatMoney(expense.amount, expense.currency ?? 'MXN'),
      sortValue: (expense) => expense.amount,
    },
    {
      id: 'date',
      header: 'Fecha de pago',
      align: 'center',
      minWidth: 140,
      render: (expense) => dateFormatter.format(new Date(`${expense.paymentDate}T00:00:00`)),
      sortValue: (expense) => expense.paymentDate,
    },
    {
      id: 'status',
      header: 'Estado',
      align: 'center',
      minWidth: 100,
      render: (expense) => (
        <Chip
          color={expense.paymentStatus ? 'success' : 'warning'}
          label={expense.paymentStatus ? 'Pagado' : 'Pendiente'}
          size="small"
          variant={expense.paymentStatus ? 'filled' : 'outlined'}
        />
      ),
      sortValue: (expense) => expense.paymentStatus,
    },
    {
      id: 'actions',
      header: 'Acciones',
      align: 'center',
      minWidth: 150,
      render: (expense) => (
        <TableRowActions
          onDelete={access.canDelete ? () => setExpenseToDelete(expense) : undefined}
          onEdit={access.canUpdate ? () => navigate(`/expenses/update/${expense.id}`) : undefined}
          onView={access.canRead ? () => navigate(`/expenses/details/${expense.id}`) : undefined}
        />
      ),
    },
  ], [access.canDelete, access.canRead, access.canUpdate, navigate])

  return (
    <ModulePageLayout
      actions={access.canCreate ? (
        <Button
          onClick={() => navigate('/expenses/register')}
          startIcon={<MaterialSymbol name="add" size={20} />}
          variant="contained"
        >
          Registrar gasto
        </Button>
      ) : undefined}
      ancestors={[{ label: 'Catálogos', to: '/catalogs' }]}
      description="Administra y consulta tus gastos."
      title="Gastos"
    >
      <DynamicDataTable
        columns={columns}
        data={expenses}
        emptyMessage="No hay gastos registrados."
        error={error ? 'No fue posible cargar los gastos.' : null}
        getRowId={(expense) => expense.id}
        initialPageSize={5}
        loading={isLoading}
      />

      <ConfirmDialog
        confirmLabel="Sí, eliminar"
        error={deleteMutation.error ? getApiErrorMessage(deleteMutation.error) : null}
        message={(
          <>
            ¿Deseas eliminar el gasto <strong>{expenseToDelete?.description}</strong>?
            <br />
            Esta acción no se puede revertir.
          </>
        )}
        onClose={closeDeleteDialog}
        onConfirm={() => expenseToDelete && deleteMutation.mutate(expenseToDelete.id)}
        open={Boolean(expenseToDelete)}
        pending={deleteMutation.isPending}
        title="Eliminar gasto"
        tone="danger"
      />
    </ModulePageLayout>
  )
}
