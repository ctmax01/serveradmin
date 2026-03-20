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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useConfirm } from '@/hooks/useConfirm'
import UserForm, { type UserFormValues } from '@/components/UserForm'
import type { User } from '../types'
import { userApi } from '../services/api'
import { DataTable } from '@/components/DataTable'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, MoreHorizontalIcon } from 'lucide-react'

const col = createColumnHelper<User>()

const UsersPage = () => {
  const qc = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<UserFormValues>()

  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      await new Promise((res) => setTimeout(res, 2000))
      return userApi.getList(search)
    },
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] })

  const handleAdd = () => {
    setEditingUser(null)
    form.reset({ name: '', phone: '', password: '', lastDbKey: '' })
    setModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    form.reset({
      name: user.name,
      phone: user.phone,
      password: '',
      lastDbKey: user.lastDbKey ?? '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (userId: number) => {
    const ok = await confirm({ title: 'Удалить пользователя?' })
    if (!ok) return
    try {
      await userApi.delete(userId)
      toast.success('Пользователь удалён')
      invalidate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  const handleSave = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      const payload = { ...values }
      if (editingUser && !payload.password) delete payload.password
      if (editingUser) {
        await userApi.update({ ...payload, id: editingUser.id })
        toast.success('Пользователь обновлён')
      } else {
        await userApi.create({ ...payload, password: payload.password ?? '' })
        toast.success('Пользователь создан')
      }
      setModalOpen(false)
      invalidate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  })

  const columns = [
    col.accessor('id', { header: 'ID', size: 50 }),
    col.accessor('name', { header: 'Имя', size: 150 }),
    col.accessor('phone', { header: 'Телефон', size: 200 }),
    col.accessor('startDate', {
      header: 'Дата регистрации',
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      size: 150,
    }),

    col.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="size-7">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>Изменить</DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDelete(row.original.id)}
            >
              Удалить
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
      <h2 className="text-xl font-semibold shrink-0">Пользователи</h2>
      {isError && (
        <Alert variant="destructive" className="shrink-0">
          <AlertDescription>{(error as Error)?.message || 'Ошибка загрузки'}</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-2 shrink-0">
        <div className="flex gap-2">
          <Input
            placeholder="Поиск по имени или телефону…"
            className="w-75"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
          />
          <Button variant="outline" onClick={() => setSearch(searchInput)}>
            Найти
          </Button>
        </div>
        <Button onClick={handleAdd}>Добавить</Button>
      </div>

      <DataTable
        table={table}
        isLoading={isLoading}
        onRowDoubleClick={(user) => handleEdit(user)}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            register={form.register}
            errors={form.formState.errors}
            isEditing={!!editingUser}
          />
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

export default UsersPage
