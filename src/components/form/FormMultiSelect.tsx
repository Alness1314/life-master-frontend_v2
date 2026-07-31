import type { Control, FieldValues, Path } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import {
  Checkbox,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
} from '@mui/material'
import { FieldLabel } from './FieldLabel'

export interface SelectOption {
  label: string
  value: string
}

interface FormMultiSelectProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  options: SelectOption[]
  hint?: string
  disabled?: boolean
  required?: boolean
}

export function FormMultiSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  hint,
  disabled,
  required = false,
}: FormMultiSelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={required ? {
        validate: (value) => (
          Array.isArray(value) && value.length > 0
            ? true
            : `${label} es obligatorio.`
        ),
      } : undefined}
      render={({ field, fieldState }) => {
        const selectedValues = Array.isArray(field.value) ? field.value as string[] : []
        return (
          <FormControl
            disabled={disabled}
            error={Boolean(fieldState.error)}
            fullWidth
            size="small"
          >
            <InputLabel><FieldLabel required={required}>{label}</FieldLabel></InputLabel>
            <Select
              {...field}
              input={<OutlinedInput label={<FieldLabel required={required}>{label}</FieldLabel>} />}
              inputProps={{ 'aria-required': required }}
              multiple
              renderValue={(selected) => (
                options
                  .filter((option) => (selected as string[]).includes(option.value))
                  .map((option) => option.label)
                  .join(', ')
              )}
              value={selectedValues}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox checked={selectedValues.includes(option.value)} size="small" />
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{fieldState.error?.message ?? hint ?? ' '}</FormHelperText>
          </FormControl>
        )
      }}
    />
  )
}
