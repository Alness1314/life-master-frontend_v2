import { useEffect, useMemo, useState } from 'react'
import {
  Alert, Button, CircularProgress, Divider, IconButton, MenuItem, Paper, TextField, Typography,
} from '@mui/material'
import { useFieldArray, useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog'
import { useFeedback } from '../../components/feedback/useFeedback'
import { FieldLabel } from '../../components/form/FieldLabel'
import { FormPageLayout } from '../../components/form/FormPageLayout'
import { MaterialSymbol } from '../../components/icons/MaterialSymbol'
import { ModulePageLayout } from '../../components/layout/ModulePageLayout'
import { DynamicDataTable } from '../../components/table/DynamicDataTable'
import type { DataTableColumn } from '../../components/table/DynamicDataTable'
import { TableRowActions } from '../../components/table/TableRowActions'
import { API_ROUTES } from '../../config/apiRoutes'
import { useModulePermission } from '../modules/api'

interface Food {
  id?: string
  foodName: string
  calories: number
  unitMeasurement: string
  quantity: string
}

interface Nutrition {
  id: string
  dateTimeConsumption: string
  food: Food[]
  mealType: string
  notes: string
}

type NutritionForm = Omit<Nutrition, 'id'>
const mealTypes = [
  { value: 'BREAKFAST', label: 'Desayuno' },
  { value: 'LUNCH', label: 'Comida' },
  { value: 'DINNER', label: 'Cena' },
  { value: 'SNACK', label: 'Colación' },
  { value: 'OTHER', label: 'Otro' },
]
const mealLabel = (value: string) => mealTypes.find((type) => type.value === value)?.label ?? value
const nowInput = () => {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}
const toRequestDate = (value: string) => `${value.replace('T', ' ')}${value.length === 16 ? ':00' : ''}`
const toInputDate = (value: string) => value?.replace(' ', 'T').slice(0, 16)
const emptyFood = (): Food => ({ foodName: '', calories: 0, unitMeasurement: '', quantity: '' })

function useNutrition(id?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['nutrition', user?.id, id],
    queryFn: async () => (await apiClient.get<Nutrition>(API_ROUTES.nutrition.byId(user!.id, id!))).data,
    enabled: Boolean(user && id),
  })
}

export function NutritionPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { showSuccess } = useFeedback()
  const access = useModulePermission('nutrition')
  const [selected, setSelected] = useState<Nutrition | null>(null)
  const query = useQuery({
    queryKey: ['nutrition', user?.id],
    queryFn: async () => (await apiClient.get<Nutrition[]>(API_ROUTES.nutrition.root(user!.id))).data,
    enabled: Boolean(user),
  })
  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(API_ROUTES.nutrition.byId(user!.id, id)),
    onSuccess: async () => {
      setSelected(null)
      await queryClient.invalidateQueries({ queryKey: ['nutrition', user?.id] })
      showSuccess('Registro de nutrición eliminado correctamente.')
    },
  })
  const columns = useMemo<DataTableColumn<Nutrition>[]>(() => [
    { id: 'number', header: 'No.', align: 'center', width: 60, render: (_, index) => index + 1 },
    { id: 'date', header: 'Fecha y hora', align: 'center', minWidth: 170, render: (row) => new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.dateTimeConsumption)) },
    { id: 'type', header: 'Tipo de comida', align: 'center', minWidth: 140, render: (row) => mealLabel(row.mealType) },
    { id: 'foods', header: 'Alimentos', align: 'center', minWidth: 110, render: (row) => row.food?.length ?? 0 },
    { id: 'calories', header: 'Calorías', align: 'center', minWidth: 110, render: (row) => row.food?.reduce((sum, food) => sum + Number(food.calories ?? 0), 0) ?? 0 },
    {
      id: 'actions', header: 'Acciones', align: 'center', minWidth: 150,
      render: (row) => <TableRowActions
        onDelete={access.canDelete ? () => setSelected(row) : undefined}
        onEdit={access.canUpdate ? () => navigate(`/nutrition/update/${row.id}`) : undefined}
        onView={access.canRead ? () => navigate(`/nutrition/details/${row.id}`) : undefined}
      />,
    },
  ], [access.canDelete, access.canRead, access.canUpdate, navigate])
  return <ModulePageLayout
    actions={access.canCreate ? <Button onClick={() => navigate('/nutrition/register')} startIcon={<MaterialSymbol name="add" size={20} />} variant="contained">Registrar comida</Button> : undefined}
    ancestors={[{ label: 'Catálogos', to: '/catalogs' }]}
    description="Registra tus comidas y alimentos consumidos."
    title="Nutrición"
  >
    <DynamicDataTable columns={columns} data={query.data ?? []} emptyMessage="No hay registros de nutrición." error={query.error ? 'No fue posible cargar los registros.' : null} getRowId={(row) => row.id} loading={query.isLoading} />
    <ConfirmDialog confirmLabel="Sí, eliminar" error={remove.error ? getApiErrorMessage(remove.error) : null} message={<>¿Deseas eliminar este registro de <strong>{selected ? mealLabel(selected.mealType) : ''}</strong>?</>} onClose={() => !remove.isPending && setSelected(null)} onConfirm={() => selected && remove.mutate(selected.id)} open={Boolean(selected)} pending={remove.isPending} title="Eliminar registro de nutrición" tone="danger" />
  </ModulePageLayout>
}

export function NutritionEditorPage({ mode }: { mode: 'create' | 'update' }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { recordId } = useParams()
  const { user } = useAuth()
  const { showError, showSuccess } = useFeedback()
  const record = useNutrition(mode === 'update' ? recordId : undefined)
  const { register, control, handleSubmit, reset, formState: { errors, isValid } } = useForm<NutritionForm>({
    mode: 'onChange',
    defaultValues: { dateTimeConsumption: nowInput(), mealType: 'BREAKFAST', notes: '', food: [emptyFood()] },
  })
  const foods = useFieldArray({ control, name: 'food' })
  useEffect(() => {
    if (record.data) reset({ ...record.data, dateTimeConsumption: toInputDate(record.data.dateTimeConsumption), food: record.data.food ?? [] })
  }, [record.data, reset])
  const save = useMutation({
    mutationFn: (values: NutritionForm) => {
      const payload = { ...values, dateTimeConsumption: toRequestDate(values.dateTimeConsumption), food: values.food.map((food) => ({ ...food, calories: Number(food.calories) })) }
      return mode === 'update'
        ? apiClient.put(API_ROUTES.nutrition.byId(user!.id, recordId!), payload)
        : apiClient.post(API_ROUTES.nutrition.root(user!.id), payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nutrition', user?.id] })
      showSuccess(`Registro de nutrición ${mode === 'update' ? 'actualizado' : 'creado'} correctamente.`)
      navigate('/nutrition', { replace: true })
    },
    onError: (error) => showError(getApiErrorMessage(error)),
  })
  return <FormPageLayout ancestors={[{ label: 'Catálogos', to: '/catalogs' }, { label: 'Nutrición', to: '/nutrition' }]} description={`${mode === 'update' ? 'Actualiza' : 'Captura'} la comida y los alimentos consumidos.`} title={mode === 'update' ? 'Editar registro de nutrición' : 'Registro de nutrición'}>
    {record.isLoading ? <div className="grid min-h-64 place-items-center"><CircularProgress /></div> : <Paper component="form" onSubmit={handleSubmit((values) => save.mutate(values))} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: { xs: 2, sm: 3 } }}>
      <div className="grid gap-x-5 md:grid-cols-2">
        <TextField {...register('dateTimeConsumption', { required: true })} helperText=" " label={<FieldLabel required>Fecha y hora de consumo</FieldLabel>} type="datetime-local" />
        <TextField {...register('mealType', { required: true })} helperText=" " label={<FieldLabel required>Tipo de comida</FieldLabel>} select>{mealTypes.map((type) => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}</TextField>
        <TextField {...register('notes')} className="md:col-span-2" helperText=" " label="Notas" multiline rows={3} />
      </div>
      <Divider sx={{ my: 2 }} />
      <div className="mb-4 flex items-center justify-between gap-3"><Typography variant="h6">Alimentos</Typography><Button onClick={() => foods.append(emptyFood())} startIcon={<MaterialSymbol name="add" size={19} />} type="button" variant="outlined">Agregar alimento</Button></div>
      <div className="grid gap-3">{foods.fields.map((food, index) => <Paper key={food.id} variant="outlined" sx={{ p: 2 }}><div className="grid gap-x-4 md:grid-cols-2 xl:grid-cols-4">
        <TextField {...register(`food.${index}.foodName`, { required: 'El alimento es obligatorio.' })} error={Boolean(errors.food?.[index]?.foodName)} helperText={errors.food?.[index]?.foodName?.message ?? ' '} label={<FieldLabel required>Alimento</FieldLabel>} />
        <TextField {...register(`food.${index}.calories`, { required: true, min: 0, valueAsNumber: true })} helperText=" " label={<FieldLabel required>Calorías</FieldLabel>} type="number" />
        <TextField {...register(`food.${index}.quantity`, { required: true })} helperText=" " label={<FieldLabel required>Cantidad</FieldLabel>} />
        <div className="flex items-start gap-2"><TextField {...register(`food.${index}.unitMeasurement`, { required: true })} fullWidth helperText=" " label={<FieldLabel required>Unidad de medida</FieldLabel>} /><IconButton aria-label="Eliminar alimento" color="error" disabled={foods.fields.length === 1} onClick={() => foods.remove(index)}><MaterialSymbol name="delete" size={22} /></IconButton></div>
      </div></Paper>)}</div>
      <div className="mt-5 flex justify-end gap-3"><Button onClick={() => navigate('/nutrition')} startIcon={<MaterialSymbol name="arrow_back" size={20} />} variant="outlined">Cancelar</Button><Button disabled={!isValid || save.isPending} startIcon={save.isPending ? <CircularProgress color="inherit" size={18} /> : <MaterialSymbol name="save" size={20} />} type="submit" variant="contained">{mode === 'update' ? 'Guardar cambios' : 'Registrar comida'}</Button></div>
    </Paper>}
  </FormPageLayout>
}

export function NutritionDetailsPage() {
  const navigate = useNavigate()
  const { recordId } = useParams()
  const query = useNutrition(recordId)
  const access = useModulePermission('nutrition')
  const record = query.data
  return <FormPageLayout actions={<Button onClick={() => navigate('/nutrition')} startIcon={<MaterialSymbol name="arrow_back" size={20} />} variant="outlined">Volver</Button>} ancestors={[{ label: 'Catálogos', to: '/catalogs' }, { label: 'Nutrición', to: '/nutrition' }]} description="Consulta los alimentos registrados en esta comida." title="Detalle de nutrición">
    {query.isLoading && <div className="grid min-h-64 place-items-center"><CircularProgress /></div>}
    {query.error && <Alert severity="error">No fue posible cargar el registro.</Alert>}
    {record && <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}><div className="flex items-center justify-between gap-4 p-5"><div className="flex items-center gap-3"><MaterialSymbol name="nutrition" size={36} style={{ color: '#7567e8' }} /><div><Typography variant="h5">{mealLabel(record.mealType)}</Typography><Typography color="text.secondary">{new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(record.dateTimeConsumption))}</Typography></div></div>{access.canUpdate && <Button onClick={() => navigate(`/nutrition/update/${record.id}`)} startIcon={<MaterialSymbol name="edit" size={20} />} variant="contained">Editar</Button>}</div><Divider /><div className="grid gap-3 p-5">{record.food.map((food, index) => <Paper key={food.id ?? index} variant="outlined" sx={{ p: 2 }}><div className="grid gap-3 sm:grid-cols-4"><div><Typography color="text.secondary" variant="caption">Alimento</Typography><Typography>{food.foodName}</Typography></div><div><Typography color="text.secondary" variant="caption">Calorías</Typography><Typography>{food.calories}</Typography></div><div><Typography color="text.secondary" variant="caption">Cantidad</Typography><Typography>{food.quantity}</Typography></div><div><Typography color="text.secondary" variant="caption">Unidad</Typography><Typography>{food.unitMeasurement}</Typography></div></div></Paper>)}</div>{record.notes && <><Divider /><div className="p-5"><Typography color="text.secondary" variant="body2">Notas</Typography><Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{record.notes}</Typography></div></>}</Paper>}
  </FormPageLayout>
}
