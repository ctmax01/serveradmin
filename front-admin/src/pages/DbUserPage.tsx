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
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Home, ChevronRight, Table } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
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
import type { DbUser } from '../types'
import { dbUserApi, userApi, dbConnApi, reportApi } from '../services/api'
import { DataTable } from '@/components/DataTable'

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

interface FormValues {
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

const col = createColumnHelper<DbUser>()

const DbUserPage = () => {
  const qc = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const dbKeyParam = searchParams.get('dbKey') ?? ''

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DbUser | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>()

  const { data: users = [] } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => userApi.getList(),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const { data: conns = [] } = useQuery({
    queryKey: ['dbconn'],
    queryFn: () => dbConnApi.getAll(),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportApi.getAll(),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['dbuser', dbKeyParam, search],
    queryFn: () => dbUserApi.getByDbKey(dbKeyParam, search || undefined),
    select: (d) => (Array.isArray(d) ? d : []),
    enabled: !!dbKeyParam,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['dbuser', dbKeyParam] })

  const buildDefaults = (): FormValues => {
    const defaults: FormValues = {
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
    }
    return defaults
  }

  const handleAdd = () => {
    setEditing(null)
    form.reset(buildDefaults())
    setModalOpen(true)
  }

  const handleEdit = (record: DbUser) => {
    setEditing(record)
    form.reset(record as unknown as FormValues)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Удалить привязку пользователя к БД?' })
    if (!ok) return
    try {
      await dbUserApi.delete(id)
      toast.success('Удалено')
      invalidate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
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
      setModalOpen(false)
      invalidate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  })

  const selectedConn = conns.find((c) => c.dbKey === dbKeyParam)

  const columns = [
    col.accessor('id', { header: 'ID', size: 60 }),
    col.accessor('userName', { header: 'Пользователь', size: 180 }),
    col.accessor('dbname', { header: 'DB Name', size: 160 }),
    col.accessor('url', {
      header: 'URL',
      size: 260,
      cell: (info) => <span className="block truncate max-w-65">{info.getValue()}</span>,
    }),
    col.display({
      id: 'actions',
      size: 90,
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Изменить"
            onClick={() => handleEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Удалить"
            className="text-destructive hover:text-destructive"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    }),
  ]

  const table = useReactTable({ data: items, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <div className="pageConn">
      {ConfirmDialog}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <button
          onClick={() => navigate('/dbconn')}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
        </button>
        <ChevronRight className="h-3 w-3" />
        <button
          onClick={() => navigate('/dbconn')}
          className="hover:text-foreground transition-colors"
        >
          Подключения к БД
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">
          {selectedConn ? selectedConn.name || selectedConn.dbKey : 'DB Users'}
        </span>
      </nav>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error)?.message || 'Ошибка загрузки'}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Controller
          name="dbKey"
          control={form.control}
          render={() => (
            <Select
              value={dbKeyParam || undefined}
              onValueChange={(val) => {
                setSearch('')
                setSearchParams({ dbKey: val })
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Выберите базу данных…" />
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
        {dbKeyParam && (
          <>
            <Input
              placeholder="Поиск по пользователю, db, url…"
              className="w-70"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
            />
            <Button variant="outline" onClick={() => setSearch(searchInput)}>
              Найти
            </Button>
            <Button onClick={handleAdd}>Добавить</Button>
          </>
        )}
      </div>

      <DataTable table={table} isLoading={isLoading} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать привязку' : 'Добавить привязку'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Пользователь</Label>
                <Controller
                  name="userId"
                  control={form.control}
                  rules={{ required: 'Обязательно' }}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите…" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.userId && (
                  <p className="text-xs text-destructive">{form.formState.errors.userId.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>DB Key</Label>
                <Controller
                  name="dbKey"
                  control={form.control}
                  rules={{ required: 'Обязательно' }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!!dbKeyParam}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите…" />
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
              </div>
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

export default DbUserPage
