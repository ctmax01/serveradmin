import { useState, useCallback, useMemo } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmOptions {
  title: string
  description?: string
}

export function useConfirm() {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<ConfirmOptions>({ title: '' })
  const [resolver, setResolver] = useState<{ resolve: (v: boolean) => void } | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setOpts(options)
    setOpen(true)
    return new Promise((res) => {
      setResolver({ resolve: res }) // ← объект, не функция
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setOpen(false)
    resolver?.resolve(true)
  }, [resolver])

  const handleCancel = useCallback(() => {
    setOpen(false)
    resolver?.resolve(false)
  }, [resolver])

  const ConfirmDialog = useMemo(
    () => (
      <AlertDialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleCancel()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{opts.title}</AlertDialogTitle>
          </AlertDialogHeader>
          {opts.description && <p className="text-sm text-muted-foreground">{opts.description}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    [open, opts, handleConfirm, handleCancel],
  )

  return { confirm, ConfirmDialog }
}
