import { useState } from 'react'
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { SpinnerCustom } from '@/components/ui/spinner'

interface DataTableProps<TData> {
  table: TanstackTable<TData>
  isLoading?: boolean
  className?: string
  onRowDoubleClick?: (row: TData) => void
}

export function DataTable<TData>({
  table,
  isLoading,
  className,
  onRowDoubleClick,
}: DataTableProps<TData>) {
  const [selectedRow, setSelectedRow] = useState<TData | null>(null)

  const totalMinWidth = table.getVisibleLeafColumns().reduce((sum, col) => sum + col.getSize(), 0)

  return (
    <div
      className={cn(
        'rounded-md border border-border overflow-auto w-full h-full relative',
        className,
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <SpinnerCustom />
        </div>
      )}
      <Table style={{ minWidth: totalMinWidth }}>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  style={{ width: h.getSize(), minWidth: h.getSize() }}
                  className="sticky top-0 z-10 bg-muted"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  selectedRow === row.original
                    ? 'bg-primary/10 hover:bg-primary/15'
                    : 'hover:bg-muted/50',
                )}
                onClick={() => setSelectedRow(row.original === selectedRow ? null : row.original)}
                onDoubleClick={() => onRowDoubleClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{ width: cell.column.getSize(), minWidth: cell.column.getSize() }}
                    className={cn(selectedRow === row.original ? 'bg-primary/10' : 'bg-background')}
                  >
                    <div>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center text-muted-foreground"
              >
                Нет данных
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
