import { useMemo, useState } from 'react'
import {
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog'
import { useFeedback } from '../../../components/feedback/useFeedback'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { ModulePageLayout } from '../../../components/layout/ModulePageLayout'
import { DynamicDataTable } from '../../../components/table/DynamicDataTable'
import type { DataTableColumn } from '../../../components/table/DynamicDataTable'
import { TEXTS } from '../../../config/texts'
import { deleteUser, useUsers } from '../api'
import type { CurrentUser } from '../api'
import { useModulePermission } from '../../modules/api'

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const actionButtonStyles = {
  bgcolor: '#c9c5f7',
  borderRadius: '8px',
  color: '#393467',
  height: 36,
  width: 36,
  '&:hover': {
    bgcolor: '#d8d5fa',
  },
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export function UsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess } = useFeedback()
  const access = useModulePermission('users')
  const { data: users = [], isLoading, error } = useUsers()
  const [userToDelete, setUserToDelete] = useState<CurrentUser | null>(null)

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      setUserToDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      showSuccess(TEXTS.users.delete.success)
    },
  })

  const closeDeleteDialog = () => {
    if (deleteMutation.isPending) return
    setUserToDelete(null)
    deleteMutation.reset()
  }

  const columns = useMemo<DataTableColumn<CurrentUser>[]>(() => [
    {
      id: 'number',
      header: TEXTS.users.columns.number,
      align: 'center',
      width: 70,
      render: (_, rowIndex) => rowIndex + 1,
    },
    {
      id: 'fullName',
      header: TEXTS.users.columns.name,
      minWidth: 160,
      render: (user) => user.fullName,
      sortValue: (user) => user.fullName,
    },
    {
      id: 'username',
      header: TEXTS.users.columns.email,
      minWidth: 220,
      render: (user) => user.username,
      sortValue: (user) => user.username,
    },
    {
      id: 'profile',
      header: TEXTS.users.columns.profile,
      minWidth: 130,
      render: (user) => user.profiles.map((profile) => profile.name).join(', ') || 'Sin perfil',
      sortValue: (user) => user.profiles[0]?.name,
    },
    {
      id: 'verified',
      header: TEXTS.users.columns.verified,
      align: 'center',
      render: (user) => (
        <Chip
          color={user.verified ? 'success' : 'default'}
          label={user.verified ? 'Sí' : 'No'}
          size="small"
          variant="outlined"
        />
      ),
      sortValue: (user) => user.verified,
    },
    {
      id: 'status',
      header: TEXTS.users.columns.status,
      align: 'center',
      render: (user) => (
        <Chip
          color={user.erased ? 'default' : 'success'}
          label={user.erased ? 'Inactivo' : 'Activo'}
          size="small"
        />
      ),
      sortValue: (user) => user.erased,
    },
    {
      id: 'created',
      header: TEXTS.users.columns.created,
      minWidth: 145,
      render: (user) => formatDate(user.created),
      sortValue: (user) => new Date(user.created),
    },
    {
      id: 'actions',
      header: TEXTS.common.actions,
      align: 'center',
      minWidth: 150,
      render: (user) => (
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
          {access.canRead && <Tooltip title="Ver detalle">
            <IconButton
              onClick={() => navigate(`/users/details/${user.id}`)}
              size="small"
              sx={actionButtonStyles}
            >
              <MaterialSymbol name="visibility" size={20} />
            </IconButton>
          </Tooltip>}
          {access.canUpdate && <Tooltip title="Editar">
            <IconButton
              onClick={() => navigate(`/users/update/${user.id}`)}
              size="small"
              sx={actionButtonStyles}
            >
              <MaterialSymbol name="edit" size={20} />
            </IconButton>
          </Tooltip>}
          {access.canDelete && <Tooltip title="Eliminar">
            <IconButton
              onClick={() => setUserToDelete(user)}
              size="small"
              sx={actionButtonStyles}
            >
              <MaterialSymbol name="delete" size={20} />
            </IconButton>
          </Tooltip>}
        </Stack>
      ),
    },
  ], [access.canDelete, access.canRead, access.canUpdate, navigate])

  return (
    <ModulePageLayout
      actions={access.canCreate ? (
        <Button
          onClick={() => navigate('/users/register')}
          startIcon={<MaterialSymbol name="add" size={20} />}
          variant="contained"
        >
          {TEXTS.users.register}
        </Button>
      ) : undefined}
      description={TEXTS.users.description}
      title={TEXTS.users.title}
    >
      <DynamicDataTable
        columns={columns}
        data={users}
        emptyMessage={TEXTS.users.empty}
        error={error ? TEXTS.users.errorLoading : null}
        getRowId={(user) => user.id}
        initialPageSize={5}
        loading={isLoading}
      />

      <ConfirmDialog
        confirmLabel={TEXTS.users.delete.confirm}
        error={deleteMutation.error ? getApiErrorMessage(deleteMutation.error) : null}
        message={(
          <>
            ¿Deseas eliminar a <strong>{userToDelete?.fullName}</strong>?
            <br />
            Esta acción no se puede revertir.
          </>
        )}
        onClose={closeDeleteDialog}
        onConfirm={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
        open={Boolean(userToDelete)}
        pending={deleteMutation.isPending}
        title={TEXTS.users.delete.title}
        tone="danger"
      />
    </ModulePageLayout>
  )
}
