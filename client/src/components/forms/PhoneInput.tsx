import * as React from 'react'

import { Input } from '@/components/ui/input'
import { formatPhoneNumber, unformatPhoneNumber } from '@/lib/phoneUtils'

export interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ onChange, ...props }, ref) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = unformatPhoneNumber(e.target.value)
      const formattedValue = formatPhoneNumber(rawValue)

      e.target.value = formattedValue

      if (onChange) {
        onChange(e)
      }
    }

    return <Input {...props} ref={ref} onChange={handleInputChange} type="tel" maxLength={19} />
  },
)
PhoneInput.displayName = 'PhoneInput'

export { PhoneInput }
