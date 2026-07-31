import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  LinearProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { useFeedback } from '../../components/feedback/useFeedback'
import { FormCard } from '../../components/form/FormCard'
import { FieldLabel } from '../../components/form/FieldLabel'
import { FormPageLayout } from '../../components/form/FormPageLayout'
import { MaterialSymbol } from '../../components/icons/MaterialSymbol'
import { API_ROUTES } from '../../config/apiRoutes'
import { toCurrencySelectOptions, useCurrencies } from '../../hooks/useCurrencies'

const MAX_FILE_SIZE = 20 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['csv', 'xls', 'xlsx']

interface ImportMovement {
  rowNumber: number
  date: string
  description: string
  amount: number
  type: 'EXPENSE' | 'INCOME'
  currency: string
}

interface ImportFailure {
  rowNumber: number
  description: string
  reason: string
}

interface ImportResult {
  dryRun: boolean
  format: 'CSV' | 'EXCEL'
  totalRows: number
  successfulRows: number
  failedRows: number
  expenses: number
  income: number
  warnings: string[]
  movements: ImportMovement[]
  failures: ImportFailure[]
}

interface FinancialAccount {
  id: string
  name: string
  currency: string
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount)
}

export function BankImportPage() {
  const { user } = useAuth()
  const { showError, showSuccess, showWarning } = useFeedback()
  const currencies = useCurrencies()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [defaultCurrency, setDefaultCurrency] = useState('MXN')
  const [preview, setPreview] = useState<ImportResult | null>(null)

  const accountsQuery = useQuery({
    queryKey: ['bank-import-accounts', user?.id],
    queryFn: async () => (
      await apiClient.get<FinancialAccount[]>(API_ROUTES.accounts.root(user!.id))
    ).data,
    enabled: Boolean(user),
  })
  const categoriesQuery = useQuery({
    queryKey: ['bank-import-categories'],
    queryFn: async () => (
      await apiClient.get<Array<{ id: string; name: string }>>(API_ROUTES.categories.root)
    ).data,
  })
  const selectedAccount = useMemo(
    () => accountsQuery.data?.find((account) => account.id === accountId),
    [accountId, accountsQuery.data],
  )
  const invalidatePreview = () => setPreview(null)

  const importMutation = useMutation({
    mutationFn: async (dryRun: boolean) => {
      const body = new FormData()
      body.append('file', file!)
      const parameters = new URLSearchParams({
        dryRun: String(dryRun),
        defaultCurrency: selectedAccount?.currency ?? defaultCurrency,
      })
      if (accountId) parameters.set('accountId', accountId)
      if (categoryId) parameters.set('expenseCategoryId', categoryId)
      return (await apiClient.post<ImportResult>(
        `${API_ROUTES.bankImports.file(user!.id)}?${parameters}`,
        body,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )).data
    },
    onSuccess: (result) => {
      setPreview(result)
      if (!result.dryRun && result.failedRows > 0) {
        showWarning(
          `Importación finalizada: ${result.successfulRows} exitosos y ${result.failedRows} fallidos.`,
        )
      } else if (!result.dryRun) {
        showSuccess('Movimientos bancarios importados correctamente.')
      }
    },
  })
  const templateMutation = useMutation({
    mutationFn: async (format: 'csv' | 'xlsx') => apiClient.get<Blob>(
      format === 'csv'
        ? API_ROUTES.bankImports.csvTemplate(user!.id)
        : API_ROUTES.bankImports.excelTemplate(user!.id),
      { responseType: 'blob' },
    ),
    onSuccess: (response, format) => {
      const url = URL.createObjectURL(response.data)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `plantilla-importacion-bancaria.${format}`
      anchor.click()
      URL.revokeObjectURL(url)
    },
    onError: () => showError('No fue posible descargar la plantilla.'),
  })

  const selectFile = (selected: File | undefined) => {
    setPreview(null)
    setFileError('')
    if (!selected) {
      setFile(null)
      return
    }
    const extension = selected.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFile(null)
      setFileError('Formato no compatible. Selecciona un archivo CSV, XLS o XLSX.')
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null)
      setFileError('El archivo excede el límite de 20 MB.')
      return
    }
    setFile(selected)
  }

  const resetImport = () => {
    setFile(null)
    setFileError('')
    setPreview(null)
    importMutation.reset()
  }

  if (preview && !preview.dryRun) {
    return (
      <FormPageLayout
        actions={(
          <Button
            onClick={resetImport}
            startIcon={<MaterialSymbol name="arrow_back" />}
            variant="outlined"
          >
            Regresar a importación bancaria
          </Button>
        )}
        description="Consulta qué registros fueron importados y cuáles fueron rechazados."
        title="Resultado de importación"
      >
        <Paper className="mb-5 p-5" variant="outlined">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Typography sx={{ fontWeight: 750 }} variant="h6">
                Archivo procesado: {preview.totalRows} registros
              </Typography>
              <Typography color="text.secondary">
                {file?.name} · {preview.format === 'EXCEL' ? 'Excel' : 'CSV'}
              </Typography>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip color="success" label={`${preview.successfulRows} exitosos`} />
              <Chip color={preview.failedRows > 0 ? 'error' : 'default'} label={`${preview.failedRows} fallidos`} />
            </div>
          </div>
          {preview.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              {preview.warnings.map((warning) => <Typography key={warning}>• {warning}</Typography>)}
            </Alert>
          )}
        </Paper>

        <Paper className="mb-5 overflow-hidden" variant="outlined">
          <div className="p-5">
            <Typography color="success.main" sx={{ fontWeight: 750 }} variant="h6">
              Registros exitosos
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Estos movimientos fueron guardados correctamente.
            </Typography>
          </div>
          {preview.movements.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 0 }}>
              No se importó ningún movimiento.
            </Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fila</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Importe</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.movements.map((movement) => (
                    <TableRow key={`success-${movement.rowNumber}`}>
                      <TableCell>{movement.rowNumber}</TableCell>
                      <TableCell>{movement.date}</TableCell>
                      <TableCell>{movement.description}</TableCell>
                      <TableCell>
                        <Chip
                          color={movement.type === 'EXPENSE' ? 'error' : 'success'}
                          label={movement.type === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatMoney(movement.amount, movement.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper className="overflow-hidden" variant="outlined">
          <div className="p-5">
            <Typography color="error.main" sx={{ fontWeight: 750 }} variant="h6">
              Registros fallidos
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Corrige estas filas en el archivo antes de volver a importarlas.
            </Typography>
          </div>
          {preview.failures.length === 0 ? (
            <Alert severity="success" sx={{ borderRadius: 0 }}>
              No hubo registros fallidos.
            </Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 320 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fila</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Motivo del fallo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.failures.map((failure) => (
                    <TableRow key={`failure-${failure.rowNumber}`}>
                      <TableCell>{failure.rowNumber}</TableCell>
                      <TableCell>{failure.description || 'Sin descripción'}</TableCell>
                      <TableCell>
                        <Typography color="error.main" variant="body2">{failure.reason}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </FormPageLayout>
    )
  }

  return (
    <FormPageLayout
      description="Valida estados de cuenta CSV o Excel antes de crear ingresos y gastos."
      title="Importación bancaria"
    >
      <FormCard onSubmit={(event) => { event.preventDefault(); importMutation.mutate(true) }}>
        <Paper
          className="mb-6 flex flex-col items-center justify-center gap-3 border-dashed px-5 py-8 text-center"
          elevation={0}
          sx={{ border: '1px dashed', borderColor: file ? 'primary.main' : 'divider' }}
        >
          <MaterialSymbol name="upload_file" size={42} style={{ color: '#7567e8' }} />
          <div>
            <Typography sx={{ fontWeight: 700 }}>
              {file?.name ?? 'Selecciona un estado de cuenta'}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              CSV o Excel de hasta 20 MB.
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Ningún movimiento se guardará sin tu confirmación.
            </Typography>
          </div>
          <Button component="label" startIcon={<MaterialSymbol name="attach_file" />} variant="outlined">
            Seleccionar archivo
            <input
              accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={(event) => selectFile(event.target.files?.[0])}
              type="file"
            />
          </Button>
        </Paper>

        <div className="grid gap-x-5 gap-y-1 md:grid-cols-3">
          <TextField
            helperText=" "
            label={<FieldLabel>Cuenta financiera</FieldLabel>}
            onChange={(event) => {
              const nextAccount = accountsQuery.data?.find((account) => account.id === event.target.value)
              setAccountId(event.target.value)
              if (nextAccount?.currency) setDefaultCurrency(nextAccount.currency)
              invalidatePreview()
            }}
            select
            value={accountId}
          >
            <MenuItem value="">Sin cuenta asociada</MenuItem>
            {accountsQuery.data?.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name} · {account.currency}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            helperText="Se aplica a movimientos que no indiquen moneda."
            label={<FieldLabel>Moneda predeterminada</FieldLabel>}
            onChange={(event) => {
              setDefaultCurrency(event.target.value)
              invalidatePreview()
            }}
            select
            value={selectedAccount?.currency ?? defaultCurrency}
          >
            {toCurrencySelectOptions(currencies.data).map((currency) => (
              <MenuItem key={currency.value} value={currency.value}>{currency.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            helperText="Obligatoria si se detectan cargos."
            label={<FieldLabel>Categoría para gastos</FieldLabel>}
            onChange={(event) => {
              setCategoryId(event.target.value)
              invalidatePreview()
            }}
            select
            value={categoryId}
          >
            <MenuItem value="">Sin categoría predeterminada</MenuItem>
            {categoriesQuery.data?.map((category) => (
              <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
            ))}
          </TextField>
        </div>

        {fileError && <Alert severity="error">{fileError}</Alert>}
        {importMutation.error && <Alert severity="error">{getApiErrorMessage(importMutation.error)}</Alert>}
        <Divider sx={{ mb: 2.25, mt: 4 }} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
              <Button
                disabled={templateMutation.isPending}
                onClick={() => templateMutation.mutate('csv')}
                size="small"
                startIcon={<MaterialSymbol name="download" />}
                variant="outlined"
              >
                Plantilla CSV
              </Button>
              <Button
                disabled={templateMutation.isPending}
                onClick={() => templateMutation.mutate('xlsx')}
                size="small"
                startIcon={<MaterialSymbol name="download" />}
                variant="outlined"
              >
                Plantilla Excel
              </Button>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              disabled={!file || importMutation.isPending}
              startIcon={<MaterialSymbol name="preview" />}
              type="submit"
              variant="outlined"
            >
              Validar archivo
            </Button>
            <Button
              disabled={!preview?.dryRun || preview.successfulRows === 0 || importMutation.isPending}
              onClick={() => importMutation.mutate(false)}
              startIcon={<MaterialSymbol name="upload_file" />}
              variant="contained"
            >
              Confirmar importación
            </Button>
          </div>
        </div>
      </FormCard>

      {preview && (
        <Paper className="mt-5 overflow-hidden" variant="outlined">
          <div className="flex flex-wrap items-start justify-between gap-3 p-5">
            <div>
              <Typography sx={{ fontWeight: 700 }}>
                Vista previa: {preview.totalRows} registros procesados
              </Typography>
              <Typography color="text.secondary">
                {preview.successfulRows} válidos y {preview.failedRows} rechazados.
              </Typography>
            </div>
            <div className="flex gap-2">
              <Chip label={preview.format === 'EXCEL' ? 'Excel' : preview.format} size="small" />
              <Chip color="success" label={`${preview.successfulRows} válidos`} size="small" />
              {preview.failedRows > 0 && (
                <Chip color="error" label={`${preview.failedRows} rechazados`} size="small" />
              )}
            </div>
          </div>
          {preview.warnings.length > 0 && (
            <Alert severity="warning" sx={{ borderRadius: 0 }}>
              {preview.warnings.map((warning) => <Typography key={warning}>• {warning}</Typography>)}
            </Alert>
          )}
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fila</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Importe</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {preview.movements.map((movement) => (
                  <TableRow key={`preview-${movement.rowNumber}`}>
                    <TableCell>{movement.rowNumber}</TableCell>
                    <TableCell>{movement.date}</TableCell>
                    <TableCell>{movement.description}</TableCell>
                    <TableCell>
                      <Chip
                        color={movement.type === 'EXPENSE' ? 'error' : 'success'}
                        label={movement.type === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{formatMoney(movement.amount, movement.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {preview.failures.length > 0 && (
            <>
              <div className="border-t p-5">
                <Typography color="error.main" sx={{ fontWeight: 700 }}>
                  Registros rechazados
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Estas filas no se importarán mientras contengan errores.
                </Typography>
              </div>
              <TableContainer sx={{ maxHeight: 280 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fila</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Motivo del fallo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.failures.map((failure) => (
                      <TableRow key={`preview-failure-${failure.rowNumber}`}>
                        <TableCell>{failure.rowNumber}</TableCell>
                        <TableCell>{failure.description || 'Sin descripción'}</TableCell>
                        <TableCell>
                          <Typography color="error.main" variant="body2">
                            {failure.reason}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
      )}

      <Dialog
        aria-describedby="bank-import-progress-description"
        aria-labelledby="bank-import-progress-title"
        fullWidth
        maxWidth="xs"
        open={importMutation.isPending}
      >
        <DialogContent sx={{ px: { xs: 3, sm: 5 }, py: 5, textAlign: 'center' }}>
          <CircularProgress aria-label="Procesando estado de cuenta" size={54} thickness={4} />
          <Typography id="bank-import-progress-title" sx={{ fontWeight: 750, mt: 3 }} variant="h6">
            {importMutation.variables === false
              ? 'Importando movimientos'
              : 'Validando estado de cuenta'}
          </Typography>
          <Typography
            color="text.secondary"
            id="bank-import-progress-description"
            sx={{ mt: 1.5 }}
            variant="body2"
          >
            Estamos revisando las fechas, importes, tipos de movimiento y monedas del archivo.
          </Typography>
          <LinearProgress sx={{ borderRadius: 999, mt: 3 }} />
          <Typography color="text.secondary" sx={{ display: 'block', mt: 1.5 }} variant="caption">
            No cierres esta ventana ni actualices la página.
          </Typography>
        </DialogContent>
      </Dialog>
    </FormPageLayout>
  )
}
