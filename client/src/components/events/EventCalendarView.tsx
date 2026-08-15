import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AppEvent } from '@/types'

interface EventCalendarViewProps {
  events: AppEvent[]
  variant: 'staff' | 'organizer'
}

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

// Mesmos rotulos/cores do badge de status do EventCard
const STATUS_INFO: Record<string, { text: string; dot: string; chip: string }> = {
  RASCUNHO: {
    text: 'Pendente',
    dot: 'bg-muted-foreground/50',
    chip: 'bg-muted text-muted-foreground',
  },
  PRONTA: {
    text: 'Confirmada',
    dot: 'bg-blue-600',
    chip: 'bg-blue-600 text-white',
  },
  EM_ANDAMENTO: {
    text: 'Ao vivo',
    dot: 'bg-destructive',
    chip: 'bg-destructive text-destructive-foreground',
  },
  CONCLUIDA: {
    text: 'Finalizada',
    dot: 'bg-muted-foreground/30',
    chip: 'bg-muted/60 text-muted-foreground',
  },
}

const statusInfo = (status: string) => STATUS_INFO[status] ?? { text: status, dot: 'bg-muted-foreground/40', chip: 'bg-muted text-muted-foreground' }

// Horario vem como "14:00:00" do banco - exibe so HH:MM
const horaCurta = (hora?: string | null) => (hora ? hora.slice(0, 5) : null)

export function EventCalendarView({ events, variant }: EventCalendarViewProps) {
  const [mesRef, setMesRef] = useState(() => startOfMonth(new Date()))
  const [diaSelecionado, setDiaSelecionado] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  // Agrupa eventos por dia ("yyyy-MM-dd")
  const eventosPorDia = useMemo(() => {
    const mapa = new Map<string, AppEvent[]>()
    for (const evento of events) {
      const chave = evento.date?.slice(0, 10)
      if (!chave) continue
      const lista = mapa.get(chave)
      if (lista) lista.push(evento)
      else mapa.set(chave, [evento])
    }
    return mapa
  }, [events])

  const dias = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesRef), { weekStartsOn: 0 })
    const fim = endOfWeek(endOfMonth(mesRef), { weekStartsOn: 0 })
    return eachDayOfInterval({ start: inicio, end: fim })
  }, [mesRef])

  const detalhesDia = eventosPorDia.get(diaSelecionado) ?? []
  const totalNoMes = dias.filter((d) => isSameMonth(d, mesRef)).reduce((soma, d) => soma + (eventosPorDia.get(format(d, 'yyyy-MM-dd'))?.length ?? 0), 0)

  const linkDetalhes = (id: number) =>
    variant === 'staff' ? `/staff/event/${id}/details` : `/organizer/event/${id}/details`

  const mudarMes = (delta: number) => {
    const novo = new Date(mesRef)
    novo.setMonth(novo.getMonth() + delta)
    setMesRef(startOfMonth(novo))
  }

  const irParaHoje = () => {
    setMesRef(startOfMonth(new Date()))
    setDiaSelecionado(format(new Date(), 'yyyy-MM-dd'))
  }

  const mesLabel = format(mesRef, 'MMMM yyyy', { locale: ptBR })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 capitalize">
              <CalendarDays className="h-5 w-5 text-primary" />
              {mesLabel}
            </CardTitle>
            <CardDescription>
              {totalNoMes > 0
                ? `${totalNoMes} ${totalNoMes === 1 ? 'festa neste mês' : 'festas neste mês'}`
                : 'Nenhuma festa neste mês'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => mudarMes(-1)} aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={irParaHoje}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => mudarMes(1)} aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {DIAS_SEMANA.map((dia, i) => (
            <span key={`${dia}-${i}`} className="py-1 text-xs font-medium text-muted-foreground">
              {dia}
            </span>
          ))}
        </div>

        {/* Grade do mes */}
        <div className="grid grid-cols-7 gap-1">
          {dias.map((dia) => {
            const chave = format(dia, 'yyyy-MM-dd')
            const doMes = isSameMonth(dia, mesRef)
            const festas = eventosPorDia.get(chave) ?? []
            const selecionado = diaSelecionado === chave

            return (
              <button
                key={chave}
                onClick={() => setDiaSelecionado(chave)}
                className={`flex min-h-[56px] flex-col items-stretch gap-1 rounded-md border p-1 text-left transition-colors sm:min-h-[84px] ${
                  selecionado
                    ? 'border-primary bg-primary/10'
                    : doMes
                      ? 'border-border bg-background hover:bg-muted/60'
                      : 'border-transparent bg-muted/20 text-muted-foreground/40'
                }`}
              >
                <span
                  className={`text-xs font-semibold ${
                    doMes ? '' : 'opacity-50'
                  } self-end`}
                >
                  {format(dia, 'd')}
                </span>

                {/* Mobile: bolinhas coloridas */}
                <div className="flex flex-wrap content-start gap-0.5 sm:hidden">
                  {festas.slice(0, 4).map((festa) => (
                    <span key={festa.id} className={`h-1.5 w-1.5 rounded-full ${statusInfo(festa.status).dot}`} />
                  ))}
                </div>

                {/* Tablet/desktop: chips com horario e nome */}
                <div className="hidden flex-col gap-0.5 sm:flex">
                  {festas.slice(0, 2).map((festa) => (
                    <span
                      key={festa.id}
                      className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight font-medium ${statusInfo(festa.status).chip}`}
                      title={`${horaCurta(festa.startTime) ?? ''} ${festa.name}`}
                    >
                      {horaCurta(festa.startTime) ? `${horaCurta(festa.startTime)} ` : ''}
                      {festa.name}
                    </span>
                  ))}
                  {festas.length > 2 && (
                    <span className="px-1 text-[10px] text-muted-foreground">+{festas.length - 2}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(STATUS_INFO).map(([status, info]) => (
            <span key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${info.dot}`} />
              {info.text}
            </span>
          ))}
        </div>

        {/* Detalhe do dia selecionado */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="mb-2 text-sm font-semibold first-letter:uppercase">
            {format(new Date(`${diaSelecionado}T12:00:00`), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          {detalhesDia.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma festa neste dia.</p>
          ) : (
            <ul className="space-y-2">
              {detalhesDia.map((festa) => (
                <li key={festa.id}>
                  <Link
                    to={linkDetalhes(festa.id)}
                    className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 transition-colors hover:border-primary/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{festa.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {horaCurta(festa.startTime) ?? 'Horário a definir'}
                        {festa.endTime ? ` – ${horaCurta(festa.endTime)}` : ''}
                        {festa.organizerName ? ` · ${festa.organizerName}` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${statusInfo(festa.status).chip}`}>
                      {statusInfo(festa.status).text}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
