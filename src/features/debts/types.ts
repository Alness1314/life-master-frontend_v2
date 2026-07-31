export interface DebtPayment {
  id?: string
  paymentDate: string
  amountPaid: number
  principalAmount: number
  interestAmount: number
  paymentMethod: string
  paymentMethodId: string | null
  isPaid: boolean
  notes: string
  accountId: string | null
}

export interface Debt {
  id: string
  creditorName: string
  totalAmount: number
  currency: string
  hasInterest: boolean
  numberOfPayments: number
  paymentsMade: number
  dueDate: string
  isFullyPaid: boolean
  notes: string
  disbursesFunds: boolean
  receivedAmount: number | null
  receivedDate: string | null
  depositAccountId: string | null
  payments: DebtPayment[]
  paidAmount: number
  outstandingAmount: number
  progressPercentage: number
  createAt: string
  updateAt: string
}

export interface FinancialAccountOption {
  id: string
  name: string
  currency: string
  currentBalance: number
  active: boolean
}

export interface PaymentMethodOption {
  id: string
  name: string
  methodType: string
  accountId: string | null
  active: boolean
}
