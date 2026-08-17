import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import api from '@/services/api'

interface EventoEspaco {
  id: number
  titulo: string
  data_inicio: string
  data_fim: string | null
  imagem_url: string | null
}

const formatarData = (data: string) =>
  new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })

const hoje = () => new Date().toISOString().slice(0, 10)

/**
 * Banner com eventos publicados do espaco, exibido no dashboard do cliente.
 * So aparece quando existe algum evento vigente ou futuro.
 */
export function EventosEspacoBanner() {
  const { data: eventos = [] } = useQuery<EventoEspaco[]>({
    queryKey: ['eventos-espaco-publicados'],
    queryFn: async () => {
      const response = await api.get('/eventos-espaco')
      return response.data.eventos
    },
    staleTime: 5 * 60 * 1000,
  })

  const ativos = eventos.filter((e) => (e.data_fim || e.data_inicio) >= hoje()).slice(0, 4)

  if (ativos.length === 0) return null

  return (
    <section className="animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Eventos do Espaço
        </h2>
        <Link
          to="/organizer/eventos"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Ver todos
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-2 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ativos.map((evento) => (
          <Link
            key={evento.id}
            to="/organizer/eventos"
            className="group relative flex h-24 w-52 shrink-0 items-end overflow-hidden rounded-xl border bg-card"
          >
            {evento.imagem_url ? (
              <img
                src={evento.imagem_url}
                alt={evento.titulo}
                className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-primary/15" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            <div className="relative z-10 w-full p-3 text-white">
              <p className="truncate text-sm font-semibold leading-tight">{evento.titulo}</p>
              <p className="flex items-center gap-1 text-xs text-white/85">
                <CalendarDays className="h-3 w-3" />
                {formatarData(evento.data_inicio)}
                {evento.data_fim && evento.data_fim !== evento.data_inicio && ` a ${formatarData(evento.data_fim)}`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
