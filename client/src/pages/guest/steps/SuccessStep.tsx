import { AddToCalendarButton } from 'add-to-calendar-button-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2 } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Interface de dados permanece a mesma
interface EventData {
  nome_festa: string
  data_festa: string
  horario_inicio?: string | null
  horario_fim?: string | null
  local_festa?: string | null
}

interface SuccessStepProps {
  event: EventData
}

export function SuccessStep({ event }: SuccessStepProps) {
  const enderecoEspacoCriar = 'R. Francisco Portugal, n° 703 - Grageru, Aracaju - SE, 49025-700'

  // Formatando a data e hora para o formato que a biblioteca exige (YYYY-MM-DD)
  const startDate = event.data_festa
  const startTime = event.horario_inicio?.substring(0, 5) || '00:00'
  const endTime = event.horario_fim?.substring(0, 5) || '04:00' // Define 4h de duração se não houver fim

  const formattedDate = format(
    new Date(event.data_festa.replace(/-/g, '/')),
    "EEEE, dd 'de' MMMM",
    {
      locale: ptBR,
    },
  )
  const timeString = `das ${startTime}h às ${endTime}h`

  return (
    <Card className="w-full max-w-lg text-center animate-in fade-in-50">
      <CardHeader className="items-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <CardTitle className="text-3xl">Tudo Certo!</CardTitle>
        <CardDescription className="pt-1">
          A presença de vocês foi confirmada com sucesso. Obrigado!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg bg-muted p-4">
          <p className="font-semibold text-foreground">Lembre-se:</p>
          <p className="text-primary font-bold text-lg">{event.nome_festa}</p>
          <p className="text-muted-foreground capitalize">
            {formattedDate} {timeString}.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="[&>button]:w-full [&>button]:max-w-xs [&>button]:h-10 [&>button]:px-4 [&>button]:py-2 [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-md [&>button]:font-medium [&>button]:inline-flex [&>button]:items-center [&>button]:justify-center [&>button:hover]:bg-primary/90">
            <AddToCalendarButton
              name={event.nome_festa}
              description={`Lembrete para a festa: ${event.nome_festa}!`}
              location={event.local_festa || enderecoEspacoCriar}
              startDate={startDate}
              endDate={startDate}
              startTime={startTime}
              endTime={endTime}
              timeZone="America/Maceio"
              options={['Apple', 'Google', 'iCal', 'Outlook.com', 'Yahoo']}
              listStyle="modal"
              buttonStyle="default"
              hideCheckmark
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
