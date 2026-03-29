// features/reports/ReportsPage.tsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/DataTable'
import { SpinnerCustom } from '@/components/ui/spinner'
import { useConfirm } from '@/hooks/useConfirm'
import { reportApi } from '@/services/api'
import type { Report } from '@/types'
import { ReportFormDialog } from './ReportFormDialog'
import { ReportColumnsDialog } from './ReportColumnsDialog'
import Title from '@/components/ui/title'

const col = createColumnHelper<Report>()

const columns = [
  col.accessor('id', { header: 'ID', size: 60 }),
  col.accessor('name', { header: 'Название' }),
  col.accessor('description', {
    header: 'Описание',
    cell: (info) => <span className="block truncate max-w-xs">{info.getValue()}</span>,
  }),
  col.accessor('queryType', { header: 'Тип', size: 70 }),
  col.accessor('sortOrder', { header: 'Порядок', size: 80 }),
  col.accessor('isActive', {
    header: 'Активен',
    size: 90,
    cell: (info) => (
      <Badge
        variant="secondary"
        className={info.getValue() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
      >
        {info.getValue() ? 'Да' : 'Нет'}
      </Badge>
    ),
  }),
]

const ReportsPage = () => {
  const qc = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Report | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const {
    data: items = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['reports', search],
    queryFn: () => reportApi.getAll(search || undefined),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['reports'] })

  const handleAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (record: Report) => {
    setEditing(record)
    setModalOpen(true)
  }

  const handleColumns = (record: Report) => {
    setSelectedReport(record)
    setColumnsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Удалить отчёт? Все колонки и права будут удалены.' })
    if (!ok) return
    try {
      await reportApi.delete(id)
      toast.success('Удалено')
      invalidate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    autoResetPageIndex: false,
  })

  return (
    <>
      <Title title="Базы данных" />
      <div className="pageConn">
        {ConfirmDialog}

        {isError && (
          <Alert variant="destructive">
            <AlertDescription>{(error as Error)?.message || 'Ошибка загрузки'}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Поиск по названию, описанию…"
            value={searchInput}
            className="max-w-90 min-w-30"
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
          />
          <Button variant="outline" size="icon" onClick={() => setSearch(searchInput)}>
            {isFetching ? <SpinnerCustom /> : <Search />}
          </Button>
          <Button size="icon" onClick={handleAdd}>
            <Plus />
          </Button>
        </div>

        <DataTable
          table={table}
          isLoading={isLoading}
          rowActions={[
            { label: 'Изменить', onClick: handleEdit },
            { label: 'Колонки', onClick: handleColumns },
            { label: 'Удалить', onClick: (r) => handleDelete(r.id), className: 'text-red-600' },
          ]}
        />

        <ReportFormDialog
          open={modalOpen}
          onOpenChange={setModalOpen}
          editing={editing}
          onSaved={invalidate}
        />

        <ReportColumnsDialog
          open={columnsDialogOpen}
          onOpenChange={setColumnsDialogOpen}
          report={selectedReport}
        />
      </div>
    </>
  )
}

export default ReportsPage
