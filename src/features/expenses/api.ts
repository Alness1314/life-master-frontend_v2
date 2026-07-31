import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { API_ROUTES } from '../../config/apiRoutes'

export interface ExpenseCategory {
  id: string
  name: string
  description: string
  erased: boolean
}

export interface Expense {
  id: string
  bankOrEntity: string
  description: string
  amount: number
  paymentDate: string
  category: ExpenseCategory
  paymentStatus: boolean
  createAt: string
  updateAt: string
  erased: boolean
  accountId: string | null
  paymentMethodId: string | null
  currency: string | null
}

export interface ExpenseRequest {
  bankOrEntity: string
  description: string
  amount: number
  category: string
  paymentDate: string
  paymentStatus: boolean
  accountId: string | null
  paymentMethodId: string | null
  currency: string
}

export interface FinancialAccount {
  id: string
  name: string
  accountType: string
  currency: string
  active: boolean
}

export interface PaymentMethod {
  id: string
  name: string
  methodType: string
  accountId: string | null
  active: boolean
}

export function useExpenses(userId?: string) {
  return useQuery({
    queryKey: ['expenses', userId],
    queryFn: async () => {
      const { data } = await apiClient.get<Expense[]>(API_ROUTES.expenses.root(userId!))
      return data
    },
    enabled: Boolean(userId),
  })
}

export function useExpense(userId?: string, expenseId?: string) {
  return useQuery({
    queryKey: ['expenses', userId, expenseId],
    queryFn: async () => {
      const { data } = await apiClient.get<Expense>(API_ROUTES.expenses.byId(userId!, expenseId!))
      return data
    },
    enabled: Boolean(userId && expenseId),
  })
}

export async function createExpense(userId: string, request: ExpenseRequest) {
  const { data } = await apiClient.post<Expense>(API_ROUTES.expenses.root(userId), request)
  return data
}

export async function updateExpense(userId: string, expenseId: string, request: ExpenseRequest) {
  const { data } = await apiClient.put<Expense>(
    API_ROUTES.expenses.byId(userId, expenseId),
    request,
  )
  return data
}

export async function deleteExpense(userId: string, expenseId: string) {
  const { data } = await apiClient.delete(API_ROUTES.expenses.byId(userId, expenseId))
  return data
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['categories', 'expenses'],
    queryFn: async () => {
      const { data } = await apiClient.get<ExpenseCategory[]>(API_ROUTES.categories.root)
      return data.filter((category) => !category.erased)
    },
  })
}

export function useFinancialAccounts(userId?: string) {
  return useQuery({
    queryKey: ['accounts', userId],
    queryFn: async () => {
      const { data } = await apiClient.get<FinancialAccount[]>(API_ROUTES.accounts.root(userId!))
      return data.filter((account) => account.active)
    },
    enabled: Boolean(userId),
  })
}

export function usePaymentMethods(userId?: string) {
  return useQuery({
    queryKey: ['payment-methods', userId],
    queryFn: async () => {
      const { data } = await apiClient.get<PaymentMethod[]>(API_ROUTES.paymentMethods.root(userId!))
      return data.filter((method) => method.active)
    },
    enabled: Boolean(userId),
  })
}
