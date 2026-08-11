import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material'
import type { SelectOption } from './FormMultiSelect'
import { FieldLabel } from './FieldLabel'

interface FormSelectProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  options: SelectOption[]
  hint?: string
  disabled?: boolean
  required?: boolean
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  hint,
  disabled,
  required = false,
}: FormSelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={required ? { required: `${label} es obligatorio.` } : undefined}
      render={({ field, fieldState }) => (
        <FormControl
          disabled={disabled}
          error={Boolean(fieldState.error)}
          fullWidth
          size="small"
        >
          <InputLabel><FieldLabel required={required}>{label}</FieldLabel></InputLabel>
          <Select
            {...field}
            inputProps={{ 'aria-required': required }}
            label={<FieldLabel required={required}>{label}</FieldLabel>}
            value={field.value ?? ''}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{fieldState.error?.message ?? hint ?? ' '}</FormHelperText>
        </FormControl>
      )}
    />
  )
}
