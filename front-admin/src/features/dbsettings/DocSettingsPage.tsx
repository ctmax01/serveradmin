import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { Plus, Search } from 'lucide-react'
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useConfirm } from '@/hooks/useConfirm'
import { DataTable } from '@/components/DataTable'
import { SpinnerCustom } from '@/components/ui/spinner'
import { docSettingApi } from '@/services/api'
import type { DocSetting } from '@/types'
import { DOC_TYPES, SETTING_KEYS, SETTING_GROUPS } from './constants'
import { dbSettingsRoute } from '@/router'
import Breadcrumbs from '@/components/Breadcrumbs'

interface FormValues {
  settingKey: string
  docType: string
  valueType: 'bool' | 'number' | 'text'
  valueBool: boolean
  valueText: string
}

const getKeyLabel = (key: string) => SETTING_KEYS.find((k) => k.key === key)?.label ?? key
const getDocTypeLabel = (docType: number | null | undefined) => {
  if (!docType) return 'Все типы'
  return DOC_TYPES.find((d) => d.id === docType)?.label ?? `DocType ${docType}`
}

const col = createColumnHelper<DocSetting>()

const columns = [
  col.accessor('id', { header: 'ID', size: 60 }),
  col.accessor('settingKey', {
    header: 'Ключ',
    cell: (info) => <span className="text-xs text-muted-foreground">{info.getValue()}</span>,
  }),
  col.display({
    id: 'label',
    header: 'Настройка',
    cell: (info) => getKeyLabel(info.row.original.settingKey),
  }),
  col.accessor('docType', {
    header: 'Тип документа',
    size: 140,
    cell: (info) => (
      <Badge variant="outline" className="text-xs">
        {getDocTypeLabel(info.getValue())}
      </Badge>
    ),
  }),
  col.accessor('value', {
    header: 'Значение',
    size: 100,
    cell: (info) => {
      const v = info.getValue()
      if (v === '1' || v === 'true')
        return <Badge className="bg-green-100 text-green-700">Да</Badge>
      if (v === '0' || v === 'false') return <Badge className="bg-red-100 text-red-700">Нет</Badge>
      return <span className="font-mono text-sm">{v}</span>
    },
  }),
]

const DocSettingsPage = () => {
  const { dbKey } = dbSettingsRoute.useParams()
  const qc = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DocSetting | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      settingKey: '',
      docType: '',
      valueType: 'bool',
      valueBool: false,
      valueText: '',
    },
  })
  const watchValueType = form.watch('valueType')

  const {
    data: items = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['doc-settings', dbKey, search],
    queryFn: () => docSettingApi.getAll(dbKey, search || undefined),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['doc-settings', dbKey] })

  const handleAdd = () => {
    setEditing(null)
    form.reset({
      settingKey: '',
      docType: '',
      valueType: 'bool',
      valueBool: false,
      valueText: '',
    })
    setModalOpen(true)
  }

  const handleEdit = (record: DocSetting) => {
    setEditing(record)
    const keyMeta = SETTING_KEYS.find((k) => k.key === record.settingKey)
    const isBool = ['1', '0', 'true', 'false'].includes(record.value)
    form.reset({
      settingKey: record.settingKey,
      docType: record.docType ? String(record.docType) : 'all',
      valueType: keyMeta?.type === 'number' ? 'number' : isBool ? 'bool' : 'text',
      valueBool: record.value === '1' || record.value === 'true',
      valueText: record.value,
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Удалить настройку?' })
    if (!ok) return
    try {
      await docSettingApi.delete(id)
      toast.success('Удалено')
      invalidate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleKeyChange = (key: string, onChange: (v: string) => void) => {
    onChange(key)
    const meta = SETTING_KEYS.find((k) => k.key === key)
    if (meta) form.setValue('valueType', meta.type as 'bool' | 'number' | 'text')
  }

  const handleSave = form.handleSubmit(async (values) => {
    if (!values.settingKey) return
    const finalValue =
      values.valueType === 'bool' ? (values.valueBool ? '1' : '0') : values.valueText
    setSaving(true)
    const payload = {
      dbKey,
      settingKey: values.settingKey,
      docType: values.docType !== 'all' ? Number(values.docType) : undefined,
      value: finalValue,
    }
    try {
      if (editing) {
        await docSettingApi.update({ ...payload, id: editing.id })
        toast.success('Обновлено')
      } else {
        await docSettingApi.create(payload)
        toast.success('Создано')
      }
      invalidate()
      setModalOpen(false)
      setEditing(null)
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
    <>
      <Breadcrumbs dbKey={dbKey} label="Настройка документа" />
      <div className="pageConn">
        {ConfirmDialog}

        {isError && (
          <Alert variant="destructive">
            <AlertDescription>{(error as Error)?.message || 'Ошибка загрузки'}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Поиск по ключу, значению…"
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
              <DialogTitle>
                {editing ? 'Редактировать настройку' : 'Добавить настройку'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>
                  Настройка <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="settingKey"
                  control={form.control}
                  rules={{ required: 'Обязательно' }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => handleKeyChange(v, field.onChange)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите настройку…" />
                      </SelectTrigger>
                      <SelectContent>
                        {SETTING_GROUPS.map((group) => (
                          <SelectGroup key={group.label}>
                            <SelectLabel>{group.label}</SelectLabel>
                            {group.keys.map((k) => (
                              <SelectItem key={k.key} value={k.key} textValue={k.label}>
                                <div className="flex flex-col items-start leading-none">
                                  <span className="font-medium">{k.label}</span>
                                  <span className="text-xs text-muted-foreground">{k.key}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.settingKey && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.settingKey.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>
                    Тип документа <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="docType"
                    control={form.control}
                    rules={{ required: 'Обязательно' }}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOC_TYPES.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.id} — {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Значение</Label>
                  {watchValueType === 'bool' ? (
                    <div className="flex items-center gap-2 h-9">
                      <Controller
                        name="valueBool"
                        control={form.control}
                        render={({ field }) => (
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                    </div>
                  ) : (
                    <Input
                      type={watchValueType === 'number' ? 'number' : 'text'}
                      {...form.register('valueText')}
                    />
                  )}
                </div>
              </div>
              {form.formState.errors.docType && (
                <p className="text-xs text-destructive">{form.formState.errors.docType.message}</p>
              )}
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
    </>
  )
}

export default DocSettingsPage
