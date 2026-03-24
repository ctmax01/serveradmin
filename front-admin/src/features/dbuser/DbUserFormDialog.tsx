import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { ChevronsUpDown, Check, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { SpinnerCustom } from '@/components/ui/spinner'
import type { DbUser } from '@/types'
import { dbUserApi, reportApi, userApi } from '@/services/api'
import { CreateUserDialog } from '../user/CreateUserDialog'

const PERMISSION_FIELDS = [
  { name: 'xreport', label: 'X Report' },
  { name: 'zakazVirtual', label: 'Zakaz Virtual' },
  { name: 'stoplist', label: 'Stoplist' },
  { name: 'passwords', label: 'Passwords' },
  { name: 'notifications', label: 'Notifications' },
  { name: 'docs', label: 'Docs' },
  { name: 'stockReport', label: 'Stock Report' },
  { name: 'relazReport', label: 'Relaz Report' },
  { name: 'cashSummary', label: 'Cash Summary' },
  { name: 'cashbook', label: 'Cashbook' },
  { name: 'msettlements', label: 'M.Settlements' },
  { name: 'users', label: 'Users' },
  { name: 'category', label: 'Category' },
  { name: 'printers', label: 'Printers' },
  { name: 'reservation', label: 'Reservation' },
  { name: 'dynamicReports', label: 'Dynamic Reports' },
]

export interface FormValues {
  userId: number | null
  dbKey: string
  dbname: string
  url: string
  docUserId: number | null
  reportIds: number[]
  xreport: boolean
  zakazVirtual: boolean
  stoplist: boolean
  passwords: boolean
  notifications: boolean
  docs: boolean
  stockReport: boolean
  relazReport: boolean
  cashSummary: boolean
  cashbook: boolean
  msettlements: boolean
  users: boolean
  category: boolean
  printers: boolean
  reservation: boolean
  dynamicReports: boolean
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: DbUser | null
  dbKeyParam: string
  onSaved: () => void
}

export function DbUserFormDialog({ open, onOpenChange, editing, dbKeyParam, onSaved }: Props) {
  const form = useForm<FormValues>()
  const [saving, setSaving] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [createUserOpen, setCreateUserOpen] = useState(false)

  const [userSearch, setUserSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')

  const { data: users = [], isFetching: usersFetching } = useQuery({
    queryKey: ['users-search', submittedSearch],
    queryFn: () => userApi.getList(submittedSearch || undefined),
    select: (d) => (Array.isArray(d) ? d : []),
    enabled: submittedSearch.length > 0, // 👈 не грузим пока не нажали поиск
  })

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportApi.getAll(),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const buildDefaults = (): FormValues => ({
    userId: null,
    dbKey: dbKeyParam,
    dbname: '',
    url: '',
    docUserId: null,
    reportIds: [],
    xreport: false,
    zakazVirtual: false,
    stoplist: false,
    passwords: false,
    notifications: false,
    docs: false,
    stockReport: false,
    relazReport: false,
    cashSummary: false,
    cashbook: false,
    msettlements: false,
    users: false,
    category: false,
    printers: false,
    reservation: false,
    dynamicReports: false,
  })

  // сбросить форму при открытии
  const handleOpenChange = (val: boolean) => {
    if (val) {
      if (editing) {
        const boolDefaults = Object.fromEntries(
          PERMISSION_FIELDS.map((f) => [f.name, (editing as any)[f.name] ?? false]),
        )
        form.reset({ ...(editing as unknown as FormValues), ...boolDefaults })
      } else {
        form.reset(buildDefaults())
      }
    }
    onOpenChange(val)
  }

  const handleSave = form.handleSubmit(async (values) => {
    setSaving(true)
    const payload = {
      ...values,
      userId: values.userId ?? 0,
      docUserId: values.docUserId ?? undefined,
    }
    try {
      if (editing) {
        await dbUserApi.update({ ...payload, id: editing.id })
        toast.success('Обновлено')
      } else {
        await dbUserApi.create(payload)
        toast.success('Создано')
      }
      onSaved()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  })

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Редактировать привязку ${dbKeyParam}` : `Добавить привязку ${dbKeyParam}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Пользователь с поиском */}
            <div className="space-y-1.5">
              <Label>Пользователь</Label>
              <Controller
                name="userId"
                control={form.control}
                rules={{ required: 'Обязательно' }}
                render={({ field }) => (
                  <Popover open={userOpen} onOpenChange={setUserOpen} modal={false}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        <span className={field.value ? '' : 'text-muted-foreground'}>
                          {field.value
                            ? (users.find((u) => u.id === field.value)?.name ??
                              `ID: ${field.value}`)
                            : 'Выберите…'}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 z-200" align="start">
                      <Command
                        shouldFilter={false}
                        className="[&_[cmdk-input-wrapper]]:w-full [&_[cmdk-input-wrapper]>svg]:hidden border-0"
                      >
                        <div className="flex p">
                          <Input
                            placeholder="Поиск пользователя…"
                            value={userSearch}
                            onValueChange={setUserSearch}
                            onKeyDown={(e) => e.key === 'Enter' && setSubmittedSearch(userSearch)}
                            className="border-none focus:ring-0"
                          />
                          <button
                            className="p-1 hover:bg-accent rounded-sm"
                            onClick={() => setSubmittedSearch(userSearch)}
                          >
                            {usersFetching ? (
                              <SpinnerCustom />
                            ) : (
                              <Search className="h-4 w-4 opacity-50" />
                            )}
                          </button>
                        </div>

                        {submittedSearch.length === 0 && (
                          <div className="py-2 text-center text-sm text-muted-foreground">
                            Введите имя и нажмите поиск
                          </div>
                        )}
                        <CommandEmpty>
                          {submittedSearch.length > 0 && !usersFetching ? 'Не найдено' : null}
                        </CommandEmpty>
                        <CommandGroup className="max-h-48 overflow-y-auto">
                          {users.map((u) => (
                            <CommandItem
                              key={u.id}
                              value={u.name}
                              onSelect={() => {
                                field.onChange(u.id)
                                setUserOpen(false)
                                setUserSearch('')
                                setSubmittedSearch('')
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  field.value === u.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {u.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        <div className="border-t p-1">
                          <button
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                            onClick={() => {
                              setUserOpen(false)
                              setCreateUserOpen(true)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            Создать пользователя
                          </button>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.userId && (
                <p className="text-xs text-destructive">{form.formState.errors.userId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>DB Name</Label>
                <Input {...form.register('dbname')} />
              </div>
              <div className="space-y-1.5">
                <Label>URL</Label>
                <Input {...form.register('url')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Doc User ID</Label>
              <Input type="number" {...form.register('docUserId', { valueAsNumber: true })} />
            </div>

            <div className="flex items-center gap-3 my-1">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">Права доступа</span>
              <Separator className="flex-1" />
            </div>

            <div className="grid grid-cols-3 gap-y-3 gap-x-4">
              {PERMISSION_FIELDS.map((f) => (
                <Controller
                  key={f.name}
                  name={f.name as keyof FormValues}
                  control={form.control}
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm">{f.label}</span>
                    </label>
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 my-1">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">Отчёты</span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-1.5">
              <Label>Доступ к отчётам</Label>
              <Controller
                name="reportIds"
                control={form.control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 p-3 border rounded-md">
                    {reports.map((r) => (
                      <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={(field.value ?? []).includes(r.id)}
                          onCheckedChange={(checked) => {
                            const current = field.value ?? []
                            field.onChange(
                              checked ? [...current, r.id] : current.filter((id) => id !== r.id),
                            )
                          }}
                        />
                        <span className="text-sm">{r.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateUserDialog
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
        onCreated={(userId) => form.setValue('userId', userId)}
      />
    </>
  )
}
