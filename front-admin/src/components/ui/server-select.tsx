import { useState } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { SpinnerCustom } from '@/components/ui/spinner'
import { toast } from 'sonner'

interface ServerSelectProps<T> {
  value: T | null
  onChange: (item: T) => void
  options: T[]
  getValue: (item: T) => string | number
  getLabel: (item: T) => string
  onSearch: (query: string) => void
  isLoading?: boolean
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  hintText?: string
  className?: string
  disabled?: boolean
  footer?: React.ReactNode
}

export function ServerSelect<T>({
  value,
  onChange,
  options,
  getValue,
  getLabel,
  onSearch,
  isLoading = false,
  placeholder = 'Выберите…',
  searchPlaceholder = 'Поиск…',
  emptyText = 'Не найдено',
  hintText = 'Введите запрос и нажмите поиск',
  className,
  disabled,
  footer,
}: ServerSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const selectedId = value ? getValue(value) : null
  const displayLabel = value ? getLabel(value) : undefined

  const handleSearch = () => {
    if (query.length < 2) {
      toast.error('Введите минимум 2 символа')
      return
    }
    setSubmitted(true)
    onSearch(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleSearch()
    }
  }
  const handleSelect = (item: T) => {
    onChange(item)
    setOpen(false)
    setQuery('')
    setSubmitted(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className={selectedId != null ? '' : 'text-muted-foreground'}>
            {selectedId != null ? `${selectedId} ${displayLabel ?? ''}`.trim() : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 z-50 w-(--radix-popover-trigger-width)" align="start">
        <Command shouldFilter={false} className="h-auto">
          <div className="flex p-1.5 gap-1.5 shrink-0">
            <Input
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="focus:ring-0"
            />
            <Button size="icon" onClick={handleSearch} type="button">
              {isLoading ? <SpinnerCustom /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {!submitted && (
            <div className="py-2 text-center text-sm text-muted-foreground shrink-0">
              {query.length > 0 && query.length < 2 ? (
                <span className="text-destructive">Минимум 2 символа</span>
              ) : (
                hintText
              )}
            </div>
          )}
          <CommandList className="max-h-50">
            <CommandEmpty>{submitted && !isLoading ? emptyText : null}</CommandEmpty>
            <CommandGroup>
              {options.map((item) => {
                const itemValue = getValue(item)
                return (
                  <CommandItem
                    key={itemValue}
                    value={String(itemValue)}
                    onSelect={() => handleSelect(item)}
                  >
                    {getLabel(item)}
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedId === itemValue ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="ml-auto text-xs text-muted-foreground">{itemValue}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
          {footer && <div className="border-t p-1">{footer}</div>}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
