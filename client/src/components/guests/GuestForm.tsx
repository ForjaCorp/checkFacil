import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useForm, type SubmitHandler } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { editGuestSchema, type EditGuestFormValues } from '@/schemas/guestSchemas'

import type { GuestType } from '@/types'

// A prop 'mode' foi removida da interface
interface GuestFormProps {
  onSubmit: SubmitHandler<EditGuestFormValues>
  isLoading?: boolean
  initialValues: Partial<EditGuestFormValues & { tipo_convidado: GuestType }> // Inclui o tipo para lógica de UI
}

export function GuestForm({ onSubmit, isLoading, initialValues }: GuestFormProps) {
  const form = useForm<EditGuestFormValues>({
    resolver: zodResolver(editGuestSchema), // Usa o novo schema
    defaultValues: initialValues,
  })

  const isChild = initialValues.tipo_convidado?.includes('CRIANCA')
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* O tipo de convidado agora é apenas um texto informativo, não um campo editável */}
        <div>
          <Label>Tipo de Convidado</Label>
          <p className="text-sm text-muted-foreground pt-2 font-medium">
            {initialValues.tipo_convidado
              ? getGuestTypeFriendlyName(initialValues.tipo_convidado)
              : 'Não definido'}
          </p>
        </div>

        <FormField
          control={form.control}
          name="nome_convidado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Convidado</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo do convidado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isChild && (
          <>
            <FormField
              control={form.control}
              name="nascimento_convidado"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Nascimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value instanceof Date ? (
                            format(field.value, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Escolha a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} captionLayout="dropdown" disabled={(date) => date > new Date()} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="e_crianca_atipica"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel>É uma criança atípica?</FormLabel>
                </FormItem>
              )}
            />
          </>
        )}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      </form>
    </Form>
  )
}

// Helper function para ser usada aqui e na página de gerenciamento
const getGuestTypeFriendlyName = (type: string) => {
  const names: { [key: string]: string } = {
    ADULTO_PAGANTE: 'Adulto',
    CRIANCA_PAGANTE: 'Criança',
    CRIANCA_ATE_1_ANO: 'Criança (até 1 ano)',
    BABA: 'Babá',
    ANFITRIAO_FAMILIA_DIRETA: 'Anfitrião/Família',
    ACOMPANHANTE_ATIPICO: 'Acompanhante',
  }
  return names[type] || type
}
