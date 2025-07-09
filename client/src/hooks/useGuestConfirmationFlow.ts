// client/src/hooks/useGuestConfirmationFlow.ts
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
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

const calculateAge = (dob: Date) => {
  const diff = Date.now() - dob.getTime()
  const ageDate = new Date(diff)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export function useGuestConfirmationFlow() {
  const { eventId } = useParams<{ eventId: string }>()
  const [currentStep, setCurrentStep] = useState<Step>('RESPONSIBLE')
  const [flowState, setFlowState] = useState<GuestFlowState>({
    responsible: null,
    children: null,
  })

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
    setFlowState({ responsible: data, children: null })
    setCurrentStep('CHILDREN')
  }

  const handleNextFromChildren = (data: AddChildrenStepValues) => {
    setFlowState((prev) => ({ ...prev, children: data.children }))
    const needsCompanion = data.children.some(
      (child) => child.isAtypical || calculateAge(child.dob!) < 6,
    )
    setCurrentStep(needsCompanion ? 'COMPANION' : 'FINAL_CONFIRMATION')
  }

  const childrenNeedingCompanion =
    flowState.children
      ?.filter((c) => c.isAtypical || calculateAge(c.dob!) < 6)
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
