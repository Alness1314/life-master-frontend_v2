import { API_ROUTES } from '../../config/apiRoutes'
import type { CrudModuleConfig, CrudRecord } from './types'

const currencies = [
  { label: 'MXN — Peso mexicano', value: 'MXN' },
  { label: 'USD — Dólar estadounidense', value: 'USD' },
  { label: 'EUR — Euro', value: 'EUR' },
]

function today() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export const incomeConfig: CrudModuleConfig = {
  key: 'incomes',
  singular: 'Ingreso',
  plural: 'Ingresos',
  basePath: '/incomes',
  description: 'Administra y consulta tus ingresos.',
  section: { label: 'Catálogos', to: '/catalogs' },
  endpoint: API_ROUTES.incomes.root,
  endpointById: API_ROUTES.incomes.byId,
  primaryField: 'description',
  icon: 'payments',
  fields: [
    { name: 'source', label: 'Fuente', required: true, maxLength: 128, table: true },
    { name: 'description', label: 'Descripción', type: 'textarea', required: true, maxLength: 512, table: true, rows: 3 },
    {
      name: 'amount',
      label: 'Monto',
      type: 'number',
      required: true,
      min: 0.01,
      table: true,
      format: (value, record) => new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: String(record.currency ?? 'MXN'),
      }).format(Number(value)),
    },
    {
      name: 'paymentDate',
      label: 'Fecha de ingreso',
      type: 'date',
      required: true,
      defaultValue: today,
      table: true,
      format: (value) => new Intl.DateTimeFormat('es-MX')
        .format(new Date(`${String(value)}T00:00:00`)),
    },
    {
      name: 'currency',
      label: 'Moneda',
      type: 'select',
      required: true,
      defaultValue: 'MXN',
      options: currencies,
    },
  ],
  normalizeRequest: (values) => ({
    ...values,
    amount: Number(values.amount),
    accountId: null,
  }),
}

export const vaultConfig: CrudModuleConfig = {
  key: 'vault',
  singular: 'Elemento de bóveda',
  plural: 'Bóveda',
  basePath: '/vault',
  description: 'Administra de forma organizada tus accesos personales.',
  section: { label: 'Catálogos', to: '/catalogs' },
  endpoint: API_ROUTES.vault.root,
  endpointById: API_ROUTES.vault.byId,
  secretEndpoint: API_ROUTES.vault.password,
  primaryField: 'siteName',
  icon: 'shield_lock',
  fields: [
    { name: 'siteName', label: 'Sitio o servicio', required: true, maxLength: 128, table: true },
    { name: 'siteUrl', label: 'Dirección web', type: 'url', maxLength: 512, table: true },
    { name: 'username', label: 'Usuario', maxLength: 256, table: true },
    {
      name: 'passwordEncrypted',
      label: 'Contraseña',
      type: 'password',
      required: true,
      sensitive: true,
    },
    { name: 'notes', label: 'Notas', type: 'textarea', maxLength: 1024, rows: 4 },
  ],
}

export const notesConfig: CrudModuleConfig = {
  key: 'notes',
  singular: 'Nota',
  plural: 'Notas',
  basePath: '/notes',
  description: 'Organiza y consulta tus notas personales.',
  section: { label: 'Catálogos', to: '/catalogs' },
  endpoint: API_ROUTES.notes.root,
  endpointById: API_ROUTES.notes.byId,
  primaryField: 'title',
  icon: 'note',
  detailLayout: 'document',
  fields: [
    { name: 'title', label: 'Título', required: true, maxLength: 256, table: true },
    { name: 'content', label: 'Contenido', type: 'textarea', required: true, maxLength: 4000, table: true, rows: 7 },
  ],
}

const yesNoOptions = [
  { label: 'No', value: 'false' },
  { label: 'Sí', value: 'true' },
]

export const assistanceConfig: CrudModuleConfig = {
  key: 'assistance',
  permissionKey: 'asistencia',
  singular: 'Asistencia',
  plural: 'Asistencias',
  basePath: '/asistencia',
  description: 'Administra y consulta tus registros de asistencia.',
  section: { label: 'Catálogos', to: '/catalogs' },
  endpoint: API_ROUTES.assistance.root,
  endpointById: API_ROUTES.assistance.byId,
  primaryField: 'workDate',
  icon: 'event_available',
  fields: [
    { name: 'workDate', label: 'Fecha laboral', type: 'date', required: true, defaultValue: today, table: true },
    { name: 'timeEntry', label: 'Hora de entrada', type: 'time', required: true, table: true },
    { name: 'departureTime', label: 'Hora de salida', type: 'time', table: true },
    {
      name: 'onTime',
      label: 'Puntual',
      type: 'select',
      required: true,
      defaultValue: 'false',
      options: yesNoOptions,
      table: true,
      format: (value) => value ? 'Sí' : 'No',
    },
    {
      name: 'retard',
      label: 'Retardo',
      type: 'select',
      required: true,
      defaultValue: 'false',
      options: yesNoOptions,
      table: true,
      format: (value) => value ? 'Sí' : 'No',
    },
    {
      name: 'justifiedAbsence',
      label: 'Falta justificada',
      type: 'select',
      required: true,
      defaultValue: 'false',
      options: yesNoOptions,
      format: (value) => value ? 'Sí' : 'No',
    },
    {
      name: 'unjustifiedAbsence',
      label: 'Falta injustificada',
      type: 'select',
      required: true,
      defaultValue: 'false',
      options: yesNoOptions,
      format: (value) => value ? 'Sí' : 'No',
    },
  ],
  toFormValues: (record) => ({
    workDate: String(record.workDate ?? ''),
    timeEntry: String(record.timeEntry ?? '').slice(0, 5),
    departureTime: String(record.departureTime ?? '').slice(0, 5),
    onTime: String(record.onTime ?? false),
    retard: String(record.retard ?? false),
    justifiedAbsence: String(record.justifiedAbsence ?? false),
    unjustifiedAbsence: String(record.unjustifiedAbsence ?? false),
  }),
  normalizeRequest: (values) => ({
    ...values,
    onTime: values.onTime === 'true',
    retard: values.retard === 'true',
    justifiedAbsence: values.justifiedAbsence === 'true',
    unjustifiedAbsence: values.unjustifiedAbsence === 'true',
  }),
}

export const paymentMethodConfig: CrudModuleConfig = {
  key: 'payment-methods',
  singular: 'Método de pago',
  plural: 'Métodos de pago',
  basePath: '/payment-methods',
  description: 'Administra los métodos de pago disponibles para tus operaciones.',
  section: { label: 'Catálogos', to: '/catalogs' },
  endpoint: API_ROUTES.paymentMethods.root,
  endpointById: API_ROUTES.paymentMethods.byId,
  primaryField: 'name',
  icon: 'credit_card',
  dynamicOptions: {
    fieldName: 'accountId',
    endpoint: API_ROUTES.accounts.root,
  },
  fields: [
    { name: 'name', label: 'Nombre', required: true, maxLength: 128, table: true },
    {
      name: 'methodType',
      label: 'Tipo',
      type: 'select',
      required: true,
      table: true,
      options: [
        { label: 'Efectivo', value: 'CASH' },
        { label: 'Tarjeta de débito', value: 'DEBIT_CARD' },
        { label: 'Tarjeta de crédito', value: 'CREDIT_CARD' },
        { label: 'Transferencia', value: 'TRANSFER' },
        { label: 'Domiciliación', value: 'DIRECT_DEBIT' },
        { label: 'Cheque', value: 'CHECK' },
        { label: 'Billetera digital', value: 'DIGITAL_WALLET' },
        { label: 'Otro', value: 'OTHER' },
      ],
      format: (value) => ({
        CASH: 'Efectivo',
        DEBIT_CARD: 'Tarjeta de débito',
        CREDIT_CARD: 'Tarjeta de crédito',
        TRANSFER: 'Transferencia',
        DIRECT_DEBIT: 'Domiciliación',
        CHECK: 'Cheque',
        DIGITAL_WALLET: 'Billetera digital',
        OTHER: 'Otro',
      }[String(value)] ?? String(value)),
    },
    {
      name: 'accountId',
      label: 'Cuenta financiera',
      type: 'select',
      options: [{ label: 'Sin cuenta asociada', value: '' }],
      format: (_, record) => {
        const account = record.account as { name?: string } | null | undefined
        return account?.name ?? 'Sin cuenta asociada'
      },
    },
    {
      name: 'active',
      label: 'Estado',
      type: 'select',
      required: true,
      defaultValue: 'true',
      options: [
        { label: 'Activo', value: 'true' },
        { label: 'Inactivo', value: 'false' },
      ],
      table: true,
      format: (value) => value ? 'Activo' : 'Inactivo',
    },
  ],
  toFormValues: (record) => ({
    name: String(record.name ?? ''),
    methodType: String(record.methodType ?? ''),
    accountId: String(record.accountId ?? ''),
    active: String(record.active ?? true),
  }),
  normalizeRequest: (values) => ({
    name: values.name,
    methodType: values.methodType,
    active: values.active === 'true',
    accountId: values.accountId || null,
  }),
}

const accountTypes = [
  { label: 'Efectivo', value: 'CASH' },
  { label: 'Cuenta corriente', value: 'CHECKING' },
  { label: 'Cuenta de ahorro', value: 'SAVINGS' },
  { label: 'Crédito', value: 'CREDIT' },
  { label: 'Inversión', value: 'INVESTMENT' },
  { label: 'Otra', value: 'OTHER' },
]

const formatAccountType = (value: unknown) =>
  accountTypes.find((type) => type.value === String(value))?.label ?? String(value)

const formatAccountMoney = (value: unknown, record: CrudRecord) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: String(record.currency ?? 'MXN'),
  }).format(Number(value ?? 0))

export const financialAccountConfig: CrudModuleConfig = {
  key: 'financial-accounts',
  singular: 'Cuenta financiera',
  plural: 'Cuentas financieras',
  basePath: '/financial-accounts',
  description: 'Administra las cuentas utilizadas en tus movimientos financieros.',
  section: { label: 'Catálogos', to: '/catalogs' },
  endpoint: API_ROUTES.accounts.root,
  endpointById: API_ROUTES.accounts.byId,
  primaryField: 'name',
  icon: 'account_balance',
  fields: [
    { name: 'name', label: 'Nombre', required: true, maxLength: 128, table: true },
    {
      name: 'accountType',
      label: 'Tipo de cuenta',
      type: 'select',
      required: true,
      options: accountTypes,
      table: true,
      format: formatAccountType,
    },
    {
      name: 'currency',
      label: 'Moneda',
      type: 'select',
      required: true,
      defaultValue: 'MXN',
      table: true,
    },
    {
      name: 'initialBalance',
      label: 'Saldo inicial',
      type: 'number',
      required: true,
      table: true,
      format: formatAccountMoney,
    },
    {
      name: 'currentBalance',
      label: 'Saldo actual',
      type: 'number',
      form: false,
      table: true,
      format: formatAccountMoney,
    },
    {
      name: 'active',
      label: 'Estado',
      type: 'select',
      required: true,
      defaultValue: 'true',
      options: [
        { label: 'Activa', value: 'true' },
        { label: 'Inactiva', value: 'false' },
      ],
      table: true,
      format: (value) => value ? 'Activa' : 'Inactiva',
    },
  ],
  toFormValues: (record) => ({
    name: String(record.name ?? ''),
    accountType: String(record.accountType ?? ''),
    currency: String(record.currency ?? 'MXN'),
    initialBalance: String(record.initialBalance ?? 0),
    active: String(record.active ?? true),
  }),
  normalizeRequest: (values) => ({
    name: values.name,
    accountType: values.accountType,
    currency: values.currency,
    initialBalance: Number(values.initialBalance),
    active: values.active === 'true',
  }),
}

const movementTypes = [
  { label: 'Gasto', value: 'EXPENSE' },
  { label: 'Ingreso', value: 'INCOME' },
]

const recurrenceFrequencies = [
  { label: 'Semanal', value: 'WEEKLY' },
  { label: 'Mensual', value: 'MONTHLY' },
  { label: 'Anual', value: 'YEARLY' },
]

export const recurringMovementConfig: CrudModuleConfig = {
  key: 'recurring-movements',
  singular: 'Movimiento recurrente',
  plural: 'Movimientos recurrentes',
  basePath: '/recurring-movements',
  description: 'Programa ingresos y gastos que se generan periódicamente.',
  section: { label: 'Catálogos', to: '/catalogs' },
  endpoint: API_ROUTES.recurringMovements.root,
  endpointById: API_ROUTES.recurringMovements.byId,
  primaryField: 'description',
  icon: 'event_repeat',
  dynamicOptions: [
    { fieldName: 'categoryId', endpoint: API_ROUTES.categories.root },
    { fieldName: 'accountId', endpoint: API_ROUTES.accounts.root },
    { fieldName: 'paymentMethodId', endpoint: API_ROUTES.paymentMethods.root },
  ],
  listAction: {
    label: 'Generar pendientes',
    icon: 'autorenew',
    endpoint: API_ROUTES.recurringMovements.generate,
    successMessage: (response) => {
      const result = response as { generatedExpenses?: number; generatedIncome?: number }
      return `Generación completada: ${result.generatedExpenses ?? 0} gastos y ${result.generatedIncome ?? 0} ingresos.`
    },
  },
  fields: [
    {
      name: 'movementType',
      label: 'Tipo de movimiento',
      type: 'select',
      required: true,
      options: movementTypes,
      table: true,
      format: (value) => movementTypes.find((type) => type.value === String(value))?.label ?? String(value),
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      required: true,
      maxLength: 256,
      rows: 3,
      table: true,
    },
    {
      name: 'amount',
      label: 'Monto',
      type: 'number',
      required: true,
      min: 0.01,
      table: true,
      format: (value, record) => new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: String(record.currency ?? 'MXN'),
      }).format(Number(value)),
    },
    {
      name: 'currency',
      label: 'Moneda',
      type: 'select',
      required: true,
      defaultValue: 'MXN',
    },
    {
      name: 'categoryId',
      label: 'Categoría',
      type: 'select',
      options: [{ label: 'Sin categoría', value: '' }],
      detail: false,
    },
    { name: 'categoryName', label: 'Categoría', form: false, table: true },
    {
      name: 'accountId',
      label: 'Cuenta financiera',
      type: 'select',
      options: [{ label: 'Sin cuenta asociada', value: '' }],
      detail: false,
    },
    { name: 'accountName', label: 'Cuenta financiera', form: false },
    {
      name: 'paymentMethodId',
      label: 'Método de pago',
      type: 'select',
      options: [{ label: 'Sin método asociado', value: '' }],
      detail: false,
    },
    { name: 'paymentMethodName', label: 'Método de pago', form: false },
    {
      name: 'frequency',
      label: 'Frecuencia',
      type: 'select',
      required: true,
      options: recurrenceFrequencies,
      table: true,
      format: (value) =>
        recurrenceFrequencies.find((frequency) => frequency.value === String(value))?.label ?? String(value),
    },
    {
      name: 'startDate',
      label: 'Fecha de inicio',
      type: 'date',
      required: true,
      defaultValue: today,
      table: true,
    },
    {
      name: 'endDate',
      label: 'Fecha de finalización',
      type: 'date',
    },
    {
      name: 'nextExecutionDate',
      label: 'Próxima generación',
      type: 'date',
      form: false,
      table: true,
    },
    {
      name: 'active',
      label: 'Estado',
      type: 'select',
      required: true,
      defaultValue: 'true',
      options: [
        { label: 'Activo', value: 'true' },
        { label: 'Inactivo', value: 'false' },
      ],
      table: true,
      format: (value) => value ? 'Activo' : 'Inactivo',
    },
  ],
  toFormValues: (record) => ({
    movementType: String(record.movementType ?? ''),
    description: String(record.description ?? ''),
    amount: String(record.amount ?? ''),
    currency: String(record.currency ?? 'MXN'),
    categoryId: String(record.categoryId ?? ''),
    accountId: String(record.accountId ?? ''),
    paymentMethodId: String(record.paymentMethodId ?? ''),
    frequency: String(record.frequency ?? ''),
    startDate: String(record.startDate ?? ''),
    endDate: String(record.endDate ?? ''),
    active: String(record.active ?? true),
  }),
  normalizeRequest: (values) => ({
    movementType: values.movementType,
    description: values.description,
    amount: Number(values.amount),
    currency: values.currency,
    categoryId: values.categoryId || null,
    accountId: values.accountId || null,
    paymentMethodId: values.paymentMethodId || null,
    frequency: values.frequency,
    startDate: values.startDate,
    endDate: values.endDate || null,
    active: values.active === 'true',
  }),
}

export const exerciseConfig: CrudModuleConfig = {
  key: 'exercises',
  singular: 'Ejercicio',
  plural: 'Ejercicios',
  basePath: '/exercises',
  description: 'Registra y consulta tus actividades de entrenamiento.',
  section: { label: 'Catálogos', to: '/catalogs' },
  endpoint: API_ROUTES.exercises.root,
  endpointById: API_ROUTES.exercises.byId,
  primaryField: 'activityType',
  icon: 'fitness_center',
  fields: [
    { name: 'activityType', label: 'Tipo de actividad', required: true, maxLength: 128, table: true },
    { name: 'trainingDate', label: 'Fecha de entrenamiento', type: 'date', required: true, defaultValue: today, table: true },
    { name: 'startTime', label: 'Hora de inicio', type: 'time', required: true, table: true },
    { name: 'endTime', label: 'Hora de término', type: 'time', required: true, table: true },
    { name: 'durationMinutes', label: 'Duración (minutos)', type: 'number', required: true, min: 1, table: true },
    { name: 'notes', label: 'Notas', type: 'textarea', maxLength: 2000, rows: 4 },
  ],
  normalizeRequest: (values) => ({
    ...values,
    durationMinutes: Number(values.durationMinutes),
  }),
}

export const categoryConfig: CrudModuleConfig = {
  key: 'categories',
  singular: 'Categoría',
  plural: 'Categorías',
  basePath: '/categories',
  description: 'Administra las categorías disponibles en el sistema.',
  section: { label: 'Configuración', to: '/settings' },
  endpoint: () => API_ROUTES.categories.root,
  endpointById: (_, id) => API_ROUTES.categories.byId(id),
  primaryField: 'name',
  icon: 'category',
  fields: [
    { name: 'name', label: 'Nombre', required: true, maxLength: 128, table: true },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      maxLength: 512,
      rows: 4,
      table: true,
    },
  ],
}

export const moduleConfig: CrudModuleConfig = {
  key: 'app-modules',
  singular: 'Módulo',
  plural: 'Módulos',
  basePath: '/app-modules',
  description: 'Administra los módulos, rutas y perfiles del sistema.',
  section: { label: 'Configuración', to: '/settings' },
  endpoint: () => API_ROUTES.modules.root,
  endpointById: (_, id) => API_ROUTES.modules.byId(id),
  primaryField: 'name',
  icon: 'widgets',
  permissionsPath: (moduleId) => `/app-modules/${moduleId}/permissions`,
  dynamicOptions: {
    fieldName: 'profile',
    endpoint: API_ROUTES.profiles.root,
  },
  fields: [
    { name: 'name', label: 'Nombre', required: true, maxLength: 128, table: true },
    { name: 'route', label: 'Ruta', required: true, maxLength: 256, table: true },
    {
      name: 'permissionKey',
      label: 'Clave de permisos',
      maxLength: 64,
      table: true,
    },
    { name: 'iconName', label: 'Nombre del icono', maxLength: 128, table: true },
    {
      name: 'level',
      label: 'Nivel',
      type: 'select',
      required: true,
      options: [
        { label: 'Barra lateral', value: 'sidebar' },
        { label: 'Menú de catálogos', value: 'menu' },
        { label: 'Configuración', value: 'settings' },
      ],
      table: true,
    },
    {
      name: 'isParent',
      label: 'Es módulo padre',
      type: 'select',
      required: true,
      defaultValue: 'false',
      options: yesNoOptions,
      table: true,
      format: (value) => value ? 'Sí' : 'No',
    },
    {
      name: 'profile',
      label: 'Perfiles con acceso',
      type: 'multiselect',
      required: true,
      format: (_, record) => (
        record.profiles as Array<{ name: string }> | undefined
      )?.map((profile) => profile.name).join(', ') || 'Sin perfil',
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      maxLength: 512,
      rows: 3,
      table: true,
    },
  ],
  toFormValues: (record) => ({
    name: String(record.name ?? ''),
    route: String(record.route ?? ''),
    permissionKey: String(record.permissionKey ?? ''),
    iconName: String(record.iconName ?? ''),
    level: String(record.level ?? ''),
    isParent: String(record.isParent ?? false),
    profile: (record.profiles as Array<{ id: string }> | undefined)
      ?.map((profile) => profile.id) ?? [],
    description: String(record.description ?? ''),
  }),
  normalizeRequest: (values) => ({
    ...values,
    isParent: values.isParent === 'true',
    profile: values.profile,
  }),
}
