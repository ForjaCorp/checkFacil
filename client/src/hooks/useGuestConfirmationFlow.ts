// client/src/hooks/useGuestConfirmationFlow.ts
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
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
  const partyDate = new Date(eventDate.replace(/-/g, '/')) // Garante compatibilidade de formato

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
    // Se já temos os dados, recalculamos para onde ir
    const needsCompanion = state.children.some((child) => child.isAtypical || child.dob === undefined) // DOB undefined como fallback
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

  useEffect(() => {
    try {
      sessionStorage.setItem(GUEST_FLOW_SESSION_KEY, JSON.stringify(flowState))
    } catch (error) {
      console.error('Falha ao salvar o estado na sessão:', error)
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

  const { mutate: submitGuests, isPending } = useMutation({
    mutationFn: (payload: object) => api.post(`/festa/${eventId}/register-guest-group`, payload),
    onSuccess: () => {
      toast.success('Presença confirmada com sucesso!')
      sessionStorage.removeItem(GUEST_FLOW_SESSION_KEY) // Limpa o storage no sucesso
      setCurrentStep('SUCCESS')
    },
    onError: () => {
      toast.error('Houve um erro ao confirmar a presença.')
      setCurrentStep('ERROR')
    },
  })

  const handleSubmitFlow = (
    companionData: CompanionStepValues | null,
    responsibleIsAttending?: boolean,
  ) => {
    const { responsible, children } = flowState
    if (!responsible || !children) return

    let allGuests: object[] = children.map((child) => ({
      nome: child.name,
      tipo_convidado: 'CRIANCA_PAGANTE',
      dataNascimento: child.dob!.toISOString().split('T')[0],
      isCriancaAtipica: child.isAtypical,
    }))

    if (companionData?.companionType === 'myself') {
      allGuests.push({
        nome: responsible.responsibleName,
        tipo_convidado: 'ACOMPANHANTE_ATIPICO',
        telefone: unformatPhoneNumber(responsible.responsiblePhone),
      })
    } else if (companionData?.companionType === 'other' && companionData.otherCompanionName) {
      allGuests.push({
        nome: companionData.otherCompanionName,
        tipo_convidado: companionData.isNanny ? 'BABA' : 'ACOMPANHANTE_ATIPICO',
        telefone: unformatPhoneNumber(companionData.otherCompanionPhone),
      })
    } else if (responsibleIsAttending) {
      allGuests.push({
        nome: responsible.responsibleName,
        tipo_convidado: 'ADULTO_PAGANTE',
        telefone: unformatPhoneNumber(responsible.responsiblePhone),
      })
    }

    submitGuests({
      contatoResponsavel: {
        nome: responsible.responsibleName,
        telefone: unformatPhoneNumber(responsible.responsiblePhone),
      },
      convidados: allGuests,
    })
  }

  const handleNextFromResponsible = (data: ResponsibleStepValues) => {
    // Ao avançar do primeiro passo, garantimos que os dados das crianças sejam limpos.
    setFlowState({ responsible: data, children: null })
    setCurrentStep('CHILDREN')
  }

  const handleNextFromChildren = (data: AddChildrenStepValues) => {
    if (!eventData?.data_festa) {
      toast.error('Não foi possível carregar a data da festa. Tente novamente.')
      return
    }

    setFlowState((prev) => ({ ...prev, children: data.children }))
    const needsCompanion = data.children.some(
      (child) =>
        child.isAtypical || calculateAgeOnEventDate(child.dob!, eventData.data_festa) < 6,
    )
    setCurrentStep(needsCompanion ? 'COMPANION' : 'FINAL_CONFIRMATION')
  }

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

  return {
    currentStep,
    eventData,
    flowState,
    isPending,
    childrenNeedingCompanion,
    handleNextFromResponsible,
    handleNextFromChildren,
    handleSubmitFlow,
    setCurrentStep,
  }
}
