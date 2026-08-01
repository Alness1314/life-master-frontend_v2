import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Alert, Button, CircularProgress, Divider, MenuItem, Paper, TextField, Typography,
} from '@mui/material'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { apiClient, getApiErrorMessage, getApiValidationErrors } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog'
import { useFeedback } from '../../components/feedback/useFeedback'
import { FieldLabel } from '../../components/form/FieldLabel'
import { FormCard } from '../../components/form/FormCard'
import { FormMultiSelect } from '../../components/form/FormMultiSelect'
import { FormPageLayout } from '../../components/form/FormPageLayout'
import { MaterialSymbol } from '../../components/icons/MaterialSymbol'
import { ModulePageLayout } from '../../components/layout/ModulePageLayout'
import { DynamicDataTable } from '../../components/table/DynamicDataTable'
import type { DataTableColumn } from '../../components/table/DynamicDataTable'
import { TableRowActions } from '../../components/table/TableRowActions'
import { toCurrencySelectOptions, useCurrencies } from '../../hooks/useCurrencies'
import { useModulePermission } from '../modules/api'
import type { CrudField, CrudFormValues, CrudModuleConfig, CrudRecord } from './types'

function useRecords(config: CrudModuleConfig, userId?: string, allowed = true) {
  return useQuery({
    queryKey: [config.key, userId],
    queryFn: async () => (await apiClient.get<CrudRecord[]>(config.endpoint(userId!))).data,
    enabled: Boolean(userId && allowed),
  })
}

function useRecord(config: CrudModuleConfig, userId?: string, id?: string, allowed = true) {
  return useQuery({
    queryKey: [config.key, userId, id],
    queryFn: async () => (await apiClient.get<CrudRecord>(config.endpointById(userId!, id!))).data,
    enabled: Boolean(userId && id && allowed),
  })
}

function renderValue(field: CrudField, record: CrudRecord): ReactNode {
  const value = record[field.name]
  if (field.sensitive) return value ? 'Dato protegido' : 'Sin dato'
  if (field.format) return field.format(value, record)
  if (value == null || value === '') return 'Sin información'
  return String(value)
}

function SensitiveValue({
  config,
  recordId,
  userId,
}: {
  config: CrudModuleConfig
  recordId: string
  userId: string
}) {
  const [visible, setVisible] = useState(false)
  const secretQuery = useMutation({
    mutationFn: async () => {
      if (!config.secretEndpoint) throw new Error('No existe un endpoint para revelar el dato.')
      return (await apiClient.get<{ password: string }>(
        config.secretEndpoint(userId, recordId),
      )).data.password
    },
    onSuccess: () => setVisible(true),
  })

  const hide = () => {
    setVisible(false)
    secretQuery.reset()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Typography
          aria-label={visible ? 'Contraseña visible' : 'Contraseña oculta'}
          sx={{ fontFamily: visible ? 'inherit' : 'monospace', mt: 0.5 }}
        >
          {visible ? secretQuery.data : '••••••••••••'}
        </Typography>
        <Button
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          disabled={secretQuery.isPending}
          onClick={visible ? hide : () => secretQuery.mutate()}
          size="small"
          startIcon={secretQuery.isPending
            ? <CircularProgress color="inherit" size={16} />
            : <MaterialSymbol name={visible ? 'visibility_off' : 'visibility'} size={18} />}
          variant="text"
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </Button>
      </div>
      {secretQuery.error && (
        <Typography color="error" variant="caption">
          {getApiErrorMessage(secretQuery.error)}
        </Typography>
      )}
    </div>
  )
}

export function StandardCrudListPage({ config }: { config: CrudModuleConfig }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { showError, showSuccess } = useFeedback()
  const access = useModulePermission(config.permissionKey ?? config.key)
  const recordsQuery = useRecords(config, user?.id, access.canRead)
  const [recordToDelete, setRecordToDelete] = useState<CrudRecord | null>(null)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(config.endpointById(user!.id, id)),
    onSuccess: async () => {
      setRecordToDelete(null)
      await queryClient.invalidateQueries({ queryKey: [config.key, user?.id] })
      showSuccess(`${config.singular} eliminado correctamente.`)
    },
  })
  const listActionMutation = useMutation({
    mutationFn: async () => {
      if (!config.listAction || !user) return
      return (await apiClient.post(config.listAction.endpoint(user.id))).data
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries()
      if (config.listAction) showSuccess(config.listAction.successMessage(response))
    },
    onError: (error) => showError(getApiErrorMessage(error)),
  })

  const columns = useMemo<DataTableColumn<CrudRecord>[]>(() => [
    { id: 'number', header: 'No.', align: 'center', width: 65, render: (_, index) => index + 1 },
    ...config.fields.filter((field) => field.table && !field.sensitive).map((field) => ({
      id: field.name,
      header: field.label,
      align: 'center' as const,
      minWidth: field.type === 'textarea' ? 220 : 140,
      render: (record: CrudRecord) => renderValue(field, record),
      sortValue: (record: CrudRecord) => {
        const value = record[field.name]
        return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? value
          : String(value ?? '')
      },
    })),
    {
      id: 'actions',
      header: 'Acciones',
      align: 'center',
      minWidth: 150,
      render: (record: CrudRecord) => (
        <TableRowActions
          onDelete={access.canDelete ? () => setRecordToDelete(record) : undefined}
          onEdit={access.canUpdate ? () => navigate(`${config.basePath}/update/${record.id}`) : undefined}
          onView={access.canRead ? () => navigate(`${config.basePath}/details/${record.id}`) : undefined}
        />
      ),
    },
  ], [access.canDelete, access.canRead, access.canUpdate, config, navigate])

  return (
    <ModulePageLayout
      actions={(
        <div className="flex flex-wrap justify-end gap-3">
          {config.permissionsPath && access.canUpdate && (
            <Button
              onClick={() => navigate(config.permissionsPath!)}
              startIcon={<MaterialSymbol name="admin_panel_settings" size={20} />}
              variant="outlined"
            >
              Configurar permisos
            </Button>
          )}
          {config.listAction && access.canCreate && (
            <Button
              disabled={listActionMutation.isPending}
              onClick={() => listActionMutation.mutate()}
              startIcon={listActionMutation.isPending
                ? <CircularProgress color="inherit" size={18} />
                : <MaterialSymbol name={config.listAction.icon} size={20} />}
              variant="outlined"
            >
              {config.listAction.label}
            </Button>
          )}
          {access.canCreate && (
            <Button onClick={() => navigate(`${config.basePath}/register`)}
              startIcon={<MaterialSymbol name="add" size={20} />} variant="contained">
              Registrar {config.singular.toLowerCase()}
            </Button>
          )}
        </div>
      )}
      ancestors={[config.section]}
      description={config.description}
      title={config.plural}
    >
      {!access.isLoading && !access.canRead ? (
        <Alert severity="error">No tienes permiso para consultar este módulo.</Alert>
      ) : (
        <DynamicDataTable
          columns={columns}
          data={recordsQuery.data ?? []}
          emptyMessage={`No hay ${config.plural.toLowerCase()} registrados.`}
          error={recordsQuery.error ? `No fue posible cargar ${config.plural.toLowerCase()}.` : null}
          getRowId={(record) => record.id}
          loading={access.isLoading || recordsQuery.isLoading}
        />
      )}
      <ConfirmDialog
        confirmLabel="Sí, eliminar"
        error={deleteMutation.error ? getApiErrorMessage(deleteMutation.error) : null}
        message={<>¿Deseas eliminar <strong>{String(recordToDelete?.[config.primaryField] ?? '')}</strong>?
          <br />Esta acción no se puede revertir.</>}
        onClose={() => !deleteMutation.isPending && setRecordToDelete(null)}
        onConfirm={() => recordToDelete && deleteMutation.mutate(recordToDelete.id)}
        open={Boolean(recordToDelete)}
        pending={deleteMutation.isPending}
        title={`Eliminar ${config.singular.toLowerCase()}`}
        tone="danger"
      />
    </ModulePageLayout>
  )
}

function CrudForm({ config, record, pending, serverError, onSubmit }: {
  config: CrudModuleConfig
  record?: CrudRecord
  pending: boolean
  serverError?: unknown
  onSubmit: (values: CrudFormValues) => void
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const dynamicOptionsConfigs = config.dynamicOptions
    ? Array.isArray(config.dynamicOptions) ? config.dynamicOptions : [config.dynamicOptions]
    : []
  const dynamicOptionsQueries = useQueries({
    queries: dynamicOptionsConfigs.map((optionConfig) => {
      const endpoint = typeof optionConfig.endpoint === 'function'
        ? optionConfig.endpoint(user?.id ?? '')
        : optionConfig.endpoint
      return {
        queryKey: ['crud-options', endpoint],
        queryFn: async () => (
          await apiClient.get<Array<{ id: string; name: string; erased?: boolean; active?: boolean }>>(
            endpoint,
          )
        ).data
          .filter((item) => !item.erased && item.active !== false)
          .map((item) => ({ label: item.name, value: item.id })),
        enabled: Boolean(endpoint && user),
      }
    }),
  })
  const dynamicOptionsByField = Object.fromEntries(dynamicOptionsConfigs.map((option, index) => [
    option.fieldName,
    dynamicOptionsQueries[index]?.data ?? [],
  ]))
  const loadingDynamicFields = new Set(dynamicOptionsConfigs
    .filter((_, index) => dynamicOptionsQueries[index]?.isLoading)
    .map((option) => option.fieldName))
  const currenciesQuery = useCurrencies()
  const formFields = config.fields.filter((field) => field.form !== false)
  const defaults = Object.fromEntries(formFields.map((field) => [
    field.name,
    field.type === 'multiselect'
      ? []
      : typeof field.defaultValue === 'function' ? field.defaultValue() : field.defaultValue ?? '',
  ]))
  const { control, handleSubmit, reset, setError, formState: { isValid } } =
    useForm<CrudFormValues>({ defaultValues: defaults, mode: 'onChange' })

  useEffect(() => {
    if (!record) return
    reset(config.toFormValues?.(record) ?? Object.fromEntries(formFields.map((field) => [
      field.name, field.sensitive ? '' : String(record[field.name] ?? ''),
    ])))
  }, [config, record, reset])

  useEffect(() => {
    Object.entries(getApiValidationErrors(serverError))
      .forEach(([name, message]) => setError(name, { message }))
  }, [serverError, setError])

  return (
    <FormCard onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
        {formFields.map((field) => (
          <div className={field.type === 'textarea' ? 'md:col-span-2' : ''} key={field.name}>
            {field.type === 'multiselect' ? (
              <FormMultiSelect
                control={control}
                disabled={pending || loadingDynamicFields.has(field.name)}
                label={field.label}
                name={field.name}
                options={dynamicOptionsByField[field.name] ?? field.options ?? []}
                required={field.required}
              />
            ) : (
              <Controller
              control={control}
              name={field.name}
              rules={{
                required: field.required ? `${field.label} es obligatorio.` : false,
                maxLength: field.maxLength
                  ? { value: field.maxLength, message: `Máximo ${field.maxLength} caracteres.` }
                  : undefined,
                min: field.min == null ? undefined
                  : { value: field.min, message: `El valor mínimo es ${field.min}.` },
              }}
              render={({ field: input, fieldState }) => (
                <TextField
                  {...input}
                  disabled={pending
                    || loadingDynamicFields.has(field.name)
                    || (field.name === 'currency' && currenciesQuery.isLoading)}
                  error={Boolean(fieldState.error)}
                  fullWidth
                  helperText={fieldState.error?.message ?? ' '}
                  label={<FieldLabel required={Boolean(field.required)}>{field.label}</FieldLabel>}
                  multiline={field.type === 'textarea'}
                  rows={field.rows ?? (field.type === 'textarea' ? 4 : undefined)}
                  select={field.type === 'select'}
                  type={field.type === 'textarea' || field.type === 'select' ? 'text' : field.type}
                >
                  {field.type === 'select' && (
                    field.name === 'currency'
                      ? toCurrencySelectOptions(currenciesQuery.data)
                      : dynamicOptionsByField[field.name]
                      ? [...(field.options ?? []), ...dynamicOptionsByField[field.name]]
                      : field.options
                  )?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button disabled={pending} onClick={() => navigate(config.basePath)}
          startIcon={<MaterialSymbol name="arrow_back" size={20} />} variant="outlined">Cancelar</Button>
        <Button disabled={!isValid || pending}
          startIcon={pending ? <CircularProgress color="inherit" size={18} />
            : <MaterialSymbol name="save" size={20} />}
          type="submit" variant="contained">
          {record ? 'Guardar cambios' : `Registrar ${config.singular.toLowerCase()}`}
        </Button>
      </div>
    </FormCard>
  )
}

export function StandardCrudEditorPage({ config, mode }: {
  config: CrudModuleConfig
  mode: 'create' | 'update'
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { recordId } = useParams()
  const { user } = useAuth()
  const { showError, showSuccess } = useFeedback()
  const access = useModulePermission(config.permissionKey ?? config.key)
  const isUpdate = mode === 'update'
  const allowed = isUpdate ? access.canUpdate : access.canCreate
  const recordQuery = useRecord(config, user?.id, isUpdate ? recordId : undefined, allowed)
  const mutation = useMutation({
    mutationFn: async (values: CrudFormValues) => {
      const payload = config.normalizeRequest?.(values) ?? values
      return isUpdate
        ? apiClient.put(config.endpointById(user!.id, recordId!), payload)
        : apiClient.post(config.endpoint(user!.id), payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [config.key, user?.id] })
      showSuccess(`${config.singular} ${isUpdate ? 'actualizado' : 'registrado'} correctamente.`)
      navigate(config.basePath, { replace: true })
    },
    onError: (error) => {
      if (Object.keys(getApiValidationErrors(error)).length === 0) showError(getApiErrorMessage(error))
    },
  })

  return (
    <FormPageLayout
      description={`${isUpdate ? 'Actualiza' : 'Captura'} la información de ${config.singular.toLowerCase()}.`}
      ancestors={[
        config.section,
        { label: config.plural, to: config.basePath },
      ]}
      title={isUpdate ? `Editar ${config.singular.toLowerCase()}` : `Registro de ${config.singular.toLowerCase()}`}
    >
      {!access.isLoading && !allowed && (
        <Alert severity="error">No tienes permiso para realizar esta operación.</Alert>
      )}
      {(access.isLoading || recordQuery.isLoading) && <div className="grid min-h-64 place-items-center"><CircularProgress /></div>}
      {recordQuery.error && <Alert severity="error">No fue posible cargar la información.</Alert>}
      {allowed && (!isUpdate || recordQuery.data) && (
        <CrudForm config={config} onSubmit={(values) => mutation.mutate(values)}
          pending={mutation.isPending} record={recordQuery.data} serverError={mutation.error} />
      )}
    </FormPageLayout>
  )
}

export function StandardCrudDetailsPage({ config }: { config: CrudModuleConfig }) {
  const navigate = useNavigate()
  const { recordId } = useParams()
  const { user } = useAuth()
  const access = useModulePermission(config.permissionKey ?? config.key)
  const recordQuery = useRecord(config, user?.id, recordId, access.canRead)
  const record = recordQuery.data

  return (
    <FormPageLayout actions={<Button onClick={() => navigate(config.basePath)}
      startIcon={<MaterialSymbol name="arrow_back" size={20} />} variant="outlined">Volver</Button>}
      description={`Consulta la información registrada de ${config.singular.toLowerCase()}.`}
      ancestors={[
        config.section,
        { label: config.plural, to: config.basePath },
      ]}
      title={`Detalle de ${config.singular.toLowerCase()}`}>
      {!access.isLoading && !access.canRead && (
        <Alert severity="error">No tienes permiso para consultar este módulo.</Alert>
      )}
      {(access.isLoading || recordQuery.isLoading) && <div className="grid min-h-64 place-items-center"><CircularProgress /></div>}
      {recordQuery.error && <Alert severity="error">No fue posible cargar la información.</Alert>}
      {record && (
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-7">
            <div className="flex items-center gap-4">
              <MaterialSymbol name={config.icon} size={40} style={{ color: '#7567e8' }} />
              <Typography variant="h5">{String(record[config.primaryField] ?? config.singular)}</Typography>
            </div>
            {access.canUpdate && (
              <Button onClick={() => navigate(`${config.basePath}/update/${record.id}`)}
                startIcon={<MaterialSymbol name="edit" size={20} />} variant="contained">Editar</Button>
            )}
          </div>
          <Divider />
          <div
            aria-label={config.detailLayout === 'document' ? 'Contenido de la nota' : undefined}
            className={config.detailLayout === 'document'
              ? 'grid gap-6 p-5 sm:p-7'
              : 'grid gap-7 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-3'}
            role={config.detailLayout === 'document' ? 'region' : undefined}
            tabIndex={config.detailLayout === 'document' ? 0 : undefined}
          >
            {config.fields.filter((field) => field.detail !== false).map((field) => (
              <div
                className={config.detailLayout === 'document' ? '' : 'flex gap-3'}
                key={field.name}
              >
                {config.detailLayout !== 'document' && (
                  <MaterialSymbol name={field.sensitive ? 'lock' : config.icon}
                    size={22} style={{ color: '#7567e8' }} />
                )}
                <div className={config.detailLayout === 'document' ? 'w-full' : ''}>
                  <Typography color="text.secondary" variant="body2">{field.label}</Typography>
                  {field.sensitive && config.secretEndpoint && user ? (
                    <SensitiveValue
                      config={config}
                      recordId={record.id}
                      userId={user.id}
                    />
                  ) : (
                    <Typography sx={{
                      lineHeight: config.detailLayout === 'document' ? 1.75 : undefined,
                      mt: 0.5,
                      overflowWrap: 'anywhere',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {renderValue(field, record)}
                    </Typography>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Paper>
      )}
    </FormPageLayout>
  )
}
