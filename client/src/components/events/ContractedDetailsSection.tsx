import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import type { CompleteDetailsFormValues } from '@/schemas/eventSchemas'
import type { UseFormReturn } from 'react-hook-form'

interface ContractedDetailsSectionProps {
  form: UseFormReturn<CompleteDetailsFormValues>
  clientPhone: string
}

export function ContractedDetailsSection({ form, clientPhone }: ContractedDetailsSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 border-b pb-2">Detalhes Contratados</h3>
      <div className="space-y-6 rounded-md border p-4 bg-muted/50">
        <FormField
          control={form.control}
          name="partyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Festa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Aniversário do(a) Joãozinho" {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="partyDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Festa</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                      disabled
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário de Início</FormLabel>
                <FormControl>
                  <Input type="time" {...field} value={field.value ?? ''} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário de Término</FormLabel>
                <FormControl>
                  <Input type="time" {...field} value={field.value ?? ''} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="packageType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pacote da Festa</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? undefined} disabled>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um pacote" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="KIDS">Festa Kids</SelectItem>
                  <SelectItem value="KIDS_MAIS_PARK">Festa Kids + Park</SelectItem>
                  <SelectItem value="PLAY">Festa Play</SelectItem>
                  <SelectItem value="PLAY_MAIS_PARK">Festa Play + Park</SelectItem>
                  <SelectItem value="KIDS_PARK_PLAY">Festa Kids + Park + Play</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contractedGuests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nº Total de Convidados Contratados</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Ex: 80"
                  {...field}
                  value={field.value ?? ''}
                  disabled
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Telefone do Cliente</FormLabel>
          <FormControl>
            <Input value={clientPhone || 'Não informado'} disabled />
          </FormControl>
        </FormItem>
      </div>
    </div>
  )
}
