import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { unformatPhoneNumber } from '@/lib/phoneUtils'
import { type AddChildrenStepValues } from '@/pages/guest/steps/AddChildrenStep'
import { type CompanionStepValues } from '@/pages/guest/steps/CompanionStep'
import { type ResponsibleStepValues } from '@/pages/guest/steps/ConfirmResponsibleStep'
import api from '@/services/api'


type Step = 'RESPONSIBLE' | 'CHILDREN' | 'COMPANION' | 'FINAL_CONFIRMATION' | 'SUCCESS' | 'ERROR'

interface GuestFlowState {
  responsible: ResponsibleStepValues | null
  children: AddChildrenStepValues['children'] | null
}

const calculateAgeOnEventDate = (dob: Date, eventDate: string) => {
  const birthDate = new Date(dob)
  const partyDate = new Date(eventDate.replace(/-/g, '/'))

  let age = partyDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = partyDate.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && partyDate.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

const GUEST_FLOW_SESSION_KEY = 'guestConfirmationFlowState'

export function useGuestConfirmationFlow() {
  const { eventId } = useParams<{ eventId: string }>()

  const getInitialStep = (state: GuestFlowState | null): Step => {
    if (!state?.responsible) return 'RESPONSIBLE'
    if (!state.children) return 'CHILDREN'
    const needsCompanion = state.children.some(
      (child) => child.isAtypical || child.dob === undefined,
    )
    return needsCompanion ? 'COMPANION' : 'FINAL_CONFIRMATION'
  }

  const [flowState, setFlowState] = useState<GuestFlowState>(() => {
    try {
      const storedState = sessionStorage.getItem(GUEST_FLOW_SESSION_KEY)
      return storedState ? JSON.parse(storedState) : { responsible: null, children: null }
    } catch (error) {
      console.error('Falha ao ler o estado da sessão:', error)
      return { responsible: null, children: null }
    }
  })

  const [currentStep, setCurrentStep] = useState<Step>(getInitialStep(flowState))

  // Salva o estado no sessionStorage quando ele muda
  useEffect(() => {
    try {
      sessionStorage.setItem(GUEST_FLOW_SESSION_KEY, JSON.stringify(flowState))
    } catch (error) {
      console.error('Falha ao salvar o estado na sessão:', error)
    }

    // Limpa o estado quando o componente for desmontado
    return () => {
      try {
        sessionStorage.removeItem(GUEST_FLOW_SESSION_KEY)
      } catch (error) {
        console.error('Falha ao limpar o estado da sessão:', error)
      }
    }
  }, [flowState])

  const { data: eventData } = useQuery({
    queryKey: ['public-event', eventId],
    queryFn: async () => {
      if (!eventId) return null
      const response = await api.get(`/festa/${eventId}/public`)
      return response.data
    },
    enabled: !!eventId,
  })

  const { mutate: submitGroup, isPending } = useMutation({
    mutationFn: (payload: object) => api.post(`/festa/${eventId}/register-guest-group`, payload),
    onSuccess: () => {
      toast.success('Presença confirmada com sucesso!')
      // Limpa o estado do fluxo atual
      setFlowState({ responsible: null, children: null })
      sessionStorage.removeItem(GUEST_FLOW_SESSION_KEY)
      setCurrentStep('SUCCESS')
    },
    onError: () => {
      toast.error('Houve um erro ao confirmar a presença.')
      setCurrentStep('ERROR')
    },
  })

    const handleGroupSubmit = useCallback((
    companionData: CompanionStepValues | null,
    responsibleIsAttending?: boolean,
  ) => {
    const { responsible, children } = flowState;
    if (!responsible || !children) {
      toast.error('Erro: dados de confirmação de presença inválidos');
      return;
    }

    const allGuests: object[] = children.map((child) => ({
      nome_convidado: child.name,
      tipo_convidado: 'CRIANCA_PAGANTE',
      nascimento_convidado: new Date(child.dob!).toISOString().split('T')[0], 
      e_crianca_atipica: child.isAtypical,
      confirmou_presenca: 'SIM',
    }));

    if (companionData?.companionType === 'myself' || responsibleIsAttending) {
      allGuests.push({
        nome_convidado: responsible.responsibleName,
        tipo_convidado: 'ADULTO_PAGANTE',
        telefone_convidado: unformatPhoneNumber(responsible.responsiblePhone),
        confirmou_presenca: 'SIM',
      });
    } else if (companionData?.companionType === 'other' && companionData.otherCompanionName) {
      allGuests.push({
        nome_convidado: companionData.otherCompanionName,
        tipo_convidado: companionData.isNanny ? 'BABA' : 'ACOMPANHANTE_ATIPICO',
        telefone_convidado: unformatPhoneNumber(companionData.otherCompanionPhone),
        confirmou_presenca: 'SIM',
      });
    }

    const payload = {
      contatoResponsavel: {
        nome: responsible.responsibleName,
        telefone: unformatPhoneNumber(responsible.responsiblePhone),
      },
      convidados: allGuests,
    };

    submitGroup(payload);
  }, [flowState, submitGroup])

  const handleNextFromResponsible = useCallback((data: ResponsibleStepValues) => {
    setFlowState(prev => ({
      ...prev,
      responsible: data
    }))
    setCurrentStep('CHILDREN')
  }, [])

  const handleNextFromChildren = useCallback((data: AddChildrenStepValues) => {
    if (!eventData?.data_festa) {
      toast.error('Não foi possível carregar a data da festa. Tente novamente.')
      return false
    }

    // Garante que temos dados válidos
    if (!data.children || data.children.length === 0) {
      toast.error('Adicione pelo menos uma criança para continuar.')
      return false
    }

    // Atualiza o estado com as crianças
    setFlowState((prev) => ({
      ...prev,
      children: data.children
    }))

    // Verifica se alguma criança precisa de acompanhante
    const needsCompanion = data.children.some(
      (child) => child.dob && (child.isAtypical || calculateAgeOnEventDate(child.dob, eventData.data_festa) < 6),
    )

    // Avança para o próximo passo
    const nextStep = needsCompanion ? 'COMPANION' : 'FINAL_CONFIRMATION'
    setCurrentStep(nextStep)
    
    return true
  }, [eventData])

  const childrenNeedingCompanion =
    flowState.children
      ?.filter(
        (c) =>
          c.dob &&
          eventData?.data_festa &&
          (c.isAtypical || calculateAgeOnEventDate(c.dob, eventData.data_festa) < 6),
      )
      .map((c) => ({
        name: c.name,
        reason: c.isAtypical ? 'Criança atípica' : 'Menor de 6 anos',
      })) || []

  const resetFlow = useCallback(() => {
    setFlowState({ responsible: null, children: null })
    try {
      sessionStorage.removeItem(GUEST_FLOW_SESSION_KEY)
    } catch (error) {
      console.error('Falha ao limpar o estado da sessão:', error)
    }
    setCurrentStep('RESPONSIBLE')
  }, [])

  return {
    currentStep,
    eventData,
    flowState,
    isPending,
    childrenNeedingCompanion,
    handleNextFromResponsible,
    handleNextFromChildren,
    handleGroupSubmit,
    setCurrentStep,
    resetFlow,
  }
}
