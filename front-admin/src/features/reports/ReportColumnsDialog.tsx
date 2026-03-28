import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { MoreHorizontalIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConfirm } from '@/hooks/useConfirm'
import { reportColumnApi } from '@/services/api'
import type { Report, ReportColumn } from '@/types'
import { ColorAlphaPicker } from './ColorAlphaPicker'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

interface ColFormValues {
  colKey: string
  colLabel: string
  colStyle: string
  sortOrder: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: Report | null
}

export function ReportColumnsDialog({ open, onOpenChange, report }: Props) {
  const qc = useQueryClient()
  const { confirm, ConfirmDialog } = useConfirm()
  const [editingCol, setEditingCol] = useState<ReportColumn | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [colorEnabled, setColorEnabled] = useState(false)

  const form = useForm<ColFormValues>({
    defaultValues: { colKey: '', colLabel: '', colStyle: '', sortOrder: 0 },
  })

  const {
    data: columns = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['report-columns', report?.id],
    queryFn: () => reportColumnApi.getByReport(report!.id),
    enabled: !!report?.id && open,
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['report-columns', report?.id] })

  useEffect(() => {
    if (!open) {
      setShowForm(false)
      setEditingCol(null)
    }
  }, [open])

  const handleAdd = () => {
    setEditingCol(null)
    setColorEnabled(false)
    form.reset({ colKey: '', colLabel: '', colStyle: '', sortOrder: 0 })
    setShowForm(true)
  }

  const handleEdit = (col: ReportColumn) => {
    setEditingCol(col)
    setColorEnabled(!!col.colStyle)
    form.reset({
      colKey: col.colKey,
      colLabel: col.colLabel,
      colStyle: col.colStyle ?? '',
      sortOrder: col.sortOrder,
    })
    setShowForm(true)
  }
  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Удалить колонку?' })
    if (!ok) return
    try {
      await reportColumnApi.delete(id)
      toast.success('Удалено')
      invalidate()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleSave = form.handleSubmit(async (values) => {
    if (!report) return
    setSaving(true)
    try {
      const payload = {
        ...values,
        reportId: report.id,
        colStyle: colorEnabled && values.colStyle ? values.colStyle : null, // null если disabled
      }

      if (editingCol) {
        await reportColumnApi.update({ ...payload, id: editingCol.id })
        toast.success('Обновлено')
      } else {
        await reportColumnApi.create(payload)
        toast.success('Добавлено')
      }
      invalidate()
      setShowForm(false)
      setEditingCol(null)
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
          <DialogTitle>Колонки — {report?.name}</DialogTitle>
        </DialogHeader>

        {ConfirmDialog}

        {/* Список колонок */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : isError ? (
          <p className="text-sm text-destructive px-3 py-4 text-center">
            {(error as Error)?.message || 'Ошибка загрузки колонок'}
          </p>
        ) : (
          <div className="border border-gray-400 rounded-md divide-y divide-gray-400 max-h-66 overflow-y-auto">
            {columns.length === 0 && (
              <p className="text-sm text-muted-foreground px-3 py-4 text-center">
                Колонки не заданы — будут показаны все из SQL
              </p>
            )}
            {columns.map((col) => (
              <div
                key={col.id}
                onClick={() => handleEdit(col)}
                className={cn(
                  'flex items-center gap-1 px-3 py-2',
                  col.id === editingCol?.id ? 'bg-blue-300' : 'bg-transparent',
                )}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium flex gap-1 items-center">
                    {col.colLabel}
                    {col.colStyle && (
                      <span
                        className="inline-block w-3 h-3 rounded-sm border"
                        style={{ background: col.colStyle }}
                      />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-1">
                    <span>key: {col.colKey}</span>
                    <span>order: {col.sortOrder}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="text-red-500 w-7 h-7"
                  onClick={() => handleDelete(col.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Форма добавления/редактирования */}
        {showForm ? (
          <div className="border border-gray-400 rounded-md p-3 space-y-3 bg-muted/30">
            <h4 className="text-sm font-medium">
              {editingCol ? 'Редактировать колонку' : 'Новая колонка'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>
                  Key <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="amount"
                  {...form.register('colKey', { required: 'Обязательно' })}
                />
                {form.formState.errors.colKey && (
                  <p className="text-xs text-destructive">{form.formState.errors.colKey.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>
                  Label <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Сумма"
                  {...form.register('colLabel', { required: 'Обязательно' })}
                />
                {form.formState.errors.colLabel && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.colLabel.message}
                  </p>
                )}
              </div>
            </div>
            <Label>Порядок</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" {...form.register('sortOrder', { valueAsNumber: true })} />
              <div className="flex items-center gap-3">
                <Switch
                  checked={colorEnabled}
                  onCheckedChange={(c) => {
                    setColorEnabled(c)
                    if (!c) form.setValue('colStyle', '')
                  }}
                />
                <Label>Цвет</Label>
              </div>
            </div>
            {colorEnabled && (
              <Controller
                name="colStyle"
                control={form.control}
                render={({ field }) => (
                  <ColorAlphaPicker value={field.value} onChange={field.onChange} />
                )}
              />
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingCol(null)
                }}
              >
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Сохранение…' : editingCol ? 'Обновить' : 'Добавить'}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" /> Добавить колонку
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
