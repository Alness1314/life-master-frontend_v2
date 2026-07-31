import type { ReactNode } from 'react'

interface FieldLabelProps {
  children: ReactNode
  required?: boolean
}

export function FieldLabel({ children, required = false }: FieldLabelProps) {
  return (
    <>
      {children}
      {required && (
        <span aria-hidden="true" style={{ color: '#ef5350', marginLeft: 4 }}>
          *
        </span>
      )}
    </>
  )
}
