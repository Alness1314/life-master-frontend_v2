import { useMemo, useState } from 'react'
import { Button, Chip, LinearProgress, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient, getApiErrorMessage } from '../../../api/client'
import { useAuth } from '../../../auth/useAuth'
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog'
import { useFeedback } from '../../../components/feedback/useFeedback'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { ModulePageLayout } from '../../../components/layout/ModulePageLayout'
import { DynamicDataTable } from '../../../components/table/DynamicDataTable'
import type { DataTableColumn } from '../../../components/table/DynamicDataTable'
import { TableRowActions } from '../../../components/table/TableRowActions'
import { API_ROUTES } from '../../../config/apiRoutes'
import type { Debt } from '../types'
import { useModulePermission } from '../../modules/api'

const money = (value: number, currency = 'MXN') =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(value)

export function DebtsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { showSuccess } = useFeedback()
  const access = useModulePermission('debts')
  const [selected, setSelected] = useState<Debt | null>(null)
  const query = useQuery({
    queryKey: ['debts', user?.id],
    queryFn: async () => (await apiClient.get<Debt[]>(API_ROUTES.debts.root(user!.id))).data,
    enabled: Boolean(user),
  })
  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(API_ROUTES.debts.byId(user!.id, id)),
    onSuccess: async () => {
      setSelected(null)
      await queryClient.invalidateQueries({ queryKey: ['debts', user?.id] })
      showSuccess('Deuda eliminada correctamente.')
    },
  })
  const columns = useMemo<DataTableColumn<Debt>[]>(() => [
    { id: 'number', header: 'No.', align: 'center', width: 60, render: (_, index) => index + 1 },
    { id: 'creditor', header: 'Acreedor', align: 'center', minWidth: 180, render: (row) => row.creditorName },
    { id: 'total', header: 'Monto total', align: 'center', minWidth: 130, render: (row) => money(row.totalAmount, row.currency) },
    { id: 'balance', header: 'Saldo pendiente', align: 'center', minWidth: 150, render: (row) => money(row.outstandingAmount, row.currency) },
    {
      id: 'progress', header: 'Progreso', align: 'center', minWidth: 170,
      render: (row) => <div className="mx-auto w-36"><Typography variant="caption">{Number(row.progressPercentage ?? 0).toFixed(0)}%</Typography><LinearProgress value={Math.min(100, Number(row.progressPercentage ?? 0))} variant="determinate" /></div>,
    },
    { id: 'dueDate', header: 'Vencimiento', align: 'center', minWidth: 125, render: (row) => new Intl.DateTimeFormat('es-MX').format(new Date(`${row.dueDate}T00:00:00`)) },
    { id: 'status', header: 'Estado', align: 'center', minWidth: 110, render: (row) => <Chip color={row.isFullyPaid ? 'success' : 'warning'} label={row.isFullyPaid ? 'Pagada' : 'Pendiente'} size="small" variant="outlined" /> },
    {
      id: 'actions', header: 'Acciones', align: 'center', minWidth: 150,
      render: (row) => <TableRowActions
        onDelete={access.canDelete ? () => setSelected(row) : undefined}
        onEdit={access.canUpdate ? () => navigate(`/debts/update/${row.id}`) : undefined}
        onView={access.canRead ? () => navigate(`/debts/details/${row.id}`) : undefined}
      />,
    },
  ], [access.canDelete, access.canRead, access.canUpdate, navigate])

  return <ModulePageLayout
    actions={access.canCreate ? <Button onClick={() => navigate('/debts/register')} startIcon={<MaterialSymbol name="add" size={20} />} variant="contained">Registrar deuda</Button> : undefined}
    ancestors={[{ label: 'Catálogos', to: '/catalogs' }]}
    description="Administra tus deudas, pagos y saldos pendientes."
    title="Deudas"
  >
    <DynamicDataTable columns={columns} data={query.data ?? []} emptyMessage="No hay deudas registradas." error={query.error ? 'No fue posible cargar las deudas.' : null} getRowId={(row) => row.id} loading={query.isLoading} />
    <ConfirmDialog confirmLabel="Sí, eliminar" error={remove.error ? getApiErrorMessage(remove.error) : null}
      message={<>¿Deseas eliminar la deuda con <strong>{selected?.creditorName}</strong>?<br />Esta acción no se puede revertir.</>}
      onClose={() => !remove.isPending && setSelected(null)} onConfirm={() => selected && remove.mutate(selected.id)}
      open={Boolean(selected)} pending={remove.isPending} title="Eliminar deuda" tone="danger" />
  </ModulePageLayout>
}
