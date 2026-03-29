import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StepUserSelect } from './StepUserSelect'
import { StepDbPermissions } from './StepDbPermissions'
import type { DbUser, User } from '@/types'
import { dbUserApi } from '@/services/api'
import type { FormValues } from './type'
import { buildDefaults, PERMISSION_FIELDS } from './constants'
import { ArrowLeft } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: DbUser | null
  dbKeyParam: string
  onSaved: () => void
}

export function DbUserFormDialog({ open, onOpenChange, editing, dbKeyParam, onSaved }: Props) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Pick<User, 'id' | 'name'> | null>(null)

  const form = useForm<FormValues>({ defaultValues: buildDefaults(dbKeyParam) })

  useEffect(() => {
    if (!open) return
    setStep(1)
    if (editing) {
      const boolDefaults = Object.fromEntries(
        PERMISSION_FIELDS.map((f) => [f.name, (editing as any)[f.name] ?? false]),
      )
      form.reset({ ...(editing as unknown as FormValues), ...boolDefaults })
      if (editing.userId && editing.userName) {
        setSelectedUser({ id: editing.userId, name: editing.userName })
      }
    } else {
      form.reset(buildDefaults(dbKeyParam))
      setSelectedUser(null)
    }
  }, [open, editing])

  const handleNext = async () => {
    if (step === 1) {
      const valid = await form.trigger('userId')
      if (!valid || !selectedUser) {
        toast.error('Выберите или создайте пользователя')
        return
      }
      setStep(2)
      return
    }
    // step === 2 — сохранение
    setSaving(true)
    const values = form.getValues()
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {editing ? `Редактировать привязку` : `Новая привязка`} — {dbKeyParam}
          </DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            <StepIndicator n={1} current={step} label="Пользователь" />
            <div className="flex-1 h-px bg-border" />
            <StepIndicator n={2} current={step} label="Подключение и права" />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 min-h-0 p-1">
          {step === 1 && (
            <StepUserSelect
              form={form}
              selectedUser={selectedUser}
              onSelectUser={setSelectedUser}
            />
          )}
          {step === 2 && (
            <StepDbPermissions
              form={form}
              selectedUser={selectedUser}
              onChangeUser={() => setStep(1)}
            />
          )}
        </div>

        <DialogFooter className="flex flex-col justify-center items-end">
          {step === 2 && (
            <Button className="mr-auto w-full sm:w-auto" onClick={() => setStep(1)}>
              <ArrowLeft /> Назад
            </Button>
          )}
          <Button className="w-full sm:w-auto" onClick={handleNext} disabled={saving}>
            {step === 1 ? 'Далее — права доступа' : saving ? 'Сохранение…' : 'Сохранить привязку'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StepIndicator({ n, current, label }: { n: number; current: number; label: string }) {
  const done = current > n
  const active = current === n
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
          done
            ? 'bg-green-100 text-green-700'
            : active
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground'
        }`}
      >
        {done ? '✓' : n}
      </div>
      <span
        className={`text-sm font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {label}
      </span>
    </div>
  )
}
