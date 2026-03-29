import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
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
import { DataTable } from '@/components/DataTable'
import UserForm, { type UserFormValues } from '@/features/user/UserForm'

import type { User } from '../../types'
import { userApi } from '../../services/api'
import { Plus, Search } from 'lucide-react'
import { SpinnerCustom } from '@/components/ui/spinner'
import { formatDate } from '@/utils/date_parse'
import Title from '@/components/ui/title'

const col = createColumnHelper<User>()
const selectArray = (d: unknown) => (Array.isArray(d) ? d : [])

const columns = [
  col.accessor('id', { header: 'ID', size: 50, maxSize: 50 }),
  col.accessor('name', { header: 'Имя', size: 150, maxSize: 200 }),
  col.accessor('phone', { header: 'Телефон', size: 200, maxSize: 200 }),
  col.accessor('startDate', {
    header: 'Дата регистрации',
    cell: (info) => formatDate(info.getValue()),
    size: 150,
  }),
]

const coreRowModel = getCoreRowModel()
const sortedRowModel = getSortedRowModel()

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
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['users', search],
    queryFn: () => userApi.getList(search),
    select: selectArray,
    staleTime: 30_000,
  })

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['users'] }), [qc])

  const handleSearch = () => {
    if (searchInput === search) return
    setSearch(searchInput)
  }

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

  const table = useReactTable({
    data: (data as User[]) ?? [],
    columns,
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    autoResetPageIndex: false,
  })

  return (
    <>
      <Title title="Пользоваетли" />
      <div className="pageConn">
        {ConfirmDialog}

        {isError && (
          <Alert variant="destructive">
            <AlertDescription>{(error as Error)?.message || 'Ошибка загрузки'}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Поиск по имени или телефону…"
            value={searchInput}
            className="max-w-90 min-w-30"
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button size="icon" variant="outline" onClick={handleSearch} disabled={isFetching}>
            {isFetching ? <SpinnerCustom /> : <Search />}
          </Button>

          <Button onClick={handleAdd} size="icon">
            <Plus />
          </Button>
        </div>
        <DataTable
          table={table}
          isLoading={isLoading}
          minWidth={550}
          rowActions={[
            { label: 'Изменить', onClick: handleEdit },
            {
              label: 'Удалить',
              onClick: (user) => handleDelete(user.id),
              className: 'text-red-600',
            },
          ]}
        />

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            aria-describedby={undefined}
          >
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
    </>
  )
}

export default UsersPage
