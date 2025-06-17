import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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

import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Textarea } from '../ui/textarea'

const eventFormSchema = z.object({
  organizerName: z.string().min(1, 'Nome do contratante é obrigatório.'),
  organizerEmail: z
    .string()
    .min(1, 'Email do contratante é obrigatório.')
    .email('Formato de email inválido.'),
  organizerPhone: z.string().min(10, 'Telefone do contratante é obrigatório (com DDD).'),

  partyName: z.string().min(1, 'Um nome para a festa é obrigatório.'),
  partyDate: z.date({ required_error: 'Data da festa é obrigatória.' }),
  packageType: z.enum(
    ['KIDS', 'KIDS_MAIS_PARK', 'PLAY', 'PLAY_MAIS_PARK', 'SUPER_FESTA_COMPLETA'],
    { required_error: 'Você precisa selecionar um tipo de pacote.' },
  ),
  contractedChildren: z.coerce.number().int().positive({ message: 'Deve ser um número positivo.' }),
  contractedAdults: z.coerce.number().int().positive({ message: 'Deve ser um número positivo.' }),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM).')
    .optional()
    .or(z.literal('')),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:MM).')
    .optional()
    .or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  birthdayPersonName: z.string().min(1, 'Nome do aniversariante é obrigatório.'),
  birthdayPersonAge: z.coerce.number().int().positive('Idade inválida.').optional().nullable(),
  partyTheme: z.string().optional().or(z.literal('')),
  isDropOffParty: z.boolean().default(false),
  allowsImageUse: z.boolean().default(false),
  clientInstagram: z.string().optional().or(z.literal('')),
  guestNotInListPolicy: z
    .enum(['PERMITIR_ANOTAR', 'CHAMAR_ANFITRIAO'], { message: 'Procedimento inválido.' })
    .optional()
    .or(z.literal('')),
  spotifyPlaylistLink: z
    .string()
    .url({ message: 'Por favor, insira uma URL válida.' })
    .optional()
    .or(z.literal('')),
  partyObservations: z.string().optional().or(z.literal('')),
})

type EventFormValues = z.infer<typeof eventFormSchema>

interface EventFormProps {
  form: ReturnType<typeof useForm<EventFormValues>> // A instância do form vinda da página pai
  onSubmit: (values: EventFormValues) => void
  isLoading: boolean
  mode: 'createDraft' | 'completeDetails'
  eventStatus?: string | null
}

const EventForm: React.FC<EventFormProps> = ({ form, onSubmit, isLoading, mode, eventStatus }) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Renderização Condicional: Seção de Dados do Contratante (apenas no modo 'createDraft') */}
        {mode === 'createDraft' && (
          <div>
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Dados do Contratante</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <FormField
                control={form.control}
                name="organizerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Contratante</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organizerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do Contratante</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@contratante.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organizerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp do Contratante</FormLabel>
                    <FormControl>
                      <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                    </FormControl>
                    <FormDescription className="text-left">
                      Usado para enviar o link de acesso.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
        {/* Seção "Detalhes Contratados" (apenas no modo 'completeDetails') */}
        {mode === 'completeDetails' && (
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
                          disabled={
                            (date: Date) =>
                              date < new Date(new Date().setDate(new Date().getDate() - 1)) // Desabilita datas passadas
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="packageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pacote da Festa</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value ?? undefined}
                      disabled
                    >
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
                        <SelectItem value="SUPER_FESTA_COMPLETA">Super Festa Completa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-left">
                      Este foi o pacote contratado com o Espaço Criar.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="contractedAdults"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº de Adultos Contratados</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 50"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? null : +e.target.value)
                          }
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractedChildren"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº de Crianças Contratadas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ex: 30"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? null : +e.target.value)
                          }
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold my-4 border-b pb-2">
            {mode === 'createDraft' ? 'Dados Essenciais da Festa' : 'Personalize Sua Festa'}
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        value={field.value ?? ''}
                        className="focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </FormControl>
                    <FormDescription className="text-left">
                      Formato HH:MM (ex: 14:00)
                    </FormDescription>
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
                      <Input
                        type="time"
                        {...field}
                        value={field.value ?? ''}
                        className="focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </FormControl>
                    <FormDescription className="text-left">
                      Formato HH:MM (ex: 18:00)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="birthdayPersonName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Aniversariante</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do(a) aniversariante"
                      {...field}
                      className="focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthdayPersonAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Idade a Comemorar (Aniversariante)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex: 7"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : +e.target.value)
                      }
                      className="focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partyTheme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tema da Festa (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Super Heróis, Princesas"
                      {...field}
                      className="focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Festa (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes adicionais sobre a festa..."
                      className="resize-y focus:border-primary focus:ring-2 focus:ring-primary/30"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Checkboxes */}
            <FormField
              control={form.control}
              name="isDropOffParty" // corresponde a 'festa_deixa_e_pegue'
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Festa no modelo &quot;Deixa e Pega&quot;?</FormLabel>
                    <FormDescription className="text-left">
                      Marque se as crianças podem ficar desacompanhadas (conforme regras de idade do
                      Espaço Criar).
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allowsImageUse" // corresponde a 'autoriza_uso_imagem'
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Contratante autoriza uso de imagem?</FormLabel>
                    <FormDescription className="text-left">
                      Permissão para o Espaço Criar usar imagens do evento para divulgação.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientInstagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram do Cliente (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://instagram.com/usuario"
                      {...field}
                      className="focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guestNotInListPolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedimento para Convidados Não Cadastrados</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger className="focus:border-primary focus:ring-2 focus:ring-primary/30">
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERMITIR_ANOTAR">Permitir e Anotar na Lista</SelectItem>
                      <SelectItem value="CHAMAR_ANFITRIAO">
                        Chamar Anfitrião para Autorizar
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="spotifyPlaylistLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link da Playlist do Spotify (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://open.spotify.com/playlist/..."
                      {...field}
                      className="focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partyObservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Adicionais (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre a festa..."
                      className="resize-y focus:border-primary focus:ring-2 focus:ring-primary/30"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading
            ? 'Salvando...'
            : eventStatus === 'RASCUNHO'
              ? 'Finalizar Agendamento e Salvar'
              : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  )
}

export default EventForm
