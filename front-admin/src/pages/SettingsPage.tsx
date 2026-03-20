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
import type { Setting } from '../types'
import { settingApi, dbConnApi } from '../services/api'

const col = createColumnHelper<Setting>()

interface FormValues {
  dbKey: string
  section: string
  settingKey: string
  docType: number | null
  value: string
}

const SettingsPage = () => {
  const qc = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Setting | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>()

  const { data: items = [], isLoading, isError, error } = useQuery({
    queryKey: ['settings', search],
    queryFn: () => settingApi.getAll(search || undefined),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const { data: conns = [] } = useQuery({
    queryKey: ['dbconn'],
    queryFn: () => dbConnApi.getAll(),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['settings'] })

  const handleAdd = () => {
    setEditing(null)
    form.reset({ dbKey: '', section: '', settingKey: '', docType: null, value: '' })
    setModalOpen(true)
  }

  const handleEdit = (record: Setting) => {
    setEditing(record)
    form.reset({
      dbKey: record.dbKey,
      section: record.section,
      settingKey: record.settingKey,
      docType: record.docType ?? null,
      value: record.value,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Удалить настройку?' })
    if (!ok) return
    try {
      await settingApi.delete(id)
      toast.success('Удалено')
      invalidate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleSave = form.handleSubmit(async (values) => {
    setSaving(true)
    const payload = { ...values, docType: values.docType ?? undefined }
    try {
      if (editing) {
        await settingApi.update({ ...payload, id: editing.id })
        toast.success('Обновлено')
      } else {
        await settingApi.create(payload)
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
    col.accessor('section', { header: 'Секция' }),
    col.accessor('settingKey', { header: 'Ключ' }),
    col.accessor('docType', { header: 'Doc Type', size: 90 }),
    col.accessor('value', {
      header: 'Значение',
      cell: (info) => <span className="block truncate max-w-xs">{info.getValue()}</span>,
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
      <h2 className="text-xl font-semibold">Настройки</h2>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error)?.message || 'Ошибка загрузки'}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Поиск по dbKey, секции, ключу, значению…"
          className="w-90"
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
            <DialogTitle>{editing ? 'Редактировать настройку' : 'Добавить настройку'}</DialogTitle>
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
                        <SelectItem key={c.dbKey} value={c.dbKey}>{c.name || c.dbKey}</SelectItem>
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
              <Label>Секция</Label>
              <Input {...form.register('section', { required: 'Обязательно' })} />
              {form.formState.errors.section && (
                <p className="text-xs text-destructive">{form.formState.errors.section.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Ключ настройки</Label>
              <Input {...form.register('settingKey', { required: 'Обязательно' })} />
              {form.formState.errors.settingKey && (
                <p className="text-xs text-destructive">{form.formState.errors.settingKey.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Doc Type</Label>
              <Input type="number" {...form.register('docType', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Значение</Label>
              <Input {...form.register('value', { required: 'Обязательно' })} />
              {form.formState.errors.value && (
                <p className="text-xs text-destructive">{form.formState.errors.value.message}</p>
              )}
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

export default SettingsPage
