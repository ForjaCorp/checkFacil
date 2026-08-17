import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  id?: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  minDate?: string
  maxDate?: string
  clearable?: boolean
  className?: string
}

const dataLocal = (value?: string) => {
  if (!value) return undefined
  const [ano, mes, dia] = value.slice(0, 10).split('-').map(Number)
  if (!ano || !mes || !dia) return undefined
  return new Date(ano, mes - 1, dia)
}

const dataIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** Campo de data padrão do app, sem depender do calendário nativo do navegador. */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Selecione uma data',
  disabled = false,
  minDate,
  maxDate,
  clearable = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = dataLocal(value)
  const minimo = dataLocal(minDate)
  const maximo = dataLocal(maxDate)
  const disabledMatchers = [
    ...(minimo ? [{ before: minimo }] : []),
    ...(maximo ? [{ after: maximo }] : []),
  ]

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'h-10 flex-1 justify-start px-3 text-left font-normal',
              !selected && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected ? format(selected, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={ptBR}
            captionLayout="dropdown"
            selected={selected}
            defaultMonth={selected ?? minimo ?? new Date()}
            startMonth={minimo ?? new Date(1900, 0)}
            endMonth={maximo ?? new Date(2100, 11)}
            disabled={disabledMatchers}
            onSelect={(date) => {
              if (!date) return
              onChange(dataIso(date))
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {clearable && value && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          aria-label="Limpar data"
          title="Limpar data"
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
