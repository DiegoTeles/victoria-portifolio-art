import * as React from 'react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'

import 'react-day-picker/style.css'

function Calendar({ className, style, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      {...props}
      className={cn(className)}
      style={
        {
          '--rdp-day-height': '2rem',
          '--rdp-day-width': '2rem',
          '--rdp-day_button-height': '1.875rem',
          '--rdp-day_button-width': '1.875rem',
          '--rdp-nav_button-height': '1.75rem',
          '--rdp-nav_button-width': '1.75rem',
          ...style,
        } as React.CSSProperties
      }
    />
  )
}

export { Calendar }
