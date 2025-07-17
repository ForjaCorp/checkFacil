import { badgeVariants } from '@/components/ui/badge'

import type { GuestType } from '@/types'
import type { VariantProps } from 'class-variance-authority'

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

export const getGuestTypeName = (tipo: GuestType | string): string => {
  const types: Record<string, string> = {
    ADULTO_PAGANTE: 'Adulto',
    CRIANCA_PAGANTE: 'Criança',
    CRIANCA_ATE_1_ANO: 'Bebê (até 1 ano)',
    BABA: 'Babá',
    ANFITRIAO_FAMILIA_DIRETA: 'Anfitrião/Família',
    ACOMPANHANTE_ATIPICO: 'Acompanhante',
  }
  return types[tipo] || tipo
}

export const getGuestTypeBadgeVariant = (tipo: string): BadgeVariant => {
  switch (tipo) {
    case 'ADULTO_PAGANTE':
      return 'default'
    case 'CRIANCA_PAGANTE':
      return 'secondary'
    case 'CRIANCA_ATE_1_ANO':
      return 'outline'
    case 'BABA':
      return 'destructive'
    case 'ANFITRIAO_FAMILIA_DIRETA':
      return 'default'
    case 'ACOMPANHANTE_ATIPICO':
      return 'secondary'
    default:
      return 'outline'
  }
}
