import { useRef, useState } from 'react'
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontalIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { Button } from './ui/button'

export interface RowAction<TData> {
  label: string
  onClick: (row: TData) => void
  className?: string
}

interface DataTableProps<TData> {
  table: TanstackTable<TData>
  isLoading?: boolean
  className?: string
  rowActions?: RowAction<TData>[]
  minWidth?: number
}

export function DataTable<TData>({
  table,
  isLoading,
  className,
  rowActions,
  minWidth,
}: DataTableProps<TData>) {
  const [selectedRow, setSelectedRow] = useState<TData | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const rows = table.getRowModel().rows

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 40,
    overscan: 100,
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalHeight = virtualizer.getTotalSize()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom =
    virtualRows.length > 0 ? totalHeight - virtualRows[virtualRows.length - 1].end : 0

  return (
    <div
      ref={scrollRef}
      className={cn(
        'rounded-md border border-border overflow-auto w-full flex-1 min-h-0 relative',
        'flex flex-col',
        className,
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
          <SpinnerCustom />
        </div>
      )}

      <Table style={{ minWidth }}>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => {
                const canSort = h.column.getCanSort()
                const sorted = h.column.getIsSorted()
                return (
                  <TableHead
                    key={h.id}
                    style={{ width: h.getSize(), minWidth: h.getSize() }}
                    className={cn(
                      'sticky top-0 z-10 bg-gray-200 select-none',
                      canSort && 'cursor-pointer hover:bg-gray-300',
                    )}
                    onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {canSort && (
                        <span className="text-muted-foreground">
                          {sorted === 'asc' ? (
                            <ArrowUpIcon className="size-3.5" />
                          ) : sorted === 'desc' ? (
                            <ArrowDownIcon className="size-3.5" />
                          ) : null}
                        </span>
                      )}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>

        {rows.length > 0 && (
          <TableBody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: paddingTop }} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index]
              const isSelected = selectedRow === row.original
              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    'relative cursor-pointer transition-colors',
                    isSelected ? 'bg-blue-200 hover:bg-blue-300' : 'hover:bg-muted/70',
                  )}
                  onClick={() => setSelectedRow(isSelected ? null : row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.getSize(),
                        maxWidth: cell.column.getSize(),
                      }}
                      className={cn(isSelected ? 'bg-primary/5' : 'bg-background')}
                    >
                      <div className="truncate">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </TableCell>
                  ))}

                  {rowActions && isSelected && (
                    <td
                      className="sticky right-0 p-0 border-none bg-transparent"
                      style={{ width: 0, minWidth: 0, padding: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-7 bg-white hover:bg-white min-w-5 min-h-5"
                            >
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {rowActions.map((action) => (
                              <DropdownMenuItem
                                key={action.label}
                                className={action.className}
                                onClick={() => action.onClick(row.original)}
                              >
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  )}
                </TableRow>
              )
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: paddingBottom }} />
              </tr>
            )}
          </TableBody>
        )}
      </Table>

      {!rows.length && !isLoading && (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Нет данных
        </div>
      )}
    </div>
  )
}
