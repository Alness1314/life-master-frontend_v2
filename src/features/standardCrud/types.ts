import type { ReactNode } from 'react'

export type CrudRecord = { id: string } & Record<string, unknown>
export type CrudFormValue = string | string[]
export type CrudFormValues = Record<string, CrudFormValue>

export interface CrudField {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'date' | 'time' | 'url' | 'password' | 'select' | 'multiselect'
  required?: boolean
  maxLength?: number
  min?: number
  rows?: number
  options?: { label: string; value: string }[]
  table?: boolean
  detail?: boolean
  form?: boolean
  sensitive?: boolean
  defaultValue?: string | (() => string)
  format?: (value: unknown, record: CrudRecord) => ReactNode
}

export interface CrudDynamicOptions {
  fieldName: string
  endpoint: string | ((userId: string) => string)
}

export interface CrudListAction {
  label: string
  icon: string
  endpoint: (userId: string) => string
  successMessage: (response: unknown) => string
}

export interface CrudModuleConfig {
  key: string
  permissionKey?: string
  singular: string
  plural: string
  basePath: string
  description: string
  section: {
    label: string
    to: string
  }
  endpoint: (userId: string) => string
  endpointById: (userId: string, id: string) => string
  secretEndpoint?: (userId: string, id: string) => string
  fields: CrudField[]
  primaryField: string
  icon: string
  detailLayout?: 'default' | 'document'
  dynamicOptions?: CrudDynamicOptions | CrudDynamicOptions[]
  listAction?: CrudListAction
  permissionsPath?: (recordId: string) => string
  toFormValues?: (record: CrudRecord) => CrudFormValues
  normalizeRequest?: (values: CrudFormValues) => Record<string, unknown>
}
