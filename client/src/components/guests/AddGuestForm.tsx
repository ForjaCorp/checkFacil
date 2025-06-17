import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// ENUM e Schema Zod (como definimos antes)
const guestTypeEnum = z.enum([
  'ADULTO_PAGANTE',
  'CRIANCA_PAGANTE',
  'CRIANCA_ATE_1_ANO',
  'BABA',
  'ANFITRIAO_FAMILIA_DIRETA',
  'ACOMPANHANTE_ATIPICO',
])

const addGuestSchema = z
  .object({
    nome_convidado: z.string().min(3, { message: 'Nome do convidado é obrigatório.' }),
    tipo_convidado: guestTypeEnum,
    idade_convidado: z.coerce.number().optional().nullable(),
    data_nascimento: z.date().optional().nullable(),
    e_crianca_atipica: z.boolean().default(false),
    telefone_convidado: z.string().optional().or(z.literal('')),
    nome_responsavel: z.string().optional().or(z.literal('')),
    telefone_responsavel: z.string().optional().or(z.literal('')),
    nome_acompanhante: z.string().optional().or(z.literal('')),
    telefone_acompanhante: z.string().optional().or(z.literal('')),
    observacao_convidado: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    const isChild = data.tipo_convidado.includes('CRIANCA')
    if (isChild && (!data.nome_responsavel || data.nome_responsavel.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nome do responsável é obrigatório para crianças.',
        path: ['nome_responsavel'],
      })
    }
    if (isChild && (!data.telefone_responsavel || data.telefone_responsavel.length < 10)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Telefone do responsável é obrigatório para crianças.',
        path: ['telefone_responsavel'],
      })
    }
    const isAdultOrBaba = data.tipo_convidado === 'ADULTO_PAGANTE' || data.tipo_convidado === 'BABA'
    if (isAdultOrBaba && (!data.telefone_convidado || data.telefone_convidado.length < 10)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Telefone é obrigatório para adultos e babás.',
        path: ['telefone_convidado'],
      })
    }
  })

export type AddGuestFormValues = z.infer<typeof addGuestSchema>

interface AddGuestFormProps {
  onSubmit: (data: AddGuestFormValues) => void
  isLoading?: boolean
  initialValues?: Partial<AddGuestFormValues>
  mode: 'add' | 'edit'
}

export function AddGuestForm({
  onSubmit,
  isLoading,
  initialValues,
  mode = 'add',
}: AddGuestFormProps) {
  const form = useForm<AddGuestFormValues>({
    resolver: zodResolver(addGuestSchema),
    defaultValues: initialValues || {
      nome_convidado: '',
      tipo_convidado: 'ADULTO_PAGANTE',
      e_crianca_atipica: false,
    },
  })

  const handleFormSubmit = (data: AddGuestFormValues) => {
    onSubmit(data)
    form.reset()
  }

  const watchedGuestType = form.watch('tipo_convidado')
  const isChild = watchedGuestType?.includes('CRIANCA') ?? false
  const showGuestPhone = watchedGuestType === 'ADULTO_PAGANTE' || watchedGuestType === 'BABA'
  const watchedDob = form.watch('data_nascimento')
  const watchedIsAtypical = form.watch('e_crianca_atipica')

  let age = null
  if (watchedDob) {
    const today = new Date()
    age = today.getFullYear() - watchedDob.getFullYear()
    const m = today.getMonth() - watchedDob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < watchedDob.getDate())) {
      age--
    }
  }

  const needsCompanion = isChild && (watchedIsAtypical || (age !== null && age < 6))

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="tipo_convidado"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de Convidado</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col gap-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="ADULTO_PAGANTE" />
                    </FormControl>
                    <FormLabel className="font-normal">Adulto</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="BABA" />
                    </FormControl>
                    <FormLabel className="font-normal">Babá</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="CRIANCA_PAGANTE" />
                    </FormControl>
                    <FormLabel className="font-normal">Criança</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nome_convidado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Convidado</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome completo do convidado"
                  {...field}
                  className="bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {showGuestPhone && (
          <FormField
            control={form.control}
            name="telefone_convidado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone do Convidado</FormLabel>
                <FormControl>
                  <Input placeholder="(XX) XXXXX-XXXX" {...field} className="bg-background" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {isChild && (
          <>
            <FormField
              control={form.control}
              name="data_nascimento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Nascimento da Criança</FormLabel>
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
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        captionLayout="dropdown"
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Abaixo de 6 anos, precisa de acompanhante.</FormDescription>
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
                  <FormLabel>Criança atípica? (precisa de acompanhante)</FormLabel>
                </FormItem>
              )}
            />
          </>
        )}

        {isChild && (
          <div className="p-4 border rounded-md bg-muted/50 dark:bg-card space-y-4">
            <h4 className="font-semibold">Dados do Responsável</h4>
            <FormField
              control={form.control}
              name="nome_responsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Responsável</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do pai ou mãe" {...field} className="bg-background" />
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
                    <Input placeholder="(XX) XXXXX-XXXX" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observacao_convidado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Alergias, etc.)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Alergia a amendoim, intolerância a lactose..."
                      {...field}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        {needsCompanion && (
          <div className="p-4 border rounded-md bg-muted/50 dark:bg-card space-y-4">
            <h4 className="font-semibold">Dados do Acompanhante (Obrigatório)</h4>
            {/* TODO: Adicionar aqui um checkbox "Mesmo que o responsável?" para facilitar */}
            <FormField
              control={form.control}
              name="nome_acompanhante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Acompanhante</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome completo do acompanhante"
                      {...field}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefone_acompanhante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone do Acompanhante</FormLabel>
                  <FormControl>
                    <Input placeholder="(XX) XXXXX-XXXX" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading
            ? 'Salvando...'
            : mode === 'add'
              ? 'Adicionar Convidado à Lista'
              : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  )
}
