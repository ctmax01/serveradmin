import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import UserForm, { type UserFormValues } from '@/features/user/UserForm'
import { useState } from 'react'
import { userApi } from '@/services/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (userId: number, userName: string) => void
}

export function CreateUserDialog({ open, onOpenChange, onCreated }: Props) {
  const qc = useQueryClient()
  const form = useForm<UserFormValues>()
  const [saving, setSaving] = useState(false)

  const handleSave = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      const newUser = await userApi.create({ ...values, password: values.password ?? '' })
      toast.success('Пользователь создан')
      qc.invalidateQueries({ queryKey: ['users-search'] })
      onCreated(newUser.id, values.name)
      onOpenChange(false)
      form.reset()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Добавить пользователя</DialogTitle>
        </DialogHeader>
        <UserForm register={form.register} errors={form.formState.errors} isEditing={false} />
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
