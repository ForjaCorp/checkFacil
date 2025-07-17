import { Edit, Loader2, Trash2 } from 'lucide-react'

import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ExtraBadge } from '@/components/guests/ExtraBadge'
import { GuestCardSkeleton } from '@/components/guests/skeletons/GuestCardSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getGuestTypeBadgeVariant, getGuestTypeName } from '@/lib/guestTypes'

import type { AppGuest } from '@/types/guest'

interface GuestCardProps {
  guest: AppGuest | null
  onEdit: (guest: AppGuest) => void
  onDelete: (guest: AppGuest) => void
  isActionLoading?: boolean
  isLoading?: boolean
}

// Inner component that might throw errors
const GuestCardContent = ({ 
  guest, 
  onEdit, 
  onDelete, 
  isActionLoading = false,
  isLoading = false 
}: GuestCardProps) => {
  if (isLoading || !guest) {
    return <GuestCardSkeleton />
  }
  // This is where an error might occur, for example with invalid guest data
  const badgeVariant = getGuestTypeBadgeVariant(guest.tipo_convidado)
  const guestTypeName = getGuestTypeName(guest.tipo_convidado)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg">{guest.nome_convidado}</CardTitle>
          <Badge variant={badgeVariant}>
            {guestTypeName}
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
        <div className="flex w-full gap-2" role="group" aria-label="Ações do convidado">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(guest)}
            disabled={isActionLoading}
            aria-label={`Editar ${guest.nome_convidado}`}
          >
            {isActionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Edit className="mr-2 h-4 w-4" />
            )}
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(guest)}
            disabled={isActionLoading}
            aria-label={`Remover ${guest.nome_convidado}`}
          >
            {isActionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Remover
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export function GuestCard(props: GuestCardProps) {
  return (
    <ErrorBoundary>
      <GuestCardContent {...props} />
    </ErrorBoundary>
  )
}
