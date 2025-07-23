import type { GuestType } from './index'

export type { GuestType }

export type GuestStatus = 'Aguardando' | 'Presente' | 'Saiu'
export type PresenceStatus = GuestStatus
export type AppGuest = BaseGuest

export interface BaseGuest {
  id: number
  nome_convidado: string
  tipo_convidado: GuestType
  e_crianca_atipica?: boolean
  nascimento_convidado?: string | Date | null
  status?: GuestStatus
  isCheckedIn?: boolean
  checkin_at?: string | null
  checkout_at?: string | null
  cadastrado_na_hora?: boolean
  // Campos de telefone e responsável
  telefone_convidado?: string | null
  telefone_responsavel_contato?: string | null
  telefone_responsavel?: string | null
  telefone_acompanhante?: string | null
  nome_responsavel_contato?: string | null
  nome_responsavel?: string | null
  nome_acompanhante?: string | null
}

export interface GuestFilterOptions {
  value: string
  label: string
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive'
}

export interface GuestSortOption {
  value: string
  label: string
}
