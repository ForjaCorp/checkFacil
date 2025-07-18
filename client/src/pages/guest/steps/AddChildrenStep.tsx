import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowRight, CalendarIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import * as z from 'zod'

import { StepHeader } from '@/components/common/StepHeader'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const addChildrenSchema = z.object({
  children: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(3, { message: 'O nome da criança é obrigatório (mínimo 3 letras).' }),
        dob: z.date().optional(),
        isAtypical: z.boolean().default(false),
      }),
    )
    .min(1, 'Você deve adicionar pelo menos uma criança.')
    .refine((children) => children.every((child) => !!child.dob), {
      message: 'A data de nascimento é obrigatória para todas as crianças.',
      path: ['0', 'dob'],
    }),
})

export type AddChildrenStepValues = z.infer<typeof addChildrenSchema>

interface AddChildrenStepProps {
  onNext: (data: AddChildrenStepValues) => void
  onBack: () => void
  initialData?: AddChildrenStepValues
}

export function AddChildrenStep({ onNext, onBack, initialData }: AddChildrenStepProps) {
  const form = useForm<AddChildrenStepValues>({
    resolver: zodResolver(addChildrenSchema),
    defaultValues: initialData || {
      children: [{ name: '', dob: undefined, isAtypical: false }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'children',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const isPending = form.formState.isSubmitting || isSubmitting

  const onSubmit = async (data: AddChildrenStepValues) => {
    try {
      setIsSubmitting(true)
      await onNext(data)
    } catch (error) {
      console.error('Erro ao processar o formulário:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <StepHeader
        title="Adicionar Crianças"
        description="Informe os dados de cada criança que irá à festa."
        onBack={onBack}
      />
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-md border p-4 space-y-4 relative">
                  <h3 className="font-semibold">Criança {index + 1}</h3>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remover Criança</span>
                    </Button>
                  )}
                  <FormField
                    control={form.control}
                    name={`children.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo da Criança</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da criança" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`children.${index}.dob`}
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
                                  format(field.value, 'PPP', { locale: ptBR })
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
                              selected={field.value}
                              onSelect={field.onChange}
                              captionLayout="dropdown"
                              disabled={(date) => date > new Date()}
                              fromYear={new Date().getFullYear() - 15}
                              toYear={new Date().getFullYear()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`children.${index}.isAtypical`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="font-normal">É uma criança atípica?</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => append({ name: '', dob: undefined, isAtypical: false })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar outra criança
            </Button>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
