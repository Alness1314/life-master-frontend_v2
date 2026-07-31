import { useEffect, useState } from 'react'
import {
  Alert, Button, Card, CardContent, Chip, CircularProgress, Divider, MenuItem,
  Paper, TextField, Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { apiClient, getApiErrorMessage, getApiValidationErrors } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { useFeedback } from '../../components/feedback/useFeedback'
import { FormCard } from '../../components/form/FormCard'
import { FieldLabel } from '../../components/form/FieldLabel'
import { FormPageLayout } from '../../components/form/FormPageLayout'
import { FormPasswordField } from '../../components/form/FormPasswordField'
import { FormTextField } from '../../components/form/FormTextField'
import { MaterialSymbol } from '../../components/icons/MaterialSymbol'
import { ModulePageLayout } from '../../components/layout/ModulePageLayout'
import { DynamicDataTable } from '../../components/table/DynamicDataTable'
import type { DataTableColumn } from '../../components/table/DynamicDataTable'
import { API_ROUTES } from '../../config/apiRoutes'
import { useCurrentUser } from '../users/api'
import { UserAvatar } from '../users/components/UserAvatar'
import { blobToDataUrl } from '../users/profileImage'

interface FinancialAlert {
  id: string
  type: string
  severity: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

interface FinancialReminder {
  id: string
  title: string
  message: string
  scheduledAt: string
  delivered: boolean
  cancelled: boolean
}

interface AuditEvent {
  id: string
  userId: string | null
  username: string | null
  method: string
  resource: string
  action: string
  module: string
  recordId: string | null
  detail: string | null
  successful: boolean
  responseStatus: number
  correlationId: string
  ipAddress: string | null
  userAgent: string | null
  durationMs: number
  createdAt: string
}

interface AuditEventPage {
  content: AuditEvent[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

interface StoredFile {
  id: string
  originalName: string
  contentType: string
  sizeBytes: number
  purpose: string
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    .format(new Date(value))
}

function severityLabel(severity: string) {
  const labels: Record<string, string> = {
    CRITICAL: 'Crítica',
    HIGH: 'Alta',
    MEDIUM: 'Media',
    LOW: 'Baja',
  }
  return labels[severity] ?? severity
}

export function FinancialAlertsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess } = useFeedback()
  const alertsQuery = useQuery({
    queryKey: ['financial-alerts', user?.id],
    queryFn: async () => (await apiClient.get<FinancialAlert[]>(API_ROUTES.alerts.root(user!.id))).data,
    enabled: Boolean(user),
  })
  const refreshMutation = useMutation({
    mutationFn: () => apiClient.post(API_ROUTES.alerts.refresh(user!.id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['financial-alerts', user?.id] })
      showSuccess('Alertas financieras actualizadas.')
    },
  })
  const readMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(API_ROUTES.alerts.markRead(user!.id, id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-alerts', user?.id] }),
  })

  return (
    <ModulePageLayout
      actions={(
        <Button
          disabled={refreshMutation.isPending}
          onClick={() => refreshMutation.mutate()}
          startIcon={<MaterialSymbol name="refresh" />}
          variant="contained"
        >
          Regenerar alertas
        </Button>
      )}
      description="Revisa riesgos, vencimientos y situaciones que requieren atención."
      title="Alertas financieras"
    >
      {alertsQuery.isLoading && <div className="grid min-h-52 place-items-center"><CircularProgress /></div>}
      {alertsQuery.error && <Alert severity="error">No fue posible cargar las alertas.</Alert>}
      <div className="grid gap-4">
        {alertsQuery.data?.map((alert) => (
          <Card
            elevation={0}
            key={alert.id}
            sx={{ border: '1px solid', borderColor: alert.read ? 'divider' : 'warning.main' }}
          >
            <CardContent className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Typography variant="h6">{alert.title}</Typography>
                  <Chip
                    color={alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? 'error' : 'warning'}
                    label={severityLabel(alert.severity)}
                    size="small"
                    variant="outlined"
                  />
                  {!alert.read && <Chip color="primary" label="Nueva" size="small" />}
                </div>
                <Typography>{alert.message}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
                  {dateTime(alert.createdAt)}
                </Typography>
              </div>
              {!alert.read && (
                <Button onClick={() => readMutation.mutate(alert.id)} variant="outlined">
                  Marcar como leída
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {alertsQuery.data?.length === 0 && <Alert severity="success">No hay alertas activas.</Alert>}
      </div>
    </ModulePageLayout>
  )
}

export function FinancialRemindersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess } = useFeedback()
  const [form, setForm] = useState({ title: '', message: '', scheduledAt: '' })
  const remindersQuery = useQuery({
    queryKey: ['financial-reminders', user?.id],
    queryFn: async () => (
      await apiClient.get<FinancialReminder[]>(API_ROUTES.reminders.root(user!.id))
    ).data,
    enabled: Boolean(user),
  })
  const saveMutation = useMutation({
    mutationFn: () => apiClient.post(API_ROUTES.reminders.root(user!.id), form),
    onSuccess: async () => {
      setForm({ title: '', message: '', scheduledAt: '' })
      await queryClient.invalidateQueries({ queryKey: ['financial-reminders', user?.id] })
      showSuccess('Recordatorio registrado correctamente.')
    },
  })
  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(API_ROUTES.reminders.cancel(user!.id, id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-reminders', user?.id] }),
  })

  return (
    <FormPageLayout
      description="Programa avisos para pagos y compromisos financieros."
      title="Recordatorios financieros"
    >
      <FormCard onSubmit={(event) => { event.preventDefault(); saveMutation.mutate() }}>
        <div className="grid gap-x-5 gap-y-1 md:grid-cols-2">
          <TextField
            error={Boolean(saveMutation.error)}
            helperText=" "
            label={<FieldLabel required>Título</FieldLabel>}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            slotProps={{ htmlInput: { 'aria-required': true } }}
            value={form.title}
          />
          <TextField
            helperText=" "
            label={<FieldLabel required>Fecha y hora</FieldLabel>}
            onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}
            slotProps={{
              htmlInput: { 'aria-required': true },
              inputLabel: { shrink: true },
            }}
            type="datetime-local"
            value={form.scheduledAt}
          />
          <TextField
            className="md:col-span-2"
            helperText=" "
            label={<FieldLabel required>Mensaje</FieldLabel>}
            multiline
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            rows={3}
            slotProps={{ htmlInput: { 'aria-required': true } }}
            value={form.message}
          />
        </div>
        {saveMutation.error && <Alert severity="error">{getApiErrorMessage(saveMutation.error)}</Alert>}
        <div className="mt-4 flex justify-end">
          <Button
            disabled={!form.title || !form.message || !form.scheduledAt || saveMutation.isPending}
            startIcon={<MaterialSymbol name="add_alert" />}
            type="submit"
            variant="contained"
          >
            Registrar recordatorio
          </Button>
        </div>
      </FormCard>
      <div className="mt-5 grid gap-3">
        {remindersQuery.data?.map((reminder) => (
          <Paper className="flex flex-wrap items-center justify-between gap-4 p-5" elevation={0} key={reminder.id}>
            <div>
              <Typography variant="h6">{reminder.title}</Typography>
              <Typography>{reminder.message}</Typography>
              <Typography color="text.secondary" variant="caption">{dateTime(reminder.scheduledAt)}</Typography>
            </div>
            <div className="flex items-center gap-2">
              <Chip
                color={reminder.cancelled ? 'default' : reminder.delivered ? 'success' : 'warning'}
                label={reminder.cancelled ? 'Cancelado' : reminder.delivered ? 'Entregado' : 'Pendiente'}
              />
              {!reminder.cancelled && !reminder.delivered && (
                <Button color="error" onClick={() => cancelMutation.mutate(reminder.id)} variant="outlined">
                  Cancelar
                </Button>
              )}
            </div>
          </Paper>
        ))}
      </div>
    </FormPageLayout>
  )
}

const personalProfileSchema = z.object({
  fullName: z.string()
    .trim()
    .min(1, 'El nombre completo es obligatorio.')
    .max(256, 'El nombre completo no puede superar 256 caracteres.'),
  password: z.string().refine(
    (value) => value.length === 0 || (value.length >= 12 && value.length <= 128),
    'La contraseña debe tener entre 12 y 128 caracteres.',
  ),
})

type PersonalProfileForm = z.infer<typeof personalProfileSchema>

export function PersonalProfilePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: currentUser } = useCurrentUser()
  const { showSuccess } = useFeedback()
  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { isValid },
  } = useForm<PersonalProfileForm>({
    defaultValues: { fullName: '', password: '' },
    mode: 'onChange',
    resolver: zodResolver(personalProfileSchema),
  })
  useEffect(() => {
    if (currentUser) reset({ fullName: currentUser.fullName, password: '' })
  }, [currentUser, reset])
  const imageQuery = useQuery({
    queryKey: ['profile-image', user?.id, currentUser?.imageId],
    queryFn: async () => {
      const response = await apiClient.get<Blob>(
        API_ROUTES.files.content(user!.id, currentUser!.imageId!),
        { responseType: 'blob' },
      )
      return blobToDataUrl(response.data)
    },
    enabled: Boolean(user && currentUser?.imageId),
  })
  const imageMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData()
      body.append('file', file)
      const requestConfig = { headers: { 'Content-Type': 'multipart/form-data' } }
      const { data } = currentUser?.imageId
        ? await apiClient.put<StoredFile>(
          `${API_ROUTES.files.byId(user!.id, currentUser.imageId)}?purpose=PROFILE_IMAGE`,
          body,
          requestConfig,
        )
        : await apiClient.post<StoredFile>(
          `${API_ROUTES.files.root(user!.id)}?purpose=PROFILE_IMAGE`,
          body,
          requestConfig,
        )
      if (!currentUser?.imageId) await apiClient.put(API_ROUTES.profile.me, { imageId: data.id })
      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['current-user'] })
      await queryClient.invalidateQueries({ queryKey: ['profile-image'] })
      showSuccess('Imagen de perfil actualizada correctamente.')
    },
  })
  const mutation = useMutation({
    mutationFn: (values: PersonalProfileForm) => apiClient.put(API_ROUTES.profile.me, {
      fullName: values.fullName.trim(),
      password: values.password || null,
      imageId: currentUser?.imageId ?? null,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['current-user'] })
      reset((values) => ({ ...values, password: '' }))
      showSuccess('Perfil actualizado correctamente.')
    },
    onError: (error) => {
      const fieldErrors = getApiValidationErrors(error)
      if (fieldErrors.fullName) setError('fullName', { message: fieldErrors.fullName, type: 'server' })
      if (fieldErrors.password) setError('password', { message: fieldErrors.password, type: 'server' })
    },
  })
  const fullName = watch('fullName')

  return (
    <FormPageLayout
      actions={(
        <Button
          onClick={() => navigate('/dashboard')}
          startIcon={<MaterialSymbol name="arrow_back" size={20} />}
          variant="outlined"
        >
          Volver
        </Button>
      )}
      description="Actualiza tus datos personales y contraseña."
      title="Mi perfil"
    >
      <FormCard onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
          <UserAvatar editable fullName={fullName} imageUrl={imageQuery.data} size={96} />
          <div className="text-center sm:text-left">
            <Typography sx={{ fontWeight: 700 }}>Imagen de perfil</Typography>
            <Typography color="text.secondary" sx={{ mb: 1.5, mt: 0.5 }} variant="body2">
              Usa una imagen PNG, JPEG o WEBP de hasta 10 MB.
            </Typography>
            <Button
              component="label"
              disabled={imageMutation.isPending}
              startIcon={imageMutation.isPending
                ? <CircularProgress color="inherit" size={18} />
                : <MaterialSymbol name="add_a_photo" size={20} />}
              variant="outlined"
            >
              Cambiar foto
              <input
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) imageMutation.mutate(file)
                  event.target.value = ''
                }}
                type="file"
              />
            </Button>
          </div>
        </div>
        <Divider sx={{ mb: 3 }} />
        <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
          <TextField
            disabled
            fullWidth
            helperText=" "
            label={<FieldLabel>Correo electrónico</FieldLabel>}
            value={currentUser?.username ?? ''}
          />
          <FormTextField
            autoComplete="name"
            control={control}
            disabled={mutation.isPending}
            label="Nombre completo"
            name="fullName"
            required
          />
          <div className="md:col-span-2">
            <FormPasswordField
              control={control}
              disabled={mutation.isPending}
              hint="Déjala vacía para conservar la contraseña actual."
              label="Nueva contraseña"
              name="password"
            />
          </div>
        </div>
        {(mutation.error || imageMutation.error) && (
          <Alert severity="error">{getApiErrorMessage(mutation.error ?? imageMutation.error)}</Alert>
        )}
        <div className="mt-3 flex justify-end">
          <Button
            disabled={!isValid || mutation.isPending}
            startIcon={mutation.isPending
              ? <CircularProgress color="inherit" size={18} />
              : <MaterialSymbol name="save" size={20} />}
            type="submit"
            variant="contained"
          >
            Guardar cambios
          </Button>
        </div>
      </FormCard>
    </FormPageLayout>
  )
}

export function AuditEventsPage() {
  const [limit, setLimit] = useState(100)
  const [module, setModule] = useState('')
  const [action, setAction] = useState('')
  const [successful, setSuccessful] = useState('')
  const eventsQuery = useQuery({
    queryKey: ['audit-events', limit, module, action, successful],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '0', size: String(limit) })
      if (module) params.set('module', module)
      if (action) params.set('action', action)
      if (successful) params.set('successful', successful)
      return (await apiClient.get<AuditEventPage>(`${API_ROUTES.audit.search}?${params}`)).data
    },
  })
  const columns: DataTableColumn<AuditEvent>[] = [
    { id: 'date', header: 'Fecha', minWidth: 170, render: (event) => dateTime(event.createdAt) },
    { id: 'user', header: 'Usuario', minWidth: 180, render: (event) => event.username || 'Anónimo' },
    { id: 'action', header: 'Acción', align: 'center', render: (event) => event.action },
    { id: 'module', header: 'Módulo', align: 'center', render: (event) => event.module },
    { id: 'record', header: 'Registro', minWidth: 180, render: (event) => event.recordId || '—' },
    { id: 'detail', header: 'Detalle', minWidth: 240, render: (event) => event.detail || event.resource },
    {
      id: 'result',
      header: 'Resultado',
      align: 'center',
      render: (event) => (
        <Chip
          color={event.successful ? 'success' : 'error'}
          label={event.successful ? 'Exitoso' : `Error ${event.responseStatus}`}
          size="small"
          variant="outlined"
        />
      ),
    },
    { id: 'duration', header: 'Duración', align: 'center', render: (event) => `${event.durationMs} ms` },
    { id: 'ip', header: 'Dirección IP', render: (event) => event.ipAddress || '—' },
  ]
  return (
    <ModulePageLayout
      ancestors={[{ label: 'Configuración', to: '/settings' }]}
      description="Consulta los eventos administrativos del sistema."
      title="Auditoría"
    >
      <Paper
        component="section"
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          mb: 2,
          p: 2,
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_180px_190px]">
          <TextField
            fullWidth
            label="Módulo"
            onChange={(e) => setModule(e.target.value)}
            placeholder="Ej. GASTOS"
            size="small"
            value={module}
          />
          <TextField
            fullWidth
            label="Acción"
            onChange={(e) => setAction(e.target.value)}
            select
            size="small"
            value={action}
          >
            <MenuItem value="">Todas</MenuItem>
            {['CREAR', 'ACTUALIZAR', 'ELIMINAR'].map((value) => (
              <MenuItem key={value} value={value}>{value}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Resultado"
            onChange={(e) => setSuccessful(e.target.value)}
            select
            size="small"
            value={successful}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Exitosos</MenuItem>
            <MenuItem value="false">Con error</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Últimos registros"
            onChange={(e) => setLimit(Number(e.target.value))}
            select
            size="small"
            value={limit}
          >
            {[50, 100, 200].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </TextField>
        </div>
      </Paper>
      <DynamicDataTable
        columns={columns}
        data={eventsQuery.data?.content ?? []}
        error={eventsQuery.error ? 'No fue posible cargar la auditoría.' : null}
        getRowId={(event) => event.id}
        loading={eventsQuery.isLoading}
      />
    </ModulePageLayout>
  )
}
