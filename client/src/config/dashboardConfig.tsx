import { PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

/**
 * Configuração do dashboard para diferentes tipos de usuário.
 *
 * @property {Object} header Configuração do cabeçalho do dashboard.
 * @property {string} header.title Título do cabeçalho.
 * @property {Function} header.getSubtitle Função para obter o subtítulo, recebendo o nome do usuário.
 * @property {JSX.Element | null} header.action Elemento JSX para ação no cabeçalho, ou null se não houver ação.
 *
 * @property {Object} events Configuração relacionada aos eventos exibidos no dashboard.
 * @property {string} events.sectionTitle Título da seção de eventos.
 * @property {string} events.emptyStateTitle Título do estado vazio quando não há eventos.
 * @property {string} events.emptyStateDescription Descrição do estado vazio.
 * @property {string} events.cardVariant Variante do card de evento, usado para estilização.
 *
 * @property {Object} fetchOptions Opções de busca de eventos.
 * @property {boolean} fetchOptions.includeOrganizerName Se deve incluir o nome do organizador na busca.
 */
const staffConfig = {
  header: {
    title: 'Painel do Staff',
    getSubtitle: (userName: string) => `Bem-vindo(a), ${userName}!`,
    action: (
      <Button asChild>
        <Link to="/staff/events/createEventDraft">
          <PlusCircle className="mr-2 h-5 w-5" />
          <span>Criar Nova Festa</span>
        </Link>
      </Button>
    ),
  },
  events: {
    sectionTitle: 'Festas Agendadas',
    emptyStateTitle: 'Nenhuma festa encontrada',
    emptyStateDescription: "Use o botão 'Criar Nova Festa' para começar a agendar um evento.",
    cardVariant: 'staff' as const,
  },
  fetchOptions: {
    includeOrganizerName: true,
  },
}

const organizerConfig = {
  header: {
    title: 'Meu Painel',
    getSubtitle: (userName: string) => `Bem-vindo(a), ${userName}!`,
    action: null,
  },
  events: {
    sectionTitle: 'Meus Eventos Agendados',
    emptyStateTitle: 'Nenhum evento agendado',
    emptyStateDescription: 'Assim que a nossa equipe criar o seu evento, ele aparecerá aqui.',
    cardVariant: 'organizer' as const,
  },
  fetchOptions: {
    includeOrganizerName: false,
  },
}

/**
 * Configuração centralizada do dashboard com base no tipo de usuário.
 */
export const dashboardConfig = {
  Adm_espaco: staffConfig,
  Adm_festa: organizerConfig,
}
