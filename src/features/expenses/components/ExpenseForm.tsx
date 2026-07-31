import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, CircularProgress } from '@mui/material'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { getApiValidationErrors } from '../../../api/client'
import { FormCard } from '../../../components/form/FormCard'
import { FormSelect } from '../../../components/form/FormSelect'
import { FormTextField } from '../../../components/form/FormTextField'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { toCurrencySelectOptions, useCurrencies } from '../../../hooks/useCurrencies'
import {
  useExpenseCategories,
  useFinancialAccounts,
  usePaymentMethods,
} from '../api'
import type { Expense, ExpenseRequest } from '../api'
import { expenseFormSchema } from '../schemas'
import type { ExpenseFormValues } from '../schemas'

interface ExpenseFormProps {
  userId: string
  expense?: Expense
  pending?: boolean
  serverError?: unknown
  onSubmit: (request: ExpenseRequest) => void
}

function today() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function ExpenseForm({
  userId,
  expense,
  pending = false,
  serverError,
  onSubmit,
}: ExpenseFormProps) {
  const navigate = useNavigate()
  const categoriesQuery = useExpenseCategories()
  const accountsQuery = useFinancialAccounts(userId)
  const paymentMethodsQuery = usePaymentMethods(userId)
  const currenciesQuery = useCurrencies()
  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<ExpenseFormValues>({
    defaultValues: {
      bankOrEntity: '',
      description: '',
      amount: '',
      category: '',
      paymentDate: today(),
      paymentStatus: 'false',
      accountId: '',
      paymentMethodId: '',
      currency: 'MXN',
    },
    mode: 'onChange',
    resolver: zodResolver(expenseFormSchema),
  })

  useEffect(() => {
    if (!expense) return
    reset({
      bankOrEntity: expense.bankOrEntity,
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category.id,
      paymentDate: expense.paymentDate,
      paymentStatus: String(expense.paymentStatus) as 'true' | 'false',
      accountId: expense.accountId ?? '',
      paymentMethodId: expense.paymentMethodId ?? '',
      currency: expense.currency ?? 'MXN',
    })
  }, [expense, reset])

  useEffect(() => {
    const fieldErrors = getApiValidationErrors(serverError)
    for (const field of Object.keys(fieldErrors) as (keyof ExpenseFormValues)[]) {
      if (!(field in expenseFormSchema.shape)) continue
      setError(field, { message: fieldErrors[field], type: 'server' })
    }
  }, [serverError, setError])

  const accountId = watch('accountId')
  const selectedAccount = accountsQuery.data?.find((account) => account.id === accountId)

  useEffect(() => {
    if (selectedAccount?.currency) setValue('currency', selectedAccount.currency, { shouldValidate: true })
  }, [selectedAccount, setValue])

  const paymentMethods = (paymentMethodsQuery.data ?? []).filter(
    (method) => !accountId || !method.accountId || method.accountId === accountId,
  )
  const loadingOptions = categoriesQuery.isLoading || accountsQuery.isLoading
    || paymentMethodsQuery.isLoading || currenciesQuery.isLoading
  const optionsError = categoriesQuery.error || accountsQuery.error
    || paymentMethodsQuery.error || currenciesQuery.error

  return (
    <>
      {optionsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No fue posible cargar todas las opciones del formulario.
        </Alert>
      )}
      <FormCard onSubmit={handleSubmit((values) => onSubmit({
        bankOrEntity: values.bankOrEntity.trim(),
        description: values.description.trim(),
        amount: Number(values.amount),
        category: values.category,
        paymentDate: values.paymentDate,
        paymentStatus: values.paymentStatus === 'true',
        accountId: values.accountId || null,
        paymentMethodId: values.paymentMethodId || null,
        currency: values.currency,
      }))}>
        <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
          <FormTextField
            control={control}
            disabled={pending}
            label="Banco o entidad"
            name="bankOrEntity"
            required
          />
          <FormTextField
            control={control}
            disabled={pending}
            label="Monto"
            name="amount"
            required
            type="number"
          />
          <div className="md:col-span-2">
            <FormTextField
              control={control}
              disabled={pending}
              label="Descripción"
              multiline
              name="description"
              required
              rows={3}
            />
          </div>
          <FormSelect
            control={control}
            disabled={loadingOptions || pending}
            label="Categoría"
            name="category"
            options={(categoriesQuery.data ?? []).map((item) => ({ label: item.name, value: item.id }))}
            required
          />
          <FormTextField
            control={control}
            disabled={pending}
            label="Fecha de pago"
            name="paymentDate"
            required
            type="date"
          />
          <FormSelect
            control={control}
            disabled={pending}
            label="Estado del pago"
            name="paymentStatus"
            options={[
              { label: 'Pendiente', value: 'false' },
              { label: 'Pagado', value: 'true' },
            ]}
            required
          />
          <FormSelect
            control={control}
            disabled={loadingOptions || pending}
            label="Cuenta"
            name="accountId"
            options={[
              { label: 'Sin cuenta', value: '' },
              ...(accountsQuery.data ?? []).map((item) => ({
                label: `${item.name} (${item.currency})`,
                value: item.id,
              })),
            ]}
          />
          <FormSelect
            control={control}
            disabled={loadingOptions || pending}
            label="Método de pago"
            name="paymentMethodId"
            options={[
              { label: 'Sin método de pago', value: '' },
              ...paymentMethods.map((item) => ({ label: item.name, value: item.id })),
            ]}
          />
          <FormSelect
            control={control}
            disabled={Boolean(selectedAccount) || pending}
            label="Moneda"
            name="currency"
            options={toCurrencySelectOptions(currenciesQuery.data)}
            required
          />
        </div>

        <div className="mt-3 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button
            disabled={pending}
            onClick={() => navigate('/expenses')}
            startIcon={<MaterialSymbol name="arrow_back" size={20} />}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            disabled={!isValid || loadingOptions || pending}
            startIcon={pending
              ? <CircularProgress color="inherit" size={18} />
              : <MaterialSymbol name="save" size={20} />}
            type="submit"
            variant="contained"
          >
            {expense ? 'Guardar cambios' : 'Registrar gasto'}
          </Button>
        </div>
      </FormCard>
    </>
  )
}
