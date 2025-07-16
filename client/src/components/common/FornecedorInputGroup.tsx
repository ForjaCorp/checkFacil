import { Input } from '@/components/ui/input'

import type { CompleteDetailsFormValues } from '@/schemas/eventSchemas'
import type { UseFormReturn } from 'react-hook-form'

interface FornecedorInputGroupProps {
  form: UseFormReturn<CompleteDetailsFormValues>
  baseName: string
  label: string
}

export function FornecedorInputGroup({ form, baseName, label }: FornecedorInputGroupProps) {
  const nameField = `${baseName}Nome` as keyof CompleteDetailsFormValues
  const contactField = `${baseName}Contato` as keyof CompleteDetailsFormValues

  return (
    <div>
      <h5 className="font-medium text-md mb-2">{label}</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Input
            id={nameField}
            {...form.register(nameField)}
            placeholder={`Nome do ${label.toLowerCase()}`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Input
            id={contactField}
            {...form.register(contactField)}
            placeholder={`Contato do ${label.toLowerCase()}`}
          />
        </div>
      </div>
    </div>
  )
}
