import { z } from 'zod'

export const expenseFormSchema = z.object({
  bankOrEntity: z.string().trim().min(1, 'El banco o entidad es obligatorio.').max(128),
  description: z.string().trim().min(1, 'La descripción es obligatoria.').max(512),
  amount: z.string()
    .trim()
    .min(1, 'El monto es obligatorio.')
    .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0.01, {
      message: 'El monto debe ser mayor o igual a 0.01.',
    }),
  category: z.string().uuid('Selecciona una categoría.'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona una fecha válida.'),
  paymentStatus: z.enum(['true', 'false']),
  accountId: z.string(),
  paymentMethodId: z.string(),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Selecciona una moneda válida.'),
})

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>
