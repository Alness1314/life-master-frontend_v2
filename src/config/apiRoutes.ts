export const API_ROUTES = {
  catalogs: {
    currencies: '/catalogs/currencies',
  },
  auth: {
    login: '/auth',
    checkSession: '/auth/check-session',
    logout: '/auth/logout',
  },
  users: {
    root: '/users',
    byId: (userId: string) => `/users/${userId}`,
  },
  modules: {
    root: '/modules',
    byId: (moduleId: string) => `/modules/${moduleId}`,
    all: '/modules/all',
  },
  profiles: {
    root: '/profiles',
  },
  permissions: {
    root: '/permissions',
    byProfileAndModule: (profileId: string, moduleId: string) =>
      `/permissions/profiles/${profileId}/modules/${moduleId}`,
  },
  categories: {
    root: '/category',
    byId: (categoryId: string) => `/category/${categoryId}`,
  },
  assistance: {
    root: (userId: string) => `/users/${userId}/assistance`,
    byId: (userId: string, assistanceId: string) =>
      `/users/${userId}/assistance/${assistanceId}`,
  },
  expenses: {
    root: (userId: string) => `/users/${userId}/expenses`,
    byId: (userId: string, expenseId: string) => `/users/${userId}/expenses/${expenseId}`,
  },
  incomes: {
    root: (userId: string) => `/users/${userId}/income`,
    byId: (userId: string, incomeId: string) => `/users/${userId}/income/${incomeId}`,
  },
  vault: {
    root: (userId: string) => `/users/${userId}/vault`,
    byId: (userId: string, vaultId: string) => `/users/${userId}/vault/${vaultId}`,
    password: (userId: string, vaultId: string) => `/users/${userId}/vault/${vaultId}/password`,
  },
  notes: {
    root: (userId: string) => `/users/${userId}/notes`,
    byId: (userId: string, noteId: string) => `/users/${userId}/notes/${noteId}`,
  },
  accounts: {
    root: (userId: string) => `/users/${userId}/accounts`,
    byId: (userId: string, accountId: string) => `/users/${userId}/accounts/${accountId}`,
  },
  paymentMethods: {
    root: (userId: string) => `/users/${userId}/payment-methods`,
    byId: (userId: string, paymentMethodId: string) =>
      `/users/${userId}/payment-methods/${paymentMethodId}`,
  },
  debts: {
    root: (userId: string) => `/users/${userId}/debts`,
    byId: (userId: string, debtId: string) => `/users/${userId}/debts/${debtId}`,
  },
  exercises: {
    root: (userId: string) => `/users/${userId}/exercises`,
    byId: (userId: string, exerciseId: string) => `/users/${userId}/exercises/${exerciseId}`,
  },
  nutrition: {
    root: (userId: string) => `/users/${userId}/nutrition`,
    byId: (userId: string, nutritionId: string) => `/users/${userId}/nutrition/${nutritionId}`,
    photo: (userId: string, nutritionId: string) =>
      `/users/${userId}/nutrition/${nutritionId}/photo`,
  },
  recurringMovements: {
    root: (userId: string) => `/users/${userId}/recurring-movements`,
    byId: (userId: string, movementId: string) =>
      `/users/${userId}/recurring-movements/${movementId}`,
    generate: (userId: string) => `/users/${userId}/recurring-movements/generate`,
  },
  financialSummary: {
    monthly: (userId: string, year: number, month: number, currency = 'MXN') =>
      `/users/${userId}/financial-summary/monthly?year=${year}&month=${month}&currency=${currency}`,
  },
  alerts: {
    root: (userId: string) => `/users/${userId}/alerts`,
    refresh: (userId: string) => `/users/${userId}/alerts/refresh`,
    markRead: (userId: string, alertId: string) => `/users/${userId}/alerts/${alertId}/read`,
  },
  reminders: {
    root: (userId: string) => `/users/${userId}/reminders`,
    cancel: (userId: string, reminderId: string) =>
      `/users/${userId}/reminders/${reminderId}/cancel`,
  },
  profile: {
    me: '/users/me',
    modules: '/users/me/modules',
  },
  files: {
    root: (userId: string) => `/users/${userId}/files`,
    metadata: (userId: string, fileId: string) => `/users/${userId}/files/${fileId}/metadata`,
    content: (userId: string, fileId: string) => `/users/${userId}/files/${fileId}/content`,
    byId: (userId: string, fileId: string) => `/users/${userId}/files/${fileId}`,
  },
  receipts: {
    root: (userId: string, expenseId: string) =>
      `/users/${userId}/expenses/${expenseId}/receipts`,
    byId: (userId: string, expenseId: string, receiptId: string) =>
      `/users/${userId}/expenses/${expenseId}/receipts/${receiptId}`,
    content: (userId: string, expenseId: string, receiptId: string) =>
      `/users/${userId}/expenses/${expenseId}/receipts/${receiptId}/content`,
  },
  bankImports: {
    file: (userId: string) => `/users/${userId}/bank-imports/file`,
    csv: (userId: string) => `/users/${userId}/bank-imports/csv`,
    csvTemplate: (userId: string) => `/users/${userId}/bank-imports/template.csv`,
    excelTemplate: (userId: string) => `/users/${userId}/bank-imports/template.xlsx`,
  },
  reports: {
    byType: (userId: string, reportType: string) =>
      `/users/${userId}/reports/${reportType}`,
    export: (userId: string, reportType: string) =>
      `/users/${userId}/reports/${reportType}/export`,
    monthlyCsv: (userId: string, year: number, month: number, currency = 'MXN') =>
      `/users/${userId}/reports/monthly.csv?year=${year}&month=${month}&currency=${currency}`,
  },
  audit: {
    root: '/audit-events',
    search: '/audit-events/search',
    byId: (eventId: string) => `/audit-events/${eventId}`,
  },
} as const
