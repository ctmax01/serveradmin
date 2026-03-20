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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useConfirm } from '@/hooks/useConfirm'
import type { DbSql } from '../types'
import { dbSqlApi, dbConnApi } from '../services/api'
import { DataTable } from '@/components/DataTable'

const col = createColumnHelper<DbSql>()

interface FormValues {
  dbKey: string
  sqlKey: string
  sqlValue: string
}

const DbSqlPage = () => {
  const qc = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DbSql | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>()

  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['dbsql', search],
    queryFn: () => dbSqlApi.getAll(search || undefined),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const { data: conns = [] } = useQuery({
    queryKey: ['dbconn'],
    queryFn: () => dbConnApi.getAll(),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['dbsql'] })

  const handleAdd = () => {
    setEditing(null)
    form.reset({ dbKey: '', sqlKey: '', sqlValue: '' })
    setModalOpen(true)
  }

  const handleEdit = (record: DbSql) => {
    setEditing(record)
    form.reset({ dbKey: record.dbKey, sqlKey: record.sqlKey, sqlValue: record.sqlValue ?? '' })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Удалить SQL запись?' })
    if (!ok) return
    try {
      await dbSqlApi.delete(id)
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
        await dbSqlApi.update({ ...values, id: editing.id })
        toast.success('Обновлено')
      } else {
        await dbSqlApi.create(values)
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
    col.accessor('dbKey', { header: 'DB Key' }),
    col.accessor('sqlKey', { header: 'SQL Key' }),
    col.accessor('sqlValue', {
      header: 'SQL Value',
      cell: (info) => <span className="block truncate max-w-xs">{info.getValue()}</span>,
    }),
    col.accessor('connName', { header: 'Подключение' }),
    col.display({
      id: 'actions',
      size: 140,
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="link" size="sm" onClick={() => handleEdit(row.original)}>
            Изменить
          </Button>
          <Button
            variant="link"
            className="text-destructive hover:text-destructive/80 p-0 h-auto"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            Удалить
          </Button>
        </div>
      ),
    }),
  ]

  const table = useReactTable({ data: items, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <div className="pageConn">
      {ConfirmDialog}
      <h2 className="text-xl font-semibold">DB SQL</h2>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error)?.message || 'Ошибка загрузки'}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Поиск по dbKey, sqlKey, значению…"
          className="w-80"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
        />
        <Button variant="outline" onClick={() => setSearch(searchInput)}>
          Найти
        </Button>
        <Button onClick={handleAdd}>Добавить</Button>
      </div>

      <DataTable table={table} isLoading={isLoading} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать SQL' : 'Добавить SQL'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>DB Key</Label>
              <Controller
                name="dbKey"
                control={form.control}
                rules={{ required: 'Обязательно' }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите подключение…" />
                    </SelectTrigger>
                    <SelectContent>
                      {conns.map((c) => (
                        <SelectItem key={c.dbKey} value={c.dbKey}>
                          {c.name || c.dbKey}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.dbKey && (
                <p className="text-xs text-destructive">{form.formState.errors.dbKey.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>SQL Key</Label>
              <Input {...form.register('sqlKey', { required: 'Обязательно' })} />
              {form.formState.errors.sqlKey && (
                <p className="text-xs text-destructive">{form.formState.errors.sqlKey.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>SQL Value</Label>
              <Textarea rows={5} {...form.register('sqlValue')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DbSqlPage
