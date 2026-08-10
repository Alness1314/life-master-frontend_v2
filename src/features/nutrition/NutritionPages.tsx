import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  Alert, Box, Button, CircularProgress, Divider, IconButton, MenuItem, Paper, TextField, Typography,
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
import { blobToDataUrl } from '../users/profileImage'

interface Food {
  id?: string
  foodName: string
  calories: number | null
  unitMeasurement: string | null
  quantity: string
}

interface Nutrition {
  id: string
  dateTimeConsumption: string
  name: string
  food: Food[]
  mealType: string
  notes: string | null
  photoId: string | null
}

interface FoodForm {
  foodName: string
  calories: number | string
  unitMeasurement: string
  quantity: string
}

interface NutritionForm {
  dateTimeConsumption: string
  name: string
  food: FoodForm[]
  mealType: string
  notes: string
}

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
const emptyFood = (): FoodForm => ({ foodName: '', calories: '', unitMeasurement: '', quantity: '' })
const MAX_PHOTO_BYTES = 10 * 1024 * 1024

function useNutrition(id?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['nutrition', user?.id, id],
    queryFn: async () => (await apiClient.get<Nutrition>(API_ROUTES.nutrition.byId(user!.id, id!))).data,
    enabled: Boolean(user && id),
  })
}

function useNutritionPhoto(id?: string, photoId?: string | null) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['nutrition-photo', user?.id, id, photoId],
    queryFn: async () => blobToDataUrl((await apiClient.get<Blob>(
      API_ROUTES.nutrition.photo(user!.id, id!),
      { responseType: 'blob' },
    )).data),
    enabled: Boolean(user && id && photoId),
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
    { id: 'dateTimeConsumption', header: 'Fecha y hora', align: 'center', minWidth: 170, sortValue: (row) => row.dateTimeConsumption, filter: { inputType: 'date', param: 'date' }, render: (row) => new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.dateTimeConsumption)) },
    { id: 'name', header: 'Nombre', align: 'center', minWidth: 170, sortValue: (row) => row.name, render: (row) => row.name },
    { id: 'mealType', header: 'Tipo de comida', align: 'center', minWidth: 140, sortValue: (row) => row.mealType, filter: { inputType: 'select', options: mealTypes }, render: (row) => mealLabel(row.mealType) },
    { id: 'foods', header: 'Alimentos', align: 'center', minWidth: 110, sortValue: (row) => row.food?.length ?? 0, render: (row) => row.food?.length ?? 0 },
    { id: 'calories', header: 'Calorías', align: 'center', minWidth: 110, sortValue: (row) => row.food?.reduce((sum, food) => sum + Number(food.calories ?? 0), 0) ?? 0, render: (row) => row.food?.reduce((sum, food) => sum + Number(food.calories ?? 0), 0) ?? 0 },
    { id: 'photo', header: 'Foto', align: 'center', minWidth: 80, render: (row) => <MaterialSymbol name={row.photoId ? 'image' : 'image_not_supported'} size={21} /> },
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
    description="Registra tus comidas; el detalle de alimentos y la fotografía son opcionales."
    title="Nutrición"
  >
    <DynamicDataTable columns={columns} data={query.data ?? []} emptyMessage="No hay registros de nutrición." error={query.error ? 'No fue posible cargar los registros.' : null} getRowId={(row) => row.id} loading={query.isLoading} />
    <ConfirmDialog confirmLabel="Sí, eliminar" error={remove.error ? getApiErrorMessage(remove.error) : null} message={<>¿Deseas eliminar <strong>{selected?.name ?? 'este registro'}</strong>?</>} onClose={() => !remove.isPending && setSelected(null)} onConfirm={() => selected && remove.mutate(selected.id)} open={Boolean(selected)} pending={remove.isPending} title="Eliminar registro de nutrición" tone="danger" />
  </ModulePageLayout>
}

export function NutritionEditorPage({ mode }: { mode: 'create' | 'update' }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { recordId } = useParams()
  const { user } = useAuth()
  const { showError, showSuccess } = useFeedback()
  const record = useNutrition(mode === 'update' ? recordId : undefined)
  const currentPhoto = useNutritionPhoto(recordId, record.data?.photoId)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const { register, control, handleSubmit, reset, formState: { errors, isValid } } = useForm<NutritionForm>({
    mode: 'onChange',
    defaultValues: { dateTimeConsumption: nowInput(), mealType: 'BREAKFAST', name: '', notes: '', food: [] },
  })
  const foods = useFieldArray({ control, name: 'food' })

  useEffect(() => {
    if (!record.data) return
    reset({
      dateTimeConsumption: toInputDate(record.data.dateTimeConsumption),
      mealType: record.data.mealType,
      name: record.data.name ?? mealLabel(record.data.mealType),
      notes: record.data.notes ?? '',
      food: (record.data.food ?? []).map((item) => ({
        foodName: item.foodName,
        calories: item.calories ?? '',
        quantity: item.quantity,
        unitMeasurement: item.unitMeasurement ?? '',
      })),
    })
  }, [record.data, reset])

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedPhoto = event.target.files?.[0]
    event.target.value = ''
    if (!selectedPhoto) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selectedPhoto.type)) {
      showError('La fotografía debe ser PNG, JPEG o WEBP.')
      return
    }
    if (selectedPhoto.size > MAX_PHOTO_BYTES) {
      showError('La fotografía no debe superar 10 MB.')
      return
    }
    setPhoto(selectedPhoto)
    setPhotoPreview(URL.createObjectURL(selectedPhoto))
    setRemovePhoto(false)
  }

  const save = useMutation({
    mutationFn: async (values: NutritionForm) => {
      const payload = {
        dateTimeConsumption: toRequestDate(values.dateTimeConsumption),
        mealType: values.mealType,
        name: values.name.trim(),
        notes: values.notes.trim() || null,
        removePhoto,
        food: values.food.map((item) => ({
          foodName: item.foodName.trim(),
          calories: item.calories === '' || !Number.isFinite(Number(item.calories))
            ? null : Number(item.calories),
          quantity: item.quantity.trim(),
          unitMeasurement: item.unitMeasurement.trim() || null,
        })),
      }
      const body = new FormData()
      body.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
      if (photo) body.append('photo', photo)
      const requestConfig = { headers: { 'Content-Type': 'multipart/form-data' } }
      return mode === 'update'
        ? apiClient.put(API_ROUTES.nutrition.byId(user!.id, recordId!), body, requestConfig)
        : apiClient.post(API_ROUTES.nutrition.root(user!.id), body, requestConfig)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nutrition', user?.id] })
      await queryClient.invalidateQueries({ queryKey: ['nutrition-photo', user?.id] })
      showSuccess(`Registro de nutrición ${mode === 'update' ? 'actualizado' : 'creado'} correctamente.`)
      navigate('/nutrition', { replace: true })
    },
    onError: (error) => showError(getApiErrorMessage(error)),
  })

  const displayedPhoto = photoPreview ?? (!removePhoto ? currentPhoto.data : null)
  const pending = save.isPending
  return <FormPageLayout ancestors={[{ label: 'Catálogos', to: '/catalogs' }, { label: 'Nutrición', to: '/nutrition' }]} description={`${mode === 'update' ? 'Actualiza' : 'Captura'} los datos generales y, si lo deseas, detalla los alimentos.`} title={mode === 'update' ? 'Editar registro de nutrición' : 'Registro de nutrición'}>
    {record.isLoading ? <div className="grid min-h-64 place-items-center"><CircularProgress /></div> : <Paper component="form" onSubmit={handleSubmit((values) => save.mutate(values))} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: { xs: 2, sm: 3 } }}>
      <Typography sx={{ mb: 2 }} variant="h6">Datos generales</Typography>
      <div className="grid gap-x-5 md:grid-cols-2">
        <TextField {...register('dateTimeConsumption', { required: true })} helperText=" " label={<FieldLabel required>Fecha y hora de consumo</FieldLabel>} type="datetime-local" />
        <TextField {...register('mealType', { required: true })} helperText=" " label={<FieldLabel required>Tipo de comida</FieldLabel>} select>{mealTypes.map((type) => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}</TextField>
        <TextField {...register('name', { required: 'El nombre es obligatorio.', maxLength: { value: 256, message: 'Máximo 256 caracteres.' } })} className="md:col-span-2" error={Boolean(errors.name)} helperText={errors.name?.message ?? ' '} label={<FieldLabel required>Nombre</FieldLabel>} />
        <TextField {...register('notes', { maxLength: 4000 })} className="md:col-span-2" helperText=" " label="Descripción (notas)" multiline rows={3} />
      </div>

      <Divider sx={{ my: 2 }} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><Typography variant="h6">Alimentos</Typography><Typography color="text.secondary" variant="body2">Opcional. Agrega únicamente los alimentos que quieras detallar.</Typography></div>
        <Button onClick={() => foods.append(emptyFood())} startIcon={<MaterialSymbol name="add" size={19} />} type="button" variant="outlined">Agregar alimento</Button>
      </div>
      {foods.fields.length === 0 ? <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No se agregaron alimentos.</Typography></Paper> : <div className="grid gap-3">{foods.fields.map((food, index) => <Paper key={food.id} variant="outlined" sx={{ p: 2 }}><div className="grid gap-x-4 md:grid-cols-2 xl:grid-cols-4">
        <TextField {...register(`food.${index}.foodName`, { required: 'El alimento es obligatorio.', maxLength: 256 })} error={Boolean(errors.food?.[index]?.foodName)} helperText={errors.food?.[index]?.foodName?.message ?? ' '} label={<FieldLabel required>Alimento</FieldLabel>} />
        <TextField {...register(`food.${index}.calories`, { min: { value: 0, message: 'No puede ser menor que cero.' }, valueAsNumber: false })} error={Boolean(errors.food?.[index]?.calories)} helperText={errors.food?.[index]?.calories?.message ?? 'Opcional'} label="Calorías" type="number" />
        <TextField {...register(`food.${index}.quantity`, { required: 'La cantidad es obligatoria.', maxLength: 256 })} error={Boolean(errors.food?.[index]?.quantity)} helperText={errors.food?.[index]?.quantity?.message ?? ' '} label={<FieldLabel required>Cantidad</FieldLabel>} />
        <div className="flex items-start gap-2"><TextField {...register(`food.${index}.unitMeasurement`, { maxLength: 128 })} fullWidth helperText="Opcional" label="Unidad de medida" /><IconButton aria-label="Eliminar alimento" color="error" onClick={() => foods.remove(index)}><MaterialSymbol name="delete" size={22} /></IconButton></div>
      </div></Paper>)}</div>}

      <Divider sx={{ my: 2 }} />
      <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_1fr] md:items-center">
        <Box sx={{ bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider', display: 'grid', minHeight: 190, overflow: 'hidden', placeItems: 'center' }}>
          {displayedPhoto ? <Box alt="Vista previa de la comida" component="img" src={displayedPhoto} sx={{ height: 220, objectFit: 'cover', width: '100%' }} /> : <div className="grid place-items-center gap-2 p-4 text-center"><MaterialSymbol name="add_a_photo" size={42} style={{ color: '#7567e8' }} /><Typography color="text.secondary">Fotografía opcional</Typography></div>}
        </Box>
        <div><Typography variant="h6">Fotografía</Typography><Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">Selecciona una imagen o abre la cámara trasera del teléfono.</Typography><div className="flex flex-wrap gap-2">
          <Button component="label" startIcon={<MaterialSymbol name="photo_library" size={19} />} variant="outlined">Seleccionar foto<input accept="image/png,image/jpeg,image/webp" hidden onChange={selectPhoto} type="file" /></Button>
          <Button component="label" startIcon={<MaterialSymbol name="photo_camera" size={19} />} variant="outlined">Tomar foto<input accept="image/*" capture="environment" hidden onChange={selectPhoto} type="file" /></Button>
          {displayedPhoto && <Button color="error" onClick={() => { setPhoto(null); setPhotoPreview(null); setRemovePhoto(Boolean(record.data?.photoId)) }} startIcon={<MaterialSymbol name="delete" size={19} />} type="button" variant="text">Quitar foto</Button>}
        </div><Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">PNG, JPEG o WEBP. Máximo 10 MB.</Typography></div>
      </div>

      <div className="mt-5 flex flex-col-reverse justify-end gap-3 sm:flex-row"><Button disabled={pending} onClick={() => navigate('/nutrition')} startIcon={<MaterialSymbol name="arrow_back" size={20} />} variant="outlined">Cancelar</Button><Button disabled={!isValid || pending} startIcon={pending ? <CircularProgress color="inherit" size={18} /> : <MaterialSymbol name="save" size={20} />} type="submit" variant="contained">{mode === 'update' ? 'Guardar cambios' : 'Registrar comida'}</Button></div>
    </Paper>}
  </FormPageLayout>
}

export function NutritionDetailsPage() {
  const navigate = useNavigate()
  const { recordId } = useParams()
  const query = useNutrition(recordId)
  const photo = useNutritionPhoto(recordId, query.data?.photoId)
  const access = useModulePermission('nutrition')
  const record = query.data
  return <FormPageLayout actions={<Button onClick={() => navigate('/nutrition')} startIcon={<MaterialSymbol name="arrow_back" size={20} />} variant="outlined">Volver</Button>} ancestors={[{ label: 'Catálogos', to: '/catalogs' }, { label: 'Nutrición', to: '/nutrition' }]} description="Consulta los datos generales y alimentos registrados." title="Detalle de nutrición">
    {query.isLoading && <div className="grid min-h-64 place-items-center"><CircularProgress /></div>}
    {query.error && <Alert severity="error">No fue posible cargar el registro.</Alert>}
    {record && <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5"><div className="flex items-center gap-3"><MaterialSymbol name="nutrition" size={36} style={{ color: '#7567e8' }} /><div><Typography variant="h5">{record.name}</Typography><Typography color="text.secondary">{mealLabel(record.mealType)} · {new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(record.dateTimeConsumption))}</Typography></div></div>{access.canUpdate && <Button onClick={() => navigate(`/nutrition/update/${record.id}`)} startIcon={<MaterialSymbol name="edit" size={20} />} variant="contained">Editar</Button>}</div>
      {record.photoId && <><Divider />{photo.isLoading ? <div className="grid min-h-48 place-items-center"><CircularProgress /></div> : photo.data ? <Box alt={`Fotografía de ${record.name}`} component="img" src={photo.data} sx={{ display: 'block', maxHeight: 440, objectFit: 'contain', width: '100%' }} /> : <Alert severity="error">No fue posible cargar la fotografía.</Alert>}</>}
      <Divider />
      <div className="p-5"><Typography sx={{ mb: 2 }} variant="h6">Alimentos</Typography>{record.food?.length ? <div className="grid gap-3">{record.food.map((food, index) => <Paper key={food.id ?? index} variant="outlined" sx={{ p: 2 }}><div className="grid gap-3 sm:grid-cols-3"><div><Typography color="text.secondary" variant="caption">Alimento</Typography><Typography>{food.foodName}</Typography></div><div><Typography color="text.secondary" variant="caption">Calorías</Typography><Typography>{food.calories ?? 'No especificadas'}</Typography></div><div><Typography color="text.secondary" variant="caption">Cantidad</Typography><Typography>{food.quantity}{food.unitMeasurement ? ` ${food.unitMeasurement}` : ''}</Typography></div></div></Paper>)}</div> : <Typography color="text.secondary">No se detallaron alimentos para esta comida.</Typography>}</div>
      {record.notes && <><Divider /><div className="p-5"><Typography color="text.secondary" variant="body2">Descripción (notas)</Typography><Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{record.notes}</Typography></div></>}
    </Paper>}
  </FormPageLayout>
}
