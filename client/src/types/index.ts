/**
 * @file Centraliza as definições de tipos e interfaces da aplicação cliente.
 * Isso garante consistência e facilita a manutenção.
 */

// =================================
// Tipos relacionados a Eventos
// =================================

/**
 * Representa a estrutura de dados de um evento como vem da API.
 * Combina informações das listagens do Staff e do Organizador.
 */
export interface ApiEventResponse {
  id: number
  nome_festa: string
  data_festa: string
  status: string
  organizador?: {
    nome: string
  }
}

/**
 * Representa um evento na camada de visualização (frontend).
 * Usado nos dashboards para exibir informações das festas.
 */
export interface AppEvent {
  id: number
  name: string
  date: string
  status: string
  organizerName?: string
}

// =================================
// Tipos relacionados a Convidados
// =================================

/**
 * Enum para os diferentes tipos de convidados, conforme definido no backend.
 */
export type GuestType =
  | 'ADULTO_PAGANTE'
  | 'CRIANCA_PAGANTE'
  | 'CRIANCA_ATE_1_ANO'
  | 'BABA'
  | 'ANFITRIAO_FAMILIA_DIRETA'
  | 'ACOMPANHANTE_ATIPICO'

/**
 * Enum para o status de confirmação de presença do convidado.
 */
export type PresenceStatus = 'PENDENTE' | 'SIM' | 'NAO'

/**
 * Representa a estrutura de dados de um convidado como vem da API.
 *
 */
export interface ApiGuestResponse {
  id: number
  nome_convidado: string
  tipo_convidado: GuestType
  data_nascimento?: string | null
  e_crianca_atipica?: boolean
  telefone_convidado?: string | null
  nome_responsavel?: string | null
  telefone_responsavel?: string | null
  nome_acompanhante?: string | null
  telefone_acompanhante?: string | null
  observacao_convidado?: string | null
  confirmou_presenca: PresenceStatus
  checkin_at?: string | null
}

/**
 * Representa um convidado na camada de visualização (frontend).
 * Usado na página de gerenciamento de convidados.
 *
 */
export interface AppGuest {
  id: number
  nome_convidado: string
  tipo_convidado: GuestType
  data_nascimento?: Date | null
  e_crianca_atipica?: boolean
  telefone_convidado?: string | null
  nome_responsavel?: string | null
  telefone_responsavel?: string | null
  nome_acompanhante?: string | null
  telefone_acompanhante?: string | null
  observacao_convidado?: string | null
  status: PresenceStatus
  isCheckedIn: boolean
}
