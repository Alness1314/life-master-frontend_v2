import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { TEXTS } from '../../config/texts'
import { MaterialSymbol } from '../icons/MaterialSymbol'

type SortDirection = 'asc' | 'desc'
type SortValue = string | number | boolean | Date | null | undefined

export type DataTableFilterInput = 'text' | 'number' | 'date' | 'time' | 'select'

export interface DataTableFilter {
  field: string
  value: string
}

export interface DataTableColumnFilter {
  inputType?: DataTableFilterInput
  options?: { label: string; value: string }[]
  param?: string
}

export interface DataTableColumn<T> {
  id: string
  header: string
  render: (row: T, rowIndex: number) => ReactNode
  sortValue?: (row: T) => SortValue
  align?: 'left' | 'center' | 'right'
  minWidth?: number
  width?: number
  filter?: DataTableColumnFilter | false
}

interface DynamicDataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowId: (row: T) => string
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  initialPageSize?: number
  pageSizeOptions?: number[]
  onFilterApply?: (filter: DataTableFilter | null) => void
}

function compareValues(left: SortValue, right: SortValue) {
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime()
  if (typeof left === 'number' && typeof right === 'number') return left - right
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right)
  return String(left).localeCompare(String(right), 'es', { numeric: true, sensitivity: 'base' })
}

export function DynamicDataTable<T>({
  columns,
  data,
  getRowId,
  loading = false,
  error = null,
  emptyMessage = TEXTS.common.empty,
  initialPageSize = 5,
  pageSizeOptions = [5, 10, 25],
  onFilterApply,
}: DynamicDataTableProps<T>) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sortColumnId, setSortColumnId] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const filterableColumns = useMemo(() => columns.filter((column) => (
    column.sortValue && column.filter !== false
  )), [columns])
  const [filterColumnId, setFilterColumnId] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [appliedFilter, setAppliedFilter] = useState<DataTableFilter | null>(null)

  const selectedFilterColumn = filterableColumns.find((column) => column.id === filterColumnId)
  const selectedFilterConfig = selectedFilterColumn?.filter || { inputType: 'text' as const }
  const selectedFilterInputType = selectedFilterConfig.inputType ?? 'text'
  const selectedFilterParam = selectedFilterConfig.param ?? filterColumnId

  useEffect(() => {
    const normalizedValue = filterValue.trim()
    const delay = selectedFilterInputType === 'select' ? 0 : 350
    const timeout = window.setTimeout(() => {
      const nextFilter = filterColumnId && normalizedValue
        ? {
            field: selectedFilterParam,
            value: normalizedValue,
          }
        : null
      setAppliedFilter(nextFilter)
      onFilterApply?.(nextFilter)
      setPage(0)
    }, delay)

    return () => window.clearTimeout(timeout)
  }, [filterColumnId, filterValue, onFilterApply, selectedFilterInputType, selectedFilterParam])

  const filteredData = useMemo(() => {
    if (!appliedFilter) return data
    const filterColumn = columns.find((column) => (
      (column.filter ? column.filter.param : column.id) === appliedFilter.field
    ))
    if (!filterColumn?.sortValue) return data
    const inputType = filterColumn.filter
      ? filterColumn.filter.inputType ?? 'text'
      : 'text'
    const expected = appliedFilter.value.toLocaleLowerCase('es')
    return data.filter((row) => {
      const rawValue = filterColumn.sortValue!(row)
      if (rawValue == null) return false
      const actual = String(rawValue).toLocaleLowerCase('es')
      if (inputType === 'text') return actual.includes(expected)
      if (inputType === 'date') return actual.startsWith(expected)
      return actual === expected
    })
  }, [appliedFilter, columns, data])

  const sortedData = useMemo(() => {
    const sortColumn = columns.find((column) => column.id === sortColumnId)
    if (!sortColumn?.sortValue) return filteredData
    const direction = sortDirection === 'asc' ? 1 : -1
    return [...filteredData].sort((left, right) => (
      compareValues(sortColumn.sortValue!(left), sortColumn.sortValue!(right)) * direction
    ))
  }, [columns, filteredData, sortColumnId, sortDirection])

  const visibleRows = useMemo(() => {
    const firstRow = page * pageSize
    return sortedData.slice(firstRow, firstRow + pageSize)
  }, [page, pageSize, sortedData])

  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortValue) return
    if (sortColumnId === column.id) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumnId(column.id)
      setSortDirection('asc')
    }
    setPage(0)
  }

  const clearFilter = () => {
    setFilterColumnId('')
    setFilterValue('')
    setAppliedFilter(null)
    onFilterApply?.(null)
    setPage(0)
  }

  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      {filterableColumns.length > 0 && (
        <Box
          sx={{
            alignItems: { sm: 'center' },
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            p: 2,
          }}
        >
          <TextField
            label="Filtrar por"
            onChange={(event) => {
              setFilterColumnId(event.target.value)
              setFilterValue('')
            }}
            select
            size="small"
            sx={{ minWidth: { sm: 220 }, width: { xs: '100%', sm: 'auto' } }}
            value={filterColumnId}
          >
            <MenuItem value=""><em>Selecciona un campo</em></MenuItem>
            {filterableColumns.map((column) => (
              <MenuItem key={column.id} value={column.id}>{column.header}</MenuItem>
            ))}
          </TextField>
          <TextField
            disabled={!selectedFilterColumn}
            fullWidth
            label="Valor a buscar"
            onChange={(event) => setFilterValue(event.target.value)}
            select={selectedFilterConfig.inputType === 'select'}
            size="small"
            type={selectedFilterConfig.inputType === 'select'
              ? 'text'
              : selectedFilterConfig.inputType ?? 'text'}
            value={filterValue}
          >
            {selectedFilterConfig.inputType === 'select' && (
              selectedFilterConfig.options ?? []
            ).map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
          <Tooltip title="Limpiar filtro">
            <span>
              <IconButton
                aria-label="Limpiar filtro"
                disabled={!appliedFilter && !filterColumnId && !filterValue}
                onClick={clearFilter}
                size="small"
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <MaterialSymbol name="filter_alt_off" size={20} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )}
      <TableContainer sx={{ maxWidth: '100%' }}>
        <Table aria-label="Tabla de datos" sx={{ minWidth: 1180 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              {columns.map((column) => (
                <TableCell
                  align={column.align}
                  key={column.id}
                  sx={{
                    fontWeight: 750,
                    minWidth: column.minWidth,
                    px: 2,
                    py: 1.75,
                    width: column.width,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {column.sortValue ? (
                    <TableSortLabel
                      active={sortColumnId === column.id}
                      direction={sortColumnId === column.id ? sortDirection : 'asc'}
                      onClick={() => handleSort(column)}
                    >
                      {column.header}
                    </TableSortLabel>
                  ) : column.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Box sx={{ display: 'grid', minHeight: 180, placeItems: 'center' }}>
                    <CircularProgress aria-label="Cargando información" />
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading && visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && visibleRows.map((row, rowIndex) => (
              <TableRow hover key={getRowId(row)}>
                {columns.map((column) => (
                  <TableCell align={column.align} key={column.id} sx={{ px: 2, py: 1.75 }}>
                    {column.render(row, page * pageSize + rowIndex)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && sortedData.length > 0 && (
        <TablePagination
          component="div"
          count={sortedData.length}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          labelRowsPerPage={TEXTS.common.rowsPerPage}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => {
            setPageSize(Number(event.target.value))
            setPage(0)
          }}
          page={Math.min(page, Math.max(0, Math.ceil(sortedData.length / pageSize) - 1))}
          rowsPerPage={pageSize}
          rowsPerPageOptions={pageSizeOptions}
        />
      )}
    </Paper>
  )
}
