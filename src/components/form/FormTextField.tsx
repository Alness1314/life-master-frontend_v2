import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { TextField } from '@mui/material'
import { FieldLabel } from './FieldLabel'

interface FormTextFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  autoComplete?: string
  disabled?: boolean
  type?: string
  required?: boolean
  multiline?: boolean
  rows?: number
  step?: number | string
}

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  autoComplete,
  disabled,
  type = 'text',
  required = false,
  multiline = false,
  rows,
  step,
}: FormTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={required ? { required: `${label} es obligatorio.` } : undefined}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          autoComplete={autoComplete}
          disabled={disabled}
          error={Boolean(fieldState.error)}
          fullWidth
          helperText={fieldState.error?.message ?? ' '}
          label={<FieldLabel required={required}>{label}</FieldLabel>}
          multiline={multiline}
          rows={rows}
          slotProps={{
            htmlInput: {
              'aria-required': required,
              step: type === 'number' ? step : undefined,
            },
          }}
          sx={multiline ? {
            '& .MuiInputBase-root.MuiInputBase-multiline': {
              alignItems: 'flex-start',
              minHeight: rows ? rows * 28 + 32 : 120,
              py: 1.25,
            },
            '& textarea.MuiInputBase-input': {
              height: 'auto !important',
              lineHeight: 1.5,
              padding: '0 !important',
            },
          } : undefined}
          type={type}
        />
      )}
    />
  )
}
