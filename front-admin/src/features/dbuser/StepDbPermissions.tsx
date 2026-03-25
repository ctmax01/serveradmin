import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { reportApi } from '@/services/api'
import type { User } from '@/types'
import type { FormValues } from './type'
import { PERMISSION_FIELDS } from './constants'
import { Controller, type UseFormReturn } from 'react-hook-form'

interface Props {
  form: UseFormReturn<FormValues>
  selectedUser: Pick<User, 'id' | 'name'> | null
  onChangeUser: () => void
}

export function StepDbPermissions({ form, selectedUser, onChangeUser }: Props) {
  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportApi.getAll(),
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const initials =
    selectedUser?.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? '?'

  return (
    <div>
      {/* Выбранный юзер — сводка из шага 1 */}
      <div className="flex items-center gap-2 px-2 py-2 border border-green-200 dark:border-green-800 rounded-md bg-green-50 dark:bg-green-950">
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs font-medium text-green-700 dark:text-green-300">
          {initials}
        </div>
        <div className="flex-1 text-sm font-medium text-green-800 dark:text-green-200">
          {selectedUser?.name}
        </div>
        <Button variant="ghost" size="sm" className="text-xs" onClick={onChangeUser}>
          Изменить
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="ml-2 uppercase">
            DB name <span className="text-destructive">*</span>
          </Label>
          <Input {...form.register('dbname')} />
        </div>
        <div>
          <Label className="ml-2 uppercase">Doc user ID</Label>
          <Input type="number" {...form.register('docUserId', { valueAsNumber: true })} />
        </div>
      </div>
      <Label className="ml-2 uppercase">URL</Label>
      <Input {...form.register('url')} />

      {/* Права */}
      <div>
        <div className="flex items-center gap-2 my-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            Права доступа
          </span>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
          {PERMISSION_FIELDS.map((f) => (
            <Controller
              key={f.name}
              name={f.name as keyof FormValues}
              control={form.control}
              render={({ field }) => (
                <label className="flex items-center gap-1 cursor-pointer rounded-md px-1 py-1 hover:bg-muted/50 transition-colors">
                  <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                  <span className="text-xs">{f.label}</span>
                </label>
              )}
            />
          ))}
        </div>
      </div>

      {reports.length > 0 && (
        <div>
          <div className="flex items-center gap-2 my-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Отчёты</span>
            <Separator className="flex-1" />
          </div>
          <Controller
            name="reportIds"
            control={form.control}
            render={({ field }) => (
              <div className="border rounded-md divide-y">
                {reports.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={(field.value ?? []).includes(r.id)}
                      onCheckedChange={(checked) => {
                        const cur = field.value ?? []
                        field.onChange(checked ? [...cur, r.id] : cur.filter((id) => id !== r.id))
                      }}
                    />
                    <span className="text-sm">{r.name}</span>
                  </label>
                ))}
              </div>
            )}
          />
        </div>
      )}
    </div>
  )
}
