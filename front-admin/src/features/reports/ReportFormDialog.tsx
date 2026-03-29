// features/reports/ReportFormDialog.tsx
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { reportApi } from '@/services/api'
import type { Report } from '@/types'

interface FormValues {
  name: string
  description: string
  sqlQuery: string
  queryType: 'SP' | 'SQL'
  includeUnknownColumns: boolean
  sortOrder: number
  isActive: boolean
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Report | null
  onSaved: () => void
}

export function ReportFormDialog({ open, onOpenChange, editing, onSaved }: Props) {
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      sqlQuery: '',
      queryType: 'SP',
      includeUnknownColumns: false,
      sortOrder: 0,
      isActive: true,
    },
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      form.reset({
        name: editing.name,
        description: editing.description ?? '',
        sqlQuery: editing.sqlQuery,
        queryType: editing.queryType,
        includeUnknownColumns: editing.includeUnknownColumns,
        sortOrder: editing.sortOrder ?? 0,
        isActive: editing.isActive,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        sqlQuery: '',
        queryType: 'SP',
        includeUnknownColumns: false,
        sortOrder: 0,
        isActive: true,
      })
    }
  }, [open, editing])

  const handleSave = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      if (editing) {
        await reportApi.update({ ...values, id: editing.id })
        toast.success('Обновлено')
      } else {
        await reportApi.create(values)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{editing ? 'Редактировать отчёт' : 'Новый отчёт'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>
              Название <span className="text-destructive">*</span>
            </Label>
            <Input {...form.register('name', { required: 'Обязательно' })} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Описание</Label>
            <Input {...form.register('description')} />
          </div>

          <div className="space-y-1">
            <Label>
              SQL запрос <span className="text-destructive">*</span>
            </Label>
            <Textarea
              rows={5}
              className="font-mono text-sm"
              placeholder="EXEC MyProc @d1, @d2 или SELECT ..."
              {...form.register('sqlQuery', { required: 'Обязательно' })}
            />
            {form.formState.errors.sqlQuery && (
              <p className="text-xs text-destructive">{form.formState.errors.sqlQuery.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>
                Тип запроса <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="queryType"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SP">SP — процедура</SelectItem>
                      <SelectItem value="SQL">SQL — запрос</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1">
              <Label>Порядок сортировки</Label>
              <Input type="number" {...form.register('sortOrder', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Controller
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label>Активен</Label>
            </div>

            <div className="flex items-center gap-2">
              <Controller
                name="includeUnknownColumns"
                control={form.control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label>Показывать все колонки</Label>
            </div>
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
  )
}
