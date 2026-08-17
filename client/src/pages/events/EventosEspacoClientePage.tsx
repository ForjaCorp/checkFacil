import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ExternalLink, Loader2, Share2, Sparkles } from 'lucide-react'
import { useEffect } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { PushNotificationsCard } from '@/components/layout/PushNotificationsCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageHeader } from '@/hooks/usePageHeader'
import api from '@/services/api'

interface EventoEspaco {
  id: number
  titulo: string
  descricao: string | null
  data_inicio: string
  data_fim: string | null
  imagem_url: string | null
  link_ingresso: string | null
}

const formatarData = (data: string) =>
  new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })

const periodoLabel = (evento: Pick<EventoEspaco, 'data_inicio' | 'data_fim'>) =>
  evento.data_fim && evento.data_fim !== evento.data_inicio
    ? `${formatarData(evento.data_inicio)} a ${formatarData(evento.data_fim)}`
    : formatarData(evento.data_inicio)

const dataMes = (data: string) => {
  const dia = data.split('-')[2]
  const mesCurto = new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR', {
    month: 'short',
    timeZone: 'UTC',
  })
  return { dia, mes: mesCurto.replace('.', '').toUpperCase() }
}

export default function EventosEspacoClientePage() {
  const { setTitle } = usePageHeader()

  useEffect(() => {
    setTitle('Eventos do Espaço')
    return () => setTitle(null)
  }, [setTitle])

  const { data: eventos = [], isLoading } = useQuery<EventoEspaco[]>({
    queryKey: ['eventos-espaco-publicados'],
    queryFn: async () => {
      const response = await api.get('/eventos-espaco')
      return response.data.eventos
    },
  })

  const compartilhar = (evento: EventoEspaco) => {
    const texto = `Evento: ${evento.titulo} — ${periodoLabel(evento)}${evento.link_ingresso ? `\n${evento.link_ingresso}` : ''}`
    if (navigator.share) {
      navigator.share({ title: evento.titulo, text: texto }).catch(() => {})
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
    }
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const proximos = eventos.filter((e) => (e.data_fim || e.data_inicio) >= hoje)
  const passados = eventos
    .filter((e) => (e.data_fim || e.data_inicio) < hoje)
    .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Eventos do Espaço"
        description="Colônias de férias, datas especiais e outros eventos abertos. Garanta seu ingresso!"
      />

      <PushNotificationsCard />

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : eventos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Nenhum evento por enquanto</p>
            <p className="text-sm text-muted-foreground">
              Em breve divulgaremos novidades por aqui — e você recebe o aviso no seu celular.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Próximos eventos</h2>
          {proximos.length === 0 ? (
            <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              Não há novos eventos programados no momento.
            </p>
          ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {proximos.map((evento) => {
            const { dia, mes } = dataMes(evento.data_inicio)
            return (
              <Card key={evento.id} className="overflow-hidden flex flex-col">
                {evento.imagem_url ? (
                  <img
                    src={evento.imagem_url}
                    alt={evento.titulo}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-primary/10 text-primary">
                    <CalendarDays className="h-10 w-10" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="text-lg font-bold leading-none">{dia}</span>
                      <span className="text-[10px] font-semibold uppercase">{mes}</span>
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-lg leading-tight">{evento.titulo}</CardTitle>
                      <p className="text-sm text-muted-foreground">{periodoLabel(evento)}</p>
                    </div>
                  </div>
                </CardHeader>
                {evento.descricao && (
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-4">{evento.descricao}</p>
                  </CardContent>
                )}
                <CardFooter className="mt-auto flex gap-2">
                  {evento.link_ingresso && (
                    <Button asChild className="flex-1">
                      <a href={evento.link_ingresso} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Participar
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    title="Compartilhar"
                    onClick={() => compartilhar(evento)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
          </div>
          )}
        </section>
      )}

      {passados.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Eventos que já passaram</h2>
          <div className="rounded-lg border bg-card p-4">
            <ul className="space-y-3">
              {passados.map((evento) => (
                <li key={evento.id} className="flex flex-col gap-1 border-b pb-3 text-sm last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium">{evento.titulo}</span>
                  <span className="text-muted-foreground">Encerrado · {periodoLabel(evento)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
