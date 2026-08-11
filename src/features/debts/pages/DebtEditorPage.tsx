import { useEffect } from 'react'
import { Alert, Button, CircularProgress, Divider, IconButton, MenuItem, Paper, TextField, Typography } from '@mui/material'
import { useFieldArray, useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient, getApiErrorMessage } from '../../../api/client'
import { useAuth } from '../../../auth/useAuth'
import { useFeedback } from '../../../components/feedback/useFeedback'
import { FieldLabel } from '../../../components/form/FieldLabel'
import { FormPageLayout } from '../../../components/form/FormPageLayout'
import { MaterialSymbol } from '../../../components/icons/MaterialSymbol'
import { API_ROUTES } from '../../../config/apiRoutes'
import { toCurrencySelectOptions, useCurrencies } from '../../../hooks/useCurrencies'
import type { Debt, DebtPayment, FinancialAccountOption, PaymentMethodOption } from '../types'

type FormValues = Omit<Debt, 'id' | 'paidAmount' | 'outstandingAmount' | 'progressPercentage' | 'createAt' | 'updateAt'>
const today = () => new Date().toLocaleDateString('en-CA')
const emptyPayment = (): DebtPayment => ({ paymentDate: today(), amountPaid: 0, principalAmount: 0, interestAmount: 0, paymentMethod: '', paymentMethodId: null, accountId: null, isPaid: false, notes: '' })
const decimalValue = (value: unknown) => Number(Number(value ?? 0).toFixed(8))

export function DebtEditorPage({ mode }: { mode: 'create' | 'update' }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { debtId } = useParams()
  const { user } = useAuth()
  const { showError, showSuccess } = useFeedback()
  const isUpdate = mode === 'update'
  const record = useQuery({
    queryKey: ['debts', user?.id, debtId],
    queryFn: async () => (await apiClient.get<Debt>(API_ROUTES.debts.byId(user!.id, debtId!))).data,
    enabled: Boolean(user && debtId && isUpdate),
  })
  const methods = useQuery({
    queryKey: ['payment-methods', user?.id],
    queryFn: async () => (await apiClient.get<PaymentMethodOption[]>(API_ROUTES.paymentMethods.root(user!.id))).data,
    enabled: Boolean(user),
  })
  const currencies = useCurrencies()
  const accounts = useQuery({
    queryKey: ['financial-accounts', user?.id],
    queryFn: async () => (await apiClient.get<FinancialAccountOption[]>(API_ROUTES.accounts.root(user!.id))).data,
    enabled: Boolean(user),
  })
  const { register, control, handleSubmit, reset, watch, formState: { errors, isValid } } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { creditorName: '', totalAmount: 0, currency: 'MXN', hasInterest: false, numberOfPayments: 1, paymentsMade: 0, dueDate: today(), isFullyPaid: false, notes: '', disbursesFunds: false, receivedAmount: null, receivedDate: null, depositAccountId: null, payments: [] },
  })
  const payments = useFieldArray({ control, name: 'payments' })
  useEffect(() => {
    if (!record.data) return
    reset({
      ...record.data,
      payments: (record.data.payments ?? []).map((payment) => ({
        ...payment,
        principalAmount: payment.principalAmount ?? payment.amountPaid,
        interestAmount: payment.interestAmount ?? 0,
      })),
    })
  }, [record.data, reset])
  const watchedPayments = watch('payments')
  const total = Number(watch('totalAmount') || 0)
  const paid = watchedPayments?.filter((p) => p.isPaid).reduce((sum, p) => sum + Number(p.principalAmount || 0), 0) ?? 0
  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const normalizedPayments = values.payments.map((payment) => {
        const selected = methods.data?.find((method) => method.id === payment.paymentMethodId)
        const principalAmount = decimalValue(payment.principalAmount)
        const interestAmount = decimalValue(payment.interestAmount)
        return { ...payment, principalAmount, interestAmount, amountPaid: decimalValue(principalAmount + interestAmount), paymentMethod: selected?.name ?? payment.paymentMethod, paymentMethodId: payment.paymentMethodId || null, accountId: payment.accountId || null }
      })
      const totalAmount = decimalValue(values.totalAmount)
      const payload = { ...values, totalAmount, receivedAmount: values.disbursesFunds ? decimalValue(values.receivedAmount) : null, receivedDate: values.disbursesFunds ? values.receivedDate : null, depositAccountId: values.disbursesFunds ? values.depositAccountId : null, numberOfPayments: Number(values.numberOfPayments), payments: normalizedPayments, paymentsMade: normalizedPayments.filter((p) => p.isPaid).length, isFullyPaid: decimalValue(normalizedPayments.filter((p) => p.isPaid).reduce((sum, p) => sum + p.principalAmount, 0)) >= totalAmount }
      return isUpdate ? apiClient.put(API_ROUTES.debts.byId(user!.id, debtId!), payload) : apiClient.post(API_ROUTES.debts.root(user!.id), payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['debts', user?.id] })
      showSuccess(`Deuda ${isUpdate ? 'actualizada' : 'registrada'} correctamente.`)
      navigate('/debts', { replace: true })
    },
    onError: (error) => showError(getApiErrorMessage(error)),
  })

  return <FormPageLayout title={isUpdate ? 'Editar deuda' : 'Registro de deuda'} description={`${isUpdate ? 'Actualiza' : 'Captura'} la información de la deuda y su plan de pagos.`}
    ancestors={[{ label: 'Catálogos', to: '/catalogs' }, { label: 'Deudas', to: '/debts' }]}>
    {record.isLoading ? <div className="grid min-h-64 place-items-center"><CircularProgress /></div> : <Paper component="form" onSubmit={handleSubmit((values) => save.mutate(values))} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: { xs: 2, sm: 3 } }}>
      {save.error && <Alert severity="error" sx={{ mb: 2 }}>{getApiErrorMessage(save.error)}</Alert>}
      <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
        <TextField {...register('creditorName', { required: 'El acreedor es obligatorio.', validate: (value) => value.trim().length > 0 || 'El acreedor es obligatorio.', maxLength: { value: 256, message: 'Máximo 256 caracteres.' } })} error={Boolean(errors.creditorName)} helperText={errors.creditorName?.message ?? ' '} label={<FieldLabel required>Acreedor</FieldLabel>} />
        <TextField {...register('totalAmount', { required: 'El monto total es obligatorio.', min: { value: .01, message: 'El monto debe ser mayor a cero.' }, valueAsNumber: true })} error={Boolean(errors.totalAmount)} helperText={errors.totalAmount?.message ?? ' '} label={<FieldLabel required>Monto total</FieldLabel>} slotProps={{ htmlInput: { step: 0.00000001 } }} type="number" />
        <TextField {...register('currency', { required: 'La moneda es obligatoria.' })} disabled={currencies.isLoading}
          error={Boolean(errors.currency || currencies.error)}
          helperText={errors.currency?.message ?? (currencies.error ? 'No fue posible cargar las monedas.' : ' ')}
          label={<FieldLabel required>Moneda</FieldLabel>} select>
          {toCurrencySelectOptions(currencies.data).map((currency) => (
            <MenuItem key={currency.value} value={currency.value}>{currency.label}</MenuItem>
          ))}
        </TextField>
        <TextField {...register('dueDate', { required: 'La fecha de vencimiento es obligatoria.' })} error={Boolean(errors.dueDate)} helperText={errors.dueDate?.message ?? ' '} label={<FieldLabel required>Fecha de vencimiento</FieldLabel>} type="date" />
        <TextField {...register('numberOfPayments', { required: 'El número de pagos es obligatorio.', min: { value: 1, message: 'Debe existir al menos un pago.' }, valueAsNumber: true })} error={Boolean(errors.numberOfPayments)} helperText={errors.numberOfPayments?.message ?? ' '} label={<FieldLabel required>Número de pagos</FieldLabel>} slotProps={{ htmlInput: { step: 1 } }} type="number" />
        <TextField {...register('hasInterest', { setValueAs: (value) => value === true || value === 'true' })} helperText=" " label={<FieldLabel required>Genera intereses</FieldLabel>} select value={String(watch('hasInterest'))}>{[{ l: 'No', v: false }, { l: 'Sí', v: true }].map((o) => <MenuItem key={o.l} value={String(o.v)}>{o.l}</MenuItem>)}</TextField>
        <TextField {...register('disbursesFunds', { setValueAs: (value) => value === true || value === 'true' })} helperText="Indica si el préstamo depositó dinero en una cuenta." label={<FieldLabel required>¿Recibiste dinero de esta deuda?</FieldLabel>} select value={String(watch('disbursesFunds'))}><MenuItem value="false">No</MenuItem><MenuItem value="true">Sí</MenuItem></TextField>
        {watch('disbursesFunds') && <>
          <TextField {...register('receivedAmount', { required: 'El monto recibido es obligatorio.', min: { value: .01, message: 'El monto recibido debe ser mayor a cero.' }, valueAsNumber: true })} error={Boolean(errors.receivedAmount)} helperText={errors.receivedAmount?.message ?? ' '} label={<FieldLabel required>Monto recibido</FieldLabel>} slotProps={{ htmlInput: { step: 0.00000001 } }} type="number" />
          <TextField {...register('receivedDate', { required: 'La fecha de depósito es obligatoria.' })} error={Boolean(errors.receivedDate)} helperText={errors.receivedDate?.message ?? ' '} label={<FieldLabel required>Fecha de depósito</FieldLabel>} type="date" />
          <TextField {...register('depositAccountId', { required: 'La cuenta que recibió el dinero es obligatoria.' })} className="md:col-span-2" error={Boolean(errors.depositAccountId)} helperText={errors.depositAccountId?.message ?? 'Aumenta el saldo disponible, pero no los ingresos ordinarios.'} label={<FieldLabel required>Cuenta que recibió el dinero</FieldLabel>} select>
            {accounts.data?.filter((account) => account.active).map((account) => <MenuItem key={account.id} value={account.id}>{account.name} · {account.currency}</MenuItem>)}
          </TextField>
        </>}
        <TextField {...register('notes')} className="md:col-span-2" helperText=" " label="Notas" multiline rows={3} />
      </div>
      <Divider sx={{ my: 2 }} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><Typography variant="h6">Plan de pagos</Typography><Typography color="text.secondary" variant="body2">Pagado: {paid.toFixed(2)} · Pendiente: {Math.max(0, total - paid).toFixed(2)}</Typography></div><Button onClick={() => payments.append(emptyPayment())} startIcon={<MaterialSymbol name="add" size={19} />} type="button" variant="outlined">Agregar pago</Button></div>
      <div className="grid gap-3">{payments.fields.map((payment, index) => <Paper key={payment.id} variant="outlined" sx={{ p: 2 }}><div className="grid grid-cols-1 gap-x-4 md:grid-cols-2 xl:grid-cols-4">
        <TextField {...register(`payments.${index}.paymentDate`, { required: 'La fecha del pago es obligatoria.' })} error={Boolean(errors.payments?.[index]?.paymentDate)} helperText={errors.payments?.[index]?.paymentDate?.message ?? ' '} label={<FieldLabel required>Fecha</FieldLabel>} type="date" />
        <TextField {...register(`payments.${index}.principalAmount`, { required: 'El capital es obligatorio.', min: { value: .01, message: 'El capital debe ser mayor a cero.' }, valueAsNumber: true })} error={Boolean(errors.payments?.[index]?.principalAmount)} helperText={errors.payments?.[index]?.principalAmount?.message ?? 'Reduce el saldo de la deuda.'} label={<FieldLabel required>Capital</FieldLabel>} slotProps={{ htmlInput: { step: 0.00000001 } }} type="number" />
        <TextField {...register(`payments.${index}.interestAmount`, { min: 0, valueAsNumber: true })} helperText=" " label="Intereses y comisiones" slotProps={{ htmlInput: { step: 0.00000001 } }} type="number" />
        <TextField value={decimalValue(Number(watch(`payments.${index}.principalAmount`) || 0) + Number(watch(`payments.${index}.interestAmount`) || 0))} helperText="Salida total de efectivo." label="Total del pago" slotProps={{ htmlInput: { readOnly: true } }} />
        <TextField {...register(`payments.${index}.paymentMethodId`, { required: 'El método de pago es obligatorio.' })} error={Boolean(errors.payments?.[index]?.paymentMethodId)} helperText={errors.payments?.[index]?.paymentMethodId?.message ?? (methods.data?.some((method) => method.active) ? ' ' : 'Primero registra un método de pago en Catálogos.')} label={<FieldLabel required>Método de pago</FieldLabel>} select>
          {methods.data?.filter((method) => method.active).map((method) => <MenuItem key={method.id} value={method.id}>{method.name}</MenuItem>)}
        </TextField>
        <TextField {...register(`payments.${index}.accountId`, { required: 'La cuenta de origen es obligatoria.' })} error={Boolean(errors.payments?.[index]?.accountId)} helperText={errors.payments?.[index]?.accountId?.message ?? 'Cuenta desde donde saldrá el pago.'} label={<FieldLabel required>Cuenta de origen</FieldLabel>} select>
          {accounts.data?.filter((account) => account.active).map((account) => <MenuItem key={account.id} value={account.id}>{account.name} · {account.currency}</MenuItem>)}
        </TextField>
        <div className="flex items-start gap-2"><TextField {...register(`payments.${index}.isPaid`, { setValueAs: (value) => value === true || value === 'true' })} fullWidth helperText=" " label={<FieldLabel required>Estado</FieldLabel>} select value={String(watch(`payments.${index}.isPaid`))}><MenuItem value="false">Pendiente</MenuItem><MenuItem value="true">Pagado</MenuItem></TextField><IconButton aria-label="Eliminar pago" color="error" onClick={() => payments.remove(index)}><MaterialSymbol name="delete" size={22} /></IconButton></div>
        <TextField {...register(`payments.${index}.notes`)} className="md:col-span-2 xl:col-span-4" helperText=" " label="Notas del pago" multiline rows={2} />
      </div></Paper>)}</div>
      <div className="mt-5 flex justify-end gap-3"><Button onClick={() => navigate('/debts')} startIcon={<MaterialSymbol name="arrow_back" size={20} />} variant="outlined">Cancelar</Button><Button disabled={!isValid || save.isPending || paid > total} startIcon={save.isPending ? <CircularProgress color="inherit" size={18} /> : <MaterialSymbol name="save" size={20} />} type="submit" variant="contained">{isUpdate ? 'Guardar cambios' : 'Registrar deuda'}</Button></div>
    </Paper>}
  </FormPageLayout>
}
