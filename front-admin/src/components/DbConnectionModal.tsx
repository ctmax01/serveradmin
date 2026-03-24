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
import { SpinnerCustom } from './ui/spinner'

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
    try {
      await onSave({ dbKey, name, conString: DEFAULT_CON(host, port) })
      onOpenChange(false)
    } catch {}
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{editing ? 'Редактировать' : 'Добавить'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          <Label>DB Key</Label>
          <Input {...form.register('dbKey', { required: 'Обязательно' })} disabled={!!editing} />
          {errors.dbKey && <p className="text-xs text-destructive">{errors.dbKey.message}</p>}
          <Label>Название</Label>
          <Input {...form.register('name')} />
          <div className="grid grid-cols-[1fr_100px] gap-2">
            <div>
              <Label>Host</Label>
              <Input
                placeholder="192.168.0.1"
                type="text"
                {...form.register('host', { required: 'Обязательно' })}
              />
              {errors.host && <p className="text-xs text-destructive">{errors.host.message}</p>}
            </div>
            <div>
              <Label>Port</Label>
              <Input
                placeholder="1433"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                {...form.register('port', { required: 'Обязательно' })}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, '')
                }}
              />
              {errors.port && <p className="text-xs text-destructive">{errors.port.message}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <SpinnerCustom /> : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
