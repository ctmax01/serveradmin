import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { docSettingApi } from '@/services/api'
import type { DocSetting } from '@/types'
import { DOC_TYPES, SETTING_KEYS, SETTING_GROUPS } from './constants'

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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  dbKey: string | null
}

export function DocSettingsModal({ open, onOpenChange, dbKey }: Props) {
  const qc = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<DocSetting | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      settingKey: '',
      docType: 'all',
      valueType: 'bool',
      valueBool: false,
      valueText: '',
    },
  })

  const watchValueType = form.watch('valueType')

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['doc-settings', dbKey],
    queryFn: () => docSettingApi.getAll(),
    enabled: !!dbKey && open,
    select: (d) => (Array.isArray(d) ? d : []).filter((s: DocSetting) => s.dbKey === dbKey),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['doc-settings', dbKey] })

  const handleAdd = () => {
    setEditing(null)
    form.reset({
      settingKey: '',
      docType: 'all',
      valueType: 'bool',
      valueBool: false,
      valueText: '',
    })
    setShowForm(true)
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
    setShowForm(true)
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
    if (!dbKey || !values.settingKey) return
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
      setShowForm(false)
      setEditing(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Настройки — {dbKey}</DialogTitle>
        </DialogHeader>

        {ConfirmDialog}

        {/* Список настроек */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : (
          <div className="border rounded-md divide-y max-h-72 overflow-y-auto">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground px-3 py-4 text-center">
                Нет настроек — используются значения по умолчанию
              </p>
            )}
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-3 py-2">
                <div className="flex-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {getKeyLabel(item.settingKey)}
                    <Badge variant="outline" className="text-xs">
                      {getDocTypeLabel(item.docType)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{item.settingKey}</div>
                </div>

                {item.value === '1' || item.value === 'true' ? (
                  <Badge className="bg-green-100 text-green-700">Да</Badge>
                ) : item.value === '0' || item.value === 'false' ? (
                  <Badge className="bg-red-100 text-red-700">Нет</Badge>
                ) : (
                  <span className="font-mono text-sm">{item.value}</span>
                )}

                <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Форма */}
        {showForm ? (
          <div className="border rounded-md p-3 space-y-3 bg-muted/30">
            <h4 className="text-sm font-medium">
              {editing ? 'Редактировать настройку' : 'Новая настройка'}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>
                  Настройка <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="settingKey"
                  control={form.control}
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
                              <SelectItem key={k.key} value={k.key}>
                                <div>
                                  <div className="font-medium">{k.label}</div>
                                  <div className="text-xs text-muted-foreground">{k.key}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1">
                <Label>Тип документа</Label>
                <Controller
                  name="docType"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все типы</SelectItem>
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
                    <span className="text-sm text-muted-foreground">
                      {form.watch('valueBool') ? 'Включено' : 'Выключено'}
                    </span>
                  </div>
                ) : (
                  <Input
                    type={watchValueType === 'number' ? 'number' : 'text'}
                    {...form.register('valueText')}
                  />
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
              >
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Сохранение…' : editing ? 'Обновить' : 'Добавить'}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" /> Добавить настройку
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
