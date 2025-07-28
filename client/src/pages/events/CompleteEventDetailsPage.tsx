import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { ContractedDetailsSection } from '@/components/events/ContractedDetailsSection'
import { PersonalizePartySection } from '@/components/events/PersonalizePartySection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { usePageHeader } from '@/hooks/usePageHeader'
import { completeDetailsSchema, type CompleteDetailsFormValues } from '@/schemas/eventSchemas'
import api from '@/services/api'

import { FornecedorSection } from './FornecedorSection'

import type { UpdateEventPayload } from '@/types'

// Tipos para os enums para garantir a tipagem correta
type PackageType = 'KIDS' | 'KIDS_MAIS_PARK' | 'PLAY' | 'PLAY_MAIS_PARK' | 'KIDS_PARK_PLAY'
type GuestPolicy = 'PERMITIR_ANOTAR' | 'CHAMAR_ANFITRIAO'
type LocalDecoracaoType = 'PLAY' | 'CASINHAS' | 'ENTRE_CASINHAS' | 'KIDS' | 'SALAO_DE_FESTAS'

// Interface para os dados da API, garantindo que o `id` e outros campos existam
interface ApiEventData {
  id: number
  status: string
  organizador?: { nome: string; email: string; telefone: string }
  nome: string
  email: string
  telefone: string
  nome_festa: string
  data_festa: string
  pacote_escolhido: PackageType
  numero_convidados_contratado: number
  horario_inicio: string
  horario_fim: string
  nome_aniversariante: string
  idade_aniversariante?: number
  tema_festa: string
  descricao: string
  festa_deixa_e_pegue: boolean
  autoriza_uso_imagem: boolean
  instagram_cliente: string
  procedimento_convidado_fora_lista: GuestPolicy | null
  link_playlist_spotify: string
  observacoes_festa: string
  link_convite?: string
  // Fornecedores
  decorador_nome?: string
  decorador_contato?: string
  tem_material_terceirizado?: boolean
  material_terceirizado_contato?: string
  local_decoracao?: LocalDecoracaoType
  buffet_nome?: string
  buffet_contato?: string
  bebidas_fornecedor_nome?: string
  bebidas_fornecedor_contato?: string
  fornecedor_extra_nome?: string
  fornecedor_extra_contato?: string
}

interface Playlist {
  id: number
  nome: string
  link: string
}

// ===================================================================
// Componente de Formulário (responsável apenas por renderizar e interagir)
// ===================================================================
function EventForm({ eventData, playlists }: { eventData: ApiEventData; playlists: Playlist[] }) {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useForm<CompleteDetailsFormValues>({
    resolver: zodResolver(completeDetailsSchema),
    // Os valores default são populados aqui, garantindo que o form já comece "controlado"
    defaultValues: {
      partyName: eventData.nome_festa,
      partyDate: new Date(eventData.data_festa.replace(/-/g, '/')),
      packageType: eventData.pacote_escolhido,
      contractedGuests: eventData.numero_convidados_contratado || 0,
      startTime: eventData.horario_inicio ? eventData.horario_inicio.substring(0, 5) : '',
      endTime: eventData.horario_fim ? eventData.horario_fim.substring(0, 5) : '',
      birthdayPersonName: eventData.nome_aniversariante || '',
      birthdayPersonAge: eventData.idade_aniversariante || undefined,
      partyTheme: eventData.tema_festa || '',
      description: eventData.descricao || '',
      isDropOffParty: eventData.festa_deixa_e_pegue || false,
      allowsImageUse: eventData.autoriza_uso_imagem || false,
      clientInstagram: eventData.instagram_cliente || '',
      guestNotInListPolicy: eventData.procedimento_convidado_fora_lista || undefined,
      spotifyPlaylistLink: eventData.link_playlist_spotify || '',
      partyObservations: eventData.observacoes_festa || '',
      decoradorNome: eventData.decorador_nome || '',
      decoradorContato: eventData.decorador_contato || '',
      temMaterialTerceirizado: eventData.tem_material_terceirizado || false,
      materialTerceirizadoContato: eventData.material_terceirizado_contato || '',
      localDecoracao: eventData.local_decoracao || undefined,
      buffetNome: eventData.buffet_nome || '',
      buffetContato: eventData.buffet_contato || '',
      bebidasFornecedorNome: eventData.bebidas_fornecedor_nome || '',
      bebidasFornecedorContato: eventData.bebidas_fornecedor_contato || '',
      fornecedorExtraNome: eventData.fornecedor_extra_nome || '',
      fornecedorExtraContato: eventData.fornecedor_extra_contato || '',
    },
  })

  const { mutate: updateEvent, isPending: isSaving } = useMutation({
    mutationFn: (payload: UpdateEventPayload) => api.patch(`/festa/${eventId}`, payload),
    onSuccess: () => {
      toast.success('Detalhes da festa salvos com sucesso!')
      navigate(-1)
    },
    onError: () => toast.error('Ocorreu um erro ao salvar as informações.'),
  })

  const { mutate: uploadInvite, isPending: isUploading } = useMutation({
    mutationFn: (formData: FormData) => api.post(`/festa/${eventId}/convite/upload`, formData),
    onSuccess: () => {
      toast.success('Imagem do convite enviada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
    onError: () => toast.error('Falha ao enviar a imagem do convite.'),
  })

  const handleInviteImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && eventId) {
      const formData = new FormData()
      formData.append('arquivo', file)
      uploadInvite(formData)
    }
  }

  const onSubmit: SubmitHandler<CompleteDetailsFormValues> = (values) => {
    const updatePayload: UpdateEventPayload = {
      nome_festa: values.partyName,
      data_festa: values.partyDate instanceof Date
        ? values.partyDate.toISOString().slice(0, 10)
        : values.partyDate,
      horario_inicio: values.startTime || null,
      horario_fim: values.endTime || null,
      pacote_escolhido: values.packageType,
      numero_convidados_contratado: values.contractedGuests,
      telefone: values.clientPhone,
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
      decorador_nome: values.decoradorNome || '',
      decorador_contato: values.decoradorContato || '',
      tem_material_terceirizado: values.temMaterialTerceirizado || false,
      material_terceirizado_contato: values.materialTerceirizadoContato || '',
      local_decoracao: values.localDecoracao || null,
      buffet_nome: values.buffetNome || '',
      buffet_contato: values.buffetContato || '',
      bebidas_fornecedor_nome: values.bebidasFornecedorNome || '',
      bebidas_fornecedor_contato: values.bebidasFornecedorContato || '',
      fornecedor_extra_nome: values.fornecedorExtraNome || '',
      fornecedor_extra_contato: values.fornecedorExtraContato || '',
    }
    updateEvent(updatePayload)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="hidden text-2xl font-bold lg:block">
              <h1>Complete os Detalhes da Sua Festa</h1>
            </CardTitle>
            <CardDescription>
              Revise e preencha as informações abaixo para finalizar o agendamento.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ContractedDetailsSection 
              form={form} 
              clientPhone={eventData.organizador?.telefone || 'Telefone não disponível'} 
            />
            <PersonalizePartySection form={form} playlists={playlists} />
            <FornecedorSection form={form} />
            <div className="space-y-4 rounded-md border p-4">
              <h4 className="font-medium">Imagem do Convite</h4>
              {eventData?.link_convite ? (
                <div className="my-4">
                  <p className="text-sm text-muted-foreground mb-2">Convite atual:</p>
                  <img
                    src={eventData.link_convite}
                    alt="Convite da Festa"
                    className="rounded-md max-h-60 w-auto"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">Nenhum convite enviado ainda.</p>
              )}
              <p className="text-sm text-muted-foreground">
                {eventData?.link_convite
                  ? 'Para alterar, envie uma nova imagem:'
                  : 'Faça o upload da imagem que será compartilhada:'}
              </p>
              <Input
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleInviteImageUpload}
                disabled={isUploading || isSaving}
              />
              {isUploading && (
                <p className="text-sm text-primary flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando imagem...
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSaving || isUploading}>
              {(isSaving || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving
                ? 'Salvando...'
                : isUploading
                  ? 'Aguarde o upload...'
                  : eventData?.status === 'RASCUNHO'
                    ? 'Finalizar Agendamento e Salvar'
                    : 'Salvar Alterações'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// ===================================================================
// Página Principal (responsável por buscar dados e controlar estados)
// ===================================================================
function CompleteEventDetailsPage() {
  const { setTitle } = usePageHeader()
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    setTitle('Detalhes da Festa')
    return () => setTitle(null)
  }, [setTitle])

  const {
    data: eventData,
    isLoading: isFetchingEvent,
    isError: isEventError,
    error: eventError,
  } = useQuery<ApiEventData>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('ID do evento não encontrado')
      const response = await api.get(`/festa/${eventId}`)
      return response.data
    },
    enabled: !!eventId,
  })

  const {
    data: playlists,
    isLoading: isFetchingPlaylists,
    isError: isPlaylistsError,
    error: playlistsError,
  } = useQuery<Playlist[]>({
    queryKey: ['playlists'],
    queryFn: async () => (await api.get('/playlists')).data,
  })

  const isLoading = isFetchingEvent || isFetchingPlaylists
  const isError = isEventError || isPlaylistsError

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !eventData) {
    console.error('Erro ao buscar dados:', eventError || playlistsError)
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Não foi possível carregar os detalhes do evento.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Voltar
        </Button>
      </div>
    )
  }

  // Renderiza o formulário apenas quando TODOS os dados estiverem prontos.
  return (
    <div className="relative inset-0 overflow-y-auto bg-background">
      <EventForm eventData={eventData} playlists={playlists || []} />
    </div>
  )
}

export default CompleteEventDetailsPage
