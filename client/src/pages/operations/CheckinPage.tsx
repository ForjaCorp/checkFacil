import { Loader2, Search, UserCheck, UserX } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDebounce } from '@/hooks/useDebounce'
import api from '@/services/api'

interface ApiGuestResponse {
  id: number
  nome_convidado: string
  checkin_at?: string | null
  checkout_at?: string | null
}

interface CheckinGuest {
  id: number
  name: string
  status: 'Aguardando' | 'Presente' | 'Saiu'
}

const CheckinPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const [guests, setGuests] = useState<CheckinGuest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300) // 300ms de delay

  const mapGuestData = (guestFromApi: ApiGuestResponse): CheckinGuest => {
    let status: CheckinGuest['status'] = 'Aguardando'
    if (guestFromApi.checkout_at) {
      status = 'Saiu'
    } else if (guestFromApi.checkin_at) {
      status = 'Presente'
    }
    return {
      id: guestFromApi.id,
      name: guestFromApi.nome_convidado,
      status,
    }
  }

  const fetchGuests = useCallback(async () => {
    if (!eventId) return
    setIsLoading(true)
    try {
      let response
      if (debouncedSearchTerm) {
        // Se houver um termo de busca, usa a rota de busca
        response = await api.get(`/festa/${eventId}/convidados/buscar`, {
          params: { nome: debouncedSearchTerm },
        })
      } else {
        // Senão, lista todos os convidados
        response = await api.get(`/festa/${eventId}/convidados`)
      }
      const mappedGuests: CheckinGuest[] = response.data.map(mapGuestData)
      setGuests(mappedGuests)
    } catch (error) {
      console.error('Erro ao buscar convidados:', error)
      toast.error('Não foi possível carregar a lista de convidados.')
    } finally {
      setIsLoading(false)
    }
  }, [eventId, debouncedSearchTerm])

  useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  const handleCheckin = (guestId: number) => {
    toast.info(`Check-in para o convidado ${guestId} (a implementar)...`)
  }

  const handleCheckout = (guestId: number) => {
    toast.info(`Check-out para o convidado ${guestId} (a implementar)...`)
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Operação de Check-in</h1>
        {/* Adicionar o nome da festa aqui seria uma boa melhoria */}
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar convidado pelo nome..."
          className="pl-10 text-lg h-12"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Convidado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.length > 0 ? (
                guests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell>{guest.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckin(guest.id)}
                          disabled={guest.status !== 'Aguardando'}
                        >
                          <UserCheck className="mr-2 h-4 w-4" /> Check-in
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCheckout(guest.id)}
                          disabled={guest.status !== 'Presente'}
                        >
                          <UserX className="mr-2 h-4 w-4" /> Check-out
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhum convidado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

export default CheckinPage
