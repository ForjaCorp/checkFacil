import { Edit, Trash2 } from 'lucide-react'

import { ExtraBadge } from '@/components/guests/ExtraBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getGuestTypeBadgeVariant, getGuestTypeName } from '@/lib/guestTypes'

interface GuestCardProps {
  guest: {
    id: number
    nome_convidado: string
    tipo_convidado: string
    e_crianca_atipica?: boolean
    status?: string
    isCheckedIn?: boolean
    cadastrado_na_hora?: boolean
  }
  onEdit: (guest: {
    id: number
    nome_convidado: string
    tipo_convidado: string
    e_crianca_atipica?: boolean
  }) => void
  onDelete: (guest: {
    id: number
    nome_convidado: string
    tipo_convidado: string
    e_crianca_atipica?: boolean
  }) => void
  isActionLoading?: boolean
}

export function GuestCard({ guest, onEdit, onDelete, isActionLoading = false }: GuestCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg">{guest.nome_convidado}</CardTitle>
          <Badge variant={getGuestTypeBadgeVariant(guest.tipo_convidado)}>
            {getGuestTypeName(guest.tipo_convidado)}
          </Badge>
        </div>
        {guest.cadastrado_na_hora && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <ExtraBadge />
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Additional guest information can go here */}
      </CardContent>
      <CardFooter className="border-t-2 border-dashed pt-4">
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(guest)}
            disabled={isActionLoading}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(guest)}
            disabled={isActionLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remover
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
