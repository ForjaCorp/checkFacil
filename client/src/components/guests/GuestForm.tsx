import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'

import { PhoneInput } from '@/components/forms/PhoneInput'
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

interface GuestFormProps {
  onSubmit: SubmitHandler<EditGuestFormValues>
  isLoading?: boolean
  initialValues: Partial<EditGuestFormValues & { tipo_convidado: GuestType }>
}

export function GuestForm({ onSubmit, isLoading, initialValues }: GuestFormProps) {
  const form = useForm<EditGuestFormValues>({
    resolver: zodResolver(editGuestSchema),
    defaultValues: {
      ...initialValues,
      // Garantir que os campos opcionais tenham valores padrão
      telefone_convidado: initialValues.telefone_convidado || '',
      telefone_responsavel: initialValues.telefone_responsavel || '',
      nome_responsavel: initialValues.nome_responsavel || '',
      e_crianca_atipica: initialValues.e_crianca_atipica || false,
      tipo_convidado: initialValues.tipo_convidado || 'adulto',
    },
  })

  // Atualiza os valores do formulário quando initialValues mudar
  useEffect(() => {
    if (initialValues) {
      form.reset({
        ...initialValues,
        telefone_convidado: initialValues.telefone_convidado || '',
        telefone_responsavel: initialValues.telefone_responsavel || '',
        nome_responsavel: initialValues.nome_responsavel || '',
        e_crianca_atipica: initialValues.e_crianca_atipica || false,
        tipo_convidado: initialValues.tipo_convidado || 'adulto',
      })
    }
  }, [initialValues, form])

  const isChild = initialValues.tipo_convidado?.includes('CRIANCA') || false
  const isAdult = !isChild

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        {isAdult ? (
          <FormField
            control={form.control}
            name="telefone_convidado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <PhoneInput
                    placeholder="+55 (XX) 9XXXX-XXXX"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, '')
                      field.onChange(numbers)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <>
            <FormField
              control={form.control}
              name="nome_responsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Responsável</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do responsável" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone_responsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone do Responsável</FormLabel>
                  <FormControl>
                    <PhoneInput
                      placeholder="+55 (XX) 9XXXX-XXXX"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/\D/g, '')
                        field.onChange(numbers)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), 'PPP', { locale: ptBR })
                          ) : (
                            <span>Escolha a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date || null)}
                        captionLayout="dropdown"
                        disabled={(date) => date > new Date()}
                      />
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
