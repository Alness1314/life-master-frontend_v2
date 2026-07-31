import { Alert, CircularProgress } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getApiErrorMessage, getApiValidationErrors } from '../../../api/client'
import { useAuth } from '../../../auth/useAuth'
import { useFeedback } from '../../../components/feedback/useFeedback'
import { FormPageLayout } from '../../../components/form/FormPageLayout'
import { createExpense, updateExpense, useExpense } from '../api'
import type { ExpenseRequest } from '../api'
import { ExpenseForm } from '../components/ExpenseForm'

interface ExpenseEditorPageProps {
  mode: 'create' | 'update'
}

export function ExpenseEditorPage({ mode }: ExpenseEditorPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { expenseId } = useParams()
  const { showError, showSuccess } = useFeedback()
  const isUpdate = mode === 'update'
  const expenseQuery = useExpense(user?.id, isUpdate ? expenseId : undefined)

  const mutation = useMutation({
    mutationFn: (request: ExpenseRequest) => (
      isUpdate
        ? updateExpense(user!.id, expenseId!, request)
        : createExpense(user!.id, request)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] })
      showSuccess(isUpdate ? 'Gasto actualizado correctamente.' : 'Gasto registrado correctamente.')
      navigate('/expenses', { replace: true })
    },
    onError: (error) => {
      if (Object.keys(getApiValidationErrors(error)).length === 0) showError(getApiErrorMessage(error))
    },
  })

  if (isUpdate && expenseQuery.isLoading) {
    return (
      <div className="grid min-h-64 place-items-center">
        <CircularProgress aria-label="Cargando gasto" />
      </div>
    )
  }

  return (
    <FormPageLayout
      description={isUpdate
        ? 'Actualiza la información financiera del gasto.'
        : 'Captura la información del nuevo gasto.'}
      ancestors={[
        { label: 'Catálogos', to: '/catalogs' },
        { label: 'Gastos', to: '/expenses' },
      ]}
      title={isUpdate ? 'Editar gasto' : 'Registro de gasto'}
    >
      {expenseQuery.error && <Alert severity="error">No fue posible cargar el gasto.</Alert>}
      {(!isUpdate || expenseQuery.data) && user && (
        <ExpenseForm
          expense={expenseQuery.data}
          onSubmit={(request) => mutation.mutate(request)}
          pending={mutation.isPending}
          serverError={mutation.error}
          userId={user.id}
        />
      )}
    </FormPageLayout>
  )
}
