import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ContractedDetailsSection } from '@/components/events/ContractedDetailsSection'
import { PersonalizePartySection } from '@/components/events/PersonalizePartySection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { usePageHeader } from '@/hooks/usePageHeader'
import { completeDetailsSchema, type CompleteDetailsFormValues } from '@/schemas/eventSchemas'
import api from '@/services/api'

import type { UpdateEventPayload } from '@/types'

function CompleteEventDetailsPage() {
  const { setTitle } = usePageHeader()
  const [isFetching, setIsFetching] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [eventStatus, setEventStatus] = useState<string | null>(null)
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    setTitle('Detalhes da Festa')
    return () => setTitle(null)
  }, [setTitle])

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

  const { mutate: updateEvent, isPending } = useMutation({
    mutationFn: (payload: UpdateEventPayload) => api.patch(`/festa/${eventId}`, payload),
    onSuccess: () => {
      toast.success('Detalhes da festa salvos com sucesso!')
      navigate(-1)
    },
    onError: (error) => {
      console.error('Falha ao salvar detalhes da festa:', error)
    },
  })

  useEffect(() => {
    if (!eventId) return
    const fetchEventData = async () => {
      setIsFetching(true)
      try {
        const response = await api.get(`/festa/${eventId}`)
        const eventDataFromApi = response.data
        setEventStatus(eventDataFromApi.status)

        const formValuesToSet = {
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
      } finally {
        setIsFetching(false)
      }
    }
    fetchEventData()
  }, [eventId, form])

  const { data: playlists = [] } = useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      const response = await api.get('/playlists')
      return response.data
    },
  })

  const onSubmit: SubmitHandler<CompleteDetailsFormValues> = (values) => {
    const updatePayload: UpdateEventPayload = {
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
    updateEvent(updatePayload)
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
          <CardTitle className="hidden text-2xl font-bold lg:block">
            <h1>Complete os Detalhes da Sua Festa</h1>
          </CardTitle>

          <CardDescription>
            Revise e preencha as informações abaixo para finalizar o agendamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <ContractedDetailsSection form={form} />
              <PersonalizePartySection form={form} playlists={playlists} />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isPending
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
