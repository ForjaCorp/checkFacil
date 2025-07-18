import { Loader2, UserCheck, UserX } from 'lucide-react'

import { ExtraBadge } from '@/components/guests/ExtraBadge'
import { GuestCheckinCardSkeleton } from '@/components/guests/skeletons/GuestCheckinCardSkeleton'
import { badgeVariants, Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import type { VariantProps } from 'class-variance-authority'

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']
export interface CheckinGuest {
  id: number
  name: string
  status: 'Aguardando' | 'Presente' | 'Saiu'
  walkedIn: boolean
  guestType: string // Mantido para compatibilidade, mas não está mais sendo usado
}

interface GuestCheckinCardProps {
  guest: CheckinGuest | null
  isActionLoading: boolean
  onCheckin: (guestId: number) => void
  onCheckout: (guestId: number) => void
  isLoading?: boolean
}

interface StatusInfo {
  text: string
  variant: BadgeVariant
  className?: string
}

export function GuestCheckinCard({
  guest,
  isActionLoading,
  onCheckin,
  onCheckout,
  isLoading = false,
}: GuestCheckinCardProps) {
  if (isLoading || !guest) {
    return <GuestCheckinCardSkeleton />
  }
  const getStatusInfo = (): StatusInfo => {
    switch (guest.status) {
      case 'Presente':
        return {
          text: 'Presente',
          variant: 'default',
          className: 'bg-green-600 text-white hover:bg-green-700',
        }
      case 'Saiu':
        return { text: 'Saiu', variant: 'destructive' }
      default:
        return { text: 'Aguardando', variant: 'secondary' }
    }
  }
  const statusInfo = getStatusInfo()

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg">{guest.name}</CardTitle>
          <Badge variant={statusInfo.variant} className={statusInfo.className}>
            {statusInfo.text}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {guest.walkedIn && <ExtraBadge />}
        </div>
      </CardHeader>
      <CardFooter className="grid grid-cols-2 gap-2 pt-6 border-t-2 border-dashed">
        <Button
          variant="outline"
          onClick={() => onCheckin(guest.id)}
          disabled={guest.status !== 'Aguardando' || isActionLoading}
        >
          {isActionLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserCheck className="mr-2 h-4 w-4" />
          )}
          Check-in
        </Button>
        <Button
          variant="destructive"
          onClick={() => onCheckout(guest.id)}
          disabled={guest.status !== 'Presente' || isActionLoading}
        >
          {isActionLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserX className="mr-2 h-4 w-4" />
          )}
          Check-out
        </Button>
      </CardFooter>
    </Card>
  )
}
