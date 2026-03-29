import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useConfirm } from '@/hooks/useConfirm'
import { DataTable } from '@/components/DataTable'
import { SpinnerCustom } from '@/components/ui/spinner'
import type { DbSql } from '@/types'
import { dbSqlApi } from '@/services/api'
import { dbSqlRoute } from '@/router'
import Breadcrumbs from '@/components/Breadcrumbs'

const col = createColumnHelper<DbSql>()

const columns = [
  col.accessor('id', { header: 'ID', size: 60 }),
  col.accessor('sqlKey', { header: 'SQL Key' }),
  col.accessor('sqlValue', {
    header: 'SQL Value',
    cell: (info) => <span className="block truncate max-w-xs">{info.getValue()}</span>,
  }),
]

interface FormValues {
  sqlKey: string
  sqlValue: string
}

const DbSqlPage = () => {
  const { dbKey } = dbSqlRoute.useParams()
  const qc = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DbSql | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: { sqlKey: '', sqlValue: '' },
  })

  const {
    data: items = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['dbsql', dbKey, search],
    queryFn: () => dbSqlApi.getAll(dbKey, search || undefined),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['dbsql', dbKey] })

  const handleAdd = () => {
    setEditing(null)
    form.reset({ sqlKey: '', sqlValue: '' })
    setModalOpen(true)
  }

  const handleEdit = (record: DbSql) => {
    setEditing(record)
    form.reset({ sqlKey: record.sqlKey, sqlValue: record.sqlValue ?? '' })
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
      const payload = { dbKey, sqlKey: values.sqlKey, sqlValue: values.sqlValue }
      if (editing) {
        await dbSqlApi.update({ ...payload, id: editing.id })
        toast.success('Обновлено')
      } else {
        await dbSqlApi.create(payload)
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

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    autoResetPageIndex: false,
  })

  return (
    <div className="pageConn">
      {ConfirmDialog}

      <Breadcrumbs dbKey={dbKey} label="SQL" />

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error)?.message || 'Ошибка загрузки'}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Поиск по sqlKey, значению…"
          className="max-w-90 min-w-30"
          value={searchInput}
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
          { label: 'Удалить', onClick: (r) => handleDelete(r.id), className: 'text-red-600' },
        ]}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать SQL' : 'Добавить SQL'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>
                SQL Key <span className="text-destructive">*</span>
              </Label>
              <Input {...form.register('sqlKey', { required: 'Обязательно' })} />
              {form.formState.errors.sqlKey && (
                <p className="text-xs text-destructive">{form.formState.errors.sqlKey.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>SQL Value</Label>
              <Textarea rows={5} className="font-mono text-sm" {...form.register('sqlValue')} />
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
