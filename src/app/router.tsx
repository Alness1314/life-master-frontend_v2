import { Navigate, createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '../auth/LoginPage'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { ModulePendingPage } from '../components/feedback/ModulePendingPage'
import { CatalogsPage } from '../features/catalogs/pages/CatalogsPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { DebtDetailsPage } from '../features/debts/pages/DebtDetailsPage'
import { DebtEditorPage } from '../features/debts/pages/DebtEditorPage'
import { DebtsPage } from '../features/debts/pages/DebtsPage'
import { ExpenseDetailsPage } from '../features/expenses/pages/ExpenseDetailsPage'
import { ExpenseEditorPage } from '../features/expenses/pages/ExpenseEditorPage'
import { ExpensesPage } from '../features/expenses/pages/ExpensesPage'
import { SettingsPage } from '../features/settings/pages/SettingsPage'
import { BankImportPage } from '../features/operations/BankImportPage'
import {
  AuditEventsPage,
  FinancialAlertsPage,
  FinancialRemindersPage,
  PersonalProfilePage,
} from '../features/operations/OperationsPages'
import {
  NutritionDetailsPage,
  NutritionEditorPage,
  NutritionPage,
} from '../features/nutrition/NutritionPages'
import {
  StandardCrudDetailsPage,
  StandardCrudEditorPage,
  StandardCrudListPage,
} from '../features/standardCrud/StandardCrudPages'
import {
  assistanceConfig,
  categoryConfig,
  financialAccountConfig,
  exerciseConfig,
  incomeConfig,
  moduleConfig,
  notesConfig,
  paymentMethodConfig,
  recurringMovementConfig,
  vaultConfig,
} from '../features/standardCrud/configs'
import { UserDetailsPage } from '../features/users/pages/UserDetailsPage'
import { UserRegisterPage } from '../features/users/pages/UserRegisterPage'
import { UsersPage } from '../features/users/pages/UsersPage'
import { UserUpdatePage } from '../features/users/pages/UserUpdatePage'
import { MainLayout } from '../layouts/MainLayout'
import { ModulePermissionsPage } from '../features/permissions/pages/ModulePermissionsPage'
import { ReportsPage } from '../features/reports/pages/ReportsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/alerts', element: <FinancialAlertsPage /> },
          { path: '/reminders', element: <FinancialRemindersPage /> },
          { path: '/bank-import', element: <BankImportPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/profile', element: <PersonalProfilePage /> },
          { path: '/audit', element: <AuditEventsPage /> },
          { path: '/catalogs', element: <CatalogsPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/users/register', element: <UserRegisterPage /> },
          { path: '/users/details/:userId', element: <UserDetailsPage /> },
          { path: '/users/update/:userId', element: <UserUpdatePage /> },
          { path: '/asistencia', element: <StandardCrudListPage config={assistanceConfig} /> },
          { path: '/asistencia/register', element: <StandardCrudEditorPage config={assistanceConfig} mode="create" /> },
          { path: '/asistencia/details/:recordId', element: <StandardCrudDetailsPage config={assistanceConfig} /> },
          { path: '/asistencia/update/:recordId', element: <StandardCrudEditorPage config={assistanceConfig} mode="update" /> },
          { path: '/expenses', element: <ExpensesPage /> },
          { path: '/expenses/register', element: <ExpenseEditorPage mode="create" /> },
          { path: '/expenses/details/:expenseId', element: <ExpenseDetailsPage /> },
          { path: '/expenses/update/:expenseId', element: <ExpenseEditorPage mode="update" /> },
          { path: '/debts', element: <DebtsPage /> },
          { path: '/debts/register', element: <DebtEditorPage mode="create" /> },
          { path: '/debts/details/:debtId', element: <DebtDetailsPage /> },
          { path: '/debts/update/:debtId', element: <DebtEditorPage mode="update" /> },
          { path: '/payment-methods', element: <StandardCrudListPage config={paymentMethodConfig} /> },
          { path: '/payment-methods/register', element: <StandardCrudEditorPage config={paymentMethodConfig} mode="create" /> },
          { path: '/payment-methods/details/:recordId', element: <StandardCrudDetailsPage config={paymentMethodConfig} /> },
          { path: '/payment-methods/update/:recordId', element: <StandardCrudEditorPage config={paymentMethodConfig} mode="update" /> },
          { path: '/financial-accounts', element: <StandardCrudListPage config={financialAccountConfig} /> },
          { path: '/financial-accounts/register', element: <StandardCrudEditorPage config={financialAccountConfig} mode="create" /> },
          { path: '/financial-accounts/details/:recordId', element: <StandardCrudDetailsPage config={financialAccountConfig} /> },
          { path: '/financial-accounts/update/:recordId', element: <StandardCrudEditorPage config={financialAccountConfig} mode="update" /> },
          { path: '/recurring-movements', element: <StandardCrudListPage config={recurringMovementConfig} /> },
          { path: '/recurring-movements/register', element: <StandardCrudEditorPage config={recurringMovementConfig} mode="create" /> },
          { path: '/recurring-movements/details/:recordId', element: <StandardCrudDetailsPage config={recurringMovementConfig} /> },
          { path: '/recurring-movements/update/:recordId', element: <StandardCrudEditorPage config={recurringMovementConfig} mode="update" /> },
          { path: '/exercises', element: <StandardCrudListPage config={exerciseConfig} /> },
          { path: '/exercises/register', element: <StandardCrudEditorPage config={exerciseConfig} mode="create" /> },
          { path: '/exercises/details/:recordId', element: <StandardCrudDetailsPage config={exerciseConfig} /> },
          { path: '/exercises/update/:recordId', element: <StandardCrudEditorPage config={exerciseConfig} mode="update" /> },
          { path: '/nutrition', element: <NutritionPage /> },
          { path: '/nutrition/register', element: <NutritionEditorPage mode="create" /> },
          { path: '/nutrition/details/:recordId', element: <NutritionDetailsPage /> },
          { path: '/nutrition/update/:recordId', element: <NutritionEditorPage mode="update" /> },
          { path: '/incomes', element: <StandardCrudListPage config={incomeConfig} /> },
          { path: '/incomes/register', element: <StandardCrudEditorPage config={incomeConfig} mode="create" /> },
          { path: '/incomes/details/:recordId', element: <StandardCrudDetailsPage config={incomeConfig} /> },
          { path: '/incomes/update/:recordId', element: <StandardCrudEditorPage config={incomeConfig} mode="update" /> },
          { path: '/notes', element: <StandardCrudListPage config={notesConfig} /> },
          { path: '/notes/register', element: <StandardCrudEditorPage config={notesConfig} mode="create" /> },
          { path: '/notes/details/:recordId', element: <StandardCrudDetailsPage config={notesConfig} /> },
          { path: '/notes/update/:recordId', element: <StandardCrudEditorPage config={notesConfig} mode="update" /> },
          { path: '/vault', element: <StandardCrudListPage config={vaultConfig} /> },
          { path: '/vault/register', element: <StandardCrudEditorPage config={vaultConfig} mode="create" /> },
          { path: '/vault/details/:recordId', element: <StandardCrudDetailsPage config={vaultConfig} /> },
          { path: '/vault/update/:recordId', element: <StandardCrudEditorPage config={vaultConfig} mode="update" /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/categories', element: <StandardCrudListPage config={categoryConfig} /> },
          { path: '/categories/register', element: <StandardCrudEditorPage config={categoryConfig} mode="create" /> },
          { path: '/categories/details/:recordId', element: <StandardCrudDetailsPage config={categoryConfig} /> },
          { path: '/categories/update/:recordId', element: <StandardCrudEditorPage config={categoryConfig} mode="update" /> },
          { path: '/app-modules', element: <StandardCrudListPage config={moduleConfig} /> },
          { path: '/app-modules/register', element: <StandardCrudEditorPage config={moduleConfig} mode="create" /> },
          { path: '/app-modules/details/:recordId', element: <StandardCrudDetailsPage config={moduleConfig} /> },
          { path: '/app-modules/update/:recordId', element: <StandardCrudEditorPage config={moduleConfig} mode="update" /> },
          { path: '/app-modules/:moduleId/permissions', element: <ModulePermissionsPage /> },
          { path: '/global-variables', element: <ModulePendingPage title="Variables globales" /> },
          { path: '/', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
