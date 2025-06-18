import { useParams } from 'react-router-dom'

const CheckinPage = () => {
  const { eventId } = useParams<{ eventId: string }>()

  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Operação de Check-in</h1>
        <p className="text-lg text-muted-foreground">Evento ID: {eventId}</p>
      </header>

      <section>
        {/* TODO: Campo de busca de convidados */}
        <div className="mb-8">
          <p>Busca de Convidados (a implementar)...</p>
        </div>

        {/* TODO: Tabela/Lista de convidados para check-in */}
        <div>
          <p>Lista de Convidados (a implementar)...</p>
        </div>
      </section>
    </div>
  )
}

export default CheckinPage
