export type ReportPeriod = 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'CUSTOM'

export type ReportKind =
  | 'summary'
  | 'assistance'
  | 'exercises'
  | 'nutrition'
  | 'expenses'
  | 'income'
  | 'debts'

export interface ReportRange {
  period: ReportPeriod
  from: string
  to: string
}

export interface AssistanceReport {
  range: ReportRange
  records: number
  onTime: number
  retards: number
  justifiedAbsences: number
  unjustifiedAbsences: number
  workedMinutes: number
  items: AssistanceReportItem[]
}

export interface AssistanceReportItem {
  id: string
  workDate: string
  timeEntry: string | null
  departureTime: string | null
  onTime: boolean | null
  retard: boolean | null
  justifiedAbsence: boolean | null
  unjustifiedAbsence: boolean | null
  workedMinutes: number
}

export interface ExerciseReport {
  range: ReportRange
  sessions: number
  totalDurationMinutes: number
  averageDurationMinutes: number
  sessionsByActivity: Record<string, number>
  items: ExerciseReportItem[]
}

export interface ExerciseReportItem {
  id: string
  trainingDate: string
  startTime: string | null
  endTime: string | null
  activityType: string | null
  durationMinutes: number | null
  notes: string | null
}

export interface NutritionReport {
  range: ReportRange
  meals: number
  foods: number
  foodsWithCalories: number
  totalKnownCalories: number
  mealsByType: Record<string, number>
  items: NutritionReportItem[]
}

export interface NutritionReportItem {
  id: string
  consumedAt: string
  name: string
  mealType: string | null
  notes: string | null
  photoId: string | null
  foods: NutritionFoodItem[]
}

export interface NutritionFoodItem {
  id: string
  name: string
  calories: number | null
  quantity: string
  unitMeasurement: string | null
}

export interface ExpenseReport {
  range: ReportRange
  currency: string
  records: number
  total: number
  paid: number
  pending: number
  totalsByCategory: Record<string, number>
  items: ExpenseReportItem[]
}

export interface ExpenseReportItem {
  id: string
  paymentDate: string
  description: string
  bankOrEntity: string
  amount: number
  currency: string
  paid: boolean
  categoryId: string | null
  category: string | null
  accountId: string | null
  paymentMethodId: string | null
}

export interface IncomeReport {
  range: ReportRange
  currency: string
  records: number
  total: number
  totalsBySource: Record<string, number>
  items: IncomeReportItem[]
}

export interface IncomeReportItem {
  id: string
  paymentDate: string
  source: string
  description: string
  amount: number
  currency: string
  accountId: string | null
}

export interface DebtReport {
  range: ReportRange
  currency: string
  debts: number
  overdueDebts: number
  originalAmount: number
  paidPrincipal: number
  outstandingAmount: number
  receivedInPeriod: number
  paidInPeriod: number
  principalPaidInPeriod: number
  interestPaidInPeriod: number
  scheduledInPeriod: number
  items: DebtReportItem[]
}

export interface DebtReportItem {
  id: string
  creditor: string
  totalAmount: number
  paidPrincipal: number
  outstandingAmount: number
  progressPercentage: number
  dueDate: string
  fullyPaid: boolean
  overdue: boolean
  disbursesFunds: boolean
  receivedAmount: number | null
  receivedDate: string | null
  periodPayments: DebtPaymentReportItem[]
}

export interface DebtPaymentReportItem {
  id: string
  paymentDate: string
  amount: number
  principal: number
  interest: number
  paid: boolean
  paymentMethod: string | null
  accountId: string | null
}

export interface ConsolidatedReport {
  range: ReportRange
  currency: string
  financial: {
    income: number
    expenses: number
    paidExpenses: number
    pendingExpenses: number
    debtProceeds: number
    debtPayments: number
    debtPrincipalPaid: number
    debtInterestPaid: number
    outstandingDebt: number
    operatingResult: number
    netCashFlow: number
  }
  activity: {
    assistanceRecords: number
    retards: number
    absences: number
    exerciseSessions: number
    exerciseMinutes: number
    nutritionMeals: number
    knownCalories: number
  }
}

export interface ReportDataByKind {
  summary: ConsolidatedReport
  assistance: AssistanceReport
  exercises: ExerciseReport
  nutrition: NutritionReport
  expenses: ExpenseReport
  income: IncomeReport
  debts: DebtReport
}
