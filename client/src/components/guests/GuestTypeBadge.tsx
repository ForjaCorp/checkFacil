import { Badge } from '@/components/ui/badge'

// Mapeamento de tipos de convidado para nomes amigáveis
const GUEST_TYPE_NAMES: Record<string, string> = {
  'ADULTO_PAGANTE': 'Adulto',
  'CRIANCA_PAGANTE': 'Criança',
  'CRIANCA_ATE_1_ANO': 'Bebê',
  'BABA': 'Babá',
  'ANFITRIAO_FAMILIA_DIRETA': 'Família',
  'ACOMPANHANTE_ATIPICO': 'Acompanhante'
}

type GuestTypeBadgeProps = {
  type: string
  className?: string
}

export function GuestTypeBadge({ type, className = '' }: GuestTypeBadgeProps) {
  const getVariant = (tipo: string) => {
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

  const displayName = GUEST_TYPE_NAMES[type] || type;
  
  return (
    <Badge variant={getVariant(type)} className={className}>
      {displayName}
    </Badge>
  )
}
