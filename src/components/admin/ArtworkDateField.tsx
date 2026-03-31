import { useMemo, useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ArtworkDateFieldProps = {
  id: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export function ArtworkDateField({ id, value, onChange, required }: ArtworkDateFieldProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => {
    if (!value?.trim()) return undefined
    const d = parseISO(value)
    return isValid(d) ? d : undefined
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        id={id}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'w-[min(100%,11rem)] justify-start gap-2 text-left font-normal'
        )}
        aria-required={required}
      >
        <CalendarIcon className="text-muted-foreground size-4 shrink-0" />
        {selected ? (
          format(selected, 'dd/MM/yyyy', { locale: ptBR })
        ) : (
          <span className="text-muted-foreground">Escolher data</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0" side="bottom" sideOffset={6}>
        <Calendar
          mode="single"
          locale={ptBR}
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            if (d) onChange(format(d, 'yyyy-MM-dd'))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
