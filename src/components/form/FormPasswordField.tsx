import { useState } from 'react'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { IconButton, InputAdornment, TextField } from '@mui/material'
import { MaterialSymbol } from '../icons/MaterialSymbol'
import { FieldLabel } from './FieldLabel'

interface FormPasswordFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  hint?: string
  disabled?: boolean
  required?: boolean
}

export function FormPasswordField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  disabled,
  required = false,
}: FormPasswordFieldProps<T>) {
  const [visible, setVisible] = useState(false)

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          autoComplete="new-password"
          disabled={disabled}
          error={Boolean(fieldState.error)}
          fullWidth
          helperText={fieldState.error?.message ?? hint ?? ' '}
          label={<FieldLabel required={required}>{label}</FieldLabel>}
          type={visible ? 'text' : 'password'}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    edge="end"
                    onClick={() => setVisible((current) => !current)}
                    size="small"
                  >
                    <MaterialSymbol name={visible ? 'visibility_off' : 'visibility'} size={20} />
                  </IconButton>
                </InputAdornment>
              ),
            },
            htmlInput: {
              'aria-required': required,
            },
          }}
        />
      )}
    />
  )
}
