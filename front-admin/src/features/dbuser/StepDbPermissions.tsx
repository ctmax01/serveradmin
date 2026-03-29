import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { reportApi } from '@/services/api'
import type { User } from '@/types'
import type { FormValues } from './type'
import { PERMISSION_FIELDS, PERMISSION_GROUPS } from './constants'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

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
        <div className="flex flex-col gap-1">
          {PERMISSION_GROUPS.map((group) => {
            const allChecked = group.fields.every((name) => !!form.watch(name))

            const toggleGroup = () => {
              group.fields.forEach((name) => form.setValue(name, !allChecked))
            }

            return (
              <div key={group.label}>
                <div className="flex items-center justify-between mb-1.5 ml-0.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  <button
                    type="button"
                    onClick={toggleGroup}
                    className={cn(
                      'flex items-center gap-1 px-1 py-1 rounded-md border cursor-pointer transition-colors text-[10px] select-none',
                      allChecked
                        ? 'bg-blue-200 border-primary/40 text-primary font-medium'
                        : 'border-border text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {allChecked && <Check size={12} />}
                    {allChecked ? 'Снять все' : 'Выбрать все'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {group.fields.map((name) => {
                    const f = PERMISSION_FIELDS.find((p) => p.name === name)!
                    return (
                      <Controller
                        key={name}
                        name={name}
                        control={form.control}
                        render={({ field }) => (
                          <label
                            className={cn(
                              'h-8 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border cursor-pointer transition-colors text-xs select-none leading-none',
                              field.value
                                ? 'bg-blue-200 border-primary/40 text-primary font-medium'
                                : 'border-border text-muted-foreground hover:bg-muted/50',
                            )}
                          >
                            <Checkbox
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                              className="hidden"
                            />
                            {field.value && <Check size={12} />}
                            <span>{f.label}</span>
                          </label>
                        )}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
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
