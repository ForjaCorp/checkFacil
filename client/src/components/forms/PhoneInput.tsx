import * as React from 'react'
import { useIMask } from 'react-imask'

import { Input } from '@/components/ui/input'

export interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ onChange, onBlur, name, value, ...props }, ref) => {
    const {
      ref: iMaskRef,
      value: maskedValue,
      setValue,
    } = useIMask(
      {
        mask: '+{55} (00) 00000-0000',
        lazy: false,
        placeholderChar: '_',
      },

      {
        onAccept: (_, mask) => {
          const event = {
            target: {
              name: name,
              value: mask.unmaskedValue,
            },
          }
          if (onChange) {
            onChange(event as React.ChangeEvent<HTMLInputElement>)
          }
        },
      },
    )

    React.useEffect(() => {
      setValue(String(value || ''))
    }, [value, setValue])

    const combinedRef = (instance: HTMLInputElement | null) => {
      iMaskRef.current = instance
      if (typeof ref === 'function') {
        ref(instance)
      } else if (ref) {
        ref.current = instance
      }
    }

    return (
      <Input
        {...props}
        ref={combinedRef}
        name={name}
        onChange={() => {}}
        onBlur={onBlur}
        value={maskedValue}
        autoComplete="tel"
      />
    )
  },
)
PhoneInput.displayName = 'PhoneInput'

export { PhoneInput }
