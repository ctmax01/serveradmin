import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useConfirm } from '@/hooks/useConfirm'
import type { Report } from '../types'
import { reportApi } from '../services/api'

const col = createColumnHelper<Report>()

interface FormValues {
  code: string
  name: string
  description: string
  sortOrder: number
  isActive: boolean
}

const ReportsPage = () => {
  const qc = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Report | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>()

  const { data: items = [], isLoading, isError, error } = useQuery({
    queryKey: ['reports', search],
    queryFn: () => reportApi.getAll(search || undefined),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['reports'] })

  const handleAdd = () => {
    setEditing(null)
    form.reset({ code: '', name: '', description: '', sortOrder: 0, isActive: true })
    setModalOpen(true)
  }

  const handleEdit = (record: Report) => {
    setEditing(record)
    form.reset({
      code: record.code,
      name: record.name,
      description: record.description ?? '',
      sortOrder: record.sortOrder ?? 0,
      isActive: record.isActive,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Удалить отчёт?' })
    if (!ok) return
    try {
      await reportApi.delete(id)
      toast.success('Удалено')
      invalidate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleSave = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      if (editing) {
        await reportApi.update({ ...values, id: editing.id })
        toast.success('Обновлено')
      } else {
        await reportApi.create(values)
        toast.success('Создано')
      }
      setModalOpen(false)
      invalidate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  })

  const columns = [
    col.accessor('id', { header: 'ID', size: 60 }),
    col.accessor('code', { header: 'Код' }),
    col.accessor('name', { header: 'Название' }),
    col.accessor('description', {
      header: 'Описание',
      cell: (info) => <span className="block truncate max-w-xs">{info.getValue()}</span>,
    }),
    col.accessor('sortOrder', { header: 'Порядок', size: 90 }),
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
    col.display({
      id: 'actions',
      size: 140,
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="link" size="sm" onClick={() => handleEdit(row.original)}>Изменить</Button>
          <Button variant="link" className="text-destructive hover:text-destructive/80 p-0 h-auto" size="sm" onClick={() => handleDelete(row.original.id)}>Удалить</Button>
        </div>
      ),
    }),
  ]

  const table = useReactTable({ data: items, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <div className="pageConn">
      {ConfirmDialog}
      <h2 className="text-xl font-semibold">Отчёты</h2>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error)?.message || 'Ошибка загрузки'}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Поиск по коду, названию, описанию…"
          className="w-80"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
        />
        <Button variant="outline" onClick={() => setSearch(searchInput)}>Найти</Button>
        <Button onClick={handleAdd}>Добавить</Button>
      </div>

      <div className="tableWrapper">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="ts-table">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} style={{ width: h.getSize() }}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать отчёт' : 'Добавить отчёт'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Код</Label>
              <Input {...form.register('code', { required: 'Обязательно' })} />
              {form.formState.errors.code && (
                <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Название</Label>
              <Input {...form.register('name', { required: 'Обязательно' })} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Описание</Label>
              <Input {...form.register('description')} />
            </div>
            <div className="space-y-1.5">
              <Label>Порядок сортировки</Label>
              <Input type="number" {...form.register('sortOrder', { valueAsNumber: true })} />
            </div>
            <div className="flex items-center gap-3">
              <Controller
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label>Активен</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReportsPage
