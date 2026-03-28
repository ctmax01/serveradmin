import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
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
import type { DbSql, DbConn } from '@/types'
import { dbSqlApi, dbConnApi } from '@/services/api'
import { ServerSelect } from '@/components/ui/server-select'

const col = createColumnHelper<DbSql>()

const columns = [
  col.accessor('id', { header: 'ID', size: 60 }),
  col.accessor('dbKey', { header: 'DB Key' }),
  col.accessor('sqlKey', { header: 'SQL Key' }),
  col.accessor('sqlValue', {
    header: 'SQL Value',
    cell: (info) => <span className="block truncate max-w-xs">{info.getValue()}</span>,
  }),
  col.accessor('connName', { header: 'Подключение' }),
]

interface FormValues {
  dbConn: DbConn | null
  sqlKey: string
  sqlValue: string
}

const DbSqlPage = () => {
  const qc = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [connSearch, setConnSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DbSql | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: { dbConn: null, sqlKey: '', sqlValue: '' },
  })

  const {
    data: items = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['dbsql', search],
    queryFn: () => dbSqlApi.getAll(search || undefined),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const { data: conns = [], isFetching: connsFetching } = useQuery({
    queryKey: ['dbconn', connSearch],
    queryFn: () => dbConnApi.getAll(connSearch || undefined),
    select: (d) => (Array.isArray(d) ? d : []),
    enabled: modalOpen,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['dbsql'] })

  const handleAdd = () => {
    setEditing(null)
    form.reset({ dbConn: null, sqlKey: '', sqlValue: '' })
    setModalOpen(true)
  }

  const handleEdit = (record: DbSql) => {
    setEditing(record)
    form.reset({
      dbConn: { dbKey: record.dbKey, name: record.connName } as DbConn,
      sqlKey: record.sqlKey,
      sqlValue: record.sqlValue ?? '',
    })
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
    if (!values.dbConn) {
      toast.error('Выберите подключение')
      return
    }
    setSaving(true)
    try {
      const payload = {
        dbKey: values.dbConn.dbKey,
        sqlKey: values.sqlKey,
        sqlValue: values.sqlValue,
      }
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать SQL' : 'Добавить SQL'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>
                Подключение <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="dbConn"
                control={form.control}
                rules={{ required: 'Обязательно' }}
                render={({ field }) => (
                  <ServerSelect<DbConn>
                    value={field.value}
                    onChange={field.onChange}
                    options={conns}
                    getValue={(c) => c.dbKey}
                    getLabel={(c) => c.name || c.dbKey}
                    onSearch={setConnSearch}
                    isLoading={connsFetching}
                    placeholder="Выберите подключение…"
                    searchPlaceholder="Поиск по названию…"
                    hintText="Введите запрос и нажмите поиск"
                  />
                )}
              />
              {form.formState.errors.dbConn && (
                <p className="text-xs text-destructive">{form.formState.errors.dbConn.message}</p>
              )}
            </div>

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
