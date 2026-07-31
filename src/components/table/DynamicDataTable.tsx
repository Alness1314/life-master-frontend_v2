import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import { TEXTS } from '../../config/texts'

type SortDirection = 'asc' | 'desc'
type SortValue = string | number | boolean | Date | null | undefined

export interface DataTableColumn<T> {
  id: string
  header: string
  render: (row: T, rowIndex: number) => ReactNode
  sortValue?: (row: T) => SortValue
  align?: 'left' | 'center' | 'right'
  minWidth?: number
  width?: number
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
}: DynamicDataTableProps<T>) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sortColumnId, setSortColumnId] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const sortedData = useMemo(() => {
    const sortColumn = columns.find((column) => column.id === sortColumnId)
    if (!sortColumn?.sortValue) return data
    const direction = sortDirection === 'asc' ? 1 : -1
    return [...data].sort((left, right) => (
      compareValues(sortColumn.sortValue!(left), sortColumn.sortValue!(right)) * direction
    ))
  }, [columns, data, sortColumnId, sortDirection])

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

  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
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

      {!loading && data.length > 0 && (
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
