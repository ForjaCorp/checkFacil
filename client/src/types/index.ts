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
  nascimento_convidado?: string | null
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
  nascimento_convidado?: Date | null
  e_crianca_atipica?: boolean
  telefone_convidado?: string | null
  nome_responsavel?: string | null
  telefone_responsavel?: string | null
  nome_acompanhante?: string | null
  telefone_acompanhante?: string | null
  observacao_convidado?: string | null
  status: PresenceStatus
  isCheckedIn: boolean
  cadastrado_na_hora?: boolean
  nome_responsavel_contato?: string | null
}

// Tipo para as opções de query da dashboard
export interface EventsQueryOptions {
  page: number
  search?: string
  status?: string
  startDate?: string
  endDate?: string
}

// Tipo para o payload de criação de evento
export interface CreateEventPayload {
  dadosFesta: {
    nome_festa: string
    data_festa: string
    horario_inicio: string
    horario_fim: string
    pacote_escolhido: string
    numero_convidados_contratado: number
  }
  dadosCliente: {
    nome: string
    email: string
    telefone: string
  }
}

// Tipo para o payload de atualização de evento
export type UpdateEventPayload = {
  nome_festa: string
  data_festa: string
  pacote_escolhido: string
  numero_convidados_contratado: number
  telefone: string
  horario_inicio: string | null | undefined
  horario_fim: string | null | undefined
  descricao?: string
  nome_aniversariante?: string
  idade_aniversariante?: number | null
  tema_festa?: string
  festa_deixa_e_pegue?: boolean
  autoriza_uso_imagem?: boolean
  instagram_cliente?: string
  procedimento_convidado_fora_lista?: string | null
  link_playlist_spotify?: string | null
  observacoes_festa?: string
  status: string
  // Fornecedores
  decorador_nome?: string
  decorador_contato?: string
  tem_material_terceirizado?: boolean
  material_terceirizado_contato?: string
  local_decoracao?: 'PLAY' | 'CASINHAS' | 'ENTRE_CASINHAS' | 'KIDS' | 'SALAO_DE_FESTAS' | null
  buffet_nome?: string
  buffet_contato?: string
  bebidas_fornecedor_nome?: string
  bebidas_fornecedor_contato?: string
  fornecedor_extra_nome?: string
  fornecedor_extra_contato?: string
}
