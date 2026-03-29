import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, Search, UserPlus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { User } from '@/types'
import { userApi } from '@/services/api'
import type { FormValues } from './type'
import type { UseFormReturn } from 'react-hook-form'
import { SpinnerCustom } from '@/components/ui/spinner'

interface Props {
  form: UseFormReturn<FormValues>
  selectedUser: Pick<User, 'id' | 'name'> | null
  onSelectUser: (user: Pick<User, 'id' | 'name'>) => void
}

export function StepUserSelect({ form, selectedUser, onSelectUser }: Props) {
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLogin, setNewLogin] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)

  const {
    data: users = [],
    isPending,
    mutate: searchUsers,
  } = useMutation({
    mutationFn: (q: string) => userApi.getList(q || undefined),
  })
  const handleCreate = async () => {
    if (!newName || !newLogin) {
      toast.error('Заполните имя и логин')
      return
    }
    setCreating(true)
    try {
      const created = await userApi.create({
        name: newName,
        phone: newLogin,
        password: newPassword,
      })
      toast.success('Пользователь создан')
      setQuery('')
      qc.invalidateQueries({ queryKey: ['users-search'] })
      form.setValue('userId', created.id)
      onSelectUser({ id: created.id, name: newName })
      setShowCreate(false)
      setNewName('')
      setNewLogin('')
      setNewPassword('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка создания')
    } finally {
      setCreating(false)
    }
  }

  const handleSelect = (user: Pick<User, 'id' | 'name'>) => {
    form.setValue('userId', user.id)
    onSelectUser(user)
  }

  const displayUsers = query.length > 0 ? users : []

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide  mb-2 block">
          Выберите пользователя <span className="text-destructive">*</span>
        </Label>

        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Поиск по имени или телефону…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers(query)}
          />
          <Button variant="outline" size="icon" onClick={() => searchUsers(query)}>
            {isPending ? <SpinnerCustom /> : <Search />}
          </Button>
        </div>

        {displayUsers.length > 0 && (
          <div className="border border-gray-300 rounded-md overflow-auto max-h-55">
            {displayUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => handleSelect(u)}
                className={cn(
                  'flex items-center gap-2 px-2 py-2 cursor-pointer transition-colors text-sm border-b border-gray-300 last:border-b-0',
                  selectedUser?.id === u.id ? 'bg-blue-50 dark:bg-blue-950' : 'hover:bg-muted/50',
                )}
              >
                <Avatar name={u.name} selected={selectedUser?.id === u.id} />
                <div className="flex-1">
                  <div className="font-medium  leading-tight line-clamp-2">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.phone}</div>
                </div>
                {selectedUser?.id === u.id && <CheckCircle2 color="blue" />}
              </div>
            ))}
          </div>
        )}

        {selectedUser && query.length === 0 && (
          <div className="flex items-center gap-3 px-3 py-2.5 border rounded-md bg-green-50 dark:bg-green-950 border-green-900 dark:border-green">
            <Avatar name={selectedUser.name} selected />
            <div className="flex-1 text-sm font-medium text-green-800 dark:text-green-200">
              {selectedUser.name}
            </div>
            <CheckCircle2 color="green" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">или</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {!showCreate ? (
        <Button
          variant="outline"
          className="w-full border-black"
          onClick={() => setShowCreate(true)}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Создать нового пользователя
        </Button>
      ) : (
        <div className="border  border-gray-500 dark:border-blue-800 rounded-md  dark:bg-blue-950 p-2">
          <div className="flex items-center justify-between">
            <span className="ml-1 text-sm font-medium text-blue-700 dark:text-blue-300">
              Новый пользователь
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6"
              onClick={() => setShowCreate(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <Label className="ml-1"> Имя</Label>
          <Input placeholder="Аман " value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Label className="ml-1">Телефон</Label>
          <Input
            placeholder="+996700111222"
            value={newLogin}
            onChange={(e) => setNewLogin(e.target.value)}
          />
          <Label className="ml-1">Пароль</Label>
          <Input
            type="password"
            placeholder="123456789"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button className="w-full mt-2" onClick={handleCreate} disabled={creating}>
            {creating ? 'Создание…' : 'Создать и выбрать'}
          </Button>
        </div>
      )}
    </div>
  )
}

function Avatar({ name, selected }: { name: string; selected: boolean }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0',
        selected
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {initials}
    </div>
  )
}
