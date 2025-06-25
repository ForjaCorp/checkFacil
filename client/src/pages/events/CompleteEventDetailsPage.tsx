import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useApiMutation } from '@/hooks/useApiMutation'
import { cn } from '@/lib/utils'
import { completeDetailsSchema, type CompleteDetailsFormValues } from '@/schemas/eventSchemas'
import api from '@/services/api'

function CompleteEventDetailsPage() {
  const [isFetching, setIsFetching] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [eventStatus, setEventStatus] = useState<string | null>(null)

  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const form = useForm<CompleteDetailsFormValues>({
    resolver: zodResolver(completeDetailsSchema),
    defaultValues: {
      partyName: '',
      partyDate: new Date(),
      startTime: '',
      endTime: '',
      description: '',
      packageType: undefined,
      contractedAdults: 0,
      contractedChildren: 0,
      birthdayPersonName: '',
      birthdayPersonAge: undefined,
      partyTheme: '',
      isDropOffParty: false,
      allowsImageUse: false,
      clientInstagram: '',
      guestNotInListPolicy: undefined,
      spotifyPlaylistLink: '',
      partyObservations: '',
      organizerName: '',
      organizerEmail: '',
      organizerPhone: '',
    },
  })

  const { mutate: updateEvent, isLoading } = useApiMutation(
    (payload) => api.patch(`/festa/${eventId}`, payload),
    'Detalhes da festa salvos com sucesso!',
    {
      onSuccess: () => {
        navigate(-1)
      },
    },
  )

  useEffect(() => {
    if (!eventId) return

    const fetchEventData = async () => {
      setIsFetching(true)
      try {
        const response = await api.get(`/festa/${eventId}`)
        const eventDataFromApi = response.data

        setEventStatus(eventDataFromApi.status)

        const formValuesToSet = {
          // Campos do rascunho
          organizerName: eventDataFromApi.organizador?.nome || '',
          organizerEmail: eventDataFromApi.organizador?.email || '',
          organizerPhone: eventDataFromApi.organizador?.telefone || '',
          partyName: eventDataFromApi.nome_festa,
          partyDate: eventDataFromApi.data_festa
            ? new Date(eventDataFromApi.data_festa.replace(/-/g, '/'))
            : new Date(),
          packageType: eventDataFromApi.pacote_escolhido,
          contractedAdults: eventDataFromApi.numero_adultos_contratado || 0,
          contractedChildren: eventDataFromApi.numero_criancas_contratado || 0,

          // Campos que o contratante edita
          startTime: eventDataFromApi.horario_inicio
            ? eventDataFromApi.horario_inicio.substring(0, 5)
            : '',
          endTime: eventDataFromApi.horario_fim ? eventDataFromApi.horario_fim.substring(0, 5) : '',
          birthdayPersonName: eventDataFromApi.nome_aniversariante || '',
          birthdayPersonAge: eventDataFromApi.idade_aniversariante || undefined,
          partyTheme: eventDataFromApi.tema_festa || '',
          description: eventDataFromApi.descricao || '',
          isDropOffParty: eventDataFromApi.festa_deixa_e_pegue || false,
          allowsImageUse: eventDataFromApi.autoriza_uso_imagem || false,
          clientInstagram: eventDataFromApi.instagram_cliente || '',
          guestNotInListPolicy: eventDataFromApi.procedimento_convidado_fora_lista,
          spotifyPlaylistLink: eventDataFromApi.link_playlist_spotify || '',
          partyObservations: eventDataFromApi.observacoes_festa || '',
        }
        form.reset(formValuesToSet)
      } catch (err) {
        setPageError('Não foi possível carregar os detalhes do evento.')
        console.error('Erro ao buscar dados do evento:', err)
      } finally {
        setIsFetching(false)
      }
    }
    fetchEventData()
  }, [eventId, form])

  async function onSubmit(values: CompleteDetailsFormValues) {
    if (!eventId) {
      toast.error('Erro: ID do evento não encontrado.')
      return
    }

    const updatePayload = {
      horario_inicio: values.startTime || null,
      horario_fim: values.endTime || null,
      descricao: values.description,
      nome_aniversariante: values.birthdayPersonName,
      idade_aniversariante: values.birthdayPersonAge,
      tema_festa: values.partyTheme,
      festa_deixa_e_pegue: values.isDropOffParty,
      autoriza_uso_imagem: values.allowsImageUse,
      instagram_cliente: values.clientInstagram,
      procedimento_convidado_fora_lista: values.guestNotInListPolicy || null,
      link_playlist_spotify: values.spotifyPlaylistLink || null,
      observacoes_festa: values.partyObservations,
      status: 'PRONTA',
    }

    try {
      await updateEvent(updatePayload)
    } catch (error) {
      console.error('Falha ao salvar detalhes da festa:', error)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">{pageError}</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Complete os Detalhes da Sua Festa</CardTitle>
          <CardDescription>
            Revise e preencha as informações abaixo para finalizar o agendamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          <Input
                            placeholder="Ex: Aniversário do(a) Joãozinho"
                            {...field}
                            disabled
                          />
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
                            <SelectItem value="SUPER_FESTA_COMPLETA">
                              Super Festa Completa
                            </SelectItem>
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
              <div>
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Personalize Sua Festa</h3>
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
                            Marque se as crianças podem ficar desacompanhadas (conforme regras de
                            idade do Espaço Criar).
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
                            <SelectItem value="PERMITIR_ANOTAR">
                              Permitir e Anotar na Lista
                            </SelectItem>
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
        </CardContent>
      </Card>
    </div>
  )
}

export default CompleteEventDetailsPage
