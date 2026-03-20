import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { useNavigate } from 'react-router-dom'
import { Users, Pencil, Trash2, MoreHorizontalIcon } from 'lucide-react'
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
import type { DbConn } from '../types'
import { dbConnApi } from '../services/api'
import { DataTable } from '@/components/DataTable'

const col = createColumnHelper<DbConn>()

interface FormValues {
  dbKey: string
  name: string
  conString: string
}

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
const DbConnPage = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DbConn | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>()

  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['dbconn', search],
    queryFn: () => dbConnApi.getAll(search || undefined),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['dbconn'] })

  const handleAdd = () => {
    setEditing(null)
    form.reset({ dbKey: '', name: '', conString: '' })
    setModalOpen(true)
  }

  const handleEdit = (record: DbConn) => {
    setEditing(record)
    form.reset({ dbKey: record.dbKey, name: record.name ?? '', conString: record.conString })
    setModalOpen(true)
  }

  const handleDelete = async (dbKey: string) => {
    const ok = await confirm({ title: 'Удалить подключение?', description: `DB Key: ${dbKey}` })
    if (!ok) return
    try {
      await dbConnApi.delete(dbKey)
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
        await dbConnApi.update(values)
        toast.success('Обновлено')
      } else {
        await dbConnApi.create(values)
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
    col.accessor('dbKey', { header: 'DB Key', size: 160 }),
    col.accessor('name', { header: 'Название', size: 200 }),
    col.accessor('conString', {
      header: 'Connection String',
      size: 400,
      cell: (info) => <span className="block truncate max-w-[400px]">{info.getValue()}</span>,
    }),
    col.display({
      id: 'actions',
      size: 120,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="size-7">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            <DropdownMenuLabel>Team</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>По email</DropdownMenuItem>
                <DropdownMenuItem>По ссылке</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem>
              New Team
              <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ]

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <div className="pageConn">
      {ConfirmDialog}
      <h2 className="text-xl font-semibold">Подключения к БД</h2>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error)?.message || 'Ошибка загрузки'}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Поиск по ключу, названию, строке подключения…"
          className="w-90"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Редактировать подключение' : 'Добавить подключение'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>DB Key</Label>
              <Input
                {...form.register('dbKey', { required: 'Обязательно' })}
                disabled={!!editing}
              />
              {form.formState.errors.dbKey && (
                <p className="text-xs text-destructive">{form.formState.errors.dbKey.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Название</Label>
              <Input {...form.register('name')} />
            </div>
            <div className="space-y-1.5">
              <Label>Connection String</Label>
              <Textarea rows={3} {...form.register('conString', { required: 'Обязательно' })} />
              {form.formState.errors.conString && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.conString.message}
                </p>
              )}
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

export default DbConnPage
