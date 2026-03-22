// components/DbConnectionModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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

export interface DbConnection {
  dbKey: string
  name?: string
  conString: string
}

interface FormValues {
  dbKey: string
  name: string
  host: string
  port: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: DbConnection | null
  onSave: (connection: DbConnection) => Promise<void>
}

const DEFAULT_CON = (host: string, port: string) =>
  `Data Source=${host}\\sqlexpress,${port};Initial Catalog=ProshopCTmax;Integrated Security=false;user id=sync;password=SyncWith!Maksat;`

function parseConString(con: string): Pick<FormValues, 'host' | 'port'> {
  const ds = con.match(/Data Source=([^;]+)/i)?.[1] ?? ''
  const clean = ds.replace(/\\sqlexpress/i, '')
  const [host, port] = clean.includes(',') ? clean.split(',') : [clean, '1433']
  return { host, port: port ?? '1433' }
}

export function DbConnectionModal({ open, onOpenChange, editing, onSave }: Props) {
  const form = useForm<FormValues>({
    defaultValues: { dbKey: '', name: '', host: '', port: '1433' },
  })

  const {
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (open) {
      if (editing) {
        form.reset({
          dbKey: editing.dbKey,
          name: editing.name ?? '',
          ...parseConString(editing.conString),
        })
      } else {
        form.reset({ dbKey: '', name: '', host: '', port: '1433' })
      }
    }
  }, [open, editing])

  const handleSave = form.handleSubmit(async ({ dbKey, name, host, port }) => {
    await onSave({ dbKey, name, conString: DEFAULT_CON(host, port) })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Редактировать подключение' : 'Добавить подключение'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* DB Key */}
          <div className="space-y-1.5">
            <Label>DB Key</Label>
            <Input {...form.register('dbKey', { required: 'Обязательно' })} disabled={!!editing} />
            {errors.dbKey && <p className="text-xs text-destructive">{errors.dbKey.message}</p>}
          </div>

          {/* Название */}
          <div className="space-y-1.5">
            <Label>Название</Label>
            <Input {...form.register('name')} />
          </div>

          {/* Host + Port */}
          <div className="grid grid-cols-[1fr_100px] gap-2">
            <div className="space-y-1.5">
              <Label>Host</Label>
              <Input
                placeholder="26.10.10.1"
                {...form.register('host', { required: 'Обязательно' })}
              />
              {errors.host && <p className="text-xs text-destructive">{errors.host.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Port</Label>
              <Input placeholder="1433" {...form.register('port', { required: 'Обязательно' })} />
              {errors.port && <p className="text-xs text-destructive">{errors.port.message}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
